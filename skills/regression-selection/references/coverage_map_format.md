# Format coverage map

> File: `<output_dir>/decisions/COVERAGE-<PROJECT>.md`. Một dự án một file. **QA lập và duyệt**; AI chỉ dựng bản nháp (mode `map`), mọi dòng nháp là `HYPOTHESIS`.

```markdown
---
id: COVERAGE-<PROJECT>
produced_by: regression-selection
status: draft | ready
updated_at: 2026-10-09
owner: <tên QA>
---
# Coverage map: <dự án>

| Phần bị đổi (module / file / endpoint / config) | Kiểu | TC | Mức | Nhãn | Ghi chú |
|---|---|---|---|---|---|
| PIM > Add Employee | module | TC-PIM-001…TC-PIM-012 | trực tiếp | QA-ACCEPTED | |
| `src/pim/employee/*` | file | TC-PIM-001…TC-PIM-012 | trực tiếp | HYPOTHESIS | AI suy từ tên thư mục |
| `POST /api/v2/pim/employees` | endpoint | TC-PIM-001, TC-API-PIM-003 | trực tiếp | QA-ACCEPTED | |
| Bảng `hs_hr_employee` | dữ liệu | TC-PIM-*, TC-LEAVE-004 | gián tiếp | HYPOTHESIS | Leave đọc tên nhân viên |
```

## Quy tắc
- **Kiểu:** `module` · `file` (glob) · `endpoint` · `config` · `dữ liệu`.
- **Mức:** `trực tiếp` (TC thao tác đúng phần này) · `gián tiếp` (TC dùng kết quả của phần này).
- TC viết đúng ID (`rules/id_conventions.md`); khoảng `TC-PIM-001…TC-PIM-012` được phép.
- Cập nhật `updated_at` mỗi lần sửa. Map cũ hơn thay đổi gần nhất của module → kết quả chọn là `HYPOTHESIS`.
- Dòng `HYPOTHESIS` vẫn dùng được để chọn, nhưng kết quả chọn kế thừa nhãn `HYPOTHESIS`.

## Ai lập lần đầu (Q7)
QA phụ trách module lập lần đầu, có thể từ bản nháp AI (mode `map`). Lead duyệt `status: ready`. Đây là đề xuất của kit; dự án có quy trình riêng thì theo dự án.
