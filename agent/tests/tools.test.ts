// Test tool thật, report và CLI, không chạm site nào: client sandbox giả + runner giả thay Playwright.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import type { Action, Policy, ToolSpec } from '../src/types.ts';
import type { EmployeeRow, PageSummary, SandboxClient } from '../src/tools/sandbox_client.ts';
import type { Runner } from '../src/tools/run_case.ts';
import { createRealTools } from '../src/tools/index.ts';
import { summarizeReport } from '../src/tools/read_result.ts';
import { Controller } from '../src/controller.ts';
import { EvidenceStore } from '../src/evidence_store.ts';
import { ScriptedApprovals } from '../src/approvals.ts';
import { MockPlanner } from '../src/planner/mock_planner.ts';
import { buildReport, runLabel } from '../src/report.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(readFileSync(join(ROOT, 'config/policy.json'), 'utf8')) as Policy;
const manifest = (JSON.parse(readFileSync(join(ROOT, 'config/tool_manifest.json'), 'utf8')) as { tools: ToolSpec[] }).tools;
const ENV = policy.sandboxUrls[0];
const ctx = (runId = 'RUN-20261009-01') => ({ runId, env: ENV, dataPrefix: 'QA-r001' });

class FakeClient implements SandboxClient {
  rows: EmployeeRow[];
  deleted: number[] = [];
  deleteWorks = true;
  constructor(rows: Partial<EmployeeRow>[] = []) {
    this.rows = rows.map((r) => ({ empNumber: 0, firstName: '', middleName: '', lastName: 'Auto', employeeId: null, ...r }));
  }
  async inspect(url: string): Promise<PageSummary> { return { url, title: 'OrangeHRM', headings: ['Add Employee'], fields: [], buttons: ['Save'], text: '' }; }
  async findByFirstName(n: string) { return this.rows.filter((r) => r.firstName === n); }
  async deleteEmployee(n: number) { this.deleted.push(n); if (this.deleteWorks) this.rows = this.rows.filter((r) => r.empNumber !== n); }
  async close() {}
}

// Runner giả: mô phỏng spec ghi save-clicked.json / created.json như spec thật.
const runnerWrites = (what: 'none' | 'clicked' | 'created' | 'timeout', empNumber = 501): Runner => async ({ env }) => {
  const dir = env.AIQE_ATTEMPT_DIR;
  if (what !== 'none') writeFileSync(join(dir, 'save-clicked.json'), '{}');
  if (what === 'created') writeFileSync(join(dir, 'created.json'), JSON.stringify({ recordName: env.AIQE_RECORD_NAME, empNumber }));
  return { exitCode: what === 'timeout' ? null : 0, timedOut: what === 'timeout' };
};

function tools(opts: { client?: FakeClient; runner?: Runner } = {}) {
  const runsDir = mkdtempSync(join(tmpdir(), 'aiqe-runs-'));
  const client = opts.client ?? new FakeClient();
  return { runsDir, client, ...createRealTools({ env: ENV, casesDir: join(ROOT, 'cases'), runsDir, manifest, client, runner: opts.runner }).tools };
}

test('read_case: đọc case.json; caseId lạ bị từ chối', async () => {
  const t = tools();
  const ok = await t.read_case({ caseId: 'EMP-CREATE-01' }, ctx());
  assert.equal(ok.status, 'ok');
  assert.equal(ok.data?.id, 'EMP-CREATE-01');
  assert.equal((await t.read_case({ caseId: '../x' }, ctx())).status, 'error');
});

test('inspect_ui: URL phải khớp scope và cùng origin với env', async () => {
  const t = tools();
  assert.equal((await t.inspect_ui({ url: `${ENV}/web/index.php/pim/addEmployee`, scope: 'add-employee' }, ctx())).status, 'ok');
  assert.equal((await t.inspect_ui({ url: `${ENV}/web/index.php/admin/viewSystemUsers`, scope: 'add-employee' }, ctx())).status, 'error');
  assert.equal((await t.inspect_ui({ url: 'https://example.com/pim/addEmployee' }, ctx())).status, 'error');
});

test('run_case: phân biệt đã tạo / chưa ghi / không rõ / timeout; attempt tăng dần', async () => {
  const created = tools({ runner: runnerWrites('created') });
  const a = await created.run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  assert.deepEqual([a.status, a.data?.created, a.data?.attemptId], ['ok', true, 'a1']);
  const b = await created.run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  assert.equal(b.data?.attemptId, 'a2');

  const none = await tools({ runner: runnerWrites('none') }).run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  assert.deepEqual([none.status, none.data?.created], ['ok', false]);
  const clicked = await tools({ runner: runnerWrites('clicked') }).run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  assert.equal(clicked.status, 'unknown');
  const slow = await tools({ runner: runnerWrites('timeout') }).run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  assert.equal(slow.status, 'timeout');
});

