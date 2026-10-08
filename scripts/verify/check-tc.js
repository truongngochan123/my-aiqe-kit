#!/usr/bin/env node
'use strict';
// Kiểm tra một file test case do skill test-design-rbt tạo ra.
//
// Dùng:  node scripts/verify/check-tc.js <file.md> [<file.md>...]
//        node scripts/verify/check-tc.js --self-test
// Thoát mã 1 nếu có LỖI. CẢNH BÁO không làm fail.
//
// Kiểm tra (theo rules/test_design.md, rules/id_conventions.md, rules/evidence_labels.md):
//  1. Front-matter có produced_by
//  2. Dòng tổng "N TC chạy được · M mục thăm dò · K câu hỏi" và N, M khớp số dòng thật
//  3. Bảng TC chạy được: không có expected chưa biết (UNKNOWN, Not specified, cần xác nhận…)
//  4. TC ID, Source, Test Data đúng quy ước (ID data QA-r001-…, email @example.com, không "dữ liệu hợp lệ")
//  5. Quan sát của QA gắn DOM-OBSERVED, không gắn PROVIDED
//  6. Không ký hiệu tắt tự đặt (C0, E, R…) ở đầu Scenario; Priority P1–P4; Risk hợp lệ
// Script chỉ bắt lỗi HÌNH THỨC. Chất lượng nội dung (đủ case, oracle đúng) vẫn cần người duyệt.

const fs = require('fs');
const path = require('path');

const RE = {
  tcId: /^TC-[A-Z][A-Z0-9]{1,9}-\d{3}$/,
  source: /\b(AC|HYP|PRV)-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b/,
  qId: /^Q-[A-Z][A-Z0-9]{1,9}-\d{2,3}$/,
  dataIdLike: /\b[A-Z]{2,6}-r\d+[A-Za-z0-9-]*/g,
  dataId: /^[A-Z]{2,6}-r\d{3}-[A-Za-z0-9-]+$/,
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  safeEmail: /@(?:example\.(?:com|org|net)|[A-Za-z0-9.-]+\.(?:test|invalid|example))$/i,
  unknownExpected: /\b(UNKNOWN|Not specified|TBD|N\/A)\b|chưa biết|chưa rõ|cần xác nhận|tùy hệ thống|chờ xác nhận/i,
  vagueData: /dữ liệu hợp lệ|dữ liệu đúng|giá trị hợp lệ|email hợp lệ|mã hợp lệ|valid data|valid value/i,
  abbrev: /^(C\d+|E\d*|R\d*|N\d+|H\d*|B\d*)[\s:.)-]/,
  count: /(\d+)\s*TC chạy được\s*·\s*(\d+)\s*mục thăm dò\s*·\s*(\d+)\s*câu hỏi|(\d+)\s*executable test cases?\s*·\s*(\d+)\s*exploration items?\s*·\s*(\d+)\s*questions?/i,
  reqSource: /\bAC-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b|(?<![-\w])[A-Z][A-Z0-9]{1,9}-\d+\b|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/,
  date: /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/,
  qaObserved: /quan sát (của )?(mình|tôi|QA|user|tester)|mình quan sát|tôi quan sát|QA quan sát|tự quan sát/i,
};

function splitRow(line) {
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = []; let cur = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\' && body[i + 1] === '|') { cur += '|'; i++; continue; }
    if (body[i] === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += body[i];
  }
  cells.push(cur.trim());
  return cells;
}

function tables(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith('|') || !/^\|[\s:|-]+\|$/.test((lines[i + 1] || '').trim())) continue;
    const header = splitRow(l).map((h) => h.toLowerCase());
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) rows.push({ cells: splitRow(lines[j]), line: j + 1 });
    out.push({ header, rows, line: i + 1 });
    i = j - 1;
  }
  return out;
}

