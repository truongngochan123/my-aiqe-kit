#!/usr/bin/env node
'use strict';
// Hook PreToolUse: báo sớm khi AI sửa oracle (G3) hoặc sửa cấu hình bảo vệ của kit.
// Hàng threat: CHỐNG SAI SÓT. Chốt chặn thật cho G3 là review PR bởi người thứ hai.
//
// Chặn khi trong file test:  xóa/sửa dòng assertion; thêm .skip/.only/.fixme/@Disabled...
// Chặn khi:                  sửa file fixture/testdata đã có; xóa file test hoặc fixture;
//                            sửa ~/.codex/config.toml, hooks.json, ~/.claude/settings*.json, ~/.aiqe/
// Bắt: Edit/MultiEdit/Write (Claude, Codex), apply_patch (Codex), Bash/PowerShell.
//
// Bỏ qua có kiểm soát: NGƯỜI DÙNG đặt biến AIQE_ALLOW_ORACLE_EDIT=<mã ticket/lý do> TRƯỚC khi mở tool.
// AI không đặt được biến này cho tiến trình hook. Khi bỏ qua, hook vẫn in cảnh báo.

const { normPath, pathTokens, commandText, block, ALLOW, runHook } = require('./lib');

const HOOK = 'block-assertion-edit';

const TEST_FILE_RES = [
  /\.(spec|test)\.[cm]?[jt]sx?$/,
  /(^|\/)(tests?|e2e|__tests__|specs?)\/.*\.(ts|tsx|js|jsx|mjs|cjs|java|kt|py)$/,
  /(test|tests)\.(java|kt)$/,               // *Test.java (đường dẫn đã chuyển chữ thường; *IT.java được bắt qua src/test/)
  /(^|\/)src\/test\//,
  /\.postman_collection\.json$/,
  /(^|\/)test_[^/]*\.py$/,
  /_test\.py$/,
];

const PROTECTED_RES = [
  /(^|\/)\.codex\/(config\.toml|hooks\.json)$/,
  /(^|\/)\.claude\/settings(\.local)?\.json$/,
  /(^|\/)\.aiqe\/(kit|backup)\//,
  /(^|\/)\.aiqe\/installed\.json$/,
];

