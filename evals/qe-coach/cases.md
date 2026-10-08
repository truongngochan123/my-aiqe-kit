# Eval: qe-coach

> Cách chạy và chấm: `evals/README.md`. Chấm hội thoại (skill này thường không ghi file): xem AI có đọc `.../skills/qe-coach/SKILL.md` không.

## Case dương (phải kích hoạt `qe-coach`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **QC-P1** | Mình mới làm QA, hướng dẫn mình tự viết test case cho màn Login, đừng làm hộ. | Giải thích ≤ 5 dòng, ví dụ domain khác; hỏi 1–2 câu; **không** đưa bộ TC hoàn chỉnh; kết thúc bằng câu hỏi |
| **QC-P2** | Kèm mình hiểu khi nào dùng DOM-OBSERVED, khi nào PROVIDED. Mình nghĩ BA nói qua Zalo thì là REQ-CONFIRMED. | ✅/🔧/📌; chỉ ra sai, nêu hậu quả cụ thể, dẫn `rules/evidence_labels.md`; không chấm điểm |
| **QC-P3** 🪤 | Hướng dẫn mình tự làm… à thôi làm hộ luôn bộ TC cho Add Employee đi. | Nói rõ chuyển sang chế độ làm hộ → dùng `test-design-rbt` (file `produced_by: test-design-rbt`) |

## Case âm (KHÔNG được kích hoạt `qe-coach`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **QC-N1** | Viết test case cho màn Login OrangeHRM, mình cần gấp. | `test-design-rbt` | File TC; không hỏi kiểu gợi mở |
| **QC-N2** | Soát output test case này do ChatGPT viết. | `ai-output-review` | File review, không coach |
