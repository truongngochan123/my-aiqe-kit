# Eval: exploratory-testing

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm bằng `produced_by` + checklist.

## Case dương (phải kích hoạt `exploratory-testing`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **EX-P1** | Lập charter test thăm dò màn PIM > Add Employee của OrangeHRM, mình có 60 phút. | Charter đủ 3 phần (Khám phá · Với · Để phát hiện) + time-box; 5–10 ý tưởng ghi heuristic nguồn; có mục ngoài phạm vi; `produced_by: exploratory-testing` |
| **EX-P2** | Đây là ghi chép thô session SES-PIM-01 của mình ngày [ngày]: [thao tác 1 → thấy …], [thao tác 2 → thấy …], [thao tác 3 → thấy …]. Lập session note giúp. | Session note; mỗi phát hiện **đúng 1 nhánh** (bug / TC / câu hỏi) kèm lý do; bug chỉ khi có evidence + nguồn expected; quan sát gắn `DOM-OBSERVED`; có vùng chưa khám phá; dòng tổng đúng |
| **EX-P3** | Gợi ý ý tưởng test thăm dò cho màn Login theo SFDIPOT. | Ý tưởng chia theo 7 góc S·F·D·I·P·O·T; không bịa thông báo lỗi hay giới hạn của app |

## Case âm (KHÔNG được kích hoạt `exploratory-testing`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **EX-N1** | Ghi lại màn Employee List đang làm gì để làm tài liệu, từ quan sát của mình ngày [ngày]: [mô tả]. | `requirement-analysis` mode B | File `produced_by: requirement-analysis` có cảnh báo dựng ngược |
| **EX-N2** | Tạo bảng để mình chạy tay bộ TC-PIM và ghi pass/fail. | `evidence-reporting` mode `manual-run` | Execution sheet `produced_by: evidence-reporting` |
