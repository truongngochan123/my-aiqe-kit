#!/usr/bin/env node
'use strict';
// Quét toàn kit tìm các mẫu bị cấm lấy từ bộ gốc (xem docs/BUILD_PLAN.md mục "Lỗi trong file nguồn").
// Dùng: node scripts/verify/grep-clean.js [--root <thư mục kit>]
// Thoát mã 1 nếu có chỗ vi phạm nằm ngoài danh sách miễn trừ (scripts/verify/grep-exempt.txt).

const fs = require('fs');
const path = require('path');

const i = process.argv.indexOf('--root');
const ROOT = i !== -1 ? path.resolve(process.argv[i + 1]) : path.resolve(__dirname, '..', '..');

// Một dòng được coi là "đang cấm/đang bỏ" thứ đó nếu có các từ này → không tính vi phạm.
// KHÔNG áp dụng cho các mẫu có `strict: true`.
const NEGATION = /(không|Không|KHÔNG|cấm|Cấm|bỏ|Bỏ|BỎ|thay cho|chặn|Chặn|❌|never|Never|instead of)/;

const PATTERNS = [
  { id: 'auto-heal', re: /auto[-\s]?heal/i },
  { id: 'tu-sua', re: /tự sửa/i },
  { id: 'cam-hoi-user', re: /CẤM hỏi/, strict: true },
  { id: 'hoi-credentials', re: /hỏi[^.\n]{0,25}(credential|mật khẩu|password)/i },
  { id: 'test-com-domain', re: /@test\.com\b/i, strict: true },
  { id: 'so-dien-thoai-mau', re: /0912345678/, strict: true },
];

const TEXT_EXT = /\.(md|json|toml|js|ts|yml|yaml|ps1|txt|java|xml|html)$/i;
const SKIP_DIR = /^(node_modules|\.git|_draft)$/;

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) out.push(...walk(path.join(dir, e.name))); }
    else if (TEXT_EXT.test(e.name) || e.name.startsWith('.')) out.push(path.join(dir, e.name));
  }
  return out;
}

function loadExempt() {
  const f = path.join(__dirname, 'grep-exempt.txt');
  const map = new Map();
  if (!fs.existsSync(f)) return map;
  for (const raw of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [p, reason] = line.split('|').map((s) => s.trim());
    if (!reason) { console.error(`grep-exempt.txt: dòng thiếu lý do: "${line}"`); process.exit(2); }
    map.set(p.replace(/\\/g, '/'), reason);
  }
  return map;
}

const exempt = loadExempt();
const violations = [];
const exemptHits = new Map();

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    for (const p of PATTERNS) {
      if (!p.re.test(line)) continue;
      if (!p.strict && NEGATION.test(line)) continue;
      if (exempt.has(rel)) { exemptHits.set(rel, (exemptHits.get(rel) || 0) + 1); continue; }
      violations.push(`${rel}:${idx + 1}  [${p.id}]  ${line.trim().slice(0, 120)}`);
    }
  });
}

console.log(`File được miễn trừ: ${exempt.size} (khai báo trong grep-exempt.txt)`);
for (const [f, n] of exemptHits) console.log(`  - ${f}: ${n} chỗ khớp, lý do: ${exempt.get(f)}`);
if (violations.length) {
  console.log(`\n${violations.length} chỗ vi phạm:`);
  violations.forEach((v) => console.log('  ' + v));
  process.exit(1);
}
console.log('\nSạch: không có chỗ vi phạm ngoài danh sách miễn trừ.');
