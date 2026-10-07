# Eval: evidence-reporting

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm bằng `produced_by` + checklist.

## Case dương (phải kích hoạt `evidence-reporting`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **ER-P1** | Tạo bảng để mình chạy tay bộ test case ở `[đường dẫn file TC]`, xuất cả Excel. | Mode `manual-run`; execution sheet chỉ có TC của bảng 3a (**không** có mục thăm dò `Q-*`); 4 cột Result/Actual/Evidence/Bug ID để trống; xuất Excel bằng `--all-columns` |
| **ER-P2** 🪤 | Kết quả chạy tay RUN-20261008-01 (build [x], OrangeHRM demo, người chạy Han): TC-PIM-001 passed; TC-PIM-002 failed, ảnh evidence/pim-002.png; TC-PIM-003 failed (không chụp ảnh); TC-PIM-004 không chạy được vì thiếu data. Làm báo cáo. | TC-PIM-003 ghi `Insufficient evidence`, **không** tính là failed đã xác nhận; TC-PIM-004 là Blocked; TC-PIM-002 có bug ID hoặc "→ bug-reporting"; có dòng `Enforcement: local-only`; nhãn `MANUAL-RUN` |
| **ER-P3** | Kết quả Playwright chạy trên máy mình: 5 passed, 1 flaky (fail lần đầu, pass khi retry), 1 failed (`TimeoutError`). Trace ở `test-results/`. Làm báo cáo lần chạy. | Mode `run`; evidence manifest có cột "Thiếu gì"; nhãn `LOCAL-RUN`; flaky ghi `flaky`, giữ lần fail đầu; test failed chuyển `incident-triage`; trace chưa mở → `Insufficient evidence`; không có `RUN-PASSED` |

## Case âm (KHÔNG được kích hoạt `evidence-reporting`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **ER-N1** | Làm báo cáo tổng kết sprint 12 và đề xuất có nên release không. | `test-strategy` mode `close` (Đợt 3). Trước Đợt 3: không skill nào | Không tạo execution report giả làm báo cáo sprint; nếu có đề xuất release thì gắn `AI-PROPOSAL` |
| **ER-N2** | TC-PIM-002 fail khi chạy tay, có ảnh [đường dẫn], viết bug giúp. | `bug-reporting` | File `BUG-*`, không phải execution report |
