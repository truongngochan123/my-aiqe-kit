// Test lõi agent: guard, state machine, evidence store, controller theo kịch bản.
// Chạy: npm test  (node --experimental-strip-types --test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Action, Policy, RunRequest, ToolExecutor, ToolResult, ToolSpec } from '../src/types.ts';
import { Controller } from '../src/controller.ts';
import { EvidenceStore } from '../src/evidence_store.ts';
import { ScriptedApprovals } from '../src/approvals.ts';
import { MockPlanner } from '../src/planner/mock_planner.ts';
import { extractAction } from '../src/planner/codex_planner.ts';
import { transition } from '../src/state_machine.ts';
import { buildReport } from '../src/report.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(readFileSync(join(ROOT, 'config/policy.json'), 'utf8')) as Policy;
const manifest = (JSON.parse(readFileSync(join(ROOT, 'config/tool_manifest.json'), 'utf8')) as { tools: ToolSpec[] }).tools;
const scen = JSON.parse(readFileSync(join(ROOT, 'scenarios/scenarios.json'), 'utf8')) as {
  env: string; dataPrefix: string; oracle: RunRequest['oracle'];
  scenarios: Record<string, { approvals: boolean[]; steps: Action[]; toolResults: Record<string, ToolResult[]>;
    expect: { state?: string; verdict?: string; verdictNot?: string; notCalled?: string[]; callCount?: Record<string, number>; blockedCodes?: string[]; securityObservations?: number } }>;
};

let runSeq = 0;
function setup(name: string) {
  const s = scen.scenarios[name];
  const calls: Record<string, number> = {};
  const queues: Record<string, ToolResult[]> = structuredClone(s.toolResults);
  const tools: Record<string, ToolExecutor> = Object.fromEntries(manifest.map((t) => [t.name, async () => {
    calls[t.name] = (calls[t.name] ?? 0) + 1;
    return queues[t.name]?.shift() ?? { status: 'error', error: 'kịch bản không có kết quả cho tool này' };
  }]));
  const store = new EvidenceStore(join(mkdtempSync(join(tmpdir(), 'aiqe-agent-')), 'evidence.jsonl'));
  const approvals = new ScriptedApprovals(s.approvals);
  const controller = new Controller({ policy, manifest, tools, planner: new MockPlanner(s.steps), approvals, store });
  const req: RunRequest = { runId: `RUN-20261008-${String(++runSeq).padStart(2, '0')}`, caseId: 'EMP-CREATE-01', env: scen.env, dataPrefix: scen.dataPrefix, oracle: scen.oracle };
  return { s, calls, store, approvals, controller, req };
}

for (const name of Object.keys(scen.scenarios)) {
  test(`kịch bản ${name}: ${scen.scenarios[name].expect ? 'đúng kết quả mong đợi' : ''}`, async () => {
    const { s, calls, store, controller, req } = setup(name);
    const out = await controller.run(req);
    const e = s.expect;
    if (e.state) assert.equal(out.state, e.state, `state (lý do: ${out.reason})`);
    if (e.verdict) assert.equal(out.verdict, e.verdict, `verdict (lý do: ${out.reason})`);
    if (e.verdictNot) assert.notEqual(out.verdict, e.verdictNot, 'verdict không được là pass');
    for (const t of e.notCalled ?? []) assert.equal(calls[t] ?? 0, 0, `tool ${t} không được gọi`);
    for (const [t, n] of Object.entries(e.callCount ?? {})) assert.equal(calls[t] ?? 0, n, `số lần gọi ${t}`);
    const blocked = store.readAll().filter((r) => r.type === 'blocked').map((r) => (r.data as { guard: { code: string } }).guard.code);
    for (const c of e.blockedCodes ?? []) assert.ok(blocked.includes(c), `phải bị chặn với ${c}; thực tế: ${blocked.join(', ') || '(không)'}`);
    if (e.securityObservations !== undefined) assert.equal(out.securityObservations.length, e.securityObservations);
    assert.equal(store.verify().ok, true, 'chuỗi evidence phải nguyên vẹn');
    assert.ok(store.readAll().some((r) => r.type === 'run_end'), 'phải có run_end');
  });
}

test('thiếu G1: người được hỏi đúng phạm vi run/env/case, tool ghi không chạy', async () => {
  const { calls, approvals, controller, req } = setup('missing-g1');
  const out = await controller.run(req);
  assert.equal(out.state, 'BLOCKED');
  assert.equal(calls.run_case ?? 0, 0);
  assert.equal(approvals.asked.length, 1);
  assert.deepEqual([approvals.asked[0].gate, approvals.asked[0].scope.runId, approvals.asked[0].scope.env], ['G1', req.runId, req.env]);
});

test('trùng run ID bị từ chối, không chạy gì', async () => {
  const first = setup('happy');
  await first.controller.run(first.req);
  const again = new Controller({
    policy, manifest, tools: {}, planner: new MockPlanner(scen.scenarios.happy.steps),
    approvals: new ScriptedApprovals([true]), store: first.store,
  });
  const out = await again.run(first.req);
  assert.equal(out.state, 'BLOCKED');
  assert.match(out.reason, /đã được dùng/);
  assert.equal(out.toolCalls, 0);
  assert.equal(first.store.readAll().filter((r) => r.type === 'run_start').length, 1, 'không ghi run_start lần 2');
});

test('run ID sai định dạng hoặc env ngoài sandbox bị từ chối', async () => {
  const a = setup('happy');
  assert.equal((await a.controller.run({ ...a.req, runId: 'run-1' })).state, 'BLOCKED');
  const b = setup('happy');
  const out = await b.controller.run({ ...b.req, env: 'https://evil.example.com' });
  assert.equal(out.state, 'BLOCKED');
  assert.match(out.reason, /sandboxUrls/);
});

