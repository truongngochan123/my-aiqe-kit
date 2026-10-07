#!/usr/bin/env node
'use strict';
// Tạo bản gửi khách (external) từ file output nội bộ (bug, báo cáo, test case).
//
// Dùng:  node scripts/export/to-external.js <file.md> [--out <thư mục>] [--lang vi|en]
//                                          [--keep-priority] [--config <project.aiqe.yml>]
//
// Làm gì (theo rules/evidence_labels.md mục 5 và rules/bug_report.md mục 7):
//   1. Bỏ front-matter và comment HTML (<!-- ... -->)
//   2. CHUYỂN nhãn evidence thành lời (không xóa nhãn, để không giấu sự không chắc chắn)
//   3. Bỏ dòng "Priority (đề xuất)" (trừ khi --keep-priority: lead đã duyệt) và dòng "Enforcement:"
//   4. Che dữ liệu nhạy cảm bằng scripts/redact/redact.js
//   5. Ghi ra <output_dir>/external/<tên file> (hoặc --out). Không bao giờ ghi đè file gốc.
// Người vẫn phải đọc lại trước khi gửi (G4).

const fs = require('fs');
const path = require('path');
const { loadConfig, argValue } = require('../lib/config');
const { redactText, loadPatterns } = require('../redact/redact');

const RESULT = {
  vi: { passed: 'đạt', failed: 'không đạt', flaky: 'không ổn định (lúc đạt lúc không)' },
  en: { passed: 'passed', failed: 'failed', flaky: 'unstable (intermittent)' },
};
const RUN_KIND = {
  vi: { 'MANUAL-RUN': 'kết quả kiểm thử thủ công', 'LOCAL-RUN': 'kết quả chạy tự động trên môi trường kiểm thử', 'CI-RUN': 'kết quả chạy tự động trên CI' },
  en: { 'MANUAL-RUN': 'manual test result', 'LOCAL-RUN': 'automated run on test environment', 'CI-RUN': 'automated run on CI' },
};
const WORDS = {
  vi: {
    'RUN-PASSED': 'kết quả chạy chính thức: đạt', 'RUN-FAILED': 'kết quả chạy chính thức: không đạt',
    'DOM-OBSERVED': 'quan sát trực tiếp', PROVIDED: 'theo thông tin được cung cấp',
    'AI-PROPOSAL': 'đề xuất của QA', 'QA-ACCEPTED': 'đề xuất của QA',
    HYPOTHESIS: 'nghi ngờ, chưa xác minh', VERIFIED: 'đã xác minh', REFUTED: 'đã loại trừ',
    UNKNOWN: 'chưa xác định', 'Not specified': 'tài liệu chưa quy định', 'Insufficient evidence': 'chưa đủ bằng chứng',
  },
  en: {
    'RUN-PASSED': 'official run: passed', 'RUN-FAILED': 'official run: failed',
    'DOM-OBSERVED': 'directly observed', PROVIDED: 'according to provided information',
    'AI-PROPOSAL': 'QA recommendation', 'QA-ACCEPTED': 'QA recommendation',
    HYPOTHESIS: 'suspected, not yet verified', VERIFIED: 'verified', REFUTED: 'ruled out',
    UNKNOWN: 'not yet determined', 'Not specified': 'not specified in the requirements', 'Insufficient evidence': 'insufficient evidence',
  },
};
const LEFTOVER = /\b(REQ-CONFIRMED|DOM-OBSERVED|AI-PROPOSAL|QA-ACCEPTED|HYPOTHESIS|VERIFIED|REFUTED|MANUAL-RUN|LOCAL-RUN|CI-RUN|RUN-PASSED|RUN-FAILED|UNKNOWN)\b/;

const OBVIOUS = {
  vi: 'kỳ vọng chung của phần mềm, chờ PO xác nhận',
  en: 'general software expectation, pending PO confirmation',
};

