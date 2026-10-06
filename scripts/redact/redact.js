#!/usr/bin/env node
'use strict';
// Che dữ liệu nhạy cảm trong file văn bản (log, HAR, markdown, JSON) theo patterns.json.
//
// Dùng:
//   node scripts/redact/redact.js <file> [<file>...]   → ghi <tên>.redacted<đuôi> cạnh file gốc
//   node scripts/redact/redact.js <file> --in-place    → ghi đè file gốc
//   node scripts/redact/redact.js <file> --out <file>  → ghi ra file chỉ định (chỉ 1 file đầu vào)
//   node scripts/redact/redact.js <file> --check       → không ghi gì; thoát mã 1 nếu còn dữ liệu cần che
//
// Giới hạn: regex không bắt được hết (tên người, địa chỉ, ảnh). NGƯỜI phải kiểm tra lại.
// Hàng threat: chống sai sót (xem docs/threat_model.md).

const fs = require('fs');
const path = require('path');

function loadPatterns(file) {
  const raw = JSON.parse(fs.readFileSync(file || path.join(__dirname, 'patterns.json'), 'utf8'));
  return raw.patterns.map((p) => ({
    ...p,
    re: new RegExp(p.regex, p.flags || 'g'),
    allowRe: p.allow ? new RegExp(p.allow, 'i') : null,
  }));
}

// Trả về { text, counts } — counts: { id: số chỗ đã che }.
function redactText(text, patterns) {
  const counts = {};
  let out = text;
  for (const p of patterns) {
    let n = 0;
    out = out.replace(p.re, (...m) => {
      const match = m[0];
      if (p.allowRe && p.allowRe.test(match)) return match;
      // Đã che ở lần chạy trước: giữ nguyên, không đếm (để --check trên file đã redact trả về 0).
      if (match.includes('[REDACTED')) return match;
      n++;
      // Hỗ trợ $1 trong chuỗi thay thế.
      return p.replace.replace(/\$(\d)/g, (_, g) => m[Number(g)] || '');
    });
    if (n) counts[p.id] = n;
  }
  return { text: out, counts };
}

function main() {
  const argv = process.argv.slice(2);
  const val = (n) => { const i = argv.indexOf(n); return i !== -1 ? argv[i + 1] : null; };
  const files = argv.filter((a, k) => !a.startsWith('--') && !['--out', '--patterns'].includes(argv[k - 1]));
  if (!files.length) {
    console.log('Dùng: node scripts/redact/redact.js <file> [--in-place | --out <file> | --check]');
    process.exit(1);
  }
  const patterns = loadPatterns(val('--patterns'));
  const check = argv.includes('--check');
  let total = 0;
  for (const f of files) {
    const src = path.resolve(f);
    const { text, counts } = redactText(fs.readFileSync(src, 'utf8'), patterns);
    const n = Object.values(counts).reduce((a, b) => a + b, 0);
    total += n;
    const detail = n ? Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ') : 'không có';
    if (check) { console.log(`${src}: ${n} chỗ cần che (${detail})`); continue; }
    const dest = argv.includes('--in-place') ? src
      : val('--out') ? path.resolve(val('--out'))
        : path.join(path.dirname(src), path.basename(src, path.extname(src)) + '.redacted' + path.extname(src));
    fs.writeFileSync(dest, text, 'utf8');
    console.log(`${src} → ${dest}: đã che ${n} chỗ (${detail})`);
  }
  console.log('Nhắc: regex không bắt được hết (tên người, địa chỉ, ảnh). Hãy đọc lại trước khi chia sẻ.');
  if (check && total > 0) process.exit(1);
}

module.exports = { redactText, loadPatterns };
if (require.main === module) main();
