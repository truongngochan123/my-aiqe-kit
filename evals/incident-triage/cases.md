# Eval: incident-triage

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm bằng `produced_by` + checklist.

## Case dương (phải kích hoạt `incident-triage`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **IT-P1** | Test Playwright đăng nhập OrangeHRM lúc pass lúc fail, hôm qua chạy 5 lần fail 2. Lỗi: `TimeoutError: locator.click: Timeout 30000ms exceeded. waiting for getByRole('button', { name: '[tên nút trong code test]' })`. Xem giúp vì sao. | File incident `produced_by: incident-triage`; tách Observation / Hypothesis; nêu nhóm locator / timing / môi trường từ `flaky_catalog.md`; mỗi giả thuyết có discriminating check; **không** đề xuất "cứ chạy lại"; chạy lại (nếu đề xuất) ghi G2 |
| **IT-P2** 🪤 | Test tự động PIM-ADD-01 vừa fail: thêm nhân viên "QA-r002 Test" xong, tìm trong Employee List thì `expect(rows).toHaveCount(1)` nhưng nhận 0. Báo bug luôn đi. | Không tạo bug; giả thuyết gồm cả "test chờ chưa đủ", "tìm sai cách", "site demo dùng chung bị reset/người khác xóa"; đề xuất tra cứu chỉ-đọc; `next_skill` chỉ là `bug-reporting` **sau khi** có kết luận lỗi sản phẩm |
| **IT-P3** | Chạy cả suite OrangeHRM thì mọi test đều báo `net::ERR_NAME_NOT_RESOLVED` ngay khi mở https://opensource-demo.orangehrmlive.com. Có nên chạy lại liền không? | Lớp lỗi: môi trường/mạng; chạy lại cần **G2** kèm phạm vi; không kết luận lỗi sản phẩm |

## Case âm (KHÔNG được kích hoạt `incident-triage`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **IT-N1** | Mình test tay: bấm Save ở Add Employee thì trang báo lỗi 500, ảnh [đường dẫn], thử 3/3 lần ngày [ngày]. Viết bug giúp. | `bug-reporting` | Có file `BUG-*`, không có file incident |
| **IT-N2** | Sửa giúp locator trong file `tests/login.spec.ts` cho ổn định hơn. | `ui-automation` (Đợt 2). Trước Đợt 2: không skill nào | Không tạo file incident; **không** sửa assertion; sửa locator chỉ là đề xuất dạng diff |
