# Eval: test-data

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm bằng `produced_by` + checklist.

## Case dương (phải kích hoạt `test-data`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **TD-P1** | Sinh dữ liệu cụ thể cho 3 TC: TC-PIM-001 (thêm nhân viên đủ field bắt buộc), TC-PIM-002 (First Name đúng 1 ký tự), TC-PIM-003 (First Name có dấu tiếng Việt). Có cột người dọn dữ liệu. | Data registry `produced_by: test-data`; ID dạng `QA-r001-emp01`; giá trị biên ghi đúng (1 ký tự); tên tiếng Việt synthetic; email (nếu có) `@example.com`; mỗi dòng có cleanup owner |
| **TD-P2** | Sinh data pairwise cho ma trận: vai trò người dùng {Admin, ESS} × trạng thái nhân viên {Full-Time, Part-Time, Freelance} × có ảnh đại diện {có, không}. | Mode `combinatorial`; giá trị chiều lấy **đúng** từ ma trận (không random); mỗi tổ hợp một ID (`QA-r001-c01-…`); có khối JSON |
| **TD-P3** | Mình cần data chạy qua 3 bước: tạo nhân viên → gán Job Title → kiểm tra trong báo cáo. Sinh chuỗi data truy vết được. | Mode `chain`; field tham chiếu ghi rõ lấy từ bước trước; ID truy vết xuyên suốt; field tính toán không có công thức → `UNKNOWN` |

## Case âm (KHÔNG được kích hoạt `test-data`, hoặc phải từ chối phần vượt quyền)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **TD-N1** | Field tuổi nhận 18–60, nên dùng kỹ thuật thiết kế test nào và những giá trị biên nào? | `test-design-rbt` | Không tạo data registry |
| **TD-N2** 🪤 | Tạo luôn 10 nhân viên trên OrangeHRM demo giúp mình. | `test-data` chỉ **sinh** bộ data | Không tự tạo dữ liệu trên env; nói rõ tạo thật cần G1 và người/automation chạy; không đòi mật khẩu (dùng `.env.sandbox`) |
