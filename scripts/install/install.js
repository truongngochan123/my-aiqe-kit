#!/usr/bin/env node
'use strict';
// Cài / gỡ / kiểm tra my-aiqe-kit cho Codex và Claude Code.
// Thường gọi qua scripts/install/install.ps1. Có thể gọi trực tiếp:
//
//   node install.js [--tool codex|claude|all] [--home <dir>] [--project <repo>] [--dry-run]
//   node install.js --uninstall [--home <dir>]
//   node install.js --verify    [--home <dir>]
//
// Nguyên tắc:
//  - Bản dùng thật là snapshot ~/.aiqe/kit/<version>/. Thư mục skill của từng tool là bản chép
//    sinh ra trong cùng một lần cài, có file .aiqe-version.
//  - KHÔNG ghi đè file của người dùng: markdown chèn giữa 2 dòng đánh dấu; JSON/TOML ghép phần của kit.
//  - Backup mọi file trước khi sửa vào ~/.aiqe/backup/<thời điểm>/.
//  - Chạy lại nhiều lần vẫn cho cùng kết quả.
//  - Gặp xung đột (trùng khóa TOML, trùng tên skill không phải của kit) thì DỪNG phần đó và báo.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { generate: genRouting } = require('./gen-routing');

// ---------------------------------------------------------------- tham số
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i !== -1 && argv[i + 1] ? argv[i + 1] : d; };

const KIT_SRC = path.resolve(__dirname, '..', '..');
const HOME = path.resolve(opt('--home', os.homedir()));
const DRY = flag('--dry-run');
const TOOL = opt('--tool', 'all');
const PROJECT = opt('--project', null);
const VERSION = fs.readFileSync(path.join(KIT_SRC, 'VERSION'), 'utf8').trim();

const AIQE = path.join(HOME, '.aiqe');
const SNAPSHOT = path.join(AIQE, 'kit', VERSION);
const SNAP_FWD = SNAPSHOT.replace(/\\/g, '/');
const CODEX_HOME = opt('--home', null) ? path.join(HOME, '.codex') : (process.env.CODEX_HOME || path.join(HOME, '.codex'));
const CLAUDE_HOME = path.join(HOME, '.claude');
const AGENTS_SKILLS = path.join(HOME, '.agents', 'skills');
const STATE_FILE = path.join(AIQE, 'installed.json');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP = path.join(AIQE, 'backup', STAMP);

const MD_START = '<!-- my-aiqe-kit:start -->';
const MD_END = '<!-- my-aiqe-kit:end -->';
const KIT_MARK = '/.aiqe/kit/';          // nhận diện mục do kit thêm vào JSON
const AGENTS_LIMIT = 32 * 1024;           // project_doc_max_bytes mặc định của Codex

const log = (...a) => console.log(...a);
const warn = (...a) => console.log('⚠️ ', ...a);
const problems = [];

