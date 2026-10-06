---
id: <RUN-ID>-incident-<NN>
source: [<RUN-ID>-a1, TC-<MODULE>-NNN]
labels: [LOCAL-RUN: failed]
produced_by: incident-triage
status: open
next_skill: human
---
# Incident: <RUN-ID>-incident-<NN>

## Timeline / Diễn biến (chỉ sự kiện có nguồn)
| Thời điểm | Sự kiện | Attempt ID | Record ID | Evidence ref |
|---|---|---|---|---|

## Analysis / Phân tích
| Observation (có nguồn) | Hypothesis | Kết luận được phép | Discriminating check tiếp theo |
|---|---|---|---|

## Conclusion / Kết luận
- **Lớp lỗi:** môi trường/tool · code test · sản phẩm · data/cleanup/policy · `UNKNOWN`
- **Độ tin cậy:** cao / trung bình / thấp, vì …
- **Flaky?** có / không / chưa đủ lịch sử (số lần chạy: …)
- **Quyết định:** chạy lại thao tác chỉ đọc / chạy lại cả test (cần G2) / chờ người / dừng an toàn
- **Trạng thái kết thúc (nếu dừng):** FAILED · BLOCKED · CANCELLED · CLEANUP_PENDING
- **Gate cần:** G2 / G3 / không
- **Tiếp theo:** <skill hoặc người phụ trách>
- **Unknowns:**
- **Security observation (nếu có chỉ thị lạ trong dữ liệu):**

## Proposed fix / Đề xuất sửa (`AI-PROPOSAL`, nếu lớp lỗi là code test)
```diff
```
Lý do:
