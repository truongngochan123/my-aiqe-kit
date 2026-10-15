// CLI của agent. Chạy: node --experimental-strip-types src/cli.ts <lệnh> [tùy chọn]  (hoặc npm run agent -- <lệnh>)
//
//   run     --scenario <tên> --run-id RUN-YYYYMMDD-NN [--tools fake|real] [--planner mock|codex] [--prefix QA-r001] [--out runs]
//   report  --run-id <id> [--out runs]
//   verify  [--out runs]
//   demo    [--out runs]      5 kịch bản demo với tool giả, mỗi lần một file evidence mới
//
// --tools real: gọi site sandbox thật. Approval LUÔN hỏi người trên console (không có cờ tự đồng ý).
//   Tài khoản sandbox: người chạy cấp qua `node --env-file=<đường dẫn .env.sandbox> …` (AIQE_SANDBOX_USER/PASS).
// --tools fake: kết quả tool lấy từ scenarios.json, approval theo kịch bản. Không chạm site nào.
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { userInfo } from 'node:os';
import type { Action, OracleSpec, Policy, RunRequest, ToolResult, ToolSpec } from './types.ts';
import { Controller } from './controller.ts';
import { EvidenceStore } from './evidence_store.ts';
import { ConsoleApprovals, ScriptedApprovals, type ApprovalProvider } from './approvals.ts';
import { createPlanner } from './planner/planner.ts';
import { createFakeTools } from './tools/fake.ts';
import { createRealTools } from './tools/index.ts';
import { buildReport, runLabel } from './report.ts';
import { loadFlowCatalog, applyCatalogToManifest } from './catalog.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = <T>(p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as T;
const policy = readJson<Policy>('config/policy.json');
const flows = loadFlowCatalog(join(ROOT, 'config/flows.json'));
const manifestRaw = readJson<{ tools: ToolSpec[] }>('config/tool_manifest.json').tools;
const manifest = applyCatalogToManifest(manifestRaw, flows);
interface Scenario { description: string; approvals: boolean[]; steps: Action[]; toolResults: Record<string, ToolResult[]> }
const scen = readJson<{ env: string; dataPrefix: string; oracle: OracleSpec; scenarios: Record<string, Scenario> }>('scenarios/scenarios.json');

export const DEMO = ['happy', 'write-timeout', 'injection', 'oracle-change', 'budget'] as const;

function fail(msg: string): never {
  console.error(`LỖI: ${msg}`);
  process.exit(2);
}

// Thay prefix mẫu trong kịch bản bằng prefix của run (QA-r001 → QA-r007).
function stepsFor(s: Scenario, prefix: string): Action[] {
  return JSON.parse(JSON.stringify(s.steps).split(scen.dataPrefix).join(prefix)) as Action[];
}

function writeReport(store: EvidenceStore, runId: string, outDir: string): string {
  const file = join(outDir, `${runId}.report.md`);
  writeFileSync(file, buildReport(store.readAll(), runId, store.verify()), 'utf8');
  return file;
}

