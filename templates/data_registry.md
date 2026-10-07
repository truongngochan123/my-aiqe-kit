---
id: DATA-<MODULE>-<run>
source: [TC-<MODULE>-NNN]
labels: [AI-PROPOSAL]
produced_by: test-data
status: draft
---
# Data registry: <Module> · <Run ID>

**Tổng:** <N> bộ data · <M> field tham chiếu · <K> mục cần dọn

<!-- Cột theo skills/test-data/references/data_registry_format.md. Email dùng @example.com. -->

| Data ID | Run ID | Màn hình / bảng | Field: giá trị | Dùng cho TC | Tham chiếu từ | Dùng chung? | Cleanup owner | Cách dọn | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| QA-r001-emp01 | r001 | PIM > Add Employee | First Name: QA-r001-emp01 | TC-PIM-001 | — | Không | teardown của test | UI | Chưa tạo |

## Ghi chú / Notes
- Số điện thoại: <chỉ dùng khi sms_gateway_disabled: yes>
- Field tính toán không có nguồn công thức: `UNKNOWN`

<!-- Mode combinatorial / chain: thêm khối JSON cho automation
```json
{ "combination_id": "c01", "dimensions": {}, "module_data": {}, "expected_output": {} }
```
-->
