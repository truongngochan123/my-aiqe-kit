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

console.log(`\nĐã kiểm tra ${dirs.length} skill, ${errors} lỗi.`);
process.exit(errors ? 1 : 0);