async function runOne(o: { scenario: string; runId: string; tools: 'fake' | 'real'; planner: 'mock' | 'codex'; prefix: string; env: string; outDir: string; evidence: string; quiet?: boolean }) {
  const s = scen.scenarios[o.scenario] ?? fail(`không có kịch bản "${o.scenario}". Có: ${Object.keys(scen.scenarios).join(', ')}`);
  const store = new EvidenceStore(o.evidence);
  let tools; let approvals: ApprovalProvider; let oracle: OracleSpec; let close = async () => {};
  if (o.tools === 'real') {
    const real = createRealTools({ env: o.env, casesDir: join(ROOT, 'cases'), runsDir: o.outDir, manifest });
    tools = real.tools; close = real.close;
    approvals = new ConsoleApprovals(userInfo().username);
    oracle = readJson<{ oracle: OracleSpec }>('cases/EMP-CREATE-01/case.json').oracle;
  } else {
    tools = createFakeTools(manifest, s.toolResults).tools;
    approvals = new ScriptedApprovals(s.approvals);
    oracle = scen.oracle;
  }
  const planner = createPlanner(o.planner, { steps: stepsFor(s, o.prefix), tools: manifest.map((t) => t.name) });
  const controller = new Controller({ policy, manifest, tools, planner, approvals, store });
  const req: RunRequest = { runId: o.runId, caseId: 'EMP-CREATE-01', env: o.env, dataPrefix: o.prefix, oracle, simulated: o.tools === 'fake' };
  try {
    const out = await controller.run(req);
    const report = writeReport(store, o.runId, o.outDir);
    if (!o.quiet) {
      console.log(`\n${o.runId} · ${o.scenario} · ${o.tools}/${o.planner}`);
      console.log(`Kết quả: ${runLabel(out.verdict, o.tools === 'fake')} · trạng thái ${out.state}`);
      console.log(`Lý do: ${out.reason}`);
      console.log(`Báo cáo: ${report}`);
    }
    return out;
  } finally {
    await close();
  }
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      scenario: { type: 'string' }, 'run-id': { type: 'string' }, tools: { type: 'string', default: 'fake' },
      planner: { type: 'string', default: 'mock' }, prefix: { type: 'string', default: scen.dataPrefix },
      env: { type: 'string', default: policy.sandboxUrls[0] }, out: { type: 'string', default: join(ROOT, 'runs') },
    },
  });
  const cmd = positionals[0];
  const outDir = resolve(values.out!);
  mkdirSync(outDir, { recursive: true });
  const evidence = join(outDir, 'evidence.jsonl');

  if (cmd === 'run') {
    const tools = values.tools === 'real' ? 'real' : values.tools === 'fake' ? 'fake' : fail('--tools phải là fake hoặc real');
    const planner = values.planner === 'codex' ? 'codex' : values.planner === 'mock' ? 'mock' : fail('--planner phải là mock hoặc codex');
    if (!values.scenario) fail('thiếu --scenario');
    if (!values['run-id']) fail('thiếu --run-id (ví dụ RUN-20261009-01; mỗi run một ID mới)');
    const out = await runOne({ scenario: values.scenario!, runId: values['run-id']!, tools, planner, prefix: values.prefix!, env: values.env!, outDir, evidence });
    process.exit(out.verdict === 'pass' ? 0 : 1);
  }
  if (cmd === 'report') {
    if (!values['run-id']) fail('thiếu --run-id');
    if (!existsSync(evidence)) fail(`không có ${evidence}`);
    console.log(`Báo cáo: ${writeReport(new EvidenceStore(evidence), values['run-id']!, outDir)}`);
    return;
  }
  if (cmd === 'verify') {
    const v = new EvidenceStore(evidence).verify();
    console.log(v.ok ? `evidence: nguyên vẹn (${evidence})` : `evidence: HỎNG tại bản ghi ${v.brokenAt}: ${v.reason}`);
    process.exit(v.ok ? 0 : 1);
  }
  if (cmd === 'demo') {
    const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const demoDir = join(outDir, `demo-${stamp}`);
    mkdirSync(demoDir, { recursive: true });
    const day = stamp.slice(0, 8);
    const rows: string[] = ['| # | Kịch bản | Kết quả | Trạng thái | Lý do |', '|---|---|---|---|---|'];
    for (const [i, name] of DEMO.entries()) {
      const runId = `RUN-${day}-${String(i + 1).padStart(2, '0')}`;
      const out = await runOne({ scenario: name, runId, tools: 'fake', planner: 'mock', prefix: scen.dataPrefix, env: scen.env, outDir: demoDir, evidence: join(demoDir, 'evidence.jsonl'), quiet: true });
      rows.push(`| ${i + 1} | ${name} | ${runLabel(out.verdict, true)} | ${out.state} | ${out.reason.replace(/\|/g, '\\|').slice(0, 90)} |`);
    }
    const v = new EvidenceStore(join(demoDir, 'evidence.jsonl')).verify();
    console.log(rows.join('\n'));
    console.log(`\nEvidence: ${v.ok ? 'nguyên vẹn' : 'HỎNG'} · báo cáo trong ${demoDir}`);
    return;
  }
  console.log('Lệnh: run | report | verify | demo. Xem đầu file src/cli.ts.');
  process.exit(cmd ? 2 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => fail((e as Error).message));
}
