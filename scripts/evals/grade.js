#!/usr/bin/env node
'use strict';
// Chấm output của một lần chạy eval/pilot.
//
// Dùng:  node scripts/evals/grade.js <output_dir> [--expect <tên skill>] [--since <thời điểm ISO>]
//   --expect  mọi file được chấm phải có produced_by = skill này (kiểm tra routing)
//   --since   chỉ chấm file sửa sau thời điểm này (ví dụ 2026-10-08T09:00), để bỏ qua output cũ
//
// Làm gì:
//   1. Tìm mọi file .md trong <output_dir>, đọc front-matter (id, produced_by, status).
//   2. File TC (produced_by test-design-rbt, id TC-…) → chạy check-tc; file bug/câu hỏi (bug-reporting) → chạy check-bug.
//   3. In bảng và dòng tổng. Thoát mã 1 nếu routing sai hoặc có file chưa ĐẠT.
// Lưu ý: produced_by do AI tự ghi (AI tự khai). Đây là cách chấm routing dùng được cho mọi tool,
// nhưng không chứng minh tuyệt đối skill đã thật sự được nạp (xem docs/tool_support.md mục eval).

const fs = require('fs');
const path = require('path');
const checkTc = require('../verify/check-tc').check;
const checkBug = require('../verify/check-bug').check;

const argv = process.argv.slice(2);
const val = (n) => { const i = argv.indexOf(n); return i !== -1 ? argv[i + 1] : null; };
const dir = argv.find((a, k) => !a.startsWith('--') && !['--expect', '--since'].includes(argv[k - 1]));
if (!dir || !fs.existsSync(dir)) { console.log('Dùng: node scripts/evals/grade.js <output_dir> [--expect <skill>] [--since <ISO>]'); process.exit(1); }
const expect = val('--expect');
const since = val('--since') ? new Date(val('--since')) : null;
if (since && isNaN(since)) { console.error('--since không phải thời điểm hợp lệ, ví dụ 2026-10-08T09:00'); process.exit(1); }

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : (e.name.endsWith('.md') ? [p] : []);
  });
}
function fm(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const o = {};
  if (m) for (const l of m[1].split(/\r?\n/)) { const kv = l.match(/^([a-z_]+):\s*(.*)$/); if (kv) o[kv[1]] = kv[2].trim(); }
  return o;
}

const files = walk(path.resolve(dir)).filter((f) => !since || fs.statSync(f).mtime >= since);
let routingBad = 0, checkBad = 0, checked = 0;
console.log(`Chấm ${files.length} file trong ${path.resolve(dir)}${since ? ` (sửa sau ${since.toISOString()})` : ''}\n`);
console.log('File | produced_by | Routing | Kiểm tra');
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const meta = fm(text);
  const by = meta.produced_by || '(thiếu)';
  let routing = '—';
  if (expect) { routing = by === expect ? 'đúng' : `SAI (mong đợi ${expect})`; if (by !== expect) routingBad++; }
  let result = 'không có script kiểm tra';
  if (by === 'test-design-rbt' && /^TC-/.test(meta.id || '')) {
    const r = checkTc(text); checked++; if (r.errors.length) checkBad++;
    result = r.errors.length ? `check-tc CHƯA ĐẠT (${r.errors.length} lỗi): ${r.errors[0]}` : 'check-tc ĐẠT';
  } else if (by === 'bug-reporting') {
    const r = checkBug(text); checked++; if (r.errors.length) checkBad++;
    result = r.errors.length ? `check-bug CHƯA ĐẠT (${r.errors.length} lỗi): ${r.errors[0]}` : `check-bug ĐẠT (${r.kind === 'question' ? 'câu hỏi' : 'bug'})`;
  }
  console.log(`${path.relative(path.resolve(dir), f)} | ${by} | ${routing} | ${result}`);
}
console.log(`\ngrade: ${files.length} file · routing sai ${routingBad}${expect ? '' : ' (không kiểm, thiếu --expect)'} · ${checked} file có script kiểm tra, ${checkBad} chưa đạt${routingBad || checkBad ? ' → CHƯA ĐẠT' : ' → ĐẠT'}`);
process.exit(routingBad || checkBad ? 1 : 0);
