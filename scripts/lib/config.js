'use strict';
// Đọc project.aiqe.yml của dự án, dùng chung cho các script.
// Thứ tự tìm (giống AGENTS.md): --config <file> → <cwd>/.aiqe/project.aiqe.yml
//                                → ~/aiqe-output/<tên thư mục cwd>/project.aiqe.yml
// Không tìm thấy → dùng giá trị mặc định CHẶT NHẤT (giống project.aiqe.example.yml).

const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULTS = {
  ai_policy: 'UNKNOWN',
  output_language: 'vi',
  sandbox_urls: [],
  server_review: 'UNKNOWN',
  id_prefix: 'QA',
  excel_columns: ['TC ID', 'Source', 'Scenario', 'Pre-condition', 'Steps', 'Expected', 'Test Data',
    'Priority', 'Risk', 'Automatable', 'Auto Type', 'Tags'],
};

function expandHome(p) {
  return typeof p === 'string' && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function findConfig(explicit) {
  if (explicit) return path.resolve(explicit);
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, '.aiqe', 'project.aiqe.yml'),
    path.join(os.homedir(), 'aiqe-output', path.basename(cwd), 'project.aiqe.yml'),
  ];
  return candidates.find((f) => fs.existsSync(f)) || null;
}

// Thư mục dự án: thư mục chứa .aiqe/ (yml nằm ở <dự án>/.aiqe/project.aiqe.yml);
// yml nằm chỗ khác (ví dụ ~/aiqe-output/<tên>/) thì lấy thư mục đang đứng.
function projectRoot(file) {
  if (file && path.basename(path.dirname(file)) === '.aiqe') return path.dirname(path.dirname(file));
  return process.cwd();
}

// output_dir mặc định (Q10): <dự án>/.aiqe/output. Đường dẫn tương đối tính từ thư mục dự án.
function resolveOutputDir(value, file) {
  const v = value ? expandHome(String(value)) : '.aiqe/output';
  return path.isAbsolute(v) ? v : path.join(projectRoot(file), v);
}

function loadConfig(explicit) {
  const file = findConfig(explicit);
  if (!file) return { file: null, config: { ...DEFAULTS, output_dir: resolveOutputDir(null, null) }, strictest: true };
  let parsed = {};
  try {
    parsed = require('yaml').parse(fs.readFileSync(file, 'utf8')) || {};
  } catch (e) {
    throw new Error(`Không đọc được ${file}: ${e.message}`);
  }
  const config = { ...DEFAULTS, ...parsed };
  config.output_dir = resolveOutputDir(config.output_dir, file);
  return { file, config, strictest: false };
}

// Lấy giá trị của một tham số dòng lệnh dạng --name value.
function argValue(argv, name) {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
}

module.exports = { loadConfig, argValue, DEFAULTS };
