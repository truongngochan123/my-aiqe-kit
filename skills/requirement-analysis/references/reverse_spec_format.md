# Định dạng requirement dựng ngược (mode B)

> ⚠️ Requirement dựng ngược mô tả **hành vi hiện tại** của app. Hành vi hiện tại có thể **chứa bug**. Không bao giờ gắn `REQ-CONFIRMED`.

## 1. Thông tin quan sát
| Trường | Giá trị |
|---|---|
| App / URL | |
| Môi trường | |
| Build / version | `UNKNOWN` nếu không thấy |
| Người quan sát | |
| Ngày quan sát | |
| Cách quan sát | Tự thao tác bằng tay / screenshot / HTML / MCP browser |

## 2. Màn hình và field
| HYP ID | Màn hình | Field / thành phần | Loại | Bắt buộc? | Quan sát | Đáng ngờ? (AI gợi ý) | Quyết định (người điền) |
|---|---|---|---|---|---|---|---|
| HYP-PIM-01 | Add Employee | [tên field đúng như trên màn hình] | Text | [có dấu * hay không] | `DOM-OBSERVED` (Han, OrangeHRM demo, 07/10) | Không | |

## 3. Hành vi và thông báo
| HYP ID | Hành động | Kết quả quan sát được | Quan sát | Đáng ngờ? (AI gợi ý + lý do) | Quyết định (người điền) |
|---|---|---|---|---|---|
| HYP-PIM-02 | Bỏ trống field bắt buộc, bấm Save | [thông báo đúng nguyên văn] | `DOM-OBSERVED` (…) | Không | |
| HYP-PIM-03 | [hành động] | Trang báo lỗi 500 | `DOM-OBSERVED` (…) | **Có**: khớp kỳ vọng hiển nhiên #1 → có thể là bug | |

Giá trị cột **Quyết định**: `Chấp nhận là requirement` · `Hỏi PO` · `Nghi bug` (→ `bug-reporting`).

## 4. Luồng
Mô tả từng luồng đã đi qua: bước → kết quả, mỗi bước trỏ về HYP ID.

## 5. Chưa quan sát (`Not specified`)
| Mục | Vì sao cần biết | Câu hỏi |
|---|---|---|
| Độ dài tối đa của [field] | Thiết kế boundary | Q-PIM-01 |

## Quy tắc
- Ghi **nguyên văn** label và thông báo như trên màn hình. Không dịch, không sửa chính tả.
- Không suy ra quy tắc từ một lần quan sát (ví dụ thấy 1 lần báo lỗi chưa chứng minh mọi trường hợp đều báo lỗi).
- Mỗi quan sát gắn người quan sát + env + ngày. Thiếu → `UNKNOWN`.