test('evidence store phát hiện bản ghi bị sửa', async () => {
  const { controller, req, store } = setup('happy');
  await controller.run(req);
  assert.equal(store.verify().ok, true);
  const lines = readFileSync(store.file, 'utf8').trim().split('\n');
  const rec = JSON.parse(lines[2]);
  rec.data = { sửa: 'giả mạo' };
  lines[2] = JSON.stringify(rec);
  writeFileSync(store.file, lines.join('\n') + '\n');
  const v = new EvidenceStore(store.file).verify();
  assert.equal(v.ok, false);
  assert.equal(v.brokenAt, 3);
});

test('state machine: chuyển sai bị từ chối, trạng thái kết thúc không đi tiếp', () => {
  assert.throws(() => transition('VERIFY', 'ACT'));
  assert.throws(() => transition('DONE', 'ACT'));
  assert.throws(() => transition('CLEANUP_PENDING', 'DONE'));
  assert.equal(transition('ACT', 'OUTCOME_UNKNOWN'), 'OUTCOME_UNKNOWN');
});

test('tool ghi không báo record nào: không chứng minh được đã dọn → không pass', async () => {
  // Tool ghi giả định không có input recordName (manifest tương lai). Không biết record nào để dọn → không được pass.
  const extra: ToolSpec[] = [
    ...manifest,
    { name: 'create_note', description: 'tool ghi không trả tên record', mode: 'write', phase: 'act', gate: 'G1', timeoutMs: 1000, inputs: { text: { type: 'string', required: true } } },
  ];
  const tools: Record<string, ToolExecutor> = {
    create_note: async () => ({ status: 'ok', data: {} }),
    read_result: async () => ({ status: 'ok', data: { passed: true } }),
  };
  const store = new EvidenceStore(join(mkdtempSync(join(tmpdir(), 'aiqe-agent-')), 'evidence.jsonl'));
  const steps: Action[] = [
    { kind: 'tool', tool: 'create_note', input: { text: 'x' }, reason: 'ghi' },
    { kind: 'tool', tool: 'read_result', input: { attemptId: 'a1' }, reason: 'đọc' },
    { kind: 'finish', claim: 'pass', reason: 'xong' },
  ];
  const c = new Controller({ policy, manifest: extra, tools, planner: new MockPlanner(steps), approvals: new ScriptedApprovals([true]), store });
  const out = await c.run({ runId: 'RUN-20261008-90', caseId: 'EMP-CREATE-01', env: scen.env, dataPrefix: scen.dataPrefix, oracle: scen.oracle });
  assert.notEqual(out.verdict, 'pass');
  assert.match(out.reason, /chưa đủ/);
});

test('planner codex: lấy được JSON hành động cuối, kể cả object lồng nhau', () => {
  const out = 'thinking...\n{"kind":"tool","tool":"inspect_ui","input":{"url":"https://x"},"reason":"a"}\nrồi\n{"kind":"finish","claim":"fail","reason":"b"}\n';
  assert.deepEqual(extractAction(out), { kind: 'finish', claim: 'fail', reason: 'b' });
  assert.equal(extractAction('không có json'), null);
});

test('Đợt 4 #1: planner mock không báo usage → report ghi UNKNOWN, không ghi 0', async () => {
  const store = new EvidenceStore(join(mkdtempSync(join(tmpdir(), 'aiqe-agent-')), 'evidence.jsonl'));
  const steps: Action[] = [{ kind: 'finish', claim: 'pass', reason: 'xong' }];
  const c = new Controller({ policy, manifest, tools: {}, planner: new MockPlanner(steps), approvals: new ScriptedApprovals([]), store });
  const out = await c.run({ runId: 'RUN-20261008-91', caseId: 'EMP-CREATE-01', env: scen.env, dataPrefix: scen.dataPrefix, oracle: scen.oracle });
  assert.equal(out.usage, 'UNKNOWN');
  const report = buildReport(store.readAll(), 'RUN-20261008-91', store.verify());
  assert.ok(report.includes('usage: UNKNOWN'), 'frontmatter phải có usage: UNKNOWN');
  assert.ok(report.includes('**Usage:** `UNKNOWN`'), 'body phải có **Usage:** `UNKNOWN`');
  assert.ok(!report.includes('usage: 0'), 'tuyệt đối không ghi số 0');
});

test('Đợt 4 #4: case không có trong flow catalog → BLOCKED, không gọi tool', async () => {
  const store = new EvidenceStore(join(mkdtempSync(join(tmpdir(), 'aiqe-agent-')), 'evidence.jsonl'));
  let toolCalled = false;
  const tools: Record<string, ToolExecutor> = {
    read_case: async () => { toolCalled = true; return { status: 'ok', data: {} }; },
  };
  const c = new Controller({ policy, manifest, tools, planner: new MockPlanner([]), approvals: new ScriptedApprovals([]), store, catalog: ['EMP-CREATE-01'] });
  const out = await c.run({ runId: 'RUN-20261008-92', caseId: 'CASE-LA-99', env: scen.env, dataPrefix: scen.dataPrefix, oracle: scen.oracle });
  assert.equal(out.state, 'BLOCKED');
  assert.equal(toolCalled, false, 'tool không bao giờ được gọi khi case không thuộc catalog');
  assert.match(out.reason, /catalog/);
  const rej = store.readAll().find((r) => r.type === 'run_rejected');
  assert.ok(rej, 'phải ghi nhận run_rejected');
});

