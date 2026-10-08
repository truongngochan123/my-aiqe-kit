# Chuẩn test API

> Lấy từ `antigravity-testing-kit-main/.agent/rules/api_rules.md` mục 1–5 và 7. **Bỏ mục 6** (`:67`, "sửa code và re-run cho đến khi PASS").
> Đổi: data theo `{{KIT}}/rules/id_conventions.md` (bản gốc dùng email domain có thật ở `:48`); SLA chỉ khi có trong spec; kiểm tra bảo mật có cột "Chạy ở đâu".

## 1. Kiến trúc
- **API client / service:** tạo request (URL, header, auth), **không** assertion.
- **Model / kiểu dữ liệu:** request/response (TypeScript interface).
- **Test:** gọi client và assert.
- **Data / tiện ích:** sinh data, đọc config, schema.

## 2. Mỗi case phải kiểm tra
1. **Status code chính xác** (`201`, không phải "2xx").
2. **Schema** response đúng contract (field, kiểu, bắt buộc).
3. **Field nghiệp vụ** quan trọng: giá trị chính xác hoặc pattern.
4. **Case lỗi:** `errorCode`/`message`/`details`, không chỉ status.
5. **Thời gian phản hồi:** chỉ khi spec có SLA; không có → `Not specified`.
6. **Header:** `Content-Type`; header bảo mật khi dự án yêu cầu.

## 3. Xác thực và bảo mật
- Không hardcode mật khẩu/token. Tài khoản test đọc từ `.env.sandbox`.
- Lấy token một lần ở bước setup, dùng lại; xử lý hết hạn.
- Che token/mật khẩu trong log và report (`scripts/redact/redact.js`).

## 4. Data
- Data tạo mới: unique, truy vết được: `QA-r001-…` (ID, tên), email `…@example.com`.
- Mỗi `POST` có `DELETE` dọn đúng record của run (teardown).
- Nhiều bộ data cho cùng endpoint → data-driven (vòng lặp test hoặc `test.describe` theo bảng).

## 5. Theo HTTP method
| Method | Thao tác | Status mong đợi (thường gặp) | Idempotent | Oracle |
|---|---|---|---|---|
| GET | Đọc | 200 | Có | Không làm đổi dữ liệu |
| POST | Tạo | 201 (hoặc 200 theo contract) | Không | `GET` lại theo ID trả đúng field; gọi 2 lần tạo 2 record |
| PUT | Thay toàn bộ | 200 / 204 | Có | `GET` lại khớp payload; gọi N lần kết quả như nhau |
| PATCH | Sửa một phần | 200 | Tùy API | Field không gửi giữ nguyên |
| DELETE | Xóa | 200 / 204 | Có | `GET` lại → 404 |

Status nào đúng là theo **contract** của dự án; bảng trên chỉ là thường gặp.

## 6. Kiểm tra bảo mật (OWASP API)
| # | Kiểm tra | Mong đợi (thường gặp) | **Chạy ở đâu** |
|---|---|---|---|
| 1 | **BOLA/IDOR**: token user A, sửa ID sang tài nguyên của user B | 403/404 | Sandbox, G1 |
| 2 | **Mass assignment**: gửi `role: "ADMIN"`, `isAdmin: true`, `id`… | Bị bỏ qua hoặc 400 | Sandbox, G1 |
| 3 | **Content-Type sai** (`text/plain`, `application/xml`) | 415 | Sandbox, G1 |
| 4 | **JSON hỏng** (`{ "name": }`) | 400 | Sandbox, G1 |
| 5 | **Payload quá lớn** | 413 | ⚠️ **Chỉ** sandbox riêng, G1 + lead xác nhận |
| 6 | **Bắn nhiều request** (rate limit) | 429 | ⚠️ **Chỉ** sandbox riêng, G1 + lead xác nhận; số request nhỏ, có giới hạn |
| 7 | **Race**: 2 request song song tạo trùng dữ liệu unique | 1 × 201, 1 × 409 | ⚠️ **Chỉ** sandbox riêng, G1 |
| 8 | **Chuỗi cực dài** (10.000 ký tự) | 400/422 | ⚠️ **Chỉ** sandbox riêng, G1 + lead xác nhận |
| 9 | **Lộ dữ liệu nhạy cảm**: response có `password`, `hash`, `secretKey` | Không bao giờ có | Sandbox, G1 |

**Cấm** chạy 5–8 trên site công khai hoặc dùng chung (ví dụ OrangeHRM demo), kể cả khi URL nằm trong `sandbox_urls`: đó là gây tải lên hệ thống của người khác.
