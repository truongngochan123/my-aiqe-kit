#!/usr/bin/env node
'use strict';
// Sinh "Bảng chọn skill" trong AGENTS.md từ frontmatter của skills/*/SKILL.md.
// Bảng nằm giữa <!-- aiqe:routing:start --> và <!-- aiqe:routing:end -->. Không sửa tay bảng này.
//
// Dùng:  node scripts/install/gen-routing.js [--root <thư mục kit>]
// Mặc định root = thư mục kit chứa script này. Đường dẫn trong bảng dùng {{KIT}};
// khi cài, install.js thay {{KIT}} bằng đường dẫn tuyệt đối.

const fs = require('fs');
const path = require('path');

const START = '<!-- aiqe:routing:start -->';
const END = '<!-- aiqe:routing:end -->';

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_-]+)\s*:\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function listSkills(root) {
  const dir = path.join(root, 'skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const file = path.join(dir, d.name, 'SKILL.md');
      if (!fs.existsSync(file)) return null;
      const fm = parseFrontmatter(fs.readFileSync(file, 'utf8')) || {};
      return { dir: d.name, name: fm.name || d.name, description: fm.description || '(thiếu description)' };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildTable(skills) {
  if (skills.length === 0) return '_(Chưa có skill. Bảng sẽ được sinh khi có skill ở Đợt 1.)_';
  const rows = skills.map((s) =>
    `| \`${s.name}\` | ${s.description.replace(/\|/g, '\\|')} | \`{{KIT}}/skills/${s.dir}/SKILL.md\` |`);
  return ['| Skill | Dùng khi / Không dùng khi | File |', '|---|---|---|', ...rows].join('\n');
}

function generate(agentsPath, root) {
  const text = fs.readFileSync(agentsPath, 'utf8');
  const a = text.indexOf(START);
  const b = text.indexOf(END);
  if (a === -1 || b === -1 || b < a) throw new Error(`Không tìm thấy cặp đánh dấu routing trong ${agentsPath}`);
  const skills = listSkills(root);
  const next = text.slice(0, a + START.length) + '\n' + buildTable(skills) + '\n' + text.slice(b);
  fs.writeFileSync(agentsPath, next, 'utf8');
  return skills.length;
}

module.exports = { generate, listSkills, parseFrontmatter };

if (require.main === module) {
  const i = process.argv.indexOf('--root');
  const root = i !== -1 ? path.resolve(process.argv[i + 1]) : path.resolve(__dirname, '..', '..');
  try {
    const n = generate(path.join(root, 'AGENTS.md'), root);
    console.log(`Đã sinh bảng routing: ${n} skill.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
