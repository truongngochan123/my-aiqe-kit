# Rule: Chuẩn automation (chung cho mọi framework)

> File này chỉ chứa **nguyên tắc**. Tên API cụ thể của từng framework nằm trong
> `skills/ui-automation/references/<stack>.md` (Playwright TS ở Đợt 2; Selenium Java, Appium Java ở Đợt 3, beta).
> Nguồn: `ai-qe-kit/rules/automation_standards.md` và `antigravity-testing-kit-main/.agent/rules/locator_strategy.md`. **Bỏ** mọi vòng tự sửa (auto-heal) của bộ gốc.

## 1. Locator
Thứ tự ưu tiên (khái niệm, áp dụng mọi framework):
1. Thuộc tính accessibility: role + accessible name, label
2. Thuộc tính test riêng: `data-testid`, `data-test`, `data-qa`
3. Định danh chính: `id`, `name`, `resource-id`, accessibility id (mobile)
4. CSS selector
5. XPath (cuối cùng, không dùng XPath tuyệt đối)

Mọi locator phải:
- **Có scope**: tìm trong dialog, trong row, trong form, không tìm trên cả trang khi có thể thu hẹp.
- Khớp **đúng 1 element** trong scope; vẫn đúng sau reload và ở mọi trạng thái (loading, rỗng, có data).
- Lấy từ quan sát thật (`DOM-OBSERVED`). Locator từ tài liệu hoặc snapshot (`PROVIDED`) phải kiểm tra lại trên env trước khi coi là chạy được.

Cấm: class động/hash, `nth-child` khi có lựa chọn tốt hơn, ID tự sinh, XPath tuyệt đối.

## 2. Cấu trúc
- **Page Object Model**: page/screen class chỉ chứa locator và action; **assertion nằm trong test**.
- Mỗi run có data riêng (prefix theo `id_conventions.md` hoặc data registry) và **cleanup cho record do run tạo**.
- Credential tài khoản test đọc từ `.env.sandbox`; không hardcode; không hỏi qua chat.
- Base URL đọc từ config, phải thuộc `sandbox_urls`.

## 3. Chạy
- **Headed** chỉ khi debug ở máy cá nhân. **CI chạy headless.**
- Chặn `.only` khi chạy trên CI (Playwright: `forbidOnly: !!process.env.CI`).
- Retry cấp framework được phép, nhưng report phải hiện `flaky` và giữ trace lần fail đầu (xem `retry_and_wait.md`).
- Trace/screenshot giữ khi fail.
- Chạy test lên một env (local hoặc sandbox) cần **G1**, trừ khi env là `localhost` và user đã cho phép trong phiên làm việc.

## 4. Wait
Chỉ dùng auto-wait và assertion polling của framework. **Cấm** hard sleep.

## 5. Khi test fail (thay cho auto-heal)
1. Lưu evidence: reporter, trace, screenshot. **Không xóa.**
2. Chuyển cho skill `incident-triage` để phân loại: tool/infra · test code (locator, sync) · product behavior · data/cleanup/policy.
3. Nếu lỗi ở test code: AI **đề xuất** bản sửa dạng diff, gắn `AI-PROPOSAL` kèm lý do.
4. Sửa assertion, expected value, fixture hoặc thêm skip là **G3**. Không bao giờ sửa để cho pass.
5. Chạy lại là một attempt mới (G2); giữ attempt cũ trong report.
