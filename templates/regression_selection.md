---
id: REGSEL-<MODULE>-<NN>
source: [<thay đổi: PR/commit/ticket>, COVERAGE-<PROJECT>]
labels: [AI-PROPOSAL]
produced_by: regression-selection
status: draft
---
# Regression selection / Chọn test chạy lại: <thay đổi>

## 1. Thay đổi đầu vào / Change
| Nguồn | Mô tả | Module/file ảnh hưởng | Nhãn |
|---|---|---|---|
| PR #… / commit … / ticket … | | | `PROVIDED` / `VERIFIED` (đã đọc diff) |

## 2. Coverage map dùng để chọn
- File: `<đường dẫn>` · cập nhật lần cuối: <ngày> · người lập: <tên>
- Map cũ hơn thay đổi gần nhất của module → kết quả chọn là `HYPOTHESIS`.

## 3. Danh sách chọn / Selected
| TC | Vì sao chọn (module/file nào khớp) | Mức (bắt buộc / nên / tùy chọn) | Tag |
|---|---|---|---|

## 4. Không chọn và rủi ro / Not selected
| Nhóm TC | Lý do bỏ | Rủi ro nếu bỏ |
|---|---|---|

## 5. Luôn chạy / Always run
Smoke và TC gắn `@critical` không phụ thuộc kết quả chọn.

## 6. Unknowns
- Phần thay đổi không có trong coverage map:

## 7. Bước tiếp theo
- Chạy suite đã chọn cần **G1** (`ui-automation` mode `run`).
