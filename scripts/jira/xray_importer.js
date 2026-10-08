'use strict';
// Chuẩn bị và (khi NGƯỜI quyết định) đẩy kết quả test lên Xray. Chuyển từ
// antigravity-testing-kit-main/scripts/integrations/jira/xray_importer.js (đã đọc toàn bộ 09/10). Khác bản gốc:
//  - Mặc định DRY-RUN: chỉ ghi payload ra file + in bảng tóm tắt. Đẩy thật cần --push (G4: publish, người chạy).
//  - Map test → Jira key chỉ khi tên test có [KEY-123] VÀ KEY đúng project. Bản gốc dùng /[A-Z]+-\d+/
//    nên "HTTP-500" hay "TC-001" trong tên test cũng bị coi là key.
//  - Test không có key: liệt kê ra, không lặng lẽ bỏ đi (bản gốc filter mất mà không báo).
//  - Flaky (fail rồi pass khi chạy lại): ghi FAILED kèm ghi chú, không ghi PASSED (rules/evidence_labels.md).
//    Bản gốc map "flaky" về TODO, và lấy kết quả lần cuối nên lần fail bị che.
//  - Không đính kèm trace/video (trace có cookie, storage, request). Chỉ ghi đường dẫn artifact vào comment.
//  - Bỏ dòng "Allure" trong mô tả bản gốc: bản gốc không hỗ trợ Allure.
//
// Dùng:
//   node scripts/jira/xray_importer.js --format playwright --file results.json --project KAN [--testplan KAN-9]
//        → ghi <cwd>/.aiqe/output/external/xray/<tên>.xray.json + in tóm tắt. KHÔNG gửi gì.
//   node --env-file=<.env.jira> scripts/jira/xray_importer.js … --push     (NGƯỜI chạy sau khi xem payload)
//   Định dạng: playwright | junit | xray.  --self-test: không cần mạng.

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');
const U = require('./utils');

function testKey(title, project) {
  const m = /\[([A-Z][A-Z0-9_]{1,9})-(\d+)\]/.exec(String(title));
  return m && m[1] === project ? `${m[1]}-${m[2]}` : null;
}

// Playwright JSON reporter: suites → specs → tests (mỗi project/browser một test) → results (mỗi lần chạy lại một result).
function convertPlaywright(report, project, testPlan) {
  const mapped = []; const unmapped = []; const flaky = [];
  const walk = (suite, file) => {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const results = t.results || [];
        const statuses = results.map((r) => r.status);
        const isFlaky = t.status === 'flaky' || (statuses.includes('passed') && statuses.some((s) => s !== 'passed' && s !== 'skipped'));
        let status;
        if (isFlaky) status = 'FAILED';
        else if (t.status === 'skipped' || statuses.every((s) => s === 'skipped')) status = 'TODO';
        else if (t.status === 'expected' || (statuses.length && statuses.every((s) => s === 'passed'))) status = 'PASSED';
        else status = 'FAILED';
        const where = `${spec.file || file || ''}:${spec.line || ''}${t.projectName ? ` [${t.projectName}]` : ''}`;
        const artifacts = results.flatMap((r) => (r.attachments || []).filter((a) => a.path).map((a) => `${a.name}: ${a.path}`));
        const comment = [
          `Test: ${spec.title}`, `Vị trí: ${where}`, `Số lần chạy: ${results.length} (${statuses.join(', ') || 'không có'})`,
          isFlaky ? 'FLAKY: có lần fail, có lần pass. Ghi FAILED, không ghi PASSED. Cần triage (incident-triage).' : '',
          artifacts.length ? `Artifact (không đính kèm, xem tại máy chạy):\n${artifacts.join('\n')}` : '',
        ].filter(Boolean).join('\n');
        const key = testKey(spec.title, project);
        const row = { title: spec.title, where, status };
        if (isFlaky) flaky.push(row);
        if (key) mapped.push({ testKey: key, status, comment, ...(results[0] && results[0].startTime ? { start: results[0].startTime } : {}) });
        else unmapped.push(row);
      }
    }
    for (const s of suite.suites || []) walk(s, s.file || file);
  };
  for (const s of report.suites || []) walk(s, s.file);
  const payload = {
    info: {
      project,
      summary: `Playwright: ${mapped.length} test (${new Date().toISOString().slice(0, 10)})`,
      description: `Nhập bằng my-aiqe-kit. ${mapped.length} test có key, ${unmapped.length} test không có key (không gửi), ${flaky.length} flaky (ghi FAILED).`,
      ...(report.stats && report.stats.startTime ? { startDate: report.stats.startTime } : {}),
      ...(testPlan ? { testPlanKey: testPlan } : {}),
    },
    tests: mapped,
  };
  return { payload, mapped, unmapped, flaky };
}

