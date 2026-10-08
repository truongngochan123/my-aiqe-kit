// Controller: vòng lặp planner → guard → (hỏi người) → tool → evidence → trạng thái.
// Planner chỉ ĐỀ XUẤT. Mọi tool đều đi qua đây; không có đường nào để planner tự gọi tool.
// Invariant I1–I11: docs/agent_design.md mục 4.
import { createHash } from 'node:crypto';
import type {
  Action, ApprovalScope, GuardResult, HistoryItem, Policy, RunContext, RunRequest, RunSummary,
  State, ToolExecutor, ToolResult, ToolSpec,
} from './types.ts';
import type { Planner } from './types.ts';
import type { ApprovalProvider } from './approvals.ts';
import type { EvidenceStore } from './evidence_store.ts';
import { TERMINAL, canTransition, transition } from './state_machine.ts';
import { checkApproval, checkBudget, checkDataPrefix, checkRunId, checkToolAction, findApproval, inSandbox } from './guards.ts';
import { detectInjection, wrapUntrusted } from './planner/untrusted.ts';

export interface ControllerDeps {
  policy: Policy;
  manifest: ToolSpec[];
  tools: Record<string, ToolExecutor>;
  planner: Planner;
  approvals: ApprovalProvider;
  store: EvidenceStore;
  now?: () => number;
}

const PHASE_STATE: Partial<Record<ToolSpec['phase'], State>> = { setup: 'SETUP', act: 'ACT', verify: 'VERIFY', cleanup: 'CLEANUP' };
const hashOf = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

export class Controller {
  readonly #d: ControllerDeps;
  readonly #manifest: Map<string, ToolSpec>;
  readonly #now: () => number;

  constructor(deps: ControllerDeps) {
    this.#d = deps;
    this.#manifest = new Map(deps.manifest.map((t) => [t.name, t]));
    this.#now = deps.now ?? Date.now;
  }

