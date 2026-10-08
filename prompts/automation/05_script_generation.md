# Automation · Bước 5/6: Viết test script

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md`.
> Nguồn: `antigravity-testing-kit-main/plans/automation/05_script_generation/prompt.txt`. **Đã bỏ mục "Self-fix Loop… KHÔNG hỏi user"** của bản gốc; thay bằng phân loại lỗi + đề xuất + tôi duyệt. Đổi ví dụ assertion bằng thông báo thành công sang kiểm tra dữ liệu.

---START---

Page Object (bước 3) và dữ liệu (bước 4) đã xong. Viết **file test** hoàn chỉnh.

## 1. Cấu trúc
- Dùng page class bước 3 và helper bước 4.
- Theo Arrange → Act → Assert. Tên test bắt đầu bằng TC ID.
- Mỗi test độc lập, có dọn dữ liệu.

## 2. Assertion
- Mỗi test có assertion cuối, kiểm tra **dữ liệu nghiệp vụ**:
  ```ts
  // ❌ Yếu: chỉ thấy thông báo
  await expect(page.getByText('Successfully Saved')).toBeVisible();
  // ✅ Mạnh: tìm lại đúng record, đúng giá trị
  await expect(employeeList.rowByName(`${runPrefix}-An`)).toHaveCount(1);
  ```
- Expected lấy đúng từ test case; không tự nghĩ ra.

## 3. Chờ
Không `waitForTimeout`, `Thread.sleep`. Dùng auto-wait và assertion tự chờ.

## 4. Khi chạy thử mà test fail
**Không tự sửa rồi chạy lại cho tới khi pass.** Thay vào đó:
1. Giữ nguyên lỗi đầu tiên (message, trace, screenshot).
2. Phân loại: môi trường · code test (locator, chờ, data) · lỗi sản phẩm · data/dọn dẹp.
3. Lỗi ở code test → **đề xuất** bản sửa dạng diff kèm lý do. Lỗi sản phẩm → mô tả để tôi viết bug.
4. **Không** sửa expected/assertion, **không** thêm `.skip`/`.only` để cho xanh.
5. Chờ tôi duyệt rồi mới sửa; mỗi lần chạy lại là một lần mới, giữ kết quả lần trước.

Trả code các file test.
