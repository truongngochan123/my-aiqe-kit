'use strict';
// Hàm dùng chung cho jira_fetcher, xray_auth, xray_importer.
// Chuyển từ antigravity-testing-kit-main/scripts/integrations/jira/utils.js (đã đọc toàn bộ 09/10). Khác bản gốc:
//  - Không dùng dotenv, không tự đọc file .env. NGƯỜI chạy cấp biến qua `node --env-file=<file> …`
//    (file nằm ngoài repo, ví dụ ~/.aiqe/secrets/.env.jira). AI không giữ token (docs/threat_model.md, hàng 🛡️).
//  - Không process.exit lúc import (bản gốc gọi loadEnv() ngay khi require → không import được để test).
//  - Không có thư viện ngoài: dùng fetch của Node ≥ 18.
//  - Lỗi HTTP chỉ in mã + errorMessages của Jira, không in nguyên response (có thể chứa dữ liệu khách).

const fs = require('fs');
const path = require('path');

class ConfigError extends Error {}

function requireEnv(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    throw new ConfigError(`Thiếu biến môi trường: ${missing.join(', ')}. Người chạy cấp qua: node --env-file=<đường dẫn .env.jira> ${path.basename(process.argv[1] || 'script.js')} …`);
  }
}

// Jira Cloud: email + API token (Basic). Server/Data Center: PAT (Bearer).
function jiraConfig() {
  requireEnv(['JIRA_BASE_URL']);
  const base = process.env.JIRA_BASE_URL.replace(/\/+$/, '');
  if (!/^https:\/\//.test(base)) throw new ConfigError('JIRA_BASE_URL phải là https://…');
  const apiVersion = process.env.JIRA_API_VERSION === '2' ? '2' : '3';
  let auth;
  if (process.env.JIRA_PAT) auth = `Bearer ${process.env.JIRA_PAT}`;
  else if (process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) auth = `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`;
  else throw new ConfigError('Thiếu xác thực Jira: JIRA_EMAIL + JIRA_API_TOKEN (Cloud) hoặc JIRA_PAT (Server/Data Center).');
  return { base, apiVersion, headers: { Accept: 'application/json', Authorization: auth }, acField: process.env.JIRA_AC_FIELD || null };
}

// ---------------------------------------------------------------- kiểm tra input
const ISSUE_KEY = /^[A-Z][A-Z0-9_]{1,9}-\d+$/;
const PROJECT_KEY = /^[A-Z][A-Z0-9_]{1,9}$/;
const ISSUE_TYPES = ['Story', 'Bug', 'Task', 'Epic', 'Sub-task', 'Test'];

function assertIssueKey(k) { if (!ISSUE_KEY.test(String(k))) throw new ConfigError(`Issue key không hợp lệ: "${k}" (ví dụ KAN-12)`); return k; }
function assertProjectKey(k) { if (!PROJECT_KEY.test(String(k))) throw new ConfigError(`Project key không hợp lệ: "${k}" (ví dụ KAN)`); return k; }
function assertIssueType(t) { if (!ISSUE_TYPES.includes(t)) throw new ConfigError(`Loại issue không hỗ trợ: "${t}". Dùng: ${ISSUE_TYPES.join(', ')}`); return t; }

// Tên file đính kèm do server trả về: chỉ giữ tên, bỏ thư mục và ký tự lạ (bản gốc ghép thẳng → path traversal).
function safeFilename(name) {
  const base = path.basename(String(name).replace(/\\/g, '/'));
  const clean = base.replace(/[^\w.\- ]+/g, '_').replace(/^\.+/, '_').slice(0, 120);
  return clean || 'attachment';
}

// ---------------------------------------------------------------- HTTP
async function httpJson(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, { method, headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const text = await res.text();
  if (!res.ok) {
    let detail = '';
    try { const j = JSON.parse(text); detail = [].concat(j.errorMessages || [], Object.values(j.errors || {}), j.error || []).join('; '); } catch (_) { /* không in body thô */ }
    const hint = { 401: 'sai thông tin xác thực', 403: 'không có quyền trên project', 404: 'sai URL hoặc không có issue', 429: 'bị giới hạn tần suất, thử lại sau' }[res.status] || '';
    throw new Error(`HTTP ${res.status}${hint ? ` (${hint})` : ''}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
  }
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text; }
}

// ---------------------------------------------------------------- ADF (Jira Cloud) → Markdown
const cellEsc = (s) => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');

function adfToMarkdown(doc) {
  if (!doc) return '';
  if (typeof doc === 'string') return doc;
  const inline = (n) => {
    if (!n) return '';
    if (n.type === 'text') {
      let t = n.text || '';
      for (const m of n.marks || []) {
        if (m.type === 'strong') t = `**${t}**`;
        else if (m.type === 'em') t = `*${t}*`;
        else if (m.type === 'code') t = `\`${t}\``;
        else if (m.type === 'link') t = `[${t}](${(m.attrs && m.attrs.href) || ''})`;
      }
      return t;
    }
    if (n.type === 'hardBreak') return '<br>';
    if (n.type === 'inlineCard') return (n.attrs && n.attrs.url) || '';
    if (n.type === 'mention') return (n.attrs && n.attrs.text) || '@mention';
    return (n.content || []).map(inline).join('');
  };
  const out = [];
  const list = (node, ordered, depth, lines = []) => {
    let i = 1;
    for (const item of node.content || []) {
      const pad = '  '.repeat(depth);
      const text = (item.content || []).filter((c) => !/List$/.test(c.type)).map(inline).join(' ').trim();
      lines.push(`${pad}${ordered ? `${i++}.` : '-'} ${text}`);
      for (const sub of (item.content || []).filter((c) => /List$/.test(c.type))) list(sub, sub.type === 'orderedList', depth + 1, lines);
    }
    if (depth === 0) out.push(lines.join('\n'));
  };
  const block = (n) => {
    switch (n.type) {
      case 'heading': out.push(`${'#'.repeat((n.attrs && n.attrs.level) || 2)} ${inline(n)}`); break;
      case 'paragraph': out.push(inline(n)); break;
      case 'bulletList': list(n, false, 0); break;
      case 'orderedList': list(n, true, 0); break;
      case 'codeBlock': out.push('```' + ((n.attrs && n.attrs.language) || '') + '\n' + (n.content || []).map((c) => c.text || '').join('') + '\n```'); break;
      case 'blockquote': out.push((n.content || []).map(inline).join('\n').split('\n').map((l) => `> ${l}`).join('\n')); break;
      case 'rule': out.push('---'); break;
      case 'table': {
        const rows = (n.content || []).filter((r) => r.type === 'tableRow').map((r) => (r.content || []).map((c) => cellEsc((c.content || []).map(inline).join(' ').trim())));
        if (!rows.length) break;
        const w = Math.max(...rows.map((r) => r.length));
        rows.forEach((r) => { while (r.length < w) r.push(''); });
        out.push([`| ${rows[0].join(' | ')} |`, `|${' --- |'.repeat(w)}`, ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`)].join('\n'));
        break;
      }
      default: (n.content || []).forEach(block);
    }
  };
  block(doc);
  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------------------------------------------------------- file
function writeFileIn(dir, name, content) {
  const target = path.resolve(dir, name);
  if (!target.startsWith(path.resolve(dir) + path.sep)) throw new Error(`Từ chối ghi ra ngoài ${dir}: ${name}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function defaultOutputDir(sub) {
  return path.resolve(process.cwd(), '.aiqe', 'output', sub);
}

// ---------------------------------------------------------------- self-test dùng chung
function runSelfTest(name, cases) {
  let ok = 0;
  for (const [title, fn] of cases) {
    try { fn(); ok++; } catch (e) { console.log(`SAI  ${title}: ${e.message}`); }
  }
  console.log(`${name} self-test: ${ok}/${cases.length} đúng`);
  process.exit(ok === cases.length ? 0 : 1);
}
function eq(a, b) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`mong đợi ${JSON.stringify(b)}, nhận ${JSON.stringify(a)}`); }

function main(fn) {
  fn().catch((e) => {
    console.error(`LỖI: ${e.message}`);
    process.exit(e instanceof ConfigError ? 2 : 1);
  });
}

module.exports = {
  ConfigError, requireEnv, jiraConfig, assertIssueKey, assertProjectKey, assertIssueType, ISSUE_TYPES,
  safeFilename, httpJson, adfToMarkdown, cellEsc, writeFileIn, defaultOutputDir, runSelfTest, eq, main,
};

if (require.main === module && process.argv.includes('--self-test')) {
  runSelfTest('utils', [
    ['issue key hợp lệ / không hợp lệ', () => { assertIssueKey('KAN-12'); let t = false; try { assertIssueKey('KAN-12" OR 1=1'); } catch (_) { t = true; } eq(t, true); }],
    ['safeFilename chặn path traversal', () => { eq(safeFilename('../../etc/passwd'), 'passwd'); eq(safeFilename('..\\..\\x.png'), 'x.png'); eq(safeFilename('..'), '_'); }],
    ['ADF: list lồng, bảng có |, link', () => {
      const doc = { type: 'doc', content: [
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A' }] }, { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A1' }] }] }] }] }] },
        { type: 'table', content: [{ type: 'tableRow', content: [{ type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x|y' }] }] }] }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'docs', marks: [{ type: 'link', attrs: { href: 'https://e.example' } }] }] },
      ] };
      eq(adfToMarkdown(doc), '- A\n  1. A1\n\n| x\\|y |\n| --- |\n\n[docs](https://e.example)');
    }],
    ['writeFileIn không ghi ra ngoài thư mục', () => { let t = false; try { writeFileIn(require('os').tmpdir(), '../x.md', ''); } catch (_) { t = true; } eq(t, true); }],
    ['thiếu env → ConfigError, không exit', () => { const b = process.env.JIRA_BASE_URL; delete process.env.JIRA_BASE_URL; let t = false; try { jiraConfig(); } catch (e) { t = e instanceof ConfigError; } if (b) process.env.JIRA_BASE_URL = b; eq(t, true); }],
  ]);
}
