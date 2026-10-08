# Khung dự án Playwright TypeScript (my-aiqe-kit)

## Bắt đầu
```powershell
npm install
npx playwright install chromium        # tải trình duyệt (một lần)
copy .env.sandbox.example .env.sandbox # rồi điền BASE_URL và tài khoản test
npx playwright test --list             # xem danh sách test, không chạy
```

## Chạy
| Lệnh | Việc |
|---|---|
| `npx playwright test` | Chạy tất cả, 3 trình duyệt (chromium, firefox, webkit) |
| `npx playwright test --grep @smoke` | Chỉ test gắn tag `@smoke` |
| `npx playwright test --grep @regression` | Chỉ test gắn tag `@regression` |
| `npx playwright test --project=chromium` | Một trình duyệt |
| `npx playwright test --headed` | Mở trình duyệt có giao diện (debug trên máy) |
| `npx playwright show-report` | Xem báo cáo HTML |

Chạy test lên một env là **G1** (cần duyệt). URL phải nằm trong `sandbox_urls` của `.aiqe/project.aiqe.yml`.

## Quy tắc đã cài sẵn
- `forbidOnly` trên CI: `test.only` không lọt lên CI.
- Retry 1 lần chỉ trên CI; test pass ở lần retry hiện là **flaky**, lần fail đầu giữ trace.
- Trace, screenshot, video giữ lại khi fail.
- `fixtures/test-base.ts` chặn request tới host ngoài allowlist (chống sai sót, có giới hạn: xem comment trong file).
- Credential đọc từ `.env.sandbox`, không hardcode.
- Data đặt tên theo prefix của lần chạy (`runPrefix`, ví dụ `QA-r001-An`) để dọn đúng dữ liệu của mình.

## Viết test mới
- Import `test`, `expect` từ `fixtures/test-base`, không import thẳng từ `@playwright/test`.
- Page Object trong `pages/`: chỉ locator + hành động. Assertion trong `tests/`.
- Locator lấy từ DOM thật; **không đoán**.
- Không `waitForTimeout`; dùng `expect(...)` polling.
- Test fail: **không** sửa assertion để pass; chuyển cho skill `incident-triage`.