// Dòng bắt đầu bằng '|' nhưng không thuộc bảng nào có tiêu đề: markdown bị vỡ (thường do dòng trống chen giữa,
// hoặc thêm dòng vào cuối file thay vì vào bảng). Những dòng này KHÔNG được đếm.
function orphanRows(text, all) {
  const used = new Set();
  for (const t of all) { used.add(t.line); used.add(t.line + 1); for (const r of t.rows) used.add(r.line); }
  return text.split(/\r?\n/).map((l, i) => ({ l: l.trim(), line: i + 1 }))
    .filter((x) => x.l.startsWith('|') && !used.has(x.line) && !/^\|[\s:|-]+\|$/.test(x.l));
}

function check(text) {
  const errors = [];
  const warns = [];
  const E = (line, msg) => errors.push(`dòng ${line}: ${msg}`);
  const W = (line, msg) => warns.push(`dòng ${line}: ${msg}`);

  // 1. Front-matter
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) E(1, 'thiếu front-matter (--- id / source / labels / produced_by / status ---)');
  else if (!/^produced_by:\s*\S+/m.test(fm[1])) E(1, 'front-matter thiếu produced_by');
  else if (!/^produced_by:\s*test-design-rbt\b/m.test(fm[1])) W(1, 'produced_by khác test-design-rbt');

  const all = tables(text);
  for (const o of orphanRows(text, all)) E(o.line, `dòng bảng bị vỡ, không thuộc bảng có tiêu đề nên không được đếm: "${o.l.slice(0, 70)}"`);
  for (const tb of all) for (const r of tb.rows) {
    if (r.cells.length !== tb.header.length) E(r.line, `dòng có ${r.cells.length} ô nhưng tiêu đề có ${tb.header.length} ô (ký tự | trong ô phải viết \\|)`);
  }
  const tcTables = all.filter((t) => t.header.includes('tc id'));
  const qTables = all.filter((t) => t.header.includes('q id') && !t.header.includes('tc id'));
  const nTc = tcTables.reduce((s, t) => s + t.rows.filter((r) => r.cells.some(Boolean)).length, 0);
  const nQ = qTables.reduce((s, t) => s + t.rows.filter((r) => r.cells.some(Boolean)).length, 0);

  // 2. Dòng tổng
  // Chỉ coi là dòng tổng khi dòng (ngoài bảng) BẮT ĐẦU bằng "**Tổng" hoặc "Tổng:" (en: Total).
  // Không dùng \bTổng\b: khớp nhầm "tổng hợp", "tổng quan" (pilot T3, TC-PIM.v5.md dòng 99).
  const lines = text.split(/\r?\n/);
  const isTotalLine = (l) => !l.trim().startsWith('|') && /^\s*(\*\*\s*(Tổng|Total)\b|(Tổng|Total)\s*:)/i.test(l);
  const ci = lines.findIndex(isTotalLine);
  if (ci === -1) {
    E(1, 'thiếu dòng tổng; phải có một dòng (ngoài bảng) đúng mẫu: "**Tổng:** N TC chạy được · M mục thăm dò · K câu hỏi"');
  } else if (!RE.count.test(lines[ci])) {
    E(ci + 1, `dòng tổng sai mẫu ("${lines[ci].trim().slice(0, 80)}"); phải đúng mẫu: "**Tổng:** N TC chạy được · M mục thăm dò · K câu hỏi"`);
  } else {
    const m = lines[ci].match(RE.count);
    const N = Number(m[1] || m[4]); const M = Number(m[2] || m[5]);
    if (N !== nTc) E(ci + 1, `dòng tổng ghi ${N} TC chạy được nhưng bảng TC đếm được ${nTc} dòng`);
    if (M !== nQ) E(ci + 1, `dòng tổng ghi ${M} mục thăm dò nhưng bảng thăm dò đếm được ${nQ} dòng (kiểm tra dòng bảng bị vỡ)`);
  }
  if (tcTables.length === 0) E(1, 'không có bảng TC chạy được (bảng có cột "TC ID")');
  const iNext = lines.findIndex((l) => /^##\s.*(Bước tiếp theo|Next steps)/i.test(l));
  if (iNext === -1) E(lines.length, 'thiếu mục "## Bước tiếp theo" ở cuối file');
  else if (!lines.slice(iNext + 1).some((l) => /\S/.test(l) && !/^\s*(<!--|1\.\s*$)/.test(l))) E(iNext + 1, 'mục "Bước tiếp theo" để trống');

  // 3–6. Từng dòng TC
  const seen = new Set();
  for (const t of tcTables) {
    const col = (name) => t.header.indexOf(name);
    const iId = col('tc id'), iSrc = col('source'), iSc = col('scenario'), iExp = col('expected');
    const iData = col('test data'), iPri = col('priority'), iRisk = col('risk');
    for (const { cells, line } of t.rows) {
      if (!cells.some(Boolean)) continue;
      const id = cells[iId] || '';
      if (!RE.tcId.test(id)) E(line, `TC ID "${id}" không đúng TC-<MODULE>-<NNN>`);
      if (seen.has(id)) E(line, `TC ID "${id}" bị trùng`); seen.add(id);
      if (iSrc !== -1 && !RE.source.test(cells[iSrc] || '')) E(line, `${id}: Source "${cells[iSrc] || ''}" không có AC-/HYP-/PRV- hợp lệ`);
      if (iExp !== -1 && RE.unknownExpected.test(cells[iExp] || '')) E(line, `${id}: expected chưa biết ("${(cells[iExp].match(RE.unknownExpected) || [''])[0]}") → chuyển sang bảng thăm dò, không để trong bảng TC`);
      if (iSc !== -1 && RE.abbrev.test(cells[iSc] || '')) E(line, `${id}: Scenario bắt đầu bằng ký hiệu tắt "${(cells[iSc].match(RE.abbrev) || [''])[1]}"`);
      if (iPri !== -1 && !/^P[1-4]$/.test(cells[iPri] || '')) E(line, `${id}: Priority "${cells[iPri] || ''}" phải là P1–P4`);
      if (iRisk !== -1 && !/^(Critical|High|Medium|Low)$/i.test(cells[iRisk] || '')) E(line, `${id}: Risk "${cells[iRisk] || ''}" phải là Critical/High/Medium/Low`);
      if (iData !== -1) {
        const d = cells[iData] || '';
        if (RE.vagueData.test(d)) E(line, `${id}: test data mơ hồ ("${d.match(RE.vagueData)[0]}")`);
        for (const x of d.match(RE.dataIdLike) || []) if (!RE.dataId.test(x)) E(line, `${id}: ID data "${x}" không đúng <PREFIX>-r<NNN>-<tên> (ví dụ QA-r001-emp01, QA-r001-An)`);
      }
      for (const em of cells.join(' ').match(RE.email) || []) if (!RE.safeEmail.test(em)) E(line, `${id}: email "${em}" không dùng domain test (@example.com, .test)`);
    }
  }
  for (const t of qTables) {
    const iq = t.header.indexOf('q id');
    for (const { cells, line } of t.rows) if (cells.some(Boolean) && !RE.qId.test(cells[iq] || '')) E(line, `mã câu hỏi "${cells[iq]}" không đúng Q-<MODULE>-<NN>`);
  }

  // 5. Nhãn: REQ-CONFIRMED phải có nguồn; quan sát của QA phải là DOM-OBSERVED
  const fmText = fm ? fm[1] : '';
  const fileHasObsDate = RE.date.test(fmText) || lines.some((l) => RE.date.test(l) && (/^#/.test(l) || /quan sát|nguồn|observed|DOM-OBSERVED/i.test(l)));
  lines.forEach((l, i) => {
    if (/\bREQ-CONFIRMED\b/.test(l) && !/^\s*(labels|source)\s*:/.test(l) && !RE.reqSource.test(l)) {
      E(i + 1, 'REQ-CONFIRMED không có nguồn (mã AC/ticket, hoặc tên người xác nhận + ngày). Quy tắc user kể lại từ BA → PROVIDED + câu hỏi xin tên BA/mã ticket, Source PRV-…');
    }
    if (/\bPROVIDED\b/.test(l) && RE.qaObserved.test(l)) E(i + 1, 'quan sát của QA gắn PROVIDED → phải là DOM-OBSERVED (ghi người quan sát, env, ngày)');
    if (!fileHasObsDate && /\bDOM-OBSERVED\b/.test(l) && !RE.date.test(l) && !/ngày|UNKNOWN/.test(l) && !/^\s*(labels|source)\s*:/.test(l)) W(i + 1, 'DOM-OBSERVED không thấy ngày quan sát (cả trên dòng lẫn ở tiêu đề/đoạn nguồn)');
  });

  return { errors, warns, nTc, nQ };
}

function report(name, r) {
  console.log(`\n== ${name}`);
  r.errors.forEach((e) => console.log(`  LỖI       ${e}`));
  r.warns.forEach((w) => console.log(`  CẢNH BÁO  ${w}`));
  console.log(`  → ${r.nTc} TC chạy được, ${r.nQ} mục thăm dò · ${r.errors.length} lỗi, ${r.warns.length} cảnh báo`);
}

// ---------------------------------------------------------------- self-test
const GOOD = `---
id: TC-PIM
source: [HYP-PIM-01]
labels: [AI-PROPOSAL, DOM-OBSERVED]
produced_by: test-design-rbt
status: draft
---
# Test cases: PIM
Bảng tổng hợp 2 nhóm rủi ro, tổng quan 3 màn hình (câu có chữ "tổng" nhưng không phải dòng tổng).
**Tổng:** 2 TC chạy được · 1 mục thăm dò · 1 câu hỏi

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PIM-001 | HYP-PIM-01 | Thêm nhân viên đủ field bắt buộc | Đăng nhập Admin | 1. Mở Add Employee<br>2. Nhập tên<br>3. Bấm Save | 1. Form mở<br>2. Nhập được<br>3. Tìm theo tên thấy đúng 1 dòng (hành vi quan sát ngày 07/10, chưa có requirement xác nhận) | First Name QA-r001-An, Last Name Test | P1 | High | Yes | UI | @Smoke |
| TC-PIM-002 | HYP-PIM-02 | Bỏ trống First Name | Đăng nhập Admin | 1. Bấm Save | 1. Hiện thông báo bắt buộc dưới First Name (DOM-OBSERVED, user, OrangeHRM demo, 07/10) | qa.emp02@example.com | P2 | Medium | Yes | UI | @Regression |

| Q ID | Scenario cần thăm dò | Cần biết điều gì | Cách quan sát | Risk |
|---|---|---|---|---|
| Q-PIM-01 | First Name 300 ký tự | Độ dài tối đa | Nhập 300 ký tự, xem phản hồi | Medium |

## 6. Bước tiếp theo
1. Thăm dò Q-PIM-01 trên OrangeHRM demo, rồi gọi test-design-rbt maintain.
`;
const BAD = `---
id: TC-PIM
labels: [AI-PROPOSAL]
status: draft
---
# Test cases: PIM
**Tổng:** 3 TC chạy được · 0 mục thăm dò · 0 câu hỏi

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PIM-1 | Not specified | C0 Thêm nhân viên | Đăng nhập | 1. Bấm Save | 1. Lưu được theo quan sát của mình (PROVIDED) | dữ liệu hợp lệ | P0 | Huge | Yes | UI | @Smoke |
| TC-PIM-002 | HYP-PIM-02 | E Max length | Đăng nhập | 1. Nhập 300 ký tự | 1. UNKNOWN, cần xác nhận | QA-r2, nguyen.van.a@gmail.com | P1 | Medium | Yes | UI | @Boundary |
`;
const BAD2 = `---
id: TC-PIM
produced_by: test-design-rbt
status: draft
---
# Test cases: PIM
**Tổng:** 10 TC có oracle

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PIM-001 | HYP-PIM-01 | Company tối đa 100 ký tự theo BA (REQ-CONFIRMED) | Đăng nhập | 1. Nhập 101 ký tự | 1. Báo lỗi | QA-r001-An | P2 | Medium | Yes | UI | @Boundary |
| TC-PIM-002 | PRV-PIM-01 | thiếu ô | 1. a | 1. b |

| TC-PIM-003 | HYP-PIM-03 | Dòng thêm sau dòng trống | Đăng nhập | 1. a | 1. b | QA-r001-Binh | P3 | Low | Yes | UI | @Regression |

## 6. Bước tiếp theo
1. Hỏi BA.
`;
const EXPECT_BAD2 = ['dòng tổng sai mẫu', 'REQ-CONFIRMED không có nguồn', 'dòng bảng bị vỡ', 'ô nhưng tiêu đề có'];
// Không có dòng tổng, chỉ có câu "tổng hợp" và ô bảng chứa "Tổng" → phải báo THIẾU, không báo "sai mẫu" ở câu tổng hợp.
const BAD3 = `---
id: TC-PIM
produced_by: test-design-rbt
status: draft
---
# Test cases: PIM
Phần tổng hợp 5 rủi ro chính ở dưới.

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PIM-001 | HYP-PIM-01 | Tổng: lương hiển thị đúng | Đăng nhập | 1. Mở Salary | 1. Tổng 2 khoản bằng 3000 | QA-r001-An | P2 | Medium | Yes | UI | @Regression |

## 6. Bước tiếp theo
1. Viết dòng tổng.
`;

const EXPECT_BAD = ['thiếu produced_by', 'ghi 3 TC chạy được nhưng bảng TC đếm được 2', 'TC-PIM-1', 'Source', 'ký hiệu tắt', 'Priority "P0"', 'Risk "Huge"',
  'test data mơ hồ', 'expected chưa biết', 'ID data "QA-r2"', 'gmail.com', 'gắn PROVIDED', 'Bước tiếp theo'];

function selfTest() {
  let fail = 0;
  const g = check(GOOD);
  const okGood = g.errors.length === 0;
  console.log(`${okGood ? 'PASS' : 'FAIL'}  file mẫu ĐÚNG: ${g.errors.length} lỗi (mong đợi 0)`); if (!okGood) { fail++; g.errors.forEach((e) => console.log('      ' + e)); }
  const b = check(BAD);
  for (const key of EXPECT_BAD) {
    const hit = b.errors.some((e) => e.includes(key));
    if (!hit) fail++;
    console.log(`${hit ? 'PASS' : 'FAIL'}  file mẫu SAI bắt được: ${key}`);
  }
  const b2 = check(BAD2);
  for (const key of EXPECT_BAD2) {
    const hit = b2.errors.some((e) => e.includes(key));
    if (!hit) fail++;
    console.log(`${hit ? 'PASS' : 'FAIL'}  file mẫu SAI (2) bắt được: ${key}`);
  }
  const b3 = check(BAD3);
  const ok3 = b3.errors.some((e) => e.includes('thiếu dòng tổng')) && !b3.errors.some((e) => e.includes('sai mẫu'));
  if (!ok3) fail++;
  console.log(`${ok3 ? 'PASS' : 'FAIL'}  câu "tổng hợp" / ô bảng có "Tổng" không bị coi là dòng tổng → báo thiếu dòng tổng`);
  const total = 2 + EXPECT_BAD.length + EXPECT_BAD2.length;
  console.log(`\ncheck-tc self-test: ${total - fail}/${total} đúng`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------- main
module.exports = { check };
if (require.main !== module) { /* được require bởi script khác: không chạy main */ }
else if (process.argv.includes('--self-test')) selfTest();
else {
  const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!files.length) { console.log('Dùng: node scripts/verify/check-tc.js <file.md> [...]  |  --self-test'); process.exit(1); }
  let errs = 0;
  for (const f of files) { const r = check(fs.readFileSync(path.resolve(f), 'utf8')); report(f, r); errs += r.errors.length; }
  console.log(`\ncheck-tc: ${files.length} file, ${errs} lỗi${errs ? ' → CHƯA ĐẠT' : ' → ĐẠT'}`);
  process.exit(errs ? 1 : 0);
}
