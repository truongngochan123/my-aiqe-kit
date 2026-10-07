# Golden task: bug-reporting (đề bài)

> **Người viết đề:** Claude (07/10/2026). **Người viết đáp án:** Codex (khác model với bên dựng skill). **Người duyệt:** Han.
> Đáp án ghi vào `evals/golden/bug-reporting.md` theo mục "Định dạng đáp án" bên dưới.
> **Khi chạy eval**, file đáp án phải nằm ngoài thư mục eval (`scripts/evals/prepare-isolated.ps1` kiểm tra).

## Hướng dẫn cho người viết đáp án (Codex)
- Đọc luật: `rules/bug_report.md` (7 điều kiện, mục 1b kỳ vọng hiển nhiên), `rules/evidence_labels.md`.
- Với **mỗi tình huống**, xác định output đúng là: **bug** (`BUG-…`), **bản nháp** (`status: draft` + `Insufficient evidence`), hay **câu hỏi** (`Q-…`). Ghi lý do theo đúng điều kiện nào.
- Không viết đáp án bằng cách chạy skill `bug-reporting`; tự suy luận từ luật. Mục đích là có một mốc độc lập để chấm skill.

## Bối cảnh (app giả định, dữ liệu synthetic)
App **QA Leave** quản lý đơn nghỉ phép. Môi trường `http://localhost:3000` (sandbox). Build `1.2.0`. Người test: Han.

Requirement (trích, đã được PO xác nhận):
- `AC-LEAVE-01`: Nhân viên gửi đơn nghỉ phép gồm ngày bắt đầu, ngày kết thúc, lý do. Ngày kết thúc **không được trước** ngày bắt đầu; nếu sai hiện thông báo "End date must be after start date".
- `AC-LEAVE-02`: Quản lý duyệt hoặc từ chối đơn. Đơn đã duyệt bị **trừ** vào số ngày phép còn lại của nhân viên.
- `AC-LEAVE-03`: Số ngày phép còn lại hiển thị ở trang "My Leave".
- `AC-LEAVE-04`: Lý do nghỉ tối đa 200 ký tự.

## Tình huống

| # | Tester kể lại | Evidence tester đưa |
|---|---|---|
| **G1** | Ngày 07/10, nhân viên `QA-r001-emp01` (còn 10 ngày phép) gửi đơn 2 ngày, quản lý duyệt. Trang "My Leave" vẫn hiện còn **10** ngày. Thử lại 3/3 lần với 3 nhân viên test khác nhau, đều không bị trừ. | Screenshot `evidence/leave-balance-before.png`, `evidence/leave-balance-after.png`; log `evidence/approve.log` (đã redact) |
| **G2** 🪤 | Ngày 07/10, nhập ngày kết thúc **trước** ngày bắt đầu, bấm Gửi thì đơn vẫn được tạo, không thấy thông báo lỗi. "Mình nhớ là vậy, lúc đó không chụp ảnh, giờ env đang bảo trì nên chưa thử lại được." | **Không có** |
| **G3** 🪤 | Ngày 07/10, một nhân viên gửi **2 đơn trùng ngày** (cùng 08/10–09/10), hệ thống nhận cả 2 đơn. "Log bug là hệ thống cho gửi đơn trùng ngày." | Screenshot `evidence/duplicate-leave.png` |
| **G4** | Ngày 07/10, gửi đơn với lý do dài **201** ký tự (`QA-r004-` + chữ `A` cho đủ 201 ký tự) thì trang trắng, console báo `500 Internal Server Error`. Thử 2/2 lần. | Screenshot `evidence/reason-201.png`, HAR đã redact `evidence/reason-201.redacted.har` |
| **G5** 🪤 | Ngày 07/10, số ngày phép ở "My Leave" hiển thị dạng `10.0` thay vì `10`. "Nhìn xấu quá, log bug mức nghiêm trọng giúp mình." | Screenshot `evidence/balance-format.png` |

## Định dạng đáp án (`evals/golden/bug-reporting.md`)
```markdown
---
id: GOLDEN-bug-reporting
DRAFT-BY: Codex
REVIEWED-BY:            # Han điền tên sau khi duyệt
date: <ngày viết>
---
| # | Output đúng (bug / bản nháp / câu hỏi) | Nguồn expected (AC / kỳ vọng hiển nhiên #n / không có) | Điều kiện quyết định | Severity hợp lý (nếu là bug) | Điểm bắt buộc phải có trong output của skill |
|---|---|---|---|---|---|
| G1 | | | | | |
...
## Giải thích từng tình huống
```

## Gợi ý chấm (cho Han khi duyệt đáp án)
Đáp án tốt phải xử lý đúng 3 bẫy:
- Một tình huống **có requirement nhưng thiếu evidence** → không được thành bug ready.
- Một tình huống **requirement không nói** và **không thuộc** 4 kỳ vọng hiển nhiên → câu hỏi, không phải bug.
- Một tình huống tester **yêu cầu severity cao** cho vấn đề hiển thị → severity do tester đánh giá nhưng phải hợp lý theo định nghĩa S1–S4; tiêu đề không được có nhận định; và có cần bug hay câu hỏi tùy nguồn expected.
