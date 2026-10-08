#!/usr/bin/env node
'use strict';
// Kiểm tra cấu trúc mọi skills/*/SKILL.md theo docs/SKILL_SPEC.md.
// Dùng: node scripts/verify/check-skills.js [--root <thư mục kit>]
// Thoát mã 1 nếu có skill sai chuẩn.

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../install/gen-routing');

const i = process.argv.indexOf('--root');
const ROOT = i !== -1 ? path.resolve(process.argv[i + 1]) : path.resolve(__dirname, '..', '..');

const MAX_LINES = 150;
const MAX_DESC = 300;
const REQUIRED_HEADINGS = [
  '## Khi dùng / Không dùng',
  '## Đầu vào',
  '## Quy trình',
  '## Output',
  '## Gate và giới hạn',
  '## Self-check',
];

const skillsDir = path.join(ROOT, 'skills');
const dirs = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];

let errors = 0;
const err = (skill, msg) => { errors++; console.log(`LỖI  ${skill}: ${msg}`); };

for (const name of dirs) {
  const file = path.join(skillsDir, name, 'SKILL.md');
  if (!fs.existsSync(file)) { err(name, 'thiếu SKILL.md'); continue; }
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const fm = parseFrontmatter(text);

  if (!fm) { err(name, 'thiếu frontmatter (--- name / description ---)'); continue; }
  if (fm.name !== name) err(name, `name trong frontmatter ("${fm.name}") phải trùng tên thư mục`);
  if (!/^[a-z0-9-]+$/.test(fm.name || '')) err(name, 'name chỉ gồm chữ thường, số, dấu gạch ngang');
  if (!fm.description) err(name, 'thiếu description');
  else {
    if (fm.description.length > MAX_DESC) err(name, `description dài ${fm.description.length} ký tự (tối đa ${MAX_DESC})`);
    if (!/Không dùng/i.test(fm.description)) err(name, 'description phải có phần "Không dùng ... → <skill khác>"');
  }
  if (lines.length > MAX_LINES) err(name, `${lines.length} dòng (tối đa ${MAX_LINES}); chuyển phần dài sang references/`);
  for (const h of REQUIRED_HEADINGS) {
    if (!lines.some((l) => l.trim().startsWith(h))) err(name, `thiếu mục "${h}"`);
  }

  // Đường dẫn được nhắc tới phải tồn tại.
  const refs = new Set();
  for (const m of text.matchAll(/\{\{KIT\}\}\/([A-Za-z0-9_./-]+\.[a-z]+)/g)) refs.add(path.join(ROOT, m[1]));
  for (const m of text.matchAll(/(?<![\w/])references\/([A-Za-z0-9_.-]+\.md)/g)) refs.add(path.join(skillsDir, name, 'references', m[1]));
  for (const r of refs) if (!fs.existsSync(r)) err(name, `tham chiếu không tồn tại: ${path.relative(ROOT, r)}`);

  if (/\]\((\.\.\/)+rules\//.test(text) || /(^|[\s`(])rules\/[a-z_]+\.md/.test(text.replace(/\{\{KIT\}\}\/rules\//g, ''))) {
    err(name, 'tham chiếu rules/ phải viết dạng {{KIT}}/rules/... (đường dẫn tương đối sẽ gãy khi chép skill sang thư mục của tool)');
  }
}

// Bảng field có 2 bản (Q9, BUILD_PLAN): references/field_validation_15.md là BẢN GỐC,
// prompts/manual/05 giữ bản sao giữa <!-- sync: ... --> và <!-- /sync --> để dán sang AI web. Hai bản phải khớp.
const SRC = path.join(ROOT, 'skills', 'test-design-rbt', 'references', 'field_validation_15.md');
const COPY = path.join(ROOT, 'prompts', 'manual', '05_rbt_and_tc_generation.md');
if (fs.existsSync(SRC) && fs.existsSync(COPY)) {
  const tableRows = (t) => t.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('|'));
  const srcText = fs.readFileSync(SRC, 'utf8');
  const srcSection = (srcText.split(/^## Bảng\s*$/m)[1] || '').split(/^## /m)[0];
  const copyMatch = fs.readFileSync(COPY, 'utf8').match(/<!-- sync:[^>]*-->([\s\S]*?)<!-- \/sync -->/);
  const a = tableRows(srcSection);
  const b = copyMatch ? tableRows(copyMatch[1]) : [];
  if (!copyMatch) err('test-design-rbt', `không thấy khối <!-- sync --> trong ${path.relative(ROOT, COPY)}`);
  else if (a.length === 0) err('test-design-rbt', `không thấy bảng dưới "## Bảng" trong ${path.relative(ROOT, SRC)}`);
  else {
    const n = Math.max(a.length, b.length);
    for (let k = 0; k < n; k++) {
      if (a[k] !== b[k]) {
        err('test-design-rbt', `bảng field lệch giữa bản gốc và prompt 05 ở dòng bảng thứ ${k + 1}: gốc "${(a[k] || '(không có)').slice(0, 60)}" / bản sao "${(b[k] || '(không có)').slice(0, 60)}". Sửa bản gốc rồi chép sang prompt 05`);
        break;
      }
    }
  }
}

// Điểm dừng mode full: prompts/manual/0N khai báo <!-- aiqe-stop-in-skill: yes|no -->,
// SKILL.md test-design-rbt ghi "chỉ dừng ở bước X và bước Y". Hai nơi phải khớp (pilot T3).
const PDIR = path.join(ROOT, 'prompts', 'manual');
const TDR = path.join(ROOT, 'skills', 'test-design-rbt', 'SKILL.md');
if (fs.existsSync(PDIR) && fs.existsSync(TDR)) {
  const promptStops = [];
  for (const f of fs.readdirSync(PDIR).filter((x) => /^0\d_.*\.md$/.test(x)).sort()) {
    const m = fs.readFileSync(path.join(PDIR, f), 'utf8').match(/<!-- aiqe-stop-in-skill: (yes|no) -->/);
    if (!m) err('test-design-rbt', `prompt ${f} thiếu dòng <!-- aiqe-stop-in-skill: yes|no -->`);
    else if (m[1] === 'yes') promptStops.push(Number(f.slice(0, 2)));
  }
  const row = fs.readFileSync(TDR, 'utf8').split(/\r?\n/).find((l) => l.startsWith('| `full`'));
  const said = row && row.match(/chỉ dừng ở ([^(;|]+)/);
  if (!said) err('test-design-rbt', 'dòng mode `full` trong SKILL.md phải ghi "chỉ dừng ở bước X và bước Y"');
  else {
    const skillStops = (said[1].match(/\d+/g) || []).map(Number);
    if (skillStops.join(',') !== promptStops.join(',')) {
      err('test-design-rbt', `điểm dừng mode full lệch: SKILL.md ghi bước [${skillStops.join(', ')}], prompt khai báo yes ở bước [${promptStops.join(', ')}]`);
    }
  }
}

console.log(`\nĐã kiểm tra ${dirs.length} skill, ${errors} lỗi.`);
process.exit(errors ? 1 : 0);