function summarizeJunit(xml) {
  const cases = (xml.match(/<testcase\b/g) || []).length;
  const failures = (xml.match(/<(failure|error)\b/g) || []).length;
  const skipped = (xml.match(/<skipped\b/g) || []).length;
  return { cases, failures, skipped };
}

function printSummary(r) {
  console.log(`\nCó key (sẽ gửi): ${r.mapped.length} · Không có key (KHÔNG gửi): ${r.unmapped.length} · Flaky (ghi FAILED): ${r.flaky.length}`);
  if (r.mapped.length) { console.log('\n| Key | Kết quả |\n|---|---|'); r.mapped.forEach((m) => console.log(`| ${m.testKey} | ${m.status} |`)); }
  if (r.unmapped.length) {
    console.log('\nTest không có [KEY-n] của project trong tên (không gửi):');
    r.unmapped.forEach((u) => console.log(`  - ${u.title} (${u.where}) → ${u.status}`));
  }
  if (r.flaky.length) { console.log('\nFlaky:'); r.flaky.forEach((u) => console.log(`  - ${u.title} (${u.where})`)); }
}

async function push(format, body, project) {
  const { xrayHeaders, platform, XRAY_CLOUD } = require('./xray_auth');
  const headers = await xrayHeaders();
  const p = platform();
  let url; let send = body; let contentType = 'application/json';
  if (p === 'cloud') {
    if (format === 'junit') { url = `${XRAY_CLOUD}/import/execution/junit?projectKey=${encodeURIComponent(project)}`; contentType = 'text/xml'; }
    else url = `${XRAY_CLOUD}/import/execution`;
  } else {
    if (format === 'junit') throw new U.ConfigError('JUnit lên Xray Server/DC chưa hỗ trợ (giống bản gốc).');
    url = `${U.jiraConfig().base}/rest/raven/2.0/import/execution`;
  }
  const res = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': contentType }, body: typeof send === 'string' ? send : JSON.stringify(send) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Xray import HTTP ${res.status}`);
  let key = '';
  try { const j = JSON.parse(text); key = j.key || (j.testExecIssue && j.testExecIssue.key) || j.id || ''; } catch (_) { /* bỏ qua */ }
  console.log(`Đã đẩy lên Xray. Test Execution: ${key || '(không đọc được key)'}`);
}

