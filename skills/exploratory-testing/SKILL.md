---
name: exploratory-testing
description: Lập charter, gợi ý ý tưởng test theo heuristic, sắp xếp ghi chép session exploratory có giới hạn thời gian; chuyển mỗi phát hiện thành bug, TC hoặc câu hỏi. Dùng khi "test thăm dò", "exploratory", "charter", "ghi chép session". Không dùng để ghi lại app làm gì → requirement-analysis mode B.
---

# Exploratory Testing

> Chuẩn: `{{KIT}}/rules/evidence_labels.md`, `{{KIT}}/rules/bug_report.md`. Heuristic: `references/heuristics.md`.
> Mẫu: `{{KIT}}/templates/charter.md`, `{{KIT}}/templates/session_note.md`.

## Khi dùng / Không dùng
- **Dùng:** muốn tìm lỗi/rủi ro mà TC viết sẵn dễ bỏ sót; tính năng mới chưa có TC; sau khi requirement-analysis còn nhiều `Not specified`.
- **Không dùng:**
  - Mục tiêu là **ghi lại app đang làm gì** để làm tài liệu → `requirement-analysis` mode B.
  - Đã có TC và chỉ cần chạy → `evidence-reporting` mode `manual-run`.
  - Đã chắc là bug, có evidence → `bug-reporting`.

**Ranh giới với requirement-analysis mode B:**
| | exploratory-testing | requirement-analysis mode B |
|---|---|---|
| Mục tiêu | **Tìm lỗi và rủi ro** | **Ghi lại hành vi** để làm tài liệu |
| Có charter + giới hạn thời gian | Có | Không |
| Output | Session note + danh sách phát hiện (bug / TC / câu hỏi) | Requirement dựng ngược (`HYP-*`) |

## Vai trò của AI (Đợt 1)
AI **không tự khám phá app**. AI viết charter, gợi ý ý tưởng test theo heuristic, và sắp xếp ghi chép do **user** quan sát. Quan sát của user gắn `DOM-OBSERVED` (người quan sát, env, ngày).

## Mode
| Mode | Việc |
|---|---|
| `charter` | Viết 1–3 charter cho một vùng chức năng |
| `session` | Từ ghi chép thô của user, lập session note và phân loại phát hiện |

## Đầu vào
- Mode `charter`: vùng chức năng, rủi ro đã biết, output của `requirement-analysis` (nếu có), thời gian user có.
- Mode `session`: charter đã chạy + **ghi chép thô** của user (thao tác, thấy gì, thời điểm, ảnh). Thiếu env/ngày → hỏi.

## Quy trình (charter)
1. Chọn vùng và rủi ro cần khám phá. Ưu tiên chỗ có nhiều `Not specified` hoặc rủi ro cao.
2. Viết charter dạng: **"Khám phá** <vùng> **với** <tài nguyên/kỹ thuật/data> **để phát hiện** <loại rủi ro>"**.
3. Giới hạn thời gian: 30, 60 hoặc 90 phút.
4. Gợi ý 5–10 ý tưởng test theo heuristic (`references/heuristics.md`: SFDIPOT, tour), mỗi ý tưởng ghi heuristic nguồn.
5. Ghi rõ **ngoài phạm vi** (để session không lan man).

## Quy trình (session)
1. Lập session note theo template: thời gian thật, % thời gian cho thiết lập / test / điều tra bug / vướng mắc.
2. Mỗi phát hiện đi **đúng 1 nhánh**:
   | Nhánh | Khi nào | Chuyển cho |
   |---|---|---|
   | **Bug** | Có evidence **và** expected có nguồn (requirement hoặc kỳ vọng hiển nhiên #1–#4) | `bug-reporting` |
   | **TC** | Hành vi đáng giữ lại để kiểm tra hồi quy, expected đã biết | `test-design-rbt` |
   | **Câu hỏi** | Không biết hành vi nào là đúng | `Q-<MODULE>-NN` cho PO/BA |
   Không phát hiện nào được để ở hai nhánh, không phát hiện nào bị bỏ trống nhánh.
3. Ghi vùng **chưa kịp khám phá** để làm charter tiếp theo.

## Output
- Charter: `<output_dir>/exploratory/SES-<MODULE>-<NN>-charter.md`.
- Session: `<output_dir>/exploratory/SES-<MODULE>-<NN>-session.md`.
- Front-matter: `id: SES-<MODULE>-<NN>`, `source: [...]`, `labels: [DOM-OBSERVED | AI-PROPOSAL]`, `produced_by: exploratory-testing`, `status: draft | done`.
- Session note có dòng tổng: "N phát hiện: B bug · T TC · Q câu hỏi".

## Gate và giới hạn
- Thao tác ghi dữ liệu trong session chỉ trên env thuộc `sandbox_urls`; data đặt tên theo `{{KIT}}/rules/id_conventions.md` để dọn được.
- Payload bảo mật (XSS, SQLi) chỉ trên env được phép, cần G1.
- AI không tự quyết một phát hiện là bug khi expected không có nguồn: đó là câu hỏi.

## Self-check
- [ ] Charter đủ 3 phần (khám phá · với · để phát hiện) và có giới hạn thời gian
- [ ] Ý tưởng test ghi heuristic nguồn
- [ ] Mọi quan sát gắn `DOM-OBSERVED` có người, env, ngày
- [ ] Mỗi phát hiện đúng 1 nhánh; bug có evidence và nguồn expected; câu hỏi có mã `Q-*`
- [ ] Có vùng chưa khám phá cho session sau
- [ ] Có dòng tổng và front-matter `produced_by: exploratory-testing`
