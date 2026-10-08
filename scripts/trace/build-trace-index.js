#!/usr/bin/env node
'use strict';
// Quét output của kit, dựng bảng truy vết requirement → TC → bug/run, và chỉ ra lỗ hổng.
// Regex ID đọc thẳng từ bảng trong rules/id_conventions.md (một nguồn duy nhất; sửa regex ở đó là script theo).
//
// Dùng: node scripts/trace/build-trace-index.js [<output_dir>] [--out <file>] [--check]
//   Mặc định <output_dir> = <cwd>/.aiqe/output; ghi <output_dir>/traceability_index.md.
//   --check: thoát mã 1 nếu có lỗ hổng (TC không có nguồn, requirement không có TC, bug không trỏ về TC/AC).
//   --self-test: chạy với dữ liệu mẫu.
// Chỉ đọc file .md; không sửa file nào ngoài file index.

const fs = require('fs');
const path = require('path');
const os = require('os');

const RULES = path.resolve(__dirname, '..', '..', 'rules', 'id_conventions.md');
const KINDS = ['AC', 'PRV', 'HYP', 'TC', 'BUG', 'RUN', 'SES', 'Q'];
const REQ_KINDS = ['AC', 'PRV', 'HYP'];

function loadRegexes(rulesFile = RULES) {
  const text = fs.readFileSync(rulesFile, 'utf8');
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    const re = (cells[3] || '').match(/^`(.+)`$/);
    const ex = (cells[4] || '').match(/^`([A-Z]+)-/);
    if (!re || !ex || !KINDS.includes(ex[1]) || out[ex[1]]) continue;
    if (/-a\\d\+/.test(re[1])) continue; // dòng attempt
    out[ex[1]] = new RegExp(re[1], 'g');
  }
  const missing = KINDS.filter((k) => !out[k]);
  if (missing.length) throw new Error(`Không đọc được regex cho ${missing.join(', ')} trong ${rulesFile}`);
  return out;
}

const idsIn = (text, re) => [...new Set(String(text).match(re) || [])];

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

// Bảng có cột "TC ID" và "Source": mỗi dòng → { tc, sources[] }.
function tcRows(text, RE) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].trim();
    if (!head.startsWith('|')) continue;
    const cols = head.split(/(?<!\\)\|/).map((c) => c.trim());
    const tcCol = cols.findIndex((c) => /^TC ID$/i.test(c));
    const srcCol = cols.findIndex((c) => /^Source$/i.test(c));
    if (tcCol < 0 || srcCol < 0) continue;
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const cells = lines[j].trim().split(/(?<!\\)\|/).map((c) => c.trim());
      const tc = idsIn(cells[tcCol] || '', RE.TC)[0];
      if (!tc) continue;
      const srcText = cells[srcCol] || '';
      rows.push({ tc, sources: REQ_KINDS.flatMap((k) => idsIn(srcText, RE[k])), notSpecified: /Not specified/i.test(srcText) });
      i = j;
    }
  }
  return rows;
}

function walkMd(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && !e.name.startsWith('.')) out.push(...walkMd(p)); }
    else if (e.name.endsWith('.md') && e.name !== 'traceability_index.md') out.push(p);
  }
  return out;
}

function build(dir, RE) {
  const reqMentioned = new Map(); // id → [file]
  const tcSource = new Map();     // tc → { sources, file }
  const bugs = [];                // { id, refs, file }
  const runs = new Map();         // tc → Set(run)
  const add = (m, k, v) => { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(v); };
  for (const file of walkMd(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, '/');
    const text = fs.readFileSync(file, 'utf8');
    const fm = frontMatter(text);
    for (const k of REQ_KINDS) for (const id of idsIn(text, RE[k])) add(reqMentioned, id, rel);
    for (const r of tcRows(text, RE)) tcSource.set(r.tc, { sources: r.sources, notSpecified: r.notSpecified, file: rel });
    const ownId = fm.id || '';
    if (idsIn(ownId, RE.BUG).length || /^bugs\//.test(rel)) {
      const src = fm.source || '';
      bugs.push({ id: idsIn(ownId, RE.BUG)[0] || rel, refs: [...idsIn(src, RE.TC), ...REQ_KINDS.flatMap((k) => idsIn(src, RE[k]))], file: rel });
    }
    const runIds = [...idsIn(ownId, RE.RUN), ...idsIn(rel, RE.RUN)];
    if (runIds.length || /^runs\//.test(rel)) for (const tc of idsIn(text, RE.TC)) for (const r of (runIds.length ? runIds : [rel])) add(runs, tc, r);
  }

  const reqToTc = new Map();
  for (const [tc, s] of tcSource) for (const r of s.sources) add(reqToTc, r, tc);
  const bugsByRef = new Map();
  for (const b of bugs) for (const r of b.refs) add(bugsByRef, r, b.id);

  const gaps = [];
  for (const [id, files] of reqMentioned) if (!reqToTc.has(id) && !id.startsWith('Q-')) gaps.push(`\`${id}\` chưa có TC nào trỏ tới (nhắc ở: ${[...files].slice(0, 3).join(', ')})`);
  for (const [tc, s] of tcSource) if (!s.sources.length) gaps.push(`\`${tc}\` không có Source${s.notSpecified ? ' (ghi Not specified: cần câu trả lời)' : ''} (${s.file})`);
  for (const b of bugs) if (!b.refs.length) gaps.push(`\`${b.id}\` không trỏ về TC/AC nào trong front-matter source (${b.file})`);
  return { reqMentioned, tcSource, reqToTc, bugsByRef, runs, gaps };
}

