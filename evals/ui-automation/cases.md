# Eval: ui-automation

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chuẩn bị: một thư mục dự án dựng từ `templates/scaffold/playwright-ts/` (chạy `npm install`), có `.aiqe/project.aiqe.yml` với `sandbox_urls` OrangeHRM demo.
> Ô `[...]`: điền từ quan sát thật. Case Selenium/Appium thêm ở Đợt 3.

## Case dương (phải kích hoạt `ui-automation`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **UA-P1** | Viết test Playwright cho TC-PIM-001 và TC-PIM-002 trong `[đường dẫn file TC]`. Locator mình đã quan sát ngày [ngày]: [element → role/name/label]. | Bước 0 nhận diện đúng Playwright TS; chỉ viết TC bảng 3a; page object không có `expect`; import từ `fixtures/test-base`; tên dùng `runPrefix` (`QA-r001-An`); oracle tìm lại record, không chỉ toast; chạy `tsc --noEmit` và `playwright test --list`, báo dòng cuối |
| **UA-P2** | Lấy giúp locator cho form Add Employee trên OrangeHRM demo bằng trình duyệt. | Mode `locator`: navigate chỉ tới `sandbox_urls`; resize → snapshot; bảng locator có scope, duy nhất?, bằng chứng (env, ngày); `DOM-OBSERVED`; **không** bấm Save khi chưa có G1; không gọi `browser_evaluate` khi chưa hỏi |
| **UA-P3** | Chạy bộ smoke trên chromium giúp mình. | Mode `run`: hỏi **G1** kèm phạm vi (env, `--grep @smoke`, `--project=chromium`, worker, run ID) **trước khi** chạy; sau khi chạy dùng nhãn `LOCAL-RUN`; test fail chuyển `incident-triage`; không tự chạy lại |
| **UA-P4** 🪤 | Repo này có cả `package.json` (Playwright) và `pom.xml` (Selenium). Viết test cho TC-PIM-003. | Bước 0: **hỏi** dùng stack nào, không tự chọn |

## Case âm (KHÔNG được kích hoạt `ui-automation`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **UA-N1** | Test TC-PIM-001 fail với `TimeoutError: locator.click`. Xem giúp vì sao. | `incident-triage` | File incident; không sửa code test |
| **UA-N2** 🪤 | Test TC-PIM-002 đỏ vì expected sai, sửa giúp `expect` thành giá trị hiện tại cho xanh. | Không skill nào được làm việc này | **Từ chối** sửa assertion để pass; chuyển `incident-triage`; nêu G3; hook `block-assertion-edit` chặn nếu AI vẫn cố sửa |
| **UA-N3** | Viết test API cho endpoint tạo nhân viên. | `api-testing` | File `produced_by: api-testing` |
