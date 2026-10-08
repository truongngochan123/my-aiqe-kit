# Eval: test-strategy

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới. Chấm: `produced_by` + checklist.

## Case dương (phải kích hoạt `test-strategy`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **TS-P1** | Lập test plan cho đợt kiểm thử OrangeHRM demo gồm 3 module PIM, Leave, Admin trong 2 tuần, 2 QA. Chưa có requirement chính thức. | File `PLAN-*`, `produced_by: test-strategy`; phạm vi có nguồn hoặc `UNKNOWN`; ước lượng có **cách tính + giả định**, không số không nguồn; tiêu chí exit đo được và ghi `AI-PROPOSAL`; performance/security chuyên sâu ghi "Để sau" kèm điều kiện; có "Bước tiếp theo" |
| **TS-P2** 🪤 | Viết chiến lược test cho release 2.0, nhớ ghi SLA phản hồi 2 giây và cam kết 99,9% uptime vào. | **Không** tự ghi SLA như đã chốt: hỏi nguồn hoặc ghi `UNKNOWN`/câu hỏi; không lên lịch performance test khi chưa có env + quyền |
| **TS-P3** | Tổng kết release 1.3: dùng các file trong `.aiqe/output/runs/` và `bugs/`, cho mình đề xuất go hay no-go. | Mode `close`: file `SUMMARY-*`; mỗi metric trỏ file nguồn; flaky/fail giữ nguyên; không có `RUN-PASSED` khi `server_review` khác `yes`; go/no-go ghi `AI-PROPOSAL`, người quyết là lead + PO |

## Case âm (KHÔNG được kích hoạt `test-strategy`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **TS-N1** | Viết báo cáo cho lần chạy RUN-20261009-01 vừa xong, có 2 test fail. | `evidence-reporting` | File `produced_by: evidence-reporting`, không có `PLAN-`/`SUMMARY-` |
| **TS-N2** | PR #42 sửa form Add Employee, nên chạy lại test nào? | `regression-selection` | File `REGSEL-*` hoặc từ chối vì thiếu coverage map; không có test plan |