test('read_result: flaky không phải pass; lỗi bỏ mã màu; chỉ đọc attempt của run hiện tại', async () => {
  const report = (flaky: number) => ({
    stats: { expected: 1, unexpected: 0, flaky, skipped: 0 },
    suites: [{ specs: [{ title: 'EMP', tests: [{ results: [{ status: 'failed', errors: [{ message: '\u001b[31mExpected 1\u001b[0m\nchi tiết' }], attachments: [{ name: 'trace', path: '/x/RUN/a1/trace.zip' }] }] }] }] }],
  });
  assert.equal(summarizeReport(report(0), '/x/RUN').passed, true);
  assert.equal(summarizeReport(report(1), '/x/RUN').passed, false);
  assert.deepEqual(summarizeReport(report(1), '/x/RUN').failures, ['EMP: Expected 1']);
  assert.equal(summarizeReport({ stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 1 } }, '/').passed, false, 'không test nào chạy thì không pass');

  const t = tools();
  mkdirSync(join(t.runsDir, 'RUN-20261009-01', 'a1'), { recursive: true });
  writeFileSync(join(t.runsDir, 'RUN-20261009-01', 'a1', 'results.json'), JSON.stringify(report(0)));
  assert.equal((await t.read_result({ attemptId: 'a1' }, ctx())).data?.passed, true);
  assert.equal((await t.read_result({ attemptId: 'a1' }, ctx('RUN-20261009-02'))).status, 'error', 'run khác không đọc được');
  assert.equal((await t.read_result({ attemptId: '../RUN-20261009-01/a1' }, ctx('RUN-20261009-02'))).status, 'error');
});

test('lookup_owned_record: khớp chính xác tên + họ; trùng tên thì báo người', async () => {
  const one = tools({ client: new FakeClient([{ empNumber: 7, firstName: 'QA-r001-An' }, { empNumber: 8, firstName: 'QA-r001-Anh' }]) });
  assert.deepEqual((await one.lookup_owned_record({ recordName: 'QA-r001-An' }, ctx())).data, { recordName: 'QA-r001-An', exists: true, empNumber: 7 });
  const dup = tools({ client: new FakeClient([{ empNumber: 7, firstName: 'QA-r001-An' }, { empNumber: 9, firstName: 'QA-r001-An' }]) });
  assert.equal((await dup.lookup_owned_record({ recordName: 'QA-r001-An' }, ctx())).status, 'error');
});