async function run() {
  const { values } = parseArgs({ options: {
    format: { type: 'string' }, file: { type: 'string' }, project: { type: 'string' }, testplan: { type: 'string' },
    out: { type: 'string' }, push: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
  } });
  if (values.help || !values.format || !values.file) { console.log('Dùng: --format playwright|junit|xray --file <report> --project <KEY> [--testplan KEY] [--out <file>] [--push]. Xem đầu file.'); process.exit(values.help ? 0 : 2); }
  if (!['playwright', 'junit', 'xray'].includes(values.format)) throw new U.ConfigError('--format phải là playwright, junit hoặc xray');
  if (!fs.existsSync(values.file)) throw new U.ConfigError(`Không có file ${values.file}`);
  const project = values.project ? U.assertProjectKey(values.project) : null;
  if (values.testplan) U.assertIssueKey(values.testplan);
  const raw = fs.readFileSync(values.file, 'utf8');

  let body; let outName;
  if (values.format === 'playwright') {
    if (!project) throw new U.ConfigError('--project là bắt buộc với playwright');
    const r = convertPlaywright(JSON.parse(raw), project, values.testplan);
    printSummary(r);
    if (!r.mapped.length) throw new Error('Không có test nào có key [KEY-n] của project: không có gì để gửi.');
    body = r.payload; outName = `${path.basename(values.file, '.json')}.xray.json`;
  } else if (values.format === 'junit') {
    if (!project) throw new U.ConfigError('--project là bắt buộc với junit');
    const s = summarizeJunit(raw);
    console.log(`JUnit: ${s.cases} testcase, ${s.failures} fail/error, ${s.skipped} skipped. Xray map theo tên testcase; kiểm tra tên trước khi đẩy.`);
    body = raw; outName = null;
  } else {
    const j = JSON.parse(raw);
    if (!j.tests || !Array.isArray(j.tests)) throw new U.ConfigError('File xray phải có mảng "tests"');
    console.log(`Xray JSON: ${j.tests.length} test.`);
    body = j; outName = null;
  }
  if (outName) {
    const out = values.out ? path.resolve(values.out) : path.join(U.defaultOutputDir(path.join('external', 'xray')), outName);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(body, null, 2));
    console.log(`\nPayload: ${out}`);
  }
  if (!values.push) { console.log('\nDRY-RUN: chưa gửi gì. Người xem payload rồi chạy lại với --push (G4: publish).'); return; }
  console.log('\n--push: gửi lên Xray (G4, người chạy).');
  await push(values.format, body, project);
}

module.exports = { convertPlaywright, testKey, summarizeJunit };

if (require.main === module) {
  if (process.argv.includes('--self-test')) {
    const rep = { suites: [{ file: 'a.spec.ts', specs: [
      { title: '[KAN-1] đăng nhập đúng', line: 3, tests: [{ status: 'expected', results: [{ status: 'passed' }] }] },
      { title: '[KAN-2] sai mật khẩu', line: 9, tests: [{ status: 'flaky', results: [{ status: 'failed', attachments: [{ name: 'trace', path: 'test-results/x/trace.zip' }] }, { status: 'passed' }] }] },
      { title: 'trả HTTP-500 khi lỗi', line: 15, tests: [{ status: 'unexpected', results: [{ status: 'failed' }] }] },
      { title: '[HR-3] project khác', line: 20, tests: [{ status: 'expected', results: [{ status: 'passed' }] }] },
      { title: '[KAN-4] bỏ qua', line: 25, tests: [{ status: 'skipped', results: [{ status: 'skipped' }] }] },
    ] }] };
    const r = convertPlaywright(rep, 'KAN');
    U.runSelfTest('xray_importer', [
      ['chỉ map [KEY-n] đúng project; HTTP-500 không phải key', () => { U.eq(testKey('trả HTTP-500 khi lỗi', 'KAN'), null); U.eq(testKey('[HR-3] x', 'KAN'), null); U.eq(testKey('[KAN-12] x', 'KAN'), 'KAN-12'); }],
      ['test không key được liệt kê, không mất', () => U.eq(r.unmapped.map((u) => u.title), ['trả HTTP-500 khi lỗi', '[HR-3] project khác'])],
      ['flaky ghi FAILED, có ghi chú FLAKY', () => { const k2 = r.mapped.find((m) => m.testKey === 'KAN-2'); U.eq(k2.status, 'FAILED'); U.eq(/FLAKY/.test(k2.comment), true); U.eq(r.flaky.length, 1); }],
      ['pass → PASSED, skip → TODO', () => { U.eq(r.mapped.find((m) => m.testKey === 'KAN-1').status, 'PASSED'); U.eq(r.mapped.find((m) => m.testKey === 'KAN-4').status, 'TODO'); }],
      ['không đính kèm trace, chỉ ghi đường dẫn', () => { const k2 = r.mapped.find((m) => m.testKey === 'KAN-2'); U.eq('evidences' in k2, false); U.eq(/trace: test-results\/x\/trace.zip/.test(k2.comment), true); }],
      ['JUnit đếm testcase/failure', () => U.eq(summarizeJunit('<testsuite><testcase/><testcase><failure/></testcase><testcase><skipped/></testcase></testsuite>'), { cases: 3, failures: 1, skipped: 1 })],
    ]);
  } else {
    U.main(run);
  }
}
