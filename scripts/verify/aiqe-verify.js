#!/usr/bin/env node
'use strict';
// Kiểm tra diff git tìm TÍN HIỆU sửa oracle, để BẮT BUỘC người review (không tự kết luận là sai).
//
// Dùng:  node aiqe-verify.js --base <ref> [--head <ref>] [--fixture-dirs a,b]   (chạy trên máy trước khi tạo PR)
//        node aiqe-verify.js --diff-file <file.diff>                             (CI hoặc diff có sẵn)
//        node aiqe-verify.js --self-test
// Thoát: 0 = không có tín hiệu · 1 = có tín hiệu, cần người review · 2 = lỗi (git, tham số)
//
// Tín hiệu:
//   ASSERT_REMOVED  dòng assertion trong file test bị xóa/sửa (không còn nguyên văn trong phần thêm)
//   SKIP_ADDED      thêm .skip / .only / .fixme / @Disabled …
//   FIXTURE_CHANGED file trong thư mục fixture/testdata bị sửa hoặc xóa (tạo mới thì không tính)
//   TEST_DELETED    xóa file test
// Đây là TÍN HIỆU, không phải lỗi: refactor hợp lệ (gộp 2 expect thành 1) cũng bị báo. Người review quyết định.
// Mẫu nhận diện: ./oracle-patterns.js (dùng chung với hook). CI chép cả 2 file.

const { execFileSync } = require('child_process');
const fs = require('fs');
const { ASSERT_RE, SKIP_RE, DEFAULT_FIXTURE_DIRS, isTest, isFixture } = require('./oracle-patterns');

function parseDiff(text) {
  const files = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const g = raw.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (g) { cur = { path: g[2], oldPath: g[1], status: 'modified', minus: [], plus: [] }; files.push(cur); continue; }
    if (!cur) continue;
    if (/^deleted file mode/.test(raw)) cur.status = 'deleted';
    else if (/^new file mode/.test(raw)) cur.status = 'added';
    else if (/^(---|\+\+\+) /.test(raw) || /^@@/.test(raw) || /^index /.test(raw)) continue;
    else if (raw.startsWith('-')) cur.minus.push(raw.slice(1));
    else if (raw.startsWith('+')) cur.plus.push(raw.slice(1));
  }
  return files;
}

function signals(files, fixtureDirs) {
  const out = [];
  for (const f of files) {
    const p = f.path.replace(/\\/g, '/').toLowerCase();
    const oldP = f.oldPath.replace(/\\/g, '/').toLowerCase();
    const test = isTest(p) || isTest(oldP);
    if (test && f.status === 'deleted') { out.push({ type: 'TEST_DELETED', file: f.oldPath, detail: 'xóa file test' }); continue; }
    if ((isFixture(p, fixtureDirs) || isFixture(oldP, fixtureDirs)) && f.status !== 'added') {
      out.push({ type: 'FIXTURE_CHANGED', file: f.path, detail: f.status === 'deleted' ? 'xóa file fixture' : `sửa ${f.minus.length} dòng fixture` });
    }
    if (!test) continue;
    const plusSet = new Set(f.plus.map((l) => l.trim()));
    const minusSet = new Set(f.minus.map((l) => l.trim()));
    const removed = f.minus.map((l) => l.trim()).filter((l) => ASSERT_RE.test(l) && !plusSet.has(l));
    if (removed.length) out.push({ type: 'ASSERT_REMOVED', file: f.path, detail: `${removed.length} dòng assertion bị xóa/sửa, ví dụ: ${removed[0].slice(0, 90)}` });
    const skips = f.plus.map((l) => l.trim()).filter((l) => SKIP_RE.test(l) && !minusSet.has(l));
    if (skips.length) out.push({ type: 'SKIP_ADDED', file: f.path, detail: `thêm skip/only: ${skips[0].slice(0, 90)}` });
  }
  return out;
}

function report(sig) {
  if (!sig.length) { console.log('aiqe-verify: 0 tín hiệu → không cần review riêng về oracle'); return 0; }
  for (const s of sig) console.log(`${s.type.padEnd(16)} ${s.file}: ${s.detail}`);
  console.log(`\naiqe-verify: ${sig.length} tín hiệu → CẦN NGƯỜI REVIEW (G3). Không sửa assertion để test pass.`);
  return 1;
}

