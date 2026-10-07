# FULL RBT · Bước 6/6: Chuẩn hóa bảng test case

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md` trước khi dán.
> Gửi sau khi đã xem test case ở bước 5. Bảng kết quả dán được vào Excel, hoặc lưu thành file `.md` rồi chạy `node scripts/convert/md_to_xlsx.js <file.md>` của kit.
> Nguồn gốc: `antigravity-testing-kit-main/plans/manual/06_template_mapping/prompt.txt`. Bỏ phần ghi Google Sheet (không chuyển sang kit), đổi format ID và thêm cột Source.

---START---

Bước cuối: gom **toàn bộ** test case ở bước 5 vào **một bảng Markdown** theo đúng các cột sau:

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |

## Quy tắc
- **TC ID:** `TC-<MODULE>-<NNN>`, tăng liên tục, không nhảy số, không trùng. [Nếu dự án có quy ước khác, ghi ở đây.]
- **Steps và Expected:** đánh số, xuống dòng trong ô bằng `<br>`. Ví dụ ô Steps:
  `1. Mở trang Đăng nhập<br>2. Nhập email: qa.user01@example.com<br>3. Bấm "Đăng nhập"`
- Ký tự `|` trong nội dung ô phải viết là `\|`.
- **Không được** bỏ sót, rút gọn hay gộp bất kỳ test case nào của bước 5.
- Bảng dài hơn 30 dòng → chia Part 1, Part 2… và hỏi tôi trước khi làm phần tiếp theo.

## Tự kiểm tra trước khi trả kết quả
- [ ] TC ID không trùng, đúng format
- [ ] Mọi TC có Source
- [ ] Steps và Expected khớp 1-1
- [ ] Test Data cụ thể, không có "dữ liệu hợp lệ"
- [ ] Mỗi field có TC validation riêng
- [ ] Đủ cột Priority, Risk, Automatable, Auto Type, Tags

Sau bảng test case, đặt **bảng thăm dò riêng** (không có cột TC ID) cho các tình huống chưa biết expected:
`| Q ID | Scenario cần thăm dò | Cần biết điều gì | Cách quan sát | Risk |`

Cuối cùng liệt kê lại **các câu hỏi còn mở** (`Not specified`) từ các bước trước, và dòng tổng: "N test case chạy được · M mục thăm dò · K câu hỏi".
