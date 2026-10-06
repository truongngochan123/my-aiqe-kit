'use strict';
// Thư viện dùng chung cho các hook PreToolUse của my-aiqe-kit.
// Chạy được với cả Claude Code và Codex: cả hai gửi JSON qua stdin
// ({ tool_name, tool_input, cwd, ... }) và chặn khi hook thoát với exit code 2.
// Hook chỉ là lớp CHỐNG SAI SÓT (xem docs/threat_model.md), không phải biên giới bảo mật.

const fs = require('fs');
const os = require('os');
const path = require('path');

const HOME = os.homedir().replace(/\\/g, '/').toLowerCase();

// Chuẩn hóa đường dẫn để so khớp: dấu "/", chữ thường, bỏ ngoặc kép, thay "~" bằng home.
function normPath(p) {
  if (!p || typeof p !== 'string') return '';
  let s = p.trim().replace(/^["'`]+|["'`,;)]+$/g, '').replace(/\\/g, '/');
  if (s.startsWith('~/')) s = HOME + s.slice(1);
  if (/^\$home\//i.test(s)) s = HOME + s.slice(5);
  if (/^\$env:userprofile\//i.test(s)) s = HOME + s.slice(16);
  return s.toLowerCase();
}

// Tách một lệnh shell thành các token có thể là đường dẫn.
function pathTokens(command) {
  if (!command) return [];
  return command
    .split(/[\s|;&<>()=,]+/)
    .map((t) => normPath(t))
    .filter((t) => t.length > 0);
}

function commandText(toolInput) {
  if (!toolInput) return '';
  const c = toolInput.command;
  if (Array.isArray(c)) return c.join(' ');
  return typeof c === 'string' ? c : '';
}

// Đọc danh sách thư mục fixture từ project.aiqe.yml (dòng dạng: fixture_dirs: [a, b]).
// Không dùng thư viện YAML để hook không phụ thuộc gì.
function fixtureDirs(cwd) {
  const defaults = ['fixtures', 'testdata', 'test-data'];
  const base = path.basename(cwd || process.cwd());
  const candidates = [
    path.join(cwd || process.cwd(), '.aiqe', 'project.aiqe.yml'),
    path.join(os.homedir(), 'aiqe-output', base, 'project.aiqe.yml'),
  ];
  for (const f of candidates) {
    try {
      const text = fs.readFileSync(f, 'utf8');
      const m = text.match(/^\s*fixture_dirs\s*:\s*\[([^\]]*)\]/m);
      if (m) {
        const dirs = m[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '').toLowerCase()).filter(Boolean);
        if (dirs.length) return dirs;
      }
    } catch (_) { /* không có file: dùng mặc định */ }
  }
  return defaults;
}

function block(hookName, reason, howTo) {
  const msg = [
    `[my-aiqe-kit/${hookName}] ĐÃ CHẶN: ${reason}`,
    howTo ? `Cách đúng: ${howTo}` : '',
    'Ghi chú: hook này là lớp chống sai sót. Nếu đây là việc đã được duyệt, NGƯỜI DÙNG tự thực hiện hoặc xem rules/agent_safety.md.',
  ].filter(Boolean).join('\n');
  return { block: true, reason: msg };
}

const ALLOW = { block: false, reason: '' };

// Đọc các case mẫu từ khối ```json trong evals/hooks/test-hooks.md.
function loadCases(mdPath, hookName) {
  const text = fs.readFileSync(mdPath, 'utf8');
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  const all = [];
  for (const b of blocks) {
    const parsed = JSON.parse(b);
    if (Array.isArray(parsed)) all.push(...parsed);
  }
  return all.filter((c) => c.hook === hookName);
}

function selfTest(hookName, evaluate, mdPath) {
  const cases = loadCases(mdPath, hookName);
  let fail = 0;
  for (const c of cases) {
    const existing = c.existing || {};
    const ctx = {
      readFile: (p) => {
        const key = Object.keys(existing).find((k) => normPath(k) === normPath(p));
        return key === undefined ? null : existing[key];
      },
      env: c.env || {},
      fixtureDirs: () => ['fixtures', 'testdata', 'test-data'],
    };
    const r = evaluate(c.input, ctx);
    const got = r.block ? 'block' : 'allow';
    const ok = got === c.expect;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}  (mong đợi ${c.expect}, nhận ${got})`);
  }
  console.log(`\n${hookName}: ${cases.length - fail}/${cases.length} case đúng`);
  if (cases.length === 0) { console.log('Không tìm thấy case nào.'); process.exit(1); }
  process.exit(fail === 0 ? 0 : 1);
}

// Điểm vào chung cho mọi hook.
function runHook(hookName, evaluate) {
  const i = process.argv.indexOf('--self-test');
  if (i !== -1) {
    const md = process.argv[i + 1] || path.join(__dirname, '..', '..', 'evals', 'hooks', 'test-hooks.md');
    return selfTest(hookName, evaluate, md);
  }
  let input = {};
  try {
    // Bỏ BOM: PowerShell 5.1 thêm BOM khi pipe chuỗi vào chương trình khác.
    const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '');
    input = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) {
    // Không đọc được input: cho qua, nhưng ghi cảnh báo (hook lỗi không được làm hỏng phiên làm việc).
    process.stderr.write(`[my-aiqe-kit/${hookName}] cảnh báo: không đọc được input (${e.message}); cho qua.\n`);
    process.exit(0);
  }
  const ctx = {
    readFile: (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } },
    env: process.env,
    fixtureDirs: () => fixtureDirs(input.cwd),
  };
  let r;
  try {
    r = evaluate(input, ctx);
  } catch (e) {
    process.stderr.write(`[my-aiqe-kit/${hookName}] cảnh báo: lỗi nội bộ (${e.message}); cho qua.\n`);
    process.exit(0);
  }
  if (r.block) {
    process.stderr.write(r.reason + '\n');
    process.exit(2);
  }
  if (r.warn) process.stderr.write(r.warn + '\n');
  process.exit(0);
}

module.exports = { normPath, pathTokens, commandText, block, ALLOW, runHook, HOME };