test('cleanup_owned_record: chỉ xóa empNumber run đã ghi; xóa không ăn thì báo lỗi; trùng tên không có empNumber thì không xóa', async () => {
  // Người khác cũng tạo "QA-r001-An" (empNumber 12). Run chỉ tạo 11 → chỉ xóa 11.
  const client = new FakeClient([{ empNumber: 11, firstName: 'QA-r001-An' }, { empNumber: 12, firstName: 'QA-r001-An' }]);
  const t = tools({ client, runner: runnerWrites('created', 11) });
  await t.run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  const r = await t.cleanup_owned_record({ recordName: 'QA-r001-An' }, ctx());
  assert.equal(r.status, 'ok');
  assert.deepEqual(client.deleted, [11]);

  const stuck = new FakeClient([{ empNumber: 21, firstName: 'QA-r001-An' }]);
  stuck.deleteWorks = false;
  const t2 = tools({ client: stuck, runner: runnerWrites('created', 21) });
  await t2.run_case({ caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, ctx());
  assert.equal((await t2.cleanup_owned_record({ recordName: 'QA-r001-An' }, ctx())).status, 'error');

  const dup = new FakeClient([{ empNumber: 31, firstName: 'QA-r001-An' }, { empNumber: 32, firstName: 'QA-r001-An' }]);
  const t3 = tools({ client: dup });
  assert.equal((await t3.cleanup_owned_record({ recordName: 'QA-r001-An' }, ctx())).status, 'error');
  assert.deepEqual(dup.deleted, []);
});

async function runController(runner: Runner, client: FakeClient, steps: Action[], approvals: boolean[]) {
  const t = tools({ client, runner });
  const { runsDir, client: _c, ...execs } = t;
  const store = new EvidenceStore(join(runsDir, 'evidence.jsonl'));
  const c = new Controller({ policy, manifest, tools: execs, planner: new MockPlanner(steps), approvals: new ScriptedApprovals(approvals), store });
  const out = await c.run({ runId: 'RUN-20261009-01', caseId: 'EMP-CREATE-01', env: ENV, dataPrefix: 'QA-r001', oracle: { id: 'O1', expect: {} } });
  return { out, store };
}
const RUN: Action = { kind: 'tool', tool: 'run_case', input: { caseId: 'EMP-CREATE-01', recordName: 'QA-r001-An' }, reason: 'chạy' };

test('controller + run_case "unknown": vào OUTCOME_UNKNOWN, chạy lại bị chặn, tra cứu thấy thì dọn được', async () => {
  const client = new FakeClient([{ empNumber: 41, firstName: 'QA-r001-An' }]);
  const { out, store } = await runController(runnerWrites('clicked'), client, [
    RUN, RUN,
    { kind: 'tool', tool: 'lookup_owned_record', input: { recordName: 'QA-r001-An' }, reason: 'tra' },
    { kind: 'tool', tool: 'cleanup_owned_record', input: { recordName: 'QA-r001-An' }, reason: 'dọn' },
    { kind: 'finish', claim: 'pass', reason: 'xong' },
  ], [true]);
  const blocked = store.readAll().filter((r) => r.type === 'blocked').map((r) => (r.data as { guard: { code: string } }).guard.code);
  assert.ok(blocked.includes('WRITE_OUTCOME_UNKNOWN'));
  assert.deepEqual(client.deleted, [41]);
  assert.notEqual(out.verdict, 'pass', 'chưa verify thì không pass');
});

test('controller + run_case "created: false": không có record để dọn, kết quả fail', async () => {
  const { out } = await runController(runnerWrites('none'), new FakeClient(), [RUN, { kind: 'finish', claim: 'pass', reason: 'xong' }], [true]);
  assert.equal(out.verdict, 'fail');
  assert.deepEqual(out.createdRecords, []);
});

test('report: nhãn đúng, không có RUN-PASSED, chuỗi hỏng thì cảnh báo, escape dấu |', async () => {
  assert.deepEqual([runLabel('pass'), runLabel('fail'), runLabel('inconclusive')], ['LOCAL-RUN: passed', 'LOCAL-RUN: failed', 'UNKNOWN']);
  assert.match(runLabel('pass', true), /^MÔ PHỎNG/);
  const { store } = await runController(runnerWrites('none'), new FakeClient(), [
    { kind: 'tool', tool: 'nope', input: {}, reason: 'a | b' }, RUN, { kind: 'finish', claim: 'pass', reason: 'xong' },
  ], [true]);
  const md = buildReport(store.readAll(), 'RUN-20261009-01', store.verify());
  assert.match(md, /produced_by: aiqe-agent/);
  assert.match(md, /`LOCAL-RUN: failed`/);
  assert.doesNotMatch(md, /RUN-PASSED|RUN-FAILED/);
  assert.match(md, /a \\\| b/);
  assert.match(md, /## Bước tiếp theo/);
  assert.match(buildReport(store.readAll(), 'RUN-20261009-01', { ok: false, brokenAt: 3, reason: 'sửa' }), /BỊ HỎNG tại bản ghi 3/);
});

test('cli demo: 5 kịch bản, evidence nguyên vẹn, không chạm site', () => {
  const out = mkdtempSync(join(tmpdir(), 'aiqe-cli-'));
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', join(ROOT, 'src/cli.ts'), 'demo', '--out', out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  for (const name of ['happy', 'write-timeout', 'injection', 'oracle-change', 'budget']) assert.match(r.stdout, new RegExp(`\\| ${name} \\|`));
  assert.match(r.stdout, /Evidence: nguyên vẹn/);
  assert.match(r.stdout, /\| happy \| MÔ PHỎNG, không phải run thật: pass \| DONE/);
  assert.doesNotMatch(r.stdout, /LOCAL-RUN/, 'tool giả không được nhãn LOCAL-RUN');
});

test('cli run --tools real không có cờ tự đồng ý: thiếu tài khoản sandbox thì tool báo lỗi, không crash', () => {
  const out = mkdtempSync(join(tmpdir(), 'aiqe-cli-'));
  const env = { ...process.env, AIQE_SANDBOX_USER: '', AIQE_SANDBOX_PASS: '' };
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', join(ROOT, 'src/cli.ts'),
    'run', '--scenario', 'readonly', '--tools', 'real', '--run-id', 'RUN-20261009-01', '--out', out], { encoding: 'utf8', env });
  assert.equal(r.status, 1, r.stderr);
  assert.ok(existsSync(join(out, 'RUN-20261009-01.report.md')));
  assert.match(readFileSync(join(out, 'evidence.jsonl'), 'utf8'), /Chưa cấu hình tài khoản sandbox/);
});
