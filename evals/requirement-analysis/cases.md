# Eval: requirement-analysis

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm bằng `produced_by` + checklist.

## Case dương (phải kích hoạt `requirement-analysis`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **RA-P1** | Phân tích requirement nghỉ phép này, tìm chỗ thiếu và câu hỏi cho BA: "AC-LEAVE-01: Nhân viên gửi đơn nghỉ phép từ ngày đến ngày. AC-LEAVE-02: Quản lý duyệt hoặc từ chối đơn. AC-LEAVE-03: Đơn đã duyệt bị trừ vào số ngày phép." | Mode A; bảng rule với `REQ-CONFIRMED` + ID AC; danh sách `Not specified` không rỗng (nghỉ nửa ngày, ngày lễ, số ngày phép âm, sửa/hủy đơn đã duyệt, ai duyệt khi quản lý vắng…); câu hỏi mã `Q-LEAVE-…` sắp theo rủi ro; không viết TC |
| **RA-P2** | OrangeHRM không có tài liệu. Ghi lại giúp màn PIM > Employee List làm gì, từ quan sát của mình ngày [ngày]: [các bộ lọc thấy được], [các cột của bảng], [khi tìm theo tên thì …]. | Mode B; **cảnh báo** "requirement dựng ngược có thể chứa bug" ở đầu; mã `HYP-PIM-…`; mỗi dòng có cột Quan sát (người, env, ngày), Đáng ngờ? (có lý do), Quyết định **để trống**; không có `REQ-CONFIRMED` |
| **RA-P3** | Requirement này có chỗ nào mâu thuẫn không? "AC-PIM-01: Employee Id là bắt buộc. AC-PIM-02: Hệ thống tự sinh Employee Id, người dùng không nhập. AC-PIM-03: Employee Id tối đa 10 ký tự." | Chỉ ra mâu thuẫn AC-PIM-01/02 (bắt buộc nhập vs tự sinh), trích dẫn đúng AC; đặt câu hỏi; không tự chọn một bên |

## Case âm (KHÔNG được kích hoạt `requirement-analysis`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **RA-N1** | Lập charter khám phá màn Add Employee của OrangeHRM trong 60 phút để tìm lỗi về dữ liệu. | `exploratory-testing` | File `produced_by: exploratory-testing` có charter 3 phần + time-box |
| **RA-N2** | Requirement đã rõ, viết test case luôn: "AC-LOGIN-01: Đăng nhập đúng username/password thì vào Dashboard. AC-LOGIN-02: Sai mật khẩu hiện 'Invalid credentials'." | `test-design-rbt` | File TC `produced_by: test-design-rbt`; Source `AC-LOGIN-…` |
