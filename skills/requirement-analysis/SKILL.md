---
name: requirement-analysis
description: Soát requirement có sẵn tìm chỗ mơ hồ, Not specified, rủi ro, lập câu hỏi (mode A); hoặc dựng ngược requirement từ screenshot/HTML/mô tả app khi không có tài liệu (mode B). Dùng trước khi viết TC. Không dùng để viết TC → test-design-rbt; tìm lỗi theo charter → exploratory-testing.
---

# Requirement Analysis

> Chuẩn: `{{KIT}}/rules/evidence_labels.md`, `{{KIT}}/rules/id_conventions.md`.
> Nguồn gốc: `requirement-analysis` của bộ mới (mode A) + `requirements_analyzer` của bộ gốc (mode B, đã bỏ phần "viết requirement như sự thật").

## Khi dùng / Không dùng
- **Dùng:** nhận requirement/user story/AC và muốn biết chỗ thiếu trước khi viết TC; sản phẩm **không có tài liệu** và cần ghi lại app đang làm gì.
- **Không dùng:**
  - Viết test case → `test-design-rbt` (đọc output của skill này).
  - Có charter, mục tiêu là **tìm lỗi** trong khoảng thời gian giới hạn → `exploratory-testing`.
  - Ticket Jira cần lấy về → người dùng tự lấy (AI không giữ token), rồi đưa file cho skill này.

## Mode
| Mode | Khi nào | Nhãn chính |
|---|---|---|
| `A` soát requirement (mặc định khi có tài liệu) | Có requirement/AC | `REQ-CONFIRMED` cho điều tài liệu nói; `Not specified` cho điều tài liệu không nói |
| `B` dựng ngược (mặc định khi **không** có tài liệu) | Chỉ có app đang chạy | `DOM-OBSERVED` (quan sát của user) hoặc `HYPOTHESIS` (AI suy ra). **Không bao giờ** `REQ-CONFIRMED` |

## Đầu vào
- Mode A: file requirement/AC (md, txt). PDF/Word/Figma → nhờ user chuyển sang text hoặc ảnh trước.
- Mode B: screenshot, đoạn HTML, hoặc **mô tả quan sát của user** kèm env + ngày. Thiếu ngày/env → hỏi; không có thì ghi `UNKNOWN`.
- `project.aiqe.yml`: `module_codes`, `output_language`.
- Không tự mở web. Xem DOM trực tiếp qua MCP là việc của Đợt 2 (`ui-automation`).

## Quy trình (mode A)
1. **Trích từng rule** thành bảng `Source ID | Rule | Actor | Điều kiện | Kết quả mong đợi | Nhãn` (`REQ-CONFIRMED`, trích dẫn `file:line`).
2. **Liệt kê điều tài liệu KHÔNG nói**: field label, validation, độ dài, thông báo lỗi, quyền, trùng lặp, timeout, cleanup. Mỗi mục ghi `Not specified`.
3. **Tách giả định khỏi requirement**: điều suy ra từ kinh nghiệm hay quan sát gắn `HYPOTHESIS`/`DOM-OBSERVED`, không trộn vào bảng rule.
4. **Câu hỏi** ưu tiên theo rủi ro: `Q ID | Câu hỏi | Vì sao quan trọng | Ảnh hưởng nếu đoán sai | Giả định tạm (AI-PROPOSAL)`.
5. **Rủi ro sơ bộ** từng rule: Probability × Impact → Critical/High/Medium/Low (`AI-PROPOSAL`).
6. **Traceability khung**: `AC → scenario → (TC sẽ viết)`.

## Quy trình (mode B)
1. **Cảnh báo ngay đầu output:** *"Requirement dựng ngược mô tả hành vi **hiện tại** của app. Hành vi hiện tại có thể **chứa bug**. Đây không phải requirement đã xác nhận."*
2. Ghi lại theo `references/reverse_spec_format.md`: trang/màn hình → field → hành động → thông báo → luồng.
3. Mỗi hành vi một dòng, mã `HYP-<MODULE>-NN`, với 3 cột bắt buộc:
   - **Quan sát:** nguồn + nhãn (`DOM-OBSERVED`, người quan sát, env, ngày).
   - **Đáng ngờ?:** AI **gợi ý** hành vi nào có thể là bug hoặc chưa hợp lý, kèm lý do (`AI-PROPOSAL`). Ví dụ: khớp "kỳ vọng hiển nhiên" trong `{{KIT}}/rules/bug_report.md` mục 1b.
   - **Quyết định:** **để trống** cho người điền (`Chấp nhận là requirement` / `Hỏi PO` / `Nghi bug`). AI không tự điền.
4. Điều chưa quan sát (độ dài tối đa, quyền, trùng lặp…) → `Not specified` + câu hỏi `Q-<MODULE>-NN`.
5. Câu hỏi và rủi ro như mode A bước 4–5.

## Output
- File `<output_dir>/analysis/ANALYSIS-<MODULE>.md`, front-matter:
  ```yaml
  id: ANALYSIS-<MODULE>
  source: [<file requirement> | DOM-OBSERVED]
  labels: [REQ-CONFIRMED | DOM-OBSERVED, AI-PROPOSAL]
  produced_by: requirement-analysis
  status: draft
  mode: A | B
  ```
- Mode A: 6 mục theo đúng thứ tự quy trình. Mode B: cảnh báo + bảng dựng ngược + `Not specified` + câu hỏi + rủi ro.
- Đầu file một dòng tổng: "N rule/hành vi · K câu hỏi · M điểm Not specified".

## Gate và giới hạn
- Không gắn `REQ-CONFIRMED` cho bất cứ điều gì không có trong tài liệu hoặc chưa được PO/BA xác nhận (📝; `check-tc.js` và người duyệt bắt ở bước sau).
- Mode B: cột **Quyết định** do người điền. Chưa có quyết định → `test-design-rbt` dùng `HYP-*` làm Source và ghi expected là hành vi quan sát, chưa xác nhận.
- Không bịa field label, message, độ dài. Không chắc → `UNKNOWN`/`Not specified`.

## Self-check
- [ ] Mọi rule mode A có trích dẫn `file:line` và nhãn `REQ-CONFIRMED`
- [ ] Mode B có cảnh báo ở đầu; không có `REQ-CONFIRMED`; mọi dòng có Quan sát (người, env, ngày)
- [ ] Cột Đáng ngờ? có lý do; cột Quyết định để trống
- [ ] Danh sách `Not specified` không rỗng (requirement thật hầu như luôn có khoảng trống)
- [ ] Câu hỏi có mã `Q-<MODULE>-NN`, sắp theo rủi ro
- [ ] Có dòng tổng và front-matter `produced_by: requirement-analysis`
