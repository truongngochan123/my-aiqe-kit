# Automation · Bước 6/6: Review và làm sạch trước khi tạo PR

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md`.
> Nguồn: `antigravity-testing-kit-main/plans/automation/06_review_and_refactor/prompt.txt`. Thêm: kiểm tra không có thay đổi oracle lén, chạy `aiqe-verify` trước PR.

---START---

Test đã chạy trên máy. Trước khi tạo PR, **review và làm sạch** code.

## 1. Dọn dẹp
- Xóa `console.log`, code comment bỏ, biến/locator không dùng.

## 2. Chất lượng code
- [ ] Tên biến, method rõ nghĩa
- [ ] Method dài (> 20 dòng) tách nhỏ
- [ ] Logic lặp tách thành helper
- [ ] Import sạch

## 3. Độ ổn định
- [ ] Không còn hard sleep
- [ ] Assertion kiểm dữ liệu nghiệp vụ, đúng expected của test case
- [ ] Dữ liệu unique mỗi lần chạy, có dọn
- [ ] Mỗi test độc lập
- [ ] **Không có thay đổi oracle lén**: không sửa expected/assertion, không thêm `.skip`/`.only`, không sửa file fixture so với bản đã duyệt

## 4. Sẵn sàng cho CI
- Gắn tag để chạy chọn lọc: `{ tag: '@smoke' }` / `@regression` (Playwright), `groups = {"smoke"}` (TestNG).
- Không `test.only`; retry không dùng để che lỗi.
- Nếu repo có `ci/aiqe/aiqe-verify.js`: chạy `node ci/aiqe/aiqe-verify.js --base origin/main` và dán kết quả vào mô tả PR.

Trả bản code cuối cùng và danh sách thay đổi so với bước 5.