function render(idx, dir) {
  const sortIds = (a) => [...a].sort();
  const L = ['---', 'produced_by: build-trace-index', `generated_at: ${new Date().toISOString()}`, `scanned: ${dir.replace(/\\/g, '/')}`, '---', '',
    '# Traceability index', '', '> Sinh tự động từ ID trong file output (regex: `rules/id_conventions.md`). Không sửa tay; chạy lại script.', ''];
  L.push('## Requirement → test case', '', '| Requirement | Test case | Bug | Run |', '|---|---|---|---|');
  const reqs = sortIds(new Set([...idx.reqMentioned.keys(), ...idx.reqToTc.keys()]));
  for (const r of reqs) {
    const tcs = sortIds(idx.reqToTc.get(r) || []);
    const bugs = sortIds(new Set([...(idx.bugsByRef.get(r) || []), ...tcs.flatMap((t) => [...(idx.bugsByRef.get(t) || [])])]));
    const runs = sortIds(new Set(tcs.flatMap((t) => [...(idx.runs.get(t) || [])])));
    L.push(`| ${r} | ${tcs.join(', ') || '**chưa có**'} | ${bugs.join(', ')} | ${runs.join(', ')} |`);
  }
  L.push('', `## Lỗ hổng (${idx.gaps.length})`, '');
  L.push(...(idx.gaps.length ? idx.gaps.map((g) => `- ${g}`) : ['Không có.']));
  L.push('', '## Bước tiếp theo', '', idx.gaps.length
    ? '- Requirement chưa có TC → `test-design-rbt` mode maintain. TC/bug không có nguồn → bổ sung Source hoặc đưa vào câu hỏi `Q-*`.'
    : '- Không có lỗ hổng truy vết. Chạy lại script sau mỗi lần thêm TC/bug/run.', '');
  return L.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) return selfTest();
  const outIdx = args.indexOf('--out');
  const dir = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out') || path.join(process.cwd(), '.aiqe', 'output'));
  if (!fs.existsSync(dir)) { console.error(`Không có thư mục ${dir}`); process.exit(2); }
  const idx = build(dir, loadRegexes());
  const out = outIdx !== -1 ? path.resolve(args[outIdx + 1]) : path.join(dir, 'traceability_index.md');
  fs.writeFileSync(out, render(idx, dir), 'utf8');
  console.log(`trace-index: ${idx.reqToTc.size + [...idx.reqMentioned.keys()].filter((k) => !idx.reqToTc.has(k)).length} requirement, ${idx.tcSource.size} TC, ${idx.gaps.length} lỗ hổng → ${out}`);
  if (args.includes('--check') && idx.gaps.length) process.exit(1);
}

function selfTest() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'aiqe-trace-'));
  const w = (rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
  w('analysis/REQ-PIM.md', '---\nid: REQ-PIM\n---\nAC-PIM-01, AC-PIM-02, PRV-PIM-01, Q-PIM-01\n');
  w('testcases/TC-PIM.md', '---\nid: TC-PIM\nproduced_by: test-design-rbt\n---\n| TC ID | Source | Scenario |\n|---|---|---|\n| TC-PIM-001 | AC-PIM-01 | a \\| b |\n| TC-PIM-002 | PRV-PIM-01, AC-PIM-01 | c |\n| TC-PIM-003 | Not specified | d |\n');
  w('bugs/BUG-PIM-001.md', '---\nid: BUG-PIM-001\nsource: [TC-PIM-002]\n---\nx');
  w('bugs/BUG-PIM-002.md', '---\nid: BUG-PIM-002\nsource: []\n---\nx');
  w('runs/RUN-20261009-01/report.md', '---\nid: RUN-20261009-01\n---\nTC-PIM-001 passed');
  const idx = build(d, loadRegexes());
  const md = render(idx, d);
  const checks = [
    ['đọc đủ regex từ id_conventions', () => Object.keys(loadRegexes()).length === KINDS.length],
    ['AC-PIM-01 → TC-PIM-001, TC-PIM-002 + bug + run', () => md.includes('| AC-PIM-01 | TC-PIM-001, TC-PIM-002 | BUG-PIM-001 | RUN-20261009-01 |')],
    ['PRV-PIM-01 được tính là nguồn', () => md.includes('| PRV-PIM-01 | TC-PIM-002 |')],
    ['AC-PIM-02 chưa có TC là lỗ hổng', () => idx.gaps.some((g) => g.includes('AC-PIM-02'))],
    ['TC không Source là lỗ hổng', () => idx.gaps.some((g) => g.includes('TC-PIM-003') && g.includes('Not specified'))],
    ['bug không nguồn là lỗ hổng', () => idx.gaps.some((g) => g.includes('BUG-PIM-002'))],
    ['Q- không bị coi là requirement', () => !md.includes('| Q-PIM-01 |')],
    ['dấu \\| trong ô không làm lệch cột', () => idx.tcSource.get('TC-PIM-001').sources.join() === 'AC-PIM-01'],
  ];
  let ok = 0;
  for (const [t, f] of checks) { if (f()) ok++; else console.log(`SAI  ${t}`); }
  console.log(`trace-index self-test: ${ok}/${checks.length} đúng`);
  process.exit(ok === checks.length ? 0 : 1);
}

module.exports = { loadRegexes, build, render, tcRows };
if (require.main === module) main();
