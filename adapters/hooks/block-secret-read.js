#!/usr/bin/env node
'use strict';
// Hook PreToolUse: báo sớm và chặn khi AI định đọc secret.
// Hàng threat: CHỐNG SAI SÓT. Lách được (ví dụ ghép chuỗi tên file trong biến),
// nên chốt chặn thật là: token tích hợp KHÔNG nằm trong môi trường của AI (rules/agent_safety.md mục 3).
//
// Bắt: Read/Grep (Claude), Bash/PowerShell (Claude, Codex).
// Cho phép: .env.sandbox (tài khoản test quyền thấp), mọi file *.example.

const { normPath, pathTokens, commandText, block, ALLOW, runHook } = require('./lib');

const HOOK = 'block-secret-read';

const SECRET_FILE_RES = [
  /(^|\/)\.env(\.[^/]*)?$/,                 // .env, .env.local, .env.production...
  /\.har$/,
  /(^|\/)storagestate[^/]*\.json$/,
  /(^|\/)cookies?[^/]*\.(json|txt)$/,
  /(^|\/)\.netrc$/,
  /(^|\/)\.npmrc$/,
  /(^|\/)\.git-credentials$/,
  /(^|\/)\.aws\/credentials$/,
  /(^|\/)credentials\.json$/,
  /(^|\/)\.credentials\.json$/,             // ~/.claude/.credentials.json
  /(^|\/)\.codex\/auth\.json$/,             // token đăng nhập của Codex
  /\.(pem|p12|pfx|key)$/,
  /(^|\/)id_(rsa|ed25519|ecdsa)$/,
];

function isAllowedException(p) {
  return /(^|\/)\.env\.sandbox$/.test(p) || /\.example$/.test(p);
}

function isSecretPath(p) {
  if (!p || isAllowedException(p)) return false;
  return SECRET_FILE_RES.some((re) => re.test(p));
}

// Biến môi trường có tên chứa TOKEN/SECRET/PASSWORD/PAT/API_KEY... (PATH không bị bắt).
const SECRET_VAR = '([A-Z0-9_]*_)?(TOKEN|SECRET|PASSWORD|PASSWD|PAT|API_?KEY|CLIENT_SECRET|PRIVATE_KEY)(_[A-Z0-9_]*)?\\b';
const ENV_DUMP_RES = [
  /(^|[\s;&|(])(printenv|env)\s*($|[|;&>)])/i,      // in toàn bộ biến môi trường
  /\b(Get-ChildItem|gci|ls|dir)\s+env:/i,
  /^\s*set\s*$/i,
  new RegExp('\\$env:' + SECRET_VAR, 'i'),
  new RegExp('\\$\\{?' + SECRET_VAR),
  new RegExp('%' + SECRET_VAR + '%', 'i'),
  new RegExp('process\\.env\\.' + SECRET_VAR),
  new RegExp('GetEnvironmentVariable\\(\\s*["\']' + SECRET_VAR, 'i'),
];

function evaluate(input) {
  const tool = (input && input.tool_name) || '';
  const ti = (input && input.tool_input) || {};

  if (tool === 'Read' || tool === 'NotebookRead') {
    const p = normPath(ti.file_path || ti.notebook_path || ti.path);
    if (isSecretPath(p)) {
      return block(HOOK, `đọc file nhạy cảm "${ti.file_path || ti.path}".`,
        'nếu cần tài khoản test, dùng .env.sandbox; token tích hợp (Jira/Xray/CI) do người dùng chạy ở terminal riêng.');
    }
    return ALLOW;
  }

  if (tool === 'Grep') {
    const targets = [ti.path, ti.glob].map(normPath).filter(Boolean);
    if (targets.some(isSecretPath)) {
      return block(HOOK, 'tìm kiếm bên trong file nhạy cảm.', 'loại file secret khỏi phạm vi tìm kiếm.');
    }
    return ALLOW;
  }

  if (tool === 'Bash' || tool === 'PowerShell' || tool === 'shell' || tool === 'local_shell') {
    const cmd = commandText(ti);
    const hit = pathTokens(cmd).find(isSecretPath);
    if (hit) {
      return block(HOOK, `lệnh có đụng tới file nhạy cảm "${hit}".`,
        'không đọc/sao chép/in nội dung secret. Cần chạy script dùng token thì người dùng tự chạy ở terminal riêng.');
    }
    if (ENV_DUMP_RES.some((re) => re.test(cmd))) {
      return block(HOOK, 'lệnh in ra biến môi trường có thể chứa secret.',
        'không in token. Kiểm tra biến có tồn tại hay không thì để người dùng tự làm.');
    }
    return ALLOW;
  }

  return ALLOW;
}

module.exports = { evaluate, isSecretPath };
if (require.main === module) runHook(HOOK, evaluate);