  async run(req: RunRequest): Promise<RunSummary> {
    const { policy, store, planner } = this.#d;
    const ctx: RunContext = {
      ...req, state: 'PLANNED', oracleHash: hashOf(req.oracle), toolCalls: 0, blockedActions: 0,
      startedAt: this.#now(), approvals: [], createdRecords: [], writeOutcomeUnknown: false,
      verifyPassed: null, cleanupDone: null, securityObservations: [],
    };

    // Kiểm tra trước khi bắt đầu (I4, prefix, env). Bị từ chối thì KHÔNG ghi run_start, không chạy gì.
    const pre = [checkRunId(req.runId, store.usedRunIds(), policy), checkDataPrefix(req.dataPrefix, policy),
      inSandbox(req.env, policy) ? { ok: true } : { ok: false, code: 'ENV_NOT_SANDBOX', reason: `Env "${req.env}" không thuộc sandboxUrls` }];
    const bad = pre.find((r) => !r.ok);
    if (bad) {
      store.append(req.runId, 'run_rejected', bad);
      ctx.state = 'BLOCKED';
      return this.#summary(ctx, 'inconclusive', bad.reason ?? 'bị từ chối');
    }

    store.append(req.runId, 'run_start', { caseId: req.caseId, env: req.env, dataPrefix: req.dataPrefix, oracle: req.oracle, oracleHash: ctx.oracleHash, planner: planner.name });
    const history: HistoryItem[] = [];
    let everCreated = false;
    let lastObservation: string | undefined;

    while (!TERMINAL.has(ctx.state)) {
      const budget = checkBudget(ctx, policy, this.#now());
      if (!budget.ok) return this.#stop(ctx, 'BLOCKED', budget);

      const action = await planner.next({ runId: ctx.runId, caseId: ctx.caseId, state: ctx.state, history, lastObservation });
      store.append(ctx.runId, 'proposal', action);

      if (action.kind === 'change_oracle') {
        return this.#stop(ctx, 'BLOCKED', { ok: false, code: 'ORACLE_IMMUTABLE', reason: 'Oracle bất biến trong run. Đổi oracle cần G3 (người duyệt) và một run MỚI' });
      }
      if (action.kind === 'ask_human') return this.#stop(ctx, 'BLOCKED_NEEDS_HUMAN', { ok: false, code: 'ASK_HUMAN', reason: action.question });
      if (action.kind === 'finish') return this.#finish(ctx, action, everCreated);

      // ---- hành động gọi tool
      const guard = checkToolAction(action, this.#manifest, ctx, policy);
      if (!guard.ok) { lastObservation = this.#block(ctx, history, action, guard); continue; }
      const spec = this.#manifest.get(action.tool)!;

      // Thứ tự pha phải hợp lệ (ví dụ không quay lại ACT sau VERIFY). Bước chờ duyệt AWAIT_G1 không nới lỏng thứ tự này.
      const target = PHASE_STATE[spec.phase];
      if (target && !canTransition(ctx.state, target)) {
        lastObservation = this.#block(ctx, history, action, { ok: false, code: 'PHASE_ORDER', reason: `Không thể chuyển ${ctx.state} → ${target} (${spec.name})` });
        continue;
      }

      // I3: tool ghi cần G1. Thiếu thì hỏi NGƯỜI (planner không trả lời thay được).
      if (spec.mode === 'write' && !findApproval(spec, ctx, this.#now())) {
        ctx.state = transition(ctx.state, 'AWAIT_G1');
        const gate = spec.gate ?? 'G1';
        const scope: ApprovalScope = { runId: ctx.runId, env: ctx.env, caseId: ctx.caseId, tools: this.#d.manifest.filter((t) => t.mode === 'write').map((t) => t.name) };
        const approval = await this.#d.approvals.request(gate, scope, `${spec.name}: ${action.reason}`, policy.approvalTtlMs);
        store.append(ctx.runId, 'approval', approval ? { decision: 'granted', ...approval } : { decision: 'denied', gate, scope });
        if (!approval) return this.#stop(ctx, 'BLOCKED', { ok: false, code: 'APPROVAL_DENIED', reason: `${gate} bị từ chối: không chạy ${spec.name}` });
        ctx.approvals.push(approval);
      }
      const ap = checkApproval(spec, ctx, this.#now());
      if (!ap.ok) { lastObservation = this.#block(ctx, history, action, ap); continue; }

      if (target && target !== ctx.state) ctx.state = transition(ctx.state, target);

      // ---- gọi tool
      ctx.toolCalls++;
      store.append(ctx.runId, 'tool_call', { tool: spec.name, input: action.input, state: ctx.state });
      const result = await this.#exec(spec, action.input, ctx);
      store.append(ctx.runId, 'tool_result', { tool: spec.name, result });
      history.push({ action, result });

      // I11: dữ liệu từ tool là untrusted
      const raw = JSON.stringify(result.data ?? {});
      const inj = detectInjection(raw);
      if (inj.length) {
        const note = `${spec.name}: dữ liệu có mẫu giống chỉ thị (${inj.join(' | ')})`;
        ctx.securityObservations.push(note);
        store.append(ctx.runId, 'security_observation', { tool: spec.name, patterns: inj });
      }
      lastObservation = wrapUntrusted(spec.name, result.data ?? { status: result.status, error: result.error });

      if (spec.mode === 'write' && spec.phase !== 'cleanup' && result.status === 'ok') everCreated = true;
      this.#apply(spec, action, result, ctx);
    }
    // Vòng lặp dừng vì #apply đưa run vào trạng thái kết thúc (CLEANUP_PENDING, BLOCKED_NEEDS_HUMAN).
    const why = ctx.state === 'CLEANUP_PENDING' ? 'Dọn dữ liệu lỗi: run không được ghi pass, cần người dọn'
      : ctx.state === 'BLOCKED_NEEDS_HUMAN' ? 'Kết quả ghi dữ liệu chưa rõ: cần người quyết định' : `Dừng ở ${ctx.state}`;
    return this.#end(ctx, this.#verdict(ctx, everCreated), why);
  }

  // Cập nhật trạng thái theo kết quả tool.
  #apply(spec: ToolSpec, action: Action & { kind: 'tool' }, result: ToolResult, ctx: RunContext): void {
    const name = String(result.data?.recordName ?? action.input.recordName ?? '');
    if (spec.mode === 'write' && spec.phase !== 'cleanup') {
      if (result.status === 'timeout') {
        // I8: không biết đã ghi hay chưa → không ghi lại, chỉ tra cứu.
        ctx.writeOutcomeUnknown = true;
        ctx.state = transition(ctx.state, 'OUTCOME_UNKNOWN');
      } else if (result.status === 'ok' && name && !ctx.createdRecords.includes(name)) {
        ctx.createdRecords.push(name);
      } else if (result.status === 'error') {
        ctx.verifyPassed = false;
      }
      return;
    }
    if (spec.phase === 'lookup' && ctx.writeOutcomeUnknown) {
      if (result.status === 'ok' && result.data?.exists === true) {
        if (name && !ctx.createdRecords.includes(name)) ctx.createdRecords.push(name);
        ctx.writeOutcomeUnknown = false;
        ctx.state = transition(ctx.state, 'VERIFY');
      } else {
        const why = result.status === 'ok' ? 'Không thấy record của run sau khi ghi bị timeout. Tạo lại cần G2 (người quyết định)' : 'Không tra cứu được record: cần người kiểm tra';
        this.#d.store.append(ctx.runId, 'stop_reason', { code: 'OUTCOME_UNRESOLVED', reason: why });
        ctx.state = transition(ctx.state, 'BLOCKED_NEEDS_HUMAN');
      }
      return;
    }
    if (spec.phase === 'verify') {
      ctx.verifyPassed = result.status === 'ok' && result.data?.passed === true;
      return;
    }
    if (spec.phase === 'cleanup') {
      if (result.status === 'ok') {
        ctx.createdRecords = ctx.createdRecords.filter((r) => r !== name);
        ctx.cleanupDone = ctx.createdRecords.length === 0;
      } else {
        // I9: dọn lỗi → không bao giờ pass.
        ctx.cleanupDone = false;
        ctx.state = transition(ctx.state, 'CLEANUP_PENDING');
      }
    }
  }

  #finish(ctx: RunContext, action: Action & { kind: 'finish' }, everCreated: boolean): RunSummary {
    if (ctx.writeOutcomeUnknown) {
      return this.#stop(ctx, 'BLOCKED_NEEDS_HUMAN', { ok: false, code: 'OUTCOME_UNKNOWN', reason: 'Kết thúc khi lần ghi vẫn chưa rõ kết quả' });
    }
    if (ctx.createdRecords.length > 0) {
      return this.#stop(ctx, 'CLEANUP_PENDING', { ok: false, code: 'CLEANUP_NOT_DONE', reason: `Còn record chưa dọn: ${ctx.createdRecords.join(', ')}` });
    }
    const to: State = canTransition(ctx.state, 'DONE') ? 'DONE' : 'CLEANUP';
    ctx.state = transition(ctx.state, to);
    if (ctx.state === 'CLEANUP') ctx.state = transition('CLEANUP', 'DONE');
    const verdict = this.#verdict(ctx, everCreated);
    const reason = action.claim === 'pass' && verdict !== 'pass'
      ? `Planner nói pass nhưng điều kiện pass chưa đủ (verify=${String(ctx.verifyPassed)}, cleanup=${String(ctx.cleanupDone)})`
      : action.reason;
    return this.#end(ctx, verdict, reason);
  }

  // Pass chỉ khi: DONE + verify đạt + (đã dọn hết, hoặc run không tạo record nào).
  #verdict(ctx: RunContext, everCreated: boolean): RunSummary['verdict'] {
    if (ctx.state !== 'DONE') return ctx.verifyPassed === false ? 'fail' : 'inconclusive';
    if (ctx.verifyPassed !== true) return ctx.verifyPassed === false ? 'fail' : 'inconclusive';
    if (everCreated && ctx.cleanupDone !== true) return 'inconclusive';
    return 'pass';
  }

  #block(ctx: RunContext, history: HistoryItem[], action: Action, guard: GuardResult): string {
    ctx.blockedActions++;
    this.#d.store.append(ctx.runId, 'blocked', { action, guard });
    history.push({ action, blocked: guard });
    return `Hành động bị controller chặn: ${guard.code}: ${guard.reason}`;
  }

  #stop(ctx: RunContext, state: State, guard: GuardResult): RunSummary {
    ctx.state = TERMINAL.has(ctx.state) ? ctx.state : transition(ctx.state, state);
    this.#d.store.append(ctx.runId, 'stop_reason', guard);
    return this.#end(ctx, ctx.verifyPassed === false ? 'fail' : 'inconclusive', guard.reason ?? guard.code ?? 'dừng');
  }

  #end(ctx: RunContext, verdict: RunSummary['verdict'], reason: string): RunSummary {
    const s = this.#summary(ctx, verdict, reason);
    this.#d.store.append(ctx.runId, 'run_end', s);
    return s;
  }

  #summary(ctx: RunContext, verdict: RunSummary['verdict'], reason: string): RunSummary {
    return { runId: ctx.runId, state: ctx.state, verdict, reason, toolCalls: ctx.toolCalls, createdRecords: [...ctx.createdRecords], securityObservations: [...ctx.securityObservations] };
  }

  async #exec(spec: ToolSpec, input: Record<string, unknown>, ctx: RunContext): Promise<ToolResult> {
    const fn = this.#d.tools[spec.name];
    if (!fn) return { status: 'error', error: `Chưa có executor cho ${spec.name}` };
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<ToolResult>((resolve) => { timer = setTimeout(() => resolve({ status: 'timeout', error: `quá ${spec.timeoutMs} ms` }), spec.timeoutMs); });
    try {
      return await Promise.race([fn(input, { runId: ctx.runId, env: ctx.env, dataPrefix: ctx.dataPrefix }), timeout]);
    } catch (e) {
      return { status: 'error', error: (e as Error).message };
    } finally {
      clearTimeout(timer);
    }
  }
}