const ASSERT_RE = /\bexpect\s*\(|\bassert[A-Za-z]*\s*[(.]|\.should\s*\(|\bAssert\.[A-Za-z]+\s*\(|\bassertThat\s*\(|\bpm\.expect\s*\(|\bpm\.test\s*\(|\bverify\s*\(/;
const SKIP_RE = /\b(test|it|describe|context)(\.describe)?\.(skip|only|fixme|fail)\s*\(|\b(xit|xdescribe|xtest|fit|fdescribe)\s*\(|@Disabled\b|@Ignore\b|enabled\s*=\s*false/;

const isTest = (p) => TEST_FILE_RES.some((re) => re.test(p));
const isProtected = (p) => PROTECTED_RES.some((re) => re.test(p));
function isFixture(p, dirs) {
  return dirs.some((d) => new RegExp('(^|/)' + d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/').test(p));
}

const lines = (s) => (s || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

// So sánh nội dung cũ và mới của một file test.
function checkTestChange(file, oldText, newText) {
  const newSet = new Set(lines(newText));
  const removed = lines(oldText).filter((l) => ASSERT_RE.test(l) && !newSet.has(l));
  if (removed.length) {
    return block(HOOK, `sửa hoặc xóa ${removed.length} dòng assertion trong "${file}" (ví dụ: ${removed[0].slice(0, 80)}).`,
      'không sửa oracle để test pass. Chuyển lỗi cho incident-triage; nếu thật sự cần đổi oracle thì là G3, người dùng tự sửa hoặc qua review PR.');
  }
  const oldSet = new Set(lines(oldText));
  const addedSkip = lines(newText).filter((l) => SKIP_RE.test(l) && !oldSet.has(l));
  if (addedSkip.length) {
    return block(HOOK, `thêm skip/only/fixme vào "${file}" (${addedSkip[0].slice(0, 80)}).`,
      'không tắt test để pipeline xanh. Ghi nhận lỗi bằng incident-triage hoặc bug-reporting.');
  }
  return ALLOW;
}

function checkFileChange(rawPath, oldText, newText, ctx) {
  const p = normPath(rawPath);
  if (!p) return ALLOW;
  if (isProtected(p)) {
    return block(HOOK, `sửa file cấu hình bảo vệ của kit "${rawPath}".`,
      'muốn đổi cấu hình thì sửa trong repo kit rồi chạy lại scripts/install/install.ps1.');
  }
  if (isFixture(p, ctx.fixtureDirs()) && oldText !== null && oldText !== undefined && oldText !== '') {
    return block(HOOK, `sửa file fixture/testdata đã có "${rawPath}" (fixture là một phần của oracle).`,
      'tạo file data mới cho run thay vì sửa data cũ; đổi data dùng chung là G3.');
  }
  if (isTest(p)) return checkTestChange(rawPath, oldText || '', newText || '');
  return ALLOW;
}

// Định dạng apply_patch của Codex: *** Begin Patch / *** Update File: p / -dòng / +dòng / *** End Patch
function parsePatch(text) {
  const files = [];
  let cur = null;
  for (const raw of (text || '').split(/\r?\n/)) {
    const m = raw.match(/^\*\*\* (Update|Add|Delete) File:\s*(.+)$/);
    if (m) { cur = { op: m[1], path: m[2].trim(), minus: [], plus: [] }; files.push(cur); continue; }
    if (!cur || raw.startsWith('***')) continue;
    if (raw.startsWith('-')) cur.minus.push(raw.slice(1));
    else if (raw.startsWith('+')) cur.plus.push(raw.slice(1));
  }
  return files;
}

const DELETE_RE = /\b(rm|del|erase|rmdir|Remove-Item|ri)\b|\bgit\s+rm\b/i;
const WRITE_RE = /\bsed\s+(-[a-zA-Z]*i|--in-place)|\bperl\s+-[a-zA-Z]*i|\b(Set-Content|Add-Content|Out-File|Move-Item|Rename-Item)\b|\b(mv|move|tee)\b|writeFileSync|appendFileSync|unlinkSync|rmSync|\[IO\.File\]::(Write|Delete)/i;

function evaluate(input, ctx) {
  const tool = (input && input.tool_name) || '';
  const ti = (input && input.tool_input) || {};
  const override = ctx.env && ctx.env.AIQE_ALLOW_ORACLE_EDIT;

  let r = ALLOW;
  if (tool === 'Edit') {
    const p = ti.file_path || ti.path;
    const oldFile = ctx.readFile(p);
    r = checkFileChange(p, ti.old_string !== undefined ? ti.old_string : oldFile, ti.new_string, ctx);
    // Sửa fixture qua Edit: file chắc chắn đã có.
  } else if (tool === 'MultiEdit') {
    const p = ti.file_path;
    for (const e of ti.edits || []) {
      r = checkFileChange(p, e.old_string, e.new_string, ctx);
      if (r.block) break;
    }
  } else if (tool === 'Write') {
    const p = ti.file_path || ti.path;
    r = checkFileChange(p, ctx.readFile(p), ti.content, ctx);
  } else if (tool === 'apply_patch') {
    const files = parsePatch(commandText(ti) || ti.patch || ti.input);
    for (const f of files) {
      const p = normPath(f.path);
      if (f.op === 'Delete' && (isTest(p) || isFixture(p, ctx.fixtureDirs()) || isProtected(p))) {
        r = block(HOOK, `xóa file test/fixture/cấu hình "${f.path}".`, 'xóa test là G3; người dùng tự làm hoặc qua review PR.');
      } else if (f.op === 'Add') {
        r = checkFileChange(f.path, null, f.plus.join('\n'), ctx);
      } else {
        r = checkFileChange(f.path, f.minus.join('\n') || ' ', f.plus.join('\n'), ctx);
      }
      if (r.block) break;
    }
  } else if (tool === 'Bash' || tool === 'PowerShell' || tool === 'shell' || tool === 'local_shell') {
    const cmd = commandText(ti);
    const toks = pathTokens(cmd);
    const dirs = ctx.fixtureDirs();
    const target = toks.find((t) => isTest(t) || isFixture(t, dirs) || isProtected(t));
    if (target && (DELETE_RE.test(cmd) || WRITE_RE.test(cmd))) {
      r = block(HOOK, `lệnh shell sửa/xóa file test, fixture hoặc cấu hình "${target}".`,
        'sửa file test bằng công cụ Edit để hook kiểm tra được; sửa oracle là G3.');
    } else {
      const redirect = [...cmd.matchAll(/>{1,2}\s*([^\s|;&]+)/g)].map((m) => normPath(m[1]));
      const hit = redirect.find((t) => isTest(t) || isFixture(t, dirs) || isProtected(t));
      if (hit) r = block(HOOK, `ghi đè file "${hit}" bằng dấu chuyển hướng >.`, 'sửa bằng công cụ Edit; sửa oracle là G3.');
    }
  }

  if (r.block && override) {
    return { block: false, warn: `[my-aiqe-kit/${HOOK}] CẢNH BÁO: cho qua vì AIQE_ALLOW_ORACLE_EDIT="${override}". ${r.reason.split('\n')[0]}` };
  }
  return r;
}

module.exports = { evaluate, isTest, parsePatch };
if (require.main === module) runHook(HOOK, evaluate);