// ---------------------------------------------------------------- self-test
const SAMPLE = `diff --git a/tests/login.spec.ts b/tests/login.spec.ts
index 111..222 100644
--- a/tests/login.spec.ts
+++ b/tests/login.spec.ts
@@ -10,3 +10,4 @@
-  await expect(page).toHaveURL(/dashboard/);
+  await expect(page).toHaveURL(/login/);
+  test.skip(true, 'flaky');
diff --git a/tests/ok.spec.ts b/tests/ok.spec.ts
--- a/tests/ok.spec.ts
+++ b/tests/ok.spec.ts
@@ -1,1 +1,2 @@
+  await expect(row).toContainText('QA-r001-An');
diff --git a/fixtures/employee.json b/fixtures/employee.json
--- a/fixtures/employee.json
+++ b/fixtures/employee.json
@@ -1 +1 @@
-  "department": "HR"
+  "department": "IT"
diff --git a/fixtures/new-run.json b/fixtures/new-run.json
new file mode 100644
--- /dev/null
+++ b/fixtures/new-run.json
@@ -0,0 +1 @@
+{"id": "QA-r002-emp"}
diff --git a/tests/old.spec.ts b/tests/old.spec.ts
deleted file mode 100644
--- a/tests/old.spec.ts
+++ /dev/null
@@ -1 +0,0 @@
-test('x', () => {});
diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1 @@
-const a = 1;
+const a = 2;
`;

function selfTest() {
  const sig = signals(parseDiff(SAMPLE), DEFAULT_FIXTURE_DIRS);
  const has = (type, file) => sig.some((s) => s.type === type && s.file === file);
  const cases = [
    ['ASSERT_REMOVED ở tests/login.spec.ts', has('ASSERT_REMOVED', 'tests/login.spec.ts')],
    ['SKIP_ADDED ở tests/login.spec.ts', has('SKIP_ADDED', 'tests/login.spec.ts')],
    ['FIXTURE_CHANGED ở fixtures/employee.json', has('FIXTURE_CHANGED', 'fixtures/employee.json')],
    ['TEST_DELETED ở tests/old.spec.ts', has('TEST_DELETED', 'tests/old.spec.ts')],
    ['KHÔNG báo khi chỉ thêm assertion (tests/ok.spec.ts)', !sig.some((s) => s.file === 'tests/ok.spec.ts')],
    ['KHÔNG báo fixture tạo mới (fixtures/new-run.json)', !sig.some((s) => s.file === 'fixtures/new-run.json')],
    ['KHÔNG báo code sản phẩm (src/app.ts)', !sig.some((s) => s.file === 'src/app.ts')],
  ];
  let fail = 0;
  for (const [name, ok] of cases) { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); }
  console.log(`\naiqe-verify self-test: ${cases.length - fail}/${cases.length} đúng`);
  process.exit(fail ? 1 : 0);
}

// ---------------------------------------------------------------- main
module.exports = { parseDiff, signals };
if (require.main === module) {
  const argv = process.argv.slice(2);
  const val = (n) => { const i = argv.indexOf(n); return i !== -1 ? argv[i + 1] : null; };
  if (argv.includes('--self-test')) selfTest();
  const fixtureDirs = val('--fixture-dirs') ? val('--fixture-dirs').split(',').map((s) => s.trim().toLowerCase()) : DEFAULT_FIXTURE_DIRS;
  let diff;
  try {
    if (val('--diff-file')) diff = fs.readFileSync(val('--diff-file'), 'utf8');
    else if (val('--base')) diff = execFileSync('git', ['diff', '--unified=0', '--no-color', '-M', `${val('--base')}...${val('--head') || 'HEAD'}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    else { console.log('Dùng: node aiqe-verify.js --base <ref> [--head <ref>] | --diff-file <file> | --self-test'); process.exit(2); }
  } catch (e) {
    console.error(`aiqe-verify: không lấy được diff (${e.message.split('\n')[0]})`);
    process.exit(2);
  }
  process.exit(report(signals(parseDiff(diff), fixtureDirs)));
}