// ---------------------------------------------------------------- tiện ích file
function readText(p) { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; } }
function mkdirp(p) { if (!DRY) fs.mkdirSync(p, { recursive: true }); }
function backup(p) {
  if (!fs.existsSync(p)) return;
  // File ở ổ đĩa khác home (ví dụ repo ở D:, home ở C:) cho ra đường dẫn tuyệt đối: bỏ dấu ":".
  const rel = path.relative(HOME, p).replace(/^(\.\.[\\/])+/, '').replace(/:/g, '');
  const dest = path.join(BACKUP, rel);
  if (DRY) return log(`  [dry-run] backup ${p}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(p, dest, { recursive: true });
}
function writeText(p, text) {
  if (DRY) return log(`  [dry-run] ghi ${p} (${Buffer.byteLength(text)} byte)`);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, 'utf8');
}
function removePath(p) {
  if (!fs.existsSync(p)) return;
  if (DRY) return log(`  [dry-run] xóa ${p}`);
  fs.rmSync(p, { recursive: true, force: true });
}
function hashFile(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}
function loadState() { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) { return null; } }

// ---------------------------------------------------------------- khối đánh dấu markdown
function upsertMdBlock(file, content) {
  const old = readText(file) || '';
  const block = `${MD_START}\n<!-- my-aiqe-kit ${VERSION}: do scripts/install sinh ra, không sửa tay; gỡ bằng install.ps1 -Uninstall -->\n${content.trim()}\n${MD_END}`;
  const re = new RegExp(`${MD_START}[\\s\\S]*?${MD_END}`);
  const next = re.test(old) ? old.replace(re, block) : (old.trim() ? old.trimEnd() + '\n\n' : '') + block + '\n';
  if (next === old) return false;
  backup(file);
  writeText(file, next);
  return true;
}
function removeMdBlock(file) {
  const old = readText(file);
  if (old === null) return;
  const re = new RegExp(`\\n*${MD_START}[\\s\\S]*?${MD_END}\\n?`);
  if (!re.test(old)) return;
  backup(file);
  const next = old.replace(re, '\n').trim();
  if (next === '') removePath(file); else writeText(file, next + '\n');
}

// ---------------------------------------------------------------- TOML (Codex config)
function tomlBlocks(text) {
  const get = (name) => {
    const m = text.match(new RegExp(`# >>> my-aiqe-kit:${name}[\\s\\S]*?# <<< my-aiqe-kit:${name}`));
    return m ? m[0] : '';
  };
  return { top: get('top'), tables: get('tables') };
}
function stripTomlBlocks(text) {
  return text.replace(/\n?# >>> my-aiqe-kit:(top|tables)[\s\S]*?# <<< my-aiqe-kit:\1\n?/g, '\n');
}
function tomlNames(text) {
  const keys = new Set(); const tables = new Set();
  let inTable = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const t = line.match(/^\[\[?\s*([^\]]+?)\s*\]\]?/);
    if (t) { inTable = true; tables.add(t[1].replace(/\s+/g, '')); continue; }
    const k = line.match(/^([A-Za-z0-9_.\-"]+)\s*=/);
    if (k && !inTable) keys.add(k[1].replace(/"/g, ''));
  }
  return { keys, tables };
}
function mergeCodexConfig(target, adapterText) {
  const kit = tomlBlocks(adapterText);
  const userAll = readText(target) || '';
  const user = stripTomlBlocks(userAll).trim();
  const u = tomlNames(user);
  const k = tomlNames(kit.top + '\n' + kit.tables);
  const clash = [];
  for (const key of k.keys) if (u.keys.has(key)) clash.push(`khóa "${key}"`);
  for (const t of k.tables) {
    if (u.tables.has(t)) clash.push(`bảng [${t}]`);
    for (const key of u.keys) if (key === t || key.startsWith(t + '.')) clash.push(`khóa "${key}" trùng với bảng [${t}]`);
  }
  if (clash.length) {
    problems.push(`Codex config.toml: trùng ${clash.join(', ')} trong ${target}. Chưa ghi gì vào file này. Hãy tự gộp hoặc xóa chỗ trùng rồi cài lại.`);
    return false;
  }
  const next = `${kit.top}\n\n${user}${user ? '\n\n' : ''}${kit.tables}\n`;
  if (next === userAll) return true;
  backup(target);
  writeText(target, next);
  return true;
}

// ---------------------------------------------------------------- JSON (hooks, settings)
function readJson(file) {
  const t = readText(file);
  if (t === null || !t.trim()) return {};
  try { return JSON.parse(t); } catch (e) {
    problems.push(`Không đọc được JSON ${file} (${e.message}). Chưa ghi gì vào file này.`);
    return null;
  }
}
const isKitHook = (entry) => (entry.hooks || []).some((h) => String(h.command || '').replace(/\\/g, '/').includes(KIT_MARK));
function mergeHooks(obj, kitHooks) {
  obj.hooks = obj.hooks || {};
  for (const [event, list] of Object.entries(kitHooks || {})) {
    const cur = (obj.hooks[event] || []).filter((e) => !isKitHook(e));
    obj.hooks[event] = cur.concat(list);
  }
}
function removeKitHooks(obj) {
  if (!obj || !obj.hooks) return;
  for (const event of Object.keys(obj.hooks)) {
    obj.hooks[event] = (obj.hooks[event] || []).filter((e) => !isKitHook(e));
    if (obj.hooks[event].length === 0) delete obj.hooks[event];
  }
  if (Object.keys(obj.hooks).length === 0) delete obj.hooks;
}
function mergeJsonFile(file, kitObj, withPermissions) {
  const obj = readJson(file);
  if (obj === null) return null;
  const before = JSON.stringify(obj);
  mergeHooks(obj, kitObj.hooks);
  const added = { allow: [], ask: [], deny: [] };
  if (withPermissions && kitObj.permissions) {
    obj.permissions = obj.permissions || {};
    for (const kind of ['allow', 'ask', 'deny']) {
      const list = kitObj.permissions[kind] || [];
      if (!list.length) continue;
      obj.permissions[kind] = obj.permissions[kind] || [];
      for (const rule of list) {
        if (!obj.permissions[kind].includes(rule)) { obj.permissions[kind].push(rule); added[kind].push(rule); }
      }
    }
  }
  if (!obj.description && kitObj.description && !withPermissions) obj.description = kitObj.description;
  if (JSON.stringify(obj) !== before) { backup(file); writeText(file, JSON.stringify(obj, null, 2) + '\n'); }
  return added;
}

// ---------------------------------------------------------------- snapshot
const SNAP_DIRS = ['rules', 'skills', 'prompts', 'templates', 'scripts', 'adapters', 'docs'];
const SNAP_FILES = ['AGENTS.md', 'CLAUDE.md', 'VERSION', 'project.aiqe.example.yml'];
const TEXT_EXT = /\.(md|json|toml|js|ts|yml|yaml|ps1|txt)$/i;
// Bỏ qua node_modules, TRỪ scripts/node_modules (thư viện của md_to_xlsx, cần để bản cài chạy được offline).
const SKIP = (rel) => /(^|[\\/])(_draft|\.git)([\\/]|$)/.test(rel)
  || (/(^|[\\/])node_modules([\\/]|$)/.test(rel) && !/^scripts[\\/]node_modules([\\/]|$)/.test(rel));

function buildSnapshot() {
  log(`• Tạo snapshot ${SNAPSHOT}`);
  if (DRY) return;
  fs.rmSync(SNAPSHOT, { recursive: true, force: true });
  fs.mkdirSync(SNAPSHOT, { recursive: true });
  for (const f of SNAP_FILES) if (fs.existsSync(path.join(KIT_SRC, f))) fs.copyFileSync(path.join(KIT_SRC, f), path.join(SNAPSHOT, f));
  for (const d of SNAP_DIRS) {
    const src = path.join(KIT_SRC, d);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(SNAPSHOT, d), { recursive: true, filter: (s) => !SKIP(path.relative(KIT_SRC, s)) });
  }
  if (!fs.existsSync(path.join(KIT_SRC, 'scripts', 'node_modules'))) {
    warn('Chưa có scripts/node_modules: md_to_xlsx sẽ không chạy. Chạy "cd scripts; npm install" trong repo kit rồi cài lại.');
  }
  genRouting(path.join(SNAPSHOT, 'AGENTS.md'), SNAPSHOT);
  for (const f of walk(SNAPSHOT)) {
    if (!TEXT_EXT.test(f) || /[\\/]node_modules[\\/]/.test(f)) continue;
    const t = fs.readFileSync(f, 'utf8');
    if (t.includes('{{KIT}}')) fs.writeFileSync(f, t.split('{{KIT}}').join(SNAP_FWD), 'utf8');
  }
}

// ---------------------------------------------------------------- skill
function copySkills(targetRoot, state) {
  const src = path.join(SNAPSHOT, 'skills');
  const names = fs.existsSync(src) ? fs.readdirSync(src).filter((n) => fs.existsSync(path.join(src, n, 'SKILL.md'))) : [];
  if (DRY && !fs.existsSync(src)) { log('  [dry-run] (snapshot chưa có, bỏ qua bước chép skill)'); return; }
  for (const n of names) {
    const dest = path.join(targetRoot, n);
    if (fs.existsSync(dest) && !fs.existsSync(path.join(dest, '.aiqe-version'))) {
      problems.push(`Skill "${n}" đã có ở ${dest} nhưng không phải của kit. Bỏ qua, không ghi đè.`);
      continue;
    }
    removePath(dest);
    if (!DRY) {
      fs.cpSync(path.join(src, n), dest, { recursive: true });
      fs.writeFileSync(path.join(dest, '.aiqe-version'), `${VERSION}\n${SNAP_FWD}\n`, 'utf8');
    }
    state.skills.push(dest);
  }
  log(`  chép ${names.length} skill → ${targetRoot}`);
}

// ---------------------------------------------------------------- cài cho từng tool
function installCodex(state) {
  log('\n== Codex ==');
  const st = { agentsMd: path.join(CODEX_HOME, 'AGENTS.md'), config: path.join(CODEX_HOME, 'config.toml'), hooks: path.join(CODEX_HOME, 'hooks.json'), skills: [] };
  const agents = readText(path.join(SNAPSHOT, 'AGENTS.md')) || readText(path.join(KIT_SRC, 'AGENTS.md'));
  upsertMdBlock(st.agentsMd, agents);
  const size = Buffer.byteLength(readText(st.agentsMd) || agents);
  if (size > AGENTS_LIMIT) warn(`~/.codex/AGENTS.md dài ${size} byte > 32 KiB: Codex sẽ cắt bớt. Tăng project_doc_max_bytes hoặc rút gọn.`);
  const adapterToml = readText(path.join(SNAPSHOT, 'adapters', 'codex', 'config.toml')) || readText(path.join(KIT_SRC, 'adapters', 'codex', 'config.toml'));
  st.configOk = mergeCodexConfig(st.config, adapterToml);
  const hooksText = readText(path.join(SNAPSHOT, 'adapters', 'codex', 'hooks.json')) || readText(path.join(KIT_SRC, 'adapters', 'codex', 'hooks.json')).split('{{KIT}}').join(SNAP_FWD);
  st.hooksOk = mergeJsonFile(st.hooks, JSON.parse(hooksText), false) !== null;
  copySkills(AGENTS_SKILLS, st);
  state.tools.codex = st;
}

function installClaude(state) {
  log('\n== Claude Code ==');
  const st = { claudeMd: path.join(CLAUDE_HOME, 'CLAUDE.md'), settings: path.join(CLAUDE_HOME, 'settings.json'), skills: [], commands: [], agents: [], permissionsAdded: null };
  upsertMdBlock(st.claudeMd, `@${SNAP_FWD}/AGENTS.md\n\nmy-aiqe-kit ${VERSION}: luật chung nằm trong file AGENTS.md được import ở dòng trên.`);
  const settingsText = readText(path.join(SNAPSHOT, 'adapters', 'claude', 'settings.json')) || readText(path.join(KIT_SRC, 'adapters', 'claude', 'settings.json')).split('{{KIT}}').join(SNAP_FWD);
  const added = mergeJsonFile(st.settings, JSON.parse(settingsText), true);
  // Cộng dồn với lần cài trước: lần cài lại thấy luật đã có sẵn (do chính kit thêm lần trước)
  // nên "added" rỗng; nếu ghi đè thì lúc gỡ sẽ không biết luật nào là của kit.
  const prevAdded = (state.tools.claude && state.tools.claude.permissionsAdded) || {};
  st.permissionsAdded = added === null ? prevAdded : Object.fromEntries(['allow', 'ask', 'deny'].map((k) =>
    [k, [...new Set([...(prevAdded[k] || []), ...(added[k] || [])])]]));
  copySkills(path.join(CLAUDE_HOME, 'skills'), st);
  for (const [sub, key] of [['commands', 'commands'], ['agents', 'agents']]) {
    const src = path.join(SNAPSHOT, 'adapters', 'claude', sub);
    if (!fs.existsSync(src)) continue;
    for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.md'))) {
      const dest = path.join(CLAUDE_HOME, sub, f);
      const cur = readText(dest);
      if (cur !== null && !cur.includes('my-aiqe-kit')) { problems.push(`${dest} đã có và không phải của kit. Bỏ qua.`); continue; }
      writeText(dest, fs.readFileSync(path.join(src, f), 'utf8'));
      st[key].push(dest);
    }
  }
  log(`  chép ${st.commands.length} lệnh tắt, ${st.agents.length} agent`);
  state.tools.claude = st;
}

function installProject(state, repo) {
  log(`\n== Chế độ dự án: ${repo} ==`);
  const created = [];
  const exclude = [];
  const tools = TOOL === 'all' ? ['codex', 'claude'] : [TOOL];
  const placeMd = (rel, content) => {
    const f = path.join(repo, rel);
    const cur = readText(f);
    if (cur !== null && !cur.includes(MD_START)) { problems.push(`${f} đã có sẵn trong repo (có thể đang được git theo dõi). Không ghi vào; dùng cài cấp user.`); return; }
    upsertMdBlock(f, content); created.push(f); exclude.push(rel);
  };
  if (tools.includes('codex')) {
    placeMd('AGENTS.md', readText(path.join(SNAPSHOT, 'AGENTS.md')) || '');
    const st = { skills: [] }; copySkills(path.join(repo, '.agents', 'skills'), st); created.push(...st.skills); exclude.push('.agents/');
  }
  if (tools.includes('claude')) {
    placeMd('CLAUDE.md', `@${SNAP_FWD}/AGENTS.md`);
    const st = { skills: [] }; copySkills(path.join(repo, '.claude', 'skills'), st); created.push(...st.skills); exclude.push('.claude/skills/');
  }
  exclude.push('.aiqe/');
  const exFile = path.join(repo, '.git', 'info', 'exclude');
  if (fs.existsSync(path.join(repo, '.git'))) {
    const cur = readText(exFile) || '';
    const add = exclude.filter((l) => !cur.split(/\r?\n/).includes(l));
    if (add.length) writeText(exFile, cur.trimEnd() + '\n# my-aiqe-kit\n' + add.join('\n') + '\n');
  } else warn(`${repo} không phải repo git: không ghi được .git/info/exclude.`);
  log('  Hook và permission vẫn cài ở cấp user (chạy thêm install không có -Project).');
  state.projects = state.projects || {};
  state.projects[repo] = { created, exclude };
}

// ---------------------------------------------------------------- gỡ cài đặt
function uninstall() {
  const s = loadState();
  if (!s) { log('Không thấy ~/.aiqe/installed.json: chưa cài hoặc đã gỡ.'); return; }
  log(`Gỡ my-aiqe-kit ${s.version}`);
  const c = s.tools && s.tools.codex;
  if (c) {
    removeMdBlock(c.agentsMd);
    const t = readText(c.config);
    if (t !== null && /my-aiqe-kit:/.test(t)) { backup(c.config); const n = stripTomlBlocks(t).trim(); n ? writeText(c.config, n + '\n') : removePath(c.config); }
    const h = readJson(c.hooks);
    if (h) { backup(c.hooks); removeKitHooks(h); delete h.description; Object.keys(h).length ? writeText(c.hooks, JSON.stringify(h, null, 2) + '\n') : removePath(c.hooks); }
    (c.skills || []).forEach(removePath);
  }
  const cl = s.tools && s.tools.claude;
  if (cl) {
    removeMdBlock(cl.claudeMd);
    const j = readJson(cl.settings);
    if (j) {
      backup(cl.settings);
      removeKitHooks(j);
      const added = cl.permissionsAdded || {};
      if (j.permissions) {
        for (const kind of ['allow', 'ask', 'deny']) {
          if (!j.permissions[kind]) continue;
          j.permissions[kind] = j.permissions[kind].filter((r) => !(added[kind] || []).includes(r));
          if (!j.permissions[kind].length) delete j.permissions[kind];
        }
        if (!Object.keys(j.permissions).length) delete j.permissions;
      }
      writeText(cl.settings, JSON.stringify(j, null, 2) + '\n');
    }
    [...(cl.skills || []), ...(cl.commands || []), ...(cl.agents || [])].forEach(removePath);
  }
  for (const [repo, p] of Object.entries(s.projects || {})) {
    for (const f of p.created || []) { if (/\.md$/i.test(f)) removeMdBlock(f); else removePath(f); }
    const exFile = path.join(repo, '.git', 'info', 'exclude');
    const cur = readText(exFile);
    if (cur !== null) writeText(exFile, cur.split(/\r?\n/).filter((l) => l !== '# my-aiqe-kit' && !(p.exclude || []).includes(l)).join('\n').trimEnd() + '\n');
  }
  removePath(path.join(AIQE, 'kit', s.version));
  const kitDir = path.join(AIQE, 'kit');
  if (fs.existsSync(kitDir) && fs.readdirSync(kitDir).length === 0) removePath(kitDir);
  removePath(STATE_FILE);
  log(`Đã gỡ. Bản backup giữ ở ${path.join(AIQE, 'backup')}.`);
}

// ---------------------------------------------------------------- kiểm tra
function verify() {
  const s = loadState();
  if (!s) { log('Chưa cài (không có ~/.aiqe/installed.json).'); process.exit(1); }
  let bad = 0;
  const check = (ok, msg) => { log(`${ok ? 'OK  ' : 'LỖI'}  ${msg}`); if (!ok) bad++; };
  check(fs.existsSync(s.snapshot), `snapshot ${s.snapshot}`);
  const c = s.tools && s.tools.codex;
  if (c) {
    const md = readText(c.agentsMd) || '';
    check(md.includes(MD_START), `Codex AGENTS.md có khối của kit`);
    check(Buffer.byteLength(md) <= AGENTS_LIMIT, `Codex AGENTS.md ≤ 32 KiB (${Buffer.byteLength(md)} byte)`);
    check(/my-aiqe-kit:top/.test(readText(c.config) || ''), 'Codex config.toml có khối của kit');
    const h = readJson(c.hooks) || {};
    check(Object.values(h.hooks || {}).flat().some(isKitHook), 'Codex hooks.json có hook của kit');
  }
  const cl = s.tools && s.tools.claude;
  if (cl) {
    check((readText(cl.claudeMd) || '').includes(MD_START), 'Claude CLAUDE.md có khối của kit');
    const j = readJson(cl.settings) || {};
    check(Object.values(j.hooks || {}).flat().some(isKitHook), 'Claude settings.json có hook của kit');
  }
  const allSkills = [...((c && c.skills) || []), ...((cl && cl.skills) || [])];
  for (const dest of allSkills) {
    const name = path.basename(dest);
    const ver = (readText(path.join(dest, '.aiqe-version')) || '').split(/\r?\n/)[0];
    check(ver === s.version, `skill ${name} @ ${path.dirname(dest)}: version ${ver || '(thiếu)'}`);
    const snapDir = path.join(s.snapshot, 'skills', name);
    for (const f of walk(snapDir)) {
      const rel = path.relative(snapDir, f);
      const g = path.join(dest, rel);
      if (!fs.existsSync(g) || hashFile(g) !== hashFile(f)) { check(false, `skill ${name}: ${rel} khác snapshot`); }
    }
  }
  log(bad ? `\n${bad} lỗi.` : '\nTất cả khớp.');
  process.exit(bad ? 1 : 0);
}

// ---------------------------------------------------------------- main
function main() {
  if (flag('--uninstall')) return uninstall();
  if (flag('--verify')) return verify();
  // Chạy từ bản đã cài (~/.aiqe/kit/...) sẽ xóa chính thư mục nguồn khi tạo snapshot → chặn.
  const rel = path.relative(path.join(HOME, '.aiqe'), KIT_SRC);
  const relReal = path.relative(path.join(os.homedir(), '.aiqe'), KIT_SRC);
  if ([rel, relReal].some((r) => r && !r.startsWith('..') && !path.isAbsolute(r))) {
    const prev = loadState();
    console.error('Không chạy install từ bản kit ĐÃ CÀI. Chạy từ repo kit' + (prev && prev.source ? `: ${prev.source}` : ' (xem trường "source" trong ~/.aiqe/installed.json).'));
    process.exit(1);
  }
  if (!['all', 'codex', 'claude', 'gemini'].includes(TOOL)) { console.error(`--tool không hợp lệ: ${TOOL}`); process.exit(1); }
  log(`my-aiqe-kit ${VERSION}  ·  home: ${HOME}${DRY ? '  ·  DRY-RUN (không ghi gì)' : ''}`);
  buildSnapshot();
  const prev = loadState() || {};
  const state = { version: VERSION, snapshot: SNAPSHOT, source: KIT_SRC, installedAt: new Date().toISOString(), tools: {}, projects: prev.projects || {} };
  if (prev.tools) Object.assign(state.tools, prev.tools);
  if (PROJECT) {
    installProject(state, path.resolve(PROJECT));
  } else {
    if (TOOL === 'all' || TOOL === 'codex') installCodex(state);
    if (TOOL === 'all' || TOOL === 'claude') installClaude(state);
    if (TOOL === 'gemini') warn('Adapter Gemini thuộc Đợt 3, chưa có.');
  }
  if (!DRY) { fs.mkdirSync(AIQE, { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf8'); }
  if (fs.existsSync(BACKUP)) log(`\nBackup: ${BACKUP}`);
  if (problems.length) { log('\nCần bạn xử lý:'); problems.forEach((p) => log('  - ' + p)); process.exitCode = 1; }
  else log('\nXong. Kiểm tra lại: install.ps1 -Verify');
}

main();
