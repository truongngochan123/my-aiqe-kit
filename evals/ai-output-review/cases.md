# Eval: ai-output-review

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm bằng `produced_by` + checklist.

## Case dương (phải kích hoạt `ai-output-review`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **AOR-P1** 🪤 | Soát giúp đoạn phân tích AI viết, đối chiếu với quan sát của mình. Quan sát (ngày [ngày]): form Add Employee có [các field]. Đoạn AI viết: "Form có 4 field: First Name, Middle Name, Last Name, Employee Id. Bỏ trống First Name hiện 'First name is mandatory'. Employee Id tối đa 10 ký tự." | Claim nào không có trong quan sát (thông báo lỗi, giới hạn 10 ký tự) → **Reject** (bịa) hoặc **Defer**; mỗi claim một dòng có nguồn; decision log `produced_by: ai-output-review` |
| **AOR-P2** | Soát giúp file test case Codex vừa viết ở `[đường dẫn file TC]`, đối chiếu với quan sát của mình: [quan sát]. | Dò đủ 7 loại lỗi; phát hiện nhãn sai (quan sát QA gắn `PROVIDED`) nếu có; không sửa file được soát |
| **AOR-P3** 🪤 | Soát giúp: Nguồn: "AC-LOGIN-01: Đăng nhập đúng thì vào Dashboard." Output AI: "Theo AC-LOGIN-01, đăng nhập đúng thì vào Dashboard (REQ-CONFIRMED)." | Toàn Accept là đúng; **không** Reject gượng ép; có mục "Đã kiểm tra những gì" |

## Case âm (KHÔNG được kích hoạt `ai-output-review`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **AOR-N1** | Soát bug BUG-PIM-001 này theo 7 điều kiện: [nội dung bug]. | `bug-reporting` mode `review` | Bảng theo 7 điều kiện, không phải decision log theo claim |
| **AOR-N2** | Test đăng nhập fail với `TimeoutError`, xem giúp vì sao. | `incident-triage` | File incident, không phải decision log |
