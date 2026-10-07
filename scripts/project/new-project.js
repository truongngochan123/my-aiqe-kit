#!/usr/bin/env node
'use strict';
// Tạo thư mục cho một dự án mới và file .aiqe/project.aiqe.yml từ project.aiqe.example.yml.
// Thường gọi qua scripts/project/new-project.ps1.
//
//   node new-project.js --name <tên> --url <url> [--modules LOGIN,PIM] [--lang vi|en]
//                       [--parent <thư mục cha>] [--output-in-project]
//
// - Chỉ điền: project_name, sandbox_urls, module_codes, output_language, output_dir.
// - Mọi field khác giữ MẶC ĐỊNH CHẶT NHẤT của file mẫu (ai_policy: UNKNOWN, allowed_ai_tools: [] ...).
// - Không ghi đè: file đã có thì dừng và in nội dung hiện tại.
// - In nội dung file vừa tạo để người dùng kiểm tra.

const fs = require('fs');
const path = require('path');

const KIT = path.resolve(__dirname, '..', '..');
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null; };
const fail = (msg) => { console.error(`LỖI: ${msg}`); process.exit(1); };

const name = opt('--name');
const url = opt('--url');
const lang = opt('--lang') || 'vi';
const parent = path.resolve(opt('--parent') || process.cwd());
const modules = (opt('--modules') || '').split(',').map((m) => m.trim().toUpperCase()).filter(Boolean);
const outputInProject = argv.includes('--output-in-project');

// ---- kiểm tra tham số
if (!name || !url) fail('cần --name và --url. Ví dụ: --name aiqe-pilot --url https://opensource-demo.orangehrmlive.com');
if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,49}$/.test(name)) fail(`tên "${name}" chỉ được gồm chữ, số, "-" và "_" (tối đa 50 ký tự).`);
if (!/^https?:\/\/[^\s"']+$/.test(url)) fail(`URL "${url}" phải bắt đầu bằng http:// hoặc https:// và không có khoảng trắng.`);
if (!['vi', 'en'].includes(lang)) fail(`--lang chỉ nhận vi hoặc en (nhận "${lang}").`);
const badModule = modules.find((m) => !/^[A-Z][A-Z0-9]{1,9}$/.test(m));
if (badModule) fail(`mã module "${badModule}" không đúng rules/id_conventions.md: chữ in hoa, 2–10 ký tự, bắt đầu bằng chữ.`);

const dir = path.join(parent, name);
const rel = path.relative(KIT, dir);
if (!rel.startsWith('..') && !path.isAbsolute(rel)) fail(`không tạo dự án bên trong repo kit (${KIT}). Dùng --parent để chọn chỗ khác.`);

const target = path.join(dir, '.aiqe', 'project.aiqe.yml');
if (fs.existsSync(target)) {
  console.log(`Đã có ${target}. KHÔNG ghi đè. Nội dung hiện tại:\n`);
  console.log(fs.readFileSync(target, 'utf8'));
  process.exit(1);
}

// ---- điền vào file mẫu (giữ nguyên comment giải thích)
const outputDir = outputInProject ? path.join(dir, 'output').replace(/\\/g, '/') : `~/aiqe-output/${name}`;
let text = fs.readFileSync(path.join(KIT, 'project.aiqe.example.yml'), 'utf8');
const today = new Date().toISOString().slice(0, 10);
const edits = [
  [/^project_name:.*$/m, `project_name: "${name}"            # tạo bởi scripts/project/new-project ngày ${today}`],
  [/^sandbox_urls:\s*\[\][^\n]*$/m, `sandbox_urls: ["${url}"]    # env được phép chạy test/ghi data`],
  [/^output_language:.*$/m, `output_language: ${lang}                 # vi | en`],
  [/^output_dir:.*$/m, `output_dir: "${outputDir}"${outputInProject ? '   # trong thư mục dự án (Codex không phải hỏi mỗi lần ghi)' : ''}`],
  [/^module_codes:.*$/m, `module_codes: [${modules.join(', ')}]${modules.length ? '' : '                 # chưa khai báo: thêm mã module chữ in hoa, ví dụ [LOGIN, PIM]'}`],
];
for (const [re, line] of edits) {
  if (!re.test(text)) fail(`file mẫu project.aiqe.example.yml không còn dòng khớp ${re}. Kiểm tra lại file mẫu.`);
  text = text.replace(re, line);
}

// ---- kiểm tra YAML hợp lệ trước khi ghi
try {
  const parsed = require(path.join(KIT, 'scripts', 'node_modules', 'yaml')).parse(text);
  if (parsed.project_name !== name || parsed.sandbox_urls[0] !== url) fail('nội dung sinh ra không đúng (kiểm tra lại script).');
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') console.log('⚠️  Chưa có thư viện yaml (chạy "cd scripts; npm install"): bỏ qua bước kiểm tra cú pháp.');
  else fail(`YAML sinh ra không hợp lệ: ${e.message}`);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
if (outputInProject) fs.mkdirSync(path.join(dir, 'output'), { recursive: true });
fs.writeFileSync(target, text, 'utf8');

console.log(`Đã tạo ${target}\n`);
console.log('================ NỘI DUNG (đọc lại để kiểm tra) ================');
console.log(text);
console.log('================================================================');
console.log('Các field còn ở mặc định chặt nhất: ai_policy: UNKNOWN, allowed_ai_tools: [], server_review: UNKNOWN, sms_gateway_disabled: UNKNOWN.');
console.log('→ Trả lời checklist docs/before_you_use.md rồi tự chỉnh các field này trong file trên.');
console.log(`Tiếp theo: mở thư mục ${dir} trong VS Code để làm việc với Codex/Claude.`);
