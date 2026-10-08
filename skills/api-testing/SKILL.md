---
name: api-testing
description: Thiết kế và viết test API theo contract (Swagger/OpenAPI hoặc request mẫu): code Playwright request hoặc collection Postman chạy Newman; oracle đọc lại dữ liệu; kiểm tra bảo mật OWASP chỉ trên sandbox. Dùng khi "test API", "Postman", "Newman". Không dùng cho test giao diện → ui-automation.
---

# API Testing

> Chuẩn: `references/api_standards.md` (từ `api_rules.md` của bộ gốc, **bỏ §6 Auto-Heal** `api_rules.md:67`), `references/postman_newman.md`.
> Chung: `{{KIT}}/rules/automation_standards.md`, `{{KIT}}/rules/agent_safety.md`, `{{KIT}}/rules/id_conventions.md`.

## Khi dùng / Không dùng
- **Dùng:** viết test API (status, schema, field nghiệp vụ, lỗi), kiểm tra bảo mật API cơ bản, chuyển TC API thành code hoặc collection Postman.
- **Không dùng:**
  - Test qua giao diện → `ui-automation`.
  - Test API fail chưa rõ nguyên nhân → `incident-triage`.
  - Load test/performance → chưa hỗ trợ ("Để sau" trong `docs/BUILD_PLAN.md`).

## Mode
| Mode | Output |
|---|---|
| `code` (mặc định khi repo có `@playwright/test`) | `tests/api/*.spec.ts` dùng `request` của Playwright |
| `postman` | `<tên>.postman_collection.json` + `<env>.postman_environment.json` (không có secret), chạy bằng Newman |

## Đầu vào
| Cần | Thiếu thì |
|---|---|
| Contract: file Swagger/OpenAPI **user đưa** (không tự tải từ web) | Dùng **request mẫu** (dev đưa → `PROVIDED`; QA xem DevTools → `DOM-OBSERVED`). Contract suy ra từ request mẫu gắn `HYPOTHESIS` |
| Base URL thuộc `sandbox_urls` | Không chạy; chỉ viết code |
| Tài khoản test (`.env.sandbox`) | Không hỏi qua chat; ghi biến `TEST_USER`/`TEST_PASSWORD` |
| TC API (nếu có, từ `test-design-rbt`) | Thiết kế case theo `references/api_standards.md` mục 2 |
| SLA thời gian phản hồi | Không có trong spec → `Not specified`, **không** tự đặt ngưỡng |

## Quy trình
1. **Lập bảng endpoint**: `Method | Path | Mục đích | Có ghi dữ liệu? | Nguồn (Swagger dòng nào / request mẫu)`.
2. **Thiết kế case** mỗi endpoint: happy, negative (thiếu field, sai kiểu), boundary, phân quyền (401/403), lỗi (404/409/422); đủ các mục kiểm tra ở `references/api_standards.md` mục 2.
3. **Oracle đọc lại dữ liệu**: sau `POST` → `GET` lại theo ID và so từng field; sau `DELETE` → `GET` phải `404`; sau `PUT/PATCH` → field không gửi phải giữ nguyên (PATCH). Không dừng ở status 200.
4. **Data**: ID/tên mang prefix của run (`QA-r001-An`); email `@example.com`; mỗi `POST` có bước dọn (`DELETE`) đúng record của run.
5. **Bảo mật** (`references/api_standards.md` mục 6): chọn kiểm tra theo **loại env**:
   - Env sandbox (kể cả site demo dùng chung): kiểm tra **1–4 và 9** (BOLA, mass assignment, content-type, payload hỏng, lộ dữ liệu nhạy cảm), cần **G1**.
   - Kiểm tra **gây tải** 5–8 (payload quá lớn, bắn nhiều request, race, chuỗi cực dài): **chỉ** env sandbox **riêng của dự án**, cần **G1 + lead xác nhận**. **Cấm** trên site công khai/dùng chung (ví dụ OrangeHRM demo).
6. **Viết code/collection** theo mode; secret chỉ đọc từ biến môi trường.
7. **Kiểm tra trước khi chạy**: mode `code` → `npx tsc --noEmit` và `npx playwright test --list tests/api`; mode `postman` → JSON hợp lệ. Báo dòng cuối.
8. **Chạy** (nếu user yêu cầu): **G1** kèm phạm vi (env, số request ghi). Kết quả → `evidence-reporting`; fail → `incident-triage`.

## Output
- Code/collection trong repo dự án (hỏi trước khi ghi vào repo khách).
- `<output_dir>/automation/API-<MODULE>.md`: bảng endpoint, bảng case, nguồn contract, `Not specified`. Front-matter `produced_by: api-testing`, `source`, `labels`, `status`.

## Gate và giới hạn
- **G1** cho mọi lần chạy có `POST/PUT/PATCH/DELETE` và mọi kiểm tra bảo mật. **G2** để chạy lại.
- **Không** auto-heal: test fail không sửa code/expected rồi chạy lại cho tới khi pass (đã bỏ `api_rules.md` §6).
- Không hardcode token/mật khẩu; không in token ra log/report (`{{KIT}}/rules/reporting_and_data.md`).
- Không tạo expected từ chính response hiện tại (đó là ghi lại hành vi, không phải kiểm tra): expected phải có nguồn.

## Self-check
- [ ] Mỗi endpoint có nguồn contract; contract suy từ request mẫu gắn `HYPOTHESIS`
- [ ] Mỗi case kiểm status **chính xác**, schema/field nghiệp vụ, và lỗi chi tiết cho case negative
- [ ] Ghi dữ liệu → có oracle đọc lại và có bước dọn đúng record của run
- [ ] SLA không có trong spec → `Not specified`
- [ ] Kiểm tra gây tải (5–8) không nằm trong suite chạy trên env dùng chung
- [ ] Không secret trong code/collection/environment file
- [ ] Đã kiểm tra cú pháp (tsc/--list hoặc JSON) và báo dòng cuối
- [ ] Có front-matter `produced_by: api-testing`
