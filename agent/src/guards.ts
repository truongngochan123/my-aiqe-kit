// Invariant của agent dưới dạng hàm thuần (docs/agent_design.md mục 4). Mỗi hàm trả GuardResult.
// Controller gọi các guard này TRƯỚC khi gọi tool. Planner không đi vòng được qua controller.
import type { Action, GuardResult, Policy, RunContext, ToolSpec } from './types.ts';

const OK: GuardResult = { ok: true };
const no = (code: string, reason: string): GuardResult => ({ ok: false, code, reason });

export function checkRunId(runId: string, usedRunIds: ReadonlySet<string>, policy: Policy): GuardResult {
  if (!new RegExp(policy.runIdPattern).test(runId)) return no('RUN_ID_FORMAT', `Run ID "${runId}" không đúng ${policy.runIdPattern}`);
  if (usedRunIds.has(runId)) return no('RUN_ID_USED', `Run ID "${runId}" đã được dùng; mỗi run một ID mới, không chạy đè`);
  return OK;
}

export function checkDataPrefix(dataPrefix: string, policy: Policy): GuardResult {
  if (!new RegExp(policy.dataPrefixPattern).test(dataPrefix)) return no('DATA_PREFIX_FORMAT', `Data prefix "${dataPrefix}" không đúng ${policy.dataPrefixPattern}`);
  if (!dataPrefix.startsWith(`${policy.idPrefix}-`)) return no('DATA_PREFIX_OWNER', `Data prefix phải bắt đầu bằng "${policy.idPrefix}-"`);
  return OK;
}

export function inSandbox(url: string, policy: Policy): boolean {
  let origin: string;
  try { origin = new URL(url).origin; } catch { return false; }
  return policy.sandboxUrls.some((s) => { try { return new URL(s).origin === origin; } catch { return false; } });
}

export function checkAllowlist(action: Action, manifest: ReadonlyMap<string, ToolSpec>): GuardResult {
  if (action.kind !== 'tool') return OK;
  return manifest.has(action.tool) ? OK : no('TOOL_NOT_ALLOWED', `Tool "${action.tool}" không có trong tool_manifest (allowlist)`);
}

export function checkInput(action: Action, spec: ToolSpec, ctx: RunContext, policy: Policy): GuardResult {
  if (action.kind !== 'tool') return OK;
  const input = action.input ?? {};
  for (const key of Object.keys(input)) {
    if (!(key in spec.inputs)) return no('INPUT_NOT_ALLOWED', `Input "${key}" không được khai báo cho ${spec.name}`);
  }
  for (const [key, rule] of Object.entries(spec.inputs)) {
    const v = input[key];
    if (v === undefined) {
      if (rule.required) return no('INPUT_MISSING', `${spec.name} thiếu input bắt buộc "${key}"`);
      continue;
    }
    if (typeof v !== rule.type) return no('INPUT_TYPE', `${spec.name}.${key} phải là ${rule.type}`);
    if (rule.allow && !rule.allow.includes(String(v))) return no('INPUT_VALUE', `${spec.name}.${key}="${String(v)}" ngoài danh sách cho phép`);
    if (rule.url && !inSandbox(String(v), policy)) return no('URL_NOT_SANDBOX', `URL "${String(v)}" không thuộc sandboxUrls`);
    if (rule.owned && !String(v).startsWith(`${ctx.dataPrefix}-`)) return no('RECORD_NOT_OWNED', `Record "${String(v)}" không mang prefix của run (${ctx.dataPrefix}-…)`);
    if (rule.createdOnly && !ctx.createdRecords.includes(String(v))) return no('RECORD_NOT_CREATED_BY_RUN', `Record "${String(v)}" không do run này tạo; không được dọn`);
  }
  return OK;
}

// G1 còn hiệu lực, đúng run, đúng env, có tool này trong phạm vi.
export function findApproval(spec: ToolSpec, ctx: RunContext, now: number) {
  if (spec.mode !== 'write') return undefined;
  return ctx.approvals.find((a) => a.gate === (spec.gate ?? 'G1')
    && a.scope.runId === ctx.runId
    && a.scope.env === ctx.env
    && a.scope.caseId === ctx.caseId
    && a.scope.tools.includes(spec.name)
    && Date.parse(a.expiresAt) > now);
}

export function checkApproval(spec: ToolSpec, ctx: RunContext, now: number): GuardResult {
  if (spec.mode !== 'write') return OK;
  return findApproval(spec, ctx, now) ? OK : no('APPROVAL_MISSING', `${spec.name} ghi dữ liệu: cần ${spec.gate ?? 'G1'} còn hiệu lực cho run ${ctx.runId}`);
}

export function checkOutcomeUnknown(spec: ToolSpec, ctx: RunContext): GuardResult {
  if (ctx.writeOutcomeUnknown && spec.mode === 'write') {
    return no('WRITE_OUTCOME_UNKNOWN', `Lần ghi trước chưa rõ kết quả: không ghi tiếp/ghi lại; chỉ được tra cứu chỉ-đọc (rules/retry_and_wait.md mục 4)`);
  }
  return OK;
}

export function checkBudget(ctx: RunContext, policy: Policy, now: number): GuardResult {
  if (ctx.toolCalls >= policy.budget.maxToolCalls) return no('BUDGET_TOOL_CALLS', `Hết budget: ${ctx.toolCalls}/${policy.budget.maxToolCalls} lần gọi tool`);
  if (ctx.blockedActions >= policy.budget.maxBlockedActions) return no('BUDGET_BLOCKED', `Planner bị chặn ${ctx.blockedActions} lần: dừng an toàn`);
  if (now - ctx.startedAt > policy.budget.maxWallMs) return no('BUDGET_TIME', `Hết thời gian cho phép (${policy.budget.maxWallMs} ms)`);
  return OK;
}

// Chạy lần lượt các guard của một hành động tool (không gồm approval: controller tự hỏi người khi thiếu).
export function checkToolAction(action: Action, manifest: ReadonlyMap<string, ToolSpec>, ctx: RunContext, policy: Policy): GuardResult {
  const a = checkAllowlist(action, manifest);
  if (!a.ok || action.kind !== 'tool') return a;
  const spec = manifest.get(action.tool)!;
  for (const r of [checkOutcomeUnknown(spec, ctx), checkInput(action, spec, ctx, policy)]) if (!r.ok) return r;
  return OK;
}