function convertLabels(text, lang) {
  let t = text;
  // Nguồn expected "kỳ vọng hiển nhiên #n" (rules/bug_report.md mục 1b).
  t = t.replace(/kỳ vọng hiển nhiên\s*#\s*[1-4]/gi, OBVIOUS[lang])
    .replace(/,?\s*cần PO\/BA xác nhận expected/gi, ''); // ghi chú nội bộ, đã nằm trong cụm thay thế
  // REQ-CONFIRMED: bỏ nhãn, giữ mã AC.
  t = t.replace(/\(\s*`?REQ-CONFIRMED`?\s*,\s*/g, '(')
    .replace(/,\s*`?REQ-CONFIRMED`?\s*\)/g, ')')
    .replace(/\s*\(\s*`?REQ-CONFIRMED`?\s*\)/g, '')
    .replace(/`?REQ-CONFIRMED`?/g, '');
  // Nhãn kết quả chạy: MANUAL-RUN: failed …
  t = t.replace(/`?(MANUAL-RUN|LOCAL-RUN|CI-RUN):\s*(passed|failed|flaky)`?/g,
    (_, kind, res) => `${RUN_KIND[lang][kind]}: ${RESULT[lang][res]}`);
  t = t.replace(/`?(MANUAL-RUN|LOCAL-RUN|CI-RUN)`?/g, (_, kind) => RUN_KIND[lang][kind]);
  // Các nhãn còn lại (cụm dài trước).
  const keys = Object.keys(WORDS[lang]).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp('`?\\b' + esc + '\\b`?', 'g'), WORDS[lang][k]);
  }
  return t;
}

function main() {
  const argv = process.argv.slice(2);
  const input = argv.find((a, k) => !a.startsWith('--') && !['--out', '--lang', '--config'].includes(argv[k - 1]));
  if (!input) {
    console.log('Dùng: node scripts/export/to-external.js <file.md> [--out <dir>] [--lang vi|en] [--keep-priority]');
    process.exit(1);
  }
  const src = path.resolve(input);
  const { file: cfgFile, config } = loadConfig(argValue(argv, '--config'));
  const lang = argValue(argv, '--lang') || config.output_language || 'vi';
  if (!WORDS[lang]) { console.error(`--lang không hỗ trợ: ${lang}`); process.exit(1); }

  let text = fs.readFileSync(src, 'utf8');
  text = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');           // 1. front-matter
  text = text.replace(/<!--[\s\S]*?-->\n?/g, '');                       //    comment HTML
  text = text.split(/\r?\n/).filter((l) => {                           // 3. dòng nội bộ
    if (/^\s*Enforcement\s*:/i.test(l)) return false;
    if (!argv.includes('--keep-priority') && /^\|\s*Priority\s*\((đề xuất|proposed)\)/i.test(l)) return false;
    return true;
  }).join('\n');
  text = convertLabels(text, lang);                                     // 2. nhãn → lời
  const { text: redacted, counts } = redactText(text, loadPatterns()); // 4. redact

  const outDir = argValue(argv, '--out')
    ? path.resolve(argValue(argv, '--out'))
    : config.output_dir ? path.join(config.output_dir, 'external') : path.join(path.dirname(src), 'external');
  fs.mkdirSync(outDir, { recursive: true });
  const dest = path.join(outDir, path.basename(src));
  if (path.resolve(dest) === src) { console.error('Đích trùng file gốc: không ghi đè.'); process.exit(1); }
  fs.writeFileSync(dest, redacted.replace(/\n{3,}/g, '\n\n'), 'utf8');

  const n = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Bản gửi khách: ${dest}`);
  console.log(`Ngôn ngữ: ${lang}${cfgFile ? '' : ' (không tìm thấy project.aiqe.yml, dùng mặc định)'} · đã che ${n} chỗ dữ liệu nhạy cảm`);
  const left = redacted.match(LEFTOVER);
  if (left) console.log(`⚠️  Còn sót nhãn "${left[0]}": kiểm tra lại bằng tay.`);
  console.log('Nhắc: đọc lại toàn bộ trước khi gửi (G4). Screenshot phải tự che.');
}

module.exports = { convertLabels };
if (require.main === module) main();
