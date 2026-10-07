#!/usr/bin/env node
'use strict';
// Kiểm tra một file bug report do skill bug-reporting tạo ra, theo 7 điều kiện của rules/bug_report.md.
//
// Dùng:  node scripts/verify/check-bug.js <file.md> [<file.md>...]
//        node scripts/verify/check-bug.js --self-test
// Thoát mã 1 nếu có LỖI.
//
// File có id dạng Q-… (câu hỏi, khi expected không có nguồn) chỉ được kiểm tra là KHÔNG giả làm bug.
// Script chỉ bắt lỗi HÌNH THỨC; đúng/sai nghiệp vụ vẫn cần người duyệt.

const fs = require('fs');
const path = require('path');
const { redactText, loadPatterns } = require('../redact/redact');

const SEVERITY = /\bS[1-4]\b/;
const RUN_FAIL = /MANUAL-RUN:\s*failed|LOCAL-RUN:\s*failed|CI-RUN:\s*failed|RUN-FAILED|DOM-OBSERVED/;
const SOURCE_REQ = /\bAC-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b|REQ-CONFIRMED/;
const SOURCE_OBVIOUS = /kỳ vọng hiển nhiên\s*#\s*[1-4]\b/i;
const JUDGEMENT = /nghiêm trọng|rất tệ|tồi tệ|khủng khiếp|cực kỳ|critical!|terrible|horrible/i;

function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const l of m[1].split(/\r?\n/)) { const kv = l.match(/^([a-z_]+):\s*(.*)$/); if (kv) fm[kv[1]] = kv[2].trim(); }
  return fm;
}

// Lấy nội dung một mục "## <tên>" (tên có thể song ngữ: "## Expected / Kết quả mong đợi").
function section(text, re) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s/.test(l) && re.test(l));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end === -1) end = lines.length;
  return lines.slice(start + 1, end).join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
}

// Giá trị một dòng trong bảng thông tin "| Trường | Giá trị |".
function field(text, re) {
  const l = text.split(/\r?\n/).find((x) => /^\|/.test(x) && re.test(x.split('|')[1] || ''));
  return l ? (l.split('|')[2] || '').trim() : null;
}

