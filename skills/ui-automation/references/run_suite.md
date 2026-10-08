# Chạy suite (mode `run`)

> Chạy test lên một env là **G1**. Chạy lại là **G2**. Kết quả chuyển cho `evidence-reporting`; test fail chuyển cho `incident-triage`.

## 1. Trước khi chạy: hỏi G1 kèm phạm vi
Nhắc lại cho user, rồi chờ đồng ý:
```
G1 · Chạy Playwright
- Env:        <BASE_URL>  (thuộc sandbox_urls: có/không)
- Phạm vi:    --grep @smoke   (N test, theo --list)
- Trình duyệt: chromium | chromium, firefox, webkit
- Worker:     <số>
- Ghi dữ liệu: có/không (data prefix <RUN_PREFIX>, cleanup: <cách>)
- Run ID:     RUN-<YYYYMMDD>-<NN>
```
Env không thuộc `sandbox_urls` → **không chạy**.

## 2. Lệnh
| Mục đích | Lệnh |
|---|---|
| Xem trước, không chạy | `npx playwright test --list --grep @smoke` |
| Smoke | `npx playwright test --grep @smoke` |
| Regression | `npx playwright test --grep @regression` |
| Bỏ một nhóm | `npx playwright test --grep-invert @slow` |
| Một trình duyệt | `npx playwright test --project=chromium` |
| Cross-browser | `npx playwright test` (3 project trong config) |
| Giới hạn worker (site dùng chung) | `npx playwright test --workers=1` |
| Chia máy (CI) | `npx playwright test --shard=1/3` |
| Báo cáo HTML | `npx playwright show-report` (thư mục `playwright-report/`) |
| Xem trace một test fail | `npx playwright show-trace test-results/<…>/trace.zip` |

Site **dùng chung/công khai** (ví dụ OrangeHRM demo): dùng `--workers=1`, chỉ chạy luồng cần thiết, không chạy lặp nhiều lần.

## 3. Đọc kết quả → nhãn
| Trạng thái Playwright | Nhãn (`{{KIT}}/rules/evidence_labels.md`) |
|---|---|
| passed | `LOCAL-RUN: passed` (máy cá nhân) / `CI-RUN: passed` |
| failed | `LOCAL-RUN: failed` → chuyển `incident-triage` |
| flaky (pass ở lần retry) | `LOCAL-RUN: flaky` / `CI-RUN: flaky`; giữ trace lần fail đầu |
| skipped | Ghi rõ vì sao skip; không tính là passed |
| timedOut, interrupted | Như failed; ghi lý do |

`RUN-PASSED` chỉ khi CI chạy trên SHA đã được người khác review và `server_review: yes`.

## 4. Không được
- `--retries` cao để "cho xanh".
- `--last-failed` chạy lại liên tục tới khi pass. Chạy lại là G2, giữ mọi lần.
- Xóa `test-results/` trước khi báo cáo xong.
