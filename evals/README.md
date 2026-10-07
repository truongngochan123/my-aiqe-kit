# Eval: kiểm tra chính kit

Eval trả lời 2 câu hỏi:
1. **Routing:** gõ một yêu cầu thì AI có chọn **đúng skill** không?
2. **Chất lượng:** output có đúng luật của kit không (nhãn, nguồn, format, không bịa)?

## Có gì
| Thư mục / file | Nội dung |
|---|---|
| `<skill>/cases.md` | Mỗi skill: ≥ 3 case **dương** (phải chọn skill này) và ≥ 2 case **âm** (dễ nhầm, phải chọn skill khác). Có cột "Đúng khi" để chấm |
| `hooks/test-hooks.md` | Case cho 2 hook (chạy bằng `--self-test`) |
| `golden/bug-reporting.task.md` | Đề bài golden (Claude viết). Đáp án `golden/bug-reporting.md` do Codex viết, Han duyệt |
| `../scripts/evals/grade.js` | Chấm output: đọc `produced_by`, chạy `check-tc`/`check-bug` |
| `../scripts/evals/prepare-isolated.ps1` | Tạo thư mục eval sạch, không chứa đáp án |

## Cách chạy một case
1. **Cài kit mới nhất** (sau mỗi lần kit đổi): `node scripts\install\install.js --tool codex` → **khởi động lại VS Code** → **chat mới**. Thiếu một bước là tool dùng skill cũ (bài học pilot 07/10).
2. Tạo thư mục sạch: `.\scripts\evals\prepare-isolated.ps1 -Name <mã case> -Url <url> -Modules <MODULE>`.
3. Mở thư mục đó trong VS Code, mở **chat mới**, dán prompt của case. Ô `[...]` điền bằng quan sát thật của bạn.
4. Chấm:
   ```
   node scripts\evals\grade.js <thư mục eval>\output --expect <skill mong đợi>
   ```
   Rồi đọc checklist "Đúng khi" của case và tự đánh dấu.
5. Ghi kết quả vào bảng (mục cuối file này).

**Case mà skill dừng sớm, không ghi file** (ví dụ mode `full` dừng ở bước 2): xem trong khung chat tool có đọc `.../skills/<tên>/SKILL.md` không; nếu không thấy thì hỏi "Bạn vừa làm theo file SKILL.md nào?". Cách này là AI tự khai, độ tin cậy thấp hơn `produced_by`.

## Chạy không tương tác (tùy chọn)
- Codex: `codex exec "<prompt>"` trong thư mục eval. Theo tài liệu bên thứ ba, log `--json` **không** có loại sự kiện "skill", nên vẫn chấm bằng `produced_by` (`docs/tool_support.md`).
- Claude Code: `claude -p "<prompt>"` trong thư mục eval.
- Mỗi prompt nên chạy **3 lần**: AI không cho kết quả giống hệt nhau giữa các lần.

## Ngưỡng đạt
| Đợt | Routing | Chất lượng |
|---|---|---|
| Đợt 1 | Case dương và âm của 8 skill: 100% đúng skill trên Codex | `check-tc`/`check-bug` ĐẠT; checklist "Đúng khi" đạt |
| Đợt 3 | ≥ 90% trên toàn bộ ~55 prompt, mỗi prompt 3 lần | như trên |

## Giới hạn
- `produced_by` do AI tự ghi. Nó cho biết AI **nói** đã dùng skill nào, không chứng minh tuyệt đối.
- **Golden do AI viết** (Codex viết đáp án, Han duyệt) yếu hơn golden do người viết: model làm bài và model viết đáp án có thể sai giống nhau. Kết quả eval có golden chỉ nên coi là tín hiệu.
- Thư mục eval tạm chỉ là cách ly **chống sai sót**: AI vẫn đọc được file ở chỗ khác bằng đường dẫn tuyệt đối.

## Bảng kết quả (điền tay)
| Ngày | Tool | Case | Lần | Skill được chọn | Routing | grade.js (dòng cuối) | Checklist | Ghi chú |
|---|---|---|---|---|---|---|---|---|
