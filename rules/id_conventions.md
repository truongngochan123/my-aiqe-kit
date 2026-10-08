# Rule: Quy ước ID

> Dùng chung cho mọi skill và cho `scripts/trace/build-trace-index.js` (Đợt 3).
> Script quét ID bằng đúng các regex dưới đây, nên **viết sai format là mất traceability**.

`<MODULE>` = mã module chữ in hoa, khai báo trong `module_codes` của `project.aiqe.yml` (ví dụ `LOGIN`, `CUS`, `EMP`).

| Loại | Format | Regex | Ví dụ |
|---|---|---|---|
| Acceptance criteria | `AC-<MODULE>-<NN>` | `\bAC-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b` | `AC-EMP-01` |
| Quy tắc được kể lại (BA/PO/dev nói qua user, chưa có mã AC/ticket) | `PRV-<MODULE>-<NN>` | `\bPRV-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b` | `PRV-PIM-01` |
| Hành vi đã quan sát trên app, chưa có requirement (dựng ngược) | `HYP-<MODULE>-<NN>` | `\bHYP-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b` | `HYP-CUS-03` |
| Test case | `TC-<MODULE>-<NNN>` | `\bTC-[A-Z][A-Z0-9]{1,9}-\d{3}\b` | `TC-LOGIN-001` |
| Bug | `BUG-<MODULE>-<NNN>` | `\bBUG-[A-Z][A-Z0-9]{1,9}-\d{3}\b` | `BUG-CUS-012` |
| Run | `RUN-<YYYYMMDD>-<NN>` | `\bRUN-\d{8}-\d{2}\b` | `RUN-20261008-01` |
| Attempt trong run | `<RUN>-a<N>` | `\bRUN-\d{8}-\d{2}-a\d+\b` | `RUN-20261008-01-a2` |
| Session exploratory | `SES-<MODULE>-<NN>` | `\bSES-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b` | `SES-PIM-01` |
| Câu hỏi làm rõ | `Q-<MODULE>-<NN>` | `\bQ-[A-Z][A-Z0-9]{1,9}-\d{2,3}\b` | `Q-EMP-04` |
| Data test | `<id_prefix>-r<NNN>-<tên>` | `\b[A-Z]{2,6}-r\d{3}-[A-Za-z0-9-]+\b` | `QA-r042-emp01`, `QA-r001-An` |

## Quy tắc
0a. **`HYP-` chỉ dùng cho hành vi ĐÃ QUAN SÁT trên app** (có người, env, ngày: `DOM-OBSERVED`). Hành vi **chưa quan sát** (suy đoán, kinh nghiệm, "chắc là…") → câu hỏi `Q-<MODULE>-NN`, **không** `HYP-`. Yêu cầu có trong tài liệu nhưng không đánh mã → `PRV-` kèm trích dẫn, hỏi user mã thật. Quy tắc do người khác kể lại (BA nói, dev nói) dùng `PRV-`, nhãn `PROVIDED`, kèm câu hỏi xin tên người + ngày hoặc mã ticket. Có mã ticket/AC rồi thì đổi sang mã đó.
0. **Tên người và tên record cũng mang prefix**, không chỉ ID và tên file: First Name `QA-r001-An`, tên phòng ban `QA-r001-Kho`. Trên site dùng chung, đây là cách duy nhất để tìm lại và dọn đúng dữ liệu của mình. Phần sau prefix dùng chữ không dấu (`An`, không `Ân`). Field có format cứng (chỉ số, đúng N ký tự) thì không chèn prefix mà ghi vào data registry.
1. ID **không tái sử dụng**. TC bị bỏ thì đánh dấu `status: deprecated`, không lấy ID đó cho TC mới.
2. Dự án đã có quy ước riêng (ví dụ Jira key `KAN-12`) → khai báo trong yml (`tc_id_format`), và ghi ID của dự án vào cột riêng, giữ ID của kit để truy vết.
3. Mỗi file output có `id` trong front-matter khớp format trên.
4. Liên kết dùng đúng ID, không dùng mô tả: ghi `Source: AC-EMP-01`, không ghi "Source: AC tạo nhân viên".
