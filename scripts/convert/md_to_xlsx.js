#!/usr/bin/env node
'use strict';
// Chuyển bảng test case trong file Markdown sang Excel (.xlsx).
//
// Dùng:  node scripts/convert/md_to_xlsx.js <file.md> [file.xlsx] [--config <project.aiqe.yml>]
//
// - Tìm mọi bảng có cột "TC ID". Lấy cột theo TÊN tiêu đề (không theo vị trí).
// - Thứ tự cột trong Excel lấy từ excel_columns của project.aiqe.yml (mặc định: 12 cột của rules/test_design.md).
// - Ô có <br> → xuống dòng; \| → |; bỏ dấu ` của code.
// Viết lại từ antigravity-testing-kit-main/scripts/convert_excel/md_to_xlsx.js: bản gốc lấy cột theo vị trí
// và dùng thư viện "xlsx" bản npm (0.18.5) không còn được cập nhật; bản này dùng exceljs.

const fs = require('fs');
const path = require('path');
const { loadConfig, argValue } = require('../lib/config');

let ExcelJS;
try { ExcelJS = require('exceljs'); } catch (_) {
  console.error('Thiếu thư viện. Chạy một lần:  cd scripts && npm install');
  process.exit(1);
}

function splitRow(line) {
  // Tách ô theo "|" nhưng bỏ qua "\|".
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\' && body[i + 1] === '|') { cur += '|'; i++; continue; }
    if (body[i] === '|') { cells.push(cur.trim()); cur = ''; continue; }
    cur += body[i];
  }
  cells.push(cur.trim());
  return cells;
}

function cleanCell(text) {
  return (text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/`([^`]*)`/g, '$1')
    .trim();
}

function parseTables(markdown) {
  const text = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''); // bỏ front-matter
  const lines = text.split(/\r?\n/);
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith('|') || !/\bTC ID\b/i.test(l)) continue;
    const sep = (lines[i + 1] || '').trim();
    if (!/^\|[\s:|-]+\|$/.test(sep)) continue;
    const header = splitRow(l).map((h) => h.toLowerCase());
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith('|'); j++) rows.push(splitRow(lines[j]));
    tables.push({ header, rows });
    i = j - 1;
  }
  return tables;
}

async function main() {
  const argv = process.argv.slice(2);
  const positional = argv.filter((a, k) => !a.startsWith('--') && argv[k - 1] !== '--config');
  if (!positional[0]) {
    console.log('Dùng: node scripts/convert/md_to_xlsx.js <file.md> [file.xlsx] [--config <project.aiqe.yml>]');
    process.exit(1);
  }
  const input = path.resolve(positional[0]);
  if (!fs.existsSync(input)) { console.error(`Không có file: ${input}`); process.exit(1); }
  const output = positional[1] ? path.resolve(positional[1]) : input.replace(/\.md$/i, '.xlsx');

  const { file: cfgFile, config } = loadConfig(argValue(argv, '--config'));
  const columns = config.excel_columns;
  console.log(`Cột Excel: ${cfgFile ? 'theo ' + cfgFile : 'mặc định (không tìm thấy project.aiqe.yml)'}`);

  const tables = parseTables(fs.readFileSync(input, 'utf8'));
  if (!tables.length) { console.error('Không tìm thấy bảng nào có cột "TC ID".'); process.exit(1); }

  const missing = new Set();
  const rows = [];
  for (const t of tables) {
    const idx = columns.map((c) => {
      const k = t.header.indexOf(c.toLowerCase());
      if (k === -1) missing.add(c);
      return k;
    });
    for (const r of t.rows) {
      if (r.every((c) => !c)) continue;
      rows.push(idx.map((k) => (k === -1 ? '' : cleanCell(r[k]))));
    }
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Test Cases', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = columns.map((c) => ({
    header: c,
    key: c,
    width: /steps|expected/i.test(c) ? 55 : /scenario|pre-condition|test data/i.test(c) ? 35 : 16,
  }));
  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  ws.eachRow((row) => { row.alignment = { wrapText: true, vertical: 'top' }; });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  await wb.xlsx.writeFile(output);
  console.log(`Đã xuất ${rows.length} test case từ ${tables.length} bảng → ${output}`);
  if (missing.size) console.log(`⚠️  Cột không có trong file md (để trống): ${[...missing].join(', ')}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