function check(text) {
  const errors = [];
  const warns = [];
  const fm = frontMatter(text);
  if (!fm) return { errors: ['thiếu front-matter'], warns, kind: '?' };
  if (!fm.produced_by) errors.push('front-matter thiếu produced_by');

  // Câu hỏi (không phải bug)
  if (/^Q-/.test(fm.id || '')) {
    if (/^BUG-/m.test(text.replace(/^---[\s\S]*?---/, '')) && /status:\s*(ready|submitted)/.test(text)) errors.push('file câu hỏi Q-… nhưng có nội dung/trạng thái của bug');
    if (!/\?/.test(text)) warns.push('file câu hỏi không có câu hỏi nào (dấu "?")');
    return { errors, warns, kind: 'question' };
  }

  if (!/^BUG-[A-Z][A-Z0-9]{1,9}-\d{3}$/.test(fm.id || '')) errors.push(`id "${fm.id || ''}" không đúng BUG-<MODULE>-<NNN>`);
  const status = fm.status || '';
  if (!/^(draft|ready|submitted|verified|reopened|closed)$/.test(status)) errors.push(`status "${status}" không hợp lệ`);
  const draft = status === 'draft';

  // Tiêu đề
  const title = (text.match(/^#\s+(.+)$/m) || [, ''])[1];
  if (!/^\[[^\]]+\]\s*.+→.+/.test(title)) errors.push(`tiêu đề "${title}" không theo dạng "[Module] Hành động → kết quả sai"`);
  if (JUDGEMENT.test(title)) errors.push(`tiêu đề có nhận định ("${title.match(JUDGEMENT)[0]}")`);

  // Điều kiện 1: actual có evidence
  const actual = section(text, /Actual/i) || '';
  const evidence = section(text, /Evidence|Bằng chứng/i) || '';
  const evidenceRows = evidence.split(/\r?\n/).filter((l) => /^\|/.test(l) && !/^\|[\s:|-]+\|$/.test(l) && !/^\|\s*Loại\s*\|/i.test(l) && /\|\s*[^|\s<][^|]*\|/.test(l.split('|').slice(2, 3).map((c) => `|${c}|`)[0] || ''));
  const hasEvidence = RUN_FAIL.test(actual) && evidenceRows.length > 0;
  if (!hasEvidence) {
    if (draft && /Insufficient evidence/.test(text)) warns.push('bản nháp thiếu evidence (đã ghi Insufficient evidence): chưa được chuyển ready');
    else errors.push('điều kiện 1: Actual không có nhãn evidence thật (MANUAL-RUN/LOCAL-RUN/CI-RUN: failed, RUN-FAILED, DOM-OBSERVED) hoặc mục Evidence không có ref nào; thiếu thì phải để status: draft + "Insufficient evidence"');
  }
  if (/HYPOTHESIS|AI-PROPOSAL/.test(actual) && !RUN_FAIL.test(actual)) errors.push('điều kiện 1: Actual chỉ dựa trên HYPOTHESIS/AI-PROPOSAL');

  // Điều kiện 2: severity, priority
  const sev = field(text, /Severity/i);
  if (!sev || !SEVERITY.test(sev)) errors.push('điều kiện 2: thiếu Severity S1–S4');
  const pri = field(text, /Priority/i);
  if (!pri || !/P[1-4]/.test(pri)) errors.push('điều kiện 2: thiếu Priority P1–P4');
  else if (!/AI-PROPOSAL/.test(pri)) errors.push('điều kiện 2: Priority phải gắn AI-PROPOSAL (PO/lead quyết định)');

  // Điều kiện 3: expected có nguồn
  const expected = section(text, /Expected/i) || '';
  if (!expected) errors.push('điều kiện 3: thiếu mục Expected');
  else if (SOURCE_OBVIOUS.test(expected)) {
    if (!/AI-PROPOSAL/.test(expected)) errors.push('điều kiện 3: expected theo kỳ vọng hiển nhiên phải gắn AI-PROPOSAL');
    if (!/xác nhận/i.test(expected)) errors.push('điều kiện 3: expected theo kỳ vọng hiển nhiên phải ghi "cần PO/BA xác nhận"');
  } else if (!SOURCE_REQ.test(expected)) {
    errors.push('điều kiện 3: expected không có nguồn (AC-…/REQ-CONFIRMED hoặc "kỳ vọng hiển nhiên #1–#4") → phải là câu hỏi Q-…, không phải bug');
  }

  // Điều kiện 4: kiểm tra trùng
  const dup = field(text, /Duplicate|trùng/i);
  if (!dup || /^<.*>$/.test(dup)) errors.push('điều kiện 4: thiếu dòng Duplicate check (đã kiểm tra trong CSV nào, hoặc "Chưa kiểm tra: thiếu CSV")');

  // Điều kiện 5: không còn dữ liệu nhạy cảm
  const { counts } = redactText(text, loadPatterns());
  const leaks = Object.entries(counts).map(([k, v]) => `${k}=${v}`);
  if (leaks.length) errors.push(`điều kiện 5: còn dữ liệu cần che (${leaks.join(', ')}); chạy scripts/redact/redact.js`);

  // Tỉ lệ tái hiện, bước tái hiện
  const rep = field(text, /Reproducibility|tái hiện/i);
  if (!rep || !(/\d+\s*\/\s*\d+/.test(rep) || /Insufficient evidence/.test(rep))) errors.push('thiếu tỉ lệ tái hiện (dạng 3/5) hoặc "Insufficient evidence"');
  const steps = section(text, /Steps|tái hiện/i) || '';
  if (!/^\s*1\.\s+\S/m.test(steps)) errors.push('bước tái hiện không đánh số (1. 2. 3.)');
  if (!field(text, /Environment|Build/i)) errors.push('thiếu Environment / Build');

  return { errors, warns, kind: 'bug' };
}

// ---------------------------------------------------------------- self-test
const GOOD = `---
id: BUG-PIM-001
source: [TC-PIM-001]
labels: [MANUAL-RUN: failed]
produced_by: bug-reporting
status: ready
---
# [PIM] Bấm Save khi thêm nhân viên → trang báo lỗi hệ thống 500

| Trường / Field | Giá trị / Value |
|---|---|
| Environment / Build | OrangeHRM demo / UNKNOWN |
| Browser / Device | Chrome 129, Windows 11 |
| Severity | S2 |
| Priority (đề xuất) | P2 (\`AI-PROPOSAL\`) |
| Reproducibility | 3/3 |
| Related | TC-PIM-001 |
| Duplicate check | Chưa kiểm tra: thiếu CSV |

## Steps to reproduce / Các bước tái hiện
1. Đăng nhập tài khoản test
2. Mở PIM > Add Employee, nhập First Name QA-r001-emp01
3. Bấm Save

## Expected / Kết quả mong đợi
Lưu thành công, không có trang lỗi — nguồn: kỳ vọng hiển nhiên #1 (\`AI-PROPOSAL\`), cần PO/BA xác nhận expected

## Actual / Kết quả thực tế
Trang báo lỗi 500 — \`MANUAL-RUN: failed\` (người chạy: Han, 07/10)

## Evidence / Bằng chứng
| Loại | Ref | Đã che dữ liệu nhạy cảm? |
|---|---|---|
| Screenshot | evidence/pim-500.png | Có (người che) |
`;
const BAD = `---
id: BUG-PIM-2
labels: []
status: ready
---
# Lỗi nghiêm trọng ở PIM

| Trường | Giá trị |
|---|---|
| Severity | Cao |
| Priority (đề xuất) | P1 |
| Reproducibility | thỉnh thoảng |

## Steps to reproduce
Vào trang, bấm nút.

## Expected
Hệ thống không cho tạo 2 nhân viên trùng tên.

## Actual
Có lẽ do validation thiếu (\`HYPOTHESIS\`). Liên hệ nguyen.van.a@gmail.com
`;
const EXPECT_BAD = ['thiếu produced_by', 'id "BUG-PIM-2"', 'tiêu đề', 'nhận định', 'điều kiện 1', 'Severity S1–S4', 'AI-PROPOSAL (PO/lead',
  'điều kiện 3: expected không có nguồn', 'điều kiện 4', 'điều kiện 5', 'tỉ lệ tái hiện', 'không đánh số', 'Environment'];
const QUESTION_OK = `---
id: Q-PIM-01
source: [DOM-OBSERVED]
labels: [DOM-OBSERVED]
produced_by: bug-reporting
status: draft
---
# Câu hỏi: tên nhân viên có được trùng không?
Quan sát (DOM-OBSERVED, Han, OrangeHRM demo, 07/10): tạo 2 nhân viên cùng tên đều được. Không có requirement quy định. Hệ thống có cần chặn trùng tên không?
`;

function selfTest() {
  let fail = 0, total = 0;
  const t = (ok, msg) => { total++; if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
  const g = check(GOOD);
  t(g.errors.length === 0, `bug mẫu ĐÚNG: ${g.errors.length} lỗi (mong đợi 0)`); g.errors.forEach((e) => console.log('      ' + e));
  const q = check(QUESTION_OK);
  t(q.kind === 'question' && q.errors.length === 0, `câu hỏi Q-… ĐÚNG: không bị chấm như bug (${q.errors.length} lỗi)`);
  const b = check(BAD);
  for (const key of EXPECT_BAD) t(b.errors.some((e) => e.includes(key)), `bug mẫu SAI bắt được: ${key}`);
  console.log(`\ncheck-bug self-test: ${total - fail}/${total} đúng`);
  process.exit(fail ? 1 : 0);
}

module.exports = { check };
if (require.main !== module) { /* được require: không chạy main */ }
else if (process.argv.includes('--self-test')) selfTest();
else {
  const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!files.length) { console.log('Dùng: node scripts/verify/check-bug.js <file.md> [...]  |  --self-test'); process.exit(1); }
  let errs = 0;
  for (const f of files) {
    const r = check(fs.readFileSync(path.resolve(f), 'utf8'));
    console.log(`\n== ${f} (${r.kind === 'question' ? 'câu hỏi' : 'bug'})`);
    r.errors.forEach((e) => console.log(`  LỖI       ${e}`));
    r.warns.forEach((w) => console.log(`  CẢNH BÁO  ${w}`));
    errs += r.errors.length;
  }
  console.log(`\ncheck-bug: ${files.length} file, ${errs} lỗi${errs ? ' → CHƯA ĐẠT' : ' → ĐẠT'}`);
  process.exit(errs ? 1 : 0);
}
