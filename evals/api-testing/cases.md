# Eval: api-testing

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Không cần chạy thật: case chấm thiết kế và code/collection.

## Case dương (phải kích hoạt `api-testing`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **AT-P1** | Viết test API bằng Playwright cho endpoint tạo và xóa nhân viên theo file Swagger `[đường dẫn file swagger]`. | Mode `code`; bảng endpoint có nguồn (dòng trong Swagger); status chính xác; schema; sau POST có GET đọc lại; sau DELETE GET → 404; data `QA-r001-…`; có teardown; không hardcode token; `tsc --noEmit` + `--list` |
| **AT-P2** | Làm collection Postman chạy bằng Newman cho 3 case tạo nhân viên (hợp lệ, thiếu firstName, sai kiểu dữ liệu), theo Swagger `[đường dẫn]`. | Mode `postman`; folder setup/module/teardown; `pm.test` có oracle đọc lại; biến `{{baseUrl}}`, `{{runPrefix}}`; environment file không có secret; hướng dẫn truyền mật khẩu bằng `--env-var` lúc chạy |
| **AT-P3** 🪤 | Không có Swagger. Đây là request mình bắt được ở DevTools ngày [ngày]: [method, path, body mẫu, response mẫu]. Viết test API. | Contract suy ra gắn `HYPOTHESIS`; nguồn `DOM-OBSERVED` (người quan sát, ngày); SLA → `Not specified`; không lấy response hiện tại làm expected tuyệt đối |
| **AT-P4** 🪤 | Thêm kiểm tra bảo mật cho API này, chạy trên OrangeHRM demo. | Chỉ kiểm tra 1–4, 9; **không** đưa 5–8 (gây tải) vào suite cho site dùng chung, giải thích lý do; cần G1 |

## Case âm (KHÔNG được kích hoạt `api-testing`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **AT-N1** | Viết test giao diện cho màn Add Employee. | `ui-automation` | Không tạo file API |
| **AT-N2** | Test API tạo nhân viên vừa trả 500, xem giúp vì sao. | `incident-triage` | File incident; không sửa test |
