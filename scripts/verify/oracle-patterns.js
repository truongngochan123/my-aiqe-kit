'use strict';
// Nguồn DUY NHẤT của các mẫu nhận diện file test, assertion, skip/only, fixture.
// Dùng chung cho: adapters/hooks/block-assertion-edit.js (báo sớm khi AI sửa) và
//                 scripts/verify/aiqe-verify.js (kiểm tra diff trước PR và trên CI).
// Copy sang repo dự án để chạy CI: chép CẢ 2 file aiqe-verify.js và oracle-patterns.js.
// Đường dẫn so khớp đã chuẩn hóa: dấu "/", chữ thường.

const TEST_FILE_RES = [
  /\.(spec|test)\.[cm]?[jt]sx?$/,
  /(^|\/)(tests?|e2e|__tests__|specs?)\/.*\.(ts|tsx|js|jsx|mjs|cjs|java|kt|py)$/,
  /(test|tests)\.(java|kt)$/, // *Test.java (*IT.java được bắt qua src/test/)
  /(^|\/)src\/test\//,
  /\.postman_collection\.json$/,
  /(^|\/)test_[^/]*\.py$/,
  /_test\.py$/,
];

const ASSERT_RE = /\bexpect\s*\(|\bassert[A-Za-z]*\s*[(.]|\.should\s*\(|\bAssert\.[A-Za-z]+\s*\(|\bassertThat\s*\(|\bpm\.expect\s*\(|\bpm\.test\s*\(|\bverify\s*\(/;
const SKIP_RE = /\b(test|it|describe|context)(\.describe)?\.(skip|only|fixme|fail)\s*\(|\b(xit|xdescribe|xtest|fit|fdescribe)\s*\(|@Disabled\b|@Ignore\b|enabled\s*=\s*false/;
const DEFAULT_FIXTURE_DIRS = ['fixtures', 'testdata', 'test-data'];

// Chỉ file DỮ LIỆU trong thư mục fixture mới tính (tài liệu .md trong thư mục tên "test-data" không phải fixture).
const FIXTURE_EXT = /\.(json|csv|tsv|ya?ml|xml|sql|txt|xlsx?|properties|ts|js|mjs|cjs|py|java|kt)$/;

const isTest = (p) => TEST_FILE_RES.some((re) => re.test(p));
function isFixture(p, dirs = DEFAULT_FIXTURE_DIRS) {
  if (!FIXTURE_EXT.test(p)) return false;
  return dirs.some((d) => new RegExp('(^|/)' + d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/').test(p));
}

module.exports = { TEST_FILE_RES, ASSERT_RE, SKIP_RE, DEFAULT_FIXTURE_DIRS, isTest, isFixture };
