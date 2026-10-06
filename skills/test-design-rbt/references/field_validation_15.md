# Checklist validation theo 15 loại field

> **Nguồn duy nhất** của bảng này. `prompts/manual/05_rbt_and_tc_generation.md` chứa **bản sao** để dán sang AI khác: sửa ở đây thì chép sang đó.
> Lấy từ `antigravity-testing-kit-main/.agent/skills/rbt_manual_testing/SKILL.md:125-145`, đã bỏ phần bị lặp (`:193-207`), đổi data mẫu sang dữ liệu an toàn.

## Cách dùng
1. Liệt kê **từng field** của form, xác định loại theo bảng dưới.
2. Lấy quy tắc của field **từ requirement** (required, min/max, format, unique). Không có → `Not specified`, đưa vào câu hỏi.
3. Chỉ chọn những dòng validation **áp dụng được** cho field đó. Không sinh TC cho quy tắc requirement không nói, trừ nhóm bảo mật (XSS, SQLi) luôn nên có cho field text.
4. Mỗi field: ≥ 1 positive, ≥ 2 negative/boundary, **mỗi field TC riêng**.

## Bảng
| Loại field | Validation cần cân nhắc |
|---|---|
| **Text** (tên, địa chỉ) | Required · min/max length (BVA) · chỉ khoảng trắng · khoảng trắng đầu/cuối · ký tự đặc biệt `<>&"'` · XSS `<script>alert(1)</script>` `@Security` · SQLi `' OR 1=1--` `@Security` · Unicode tiếng Việt có dấu · emoji |
| **Email** | Đúng format `qa.user01@example.com` · thiếu `@` · thiếu domain (`qa.user01@`) · domain sai (`qa@example`) · nhiều `@` · ký tự đặc biệt trước `@` · max length · hoa/thường · trùng (nếu unique) |
| **Phone** | Chỉ số · prefix (`+84`, `0`) · min/max độ dài · chữ xen lẫn (`09abc12345`) · dấu `-` `.` khoảng trắng · mã vùng sai. Env test phải tắt SMS (`sms_gateway_disabled`) |
| **Date / DateTime** | Đúng format · ngày không tồn tại (`31/02/2026`) · năm nhuận (`29/02/2024`) · quá khứ / tương lai · min/max · múi giờ |
| **Number / Currency** | Min/max (BVA) · số âm · 0 · thập phân · ký tự không phải số · tràn số · số 0 ở đầu · định dạng tiền tệ |
| **Dropdown / Select** | Giá trị mặc định · mọi option hợp lệ · option bị disable · required (chưa chọn) |
| **Checkbox / Radio** | Trạng thái mặc định · check/uncheck · required · nhóm radio chỉ chọn 1 |
| **File upload** | Loại file hợp lệ/không hợp lệ · max size (BVA) · file 0 KB · tên file ký tự đặc biệt · nhiều file · kéo thả vs nút chọn |
| **Password** | Min/max · ký tự đặc biệt · hoa/thường · số · chặn copy-paste? · hiện/ẩn · confirm khớp/không khớp |
| **Textarea** | Max length · xuống dòng · thẻ HTML · ô đếm ký tự (nếu có) |
| **OTP / MFA** | Tự nhảy ô · dán cả chuỗi · hết hạn · nhập sai quá số lần (khóa) · giới hạn gửi lại |
| **Date range / Time picker** | Ngày kết thúc < ngày bắt đầu · trùng khung giờ · khoảng tối đa (ví dụ 30 ngày) · giới hạn quá khứ/tương lai |
| **Rich text (WYSIWYG)** | Lọc thẻ nguy hiểm (`<script>`, `<iframe>`) `@Security` · dán văn bản kèm định dạng/ảnh · đếm ký tự theo text thô hay HTML |
| **Multi-select / Tag** | Giới hạn số tag · tag trùng · xóa bằng Backspace/nút X · ký tự đặc biệt trong tag |
| **Slider / Stepper** | Min/max · bước nhảy sai · nhập tay vs kéo |

## Ví dụ (form Đăng ký: Họ tên, Email, SĐT, Mật khẩu)
Quy tắc giả định cho ví dụ: Họ tên text 1–100 required; Email required, unique; SĐT 10 số bắt đầu bằng 0; Mật khẩu 8–20, có chữ hoa và số.

| Field | TC | Data | Expected |
|---|---|---|---|
| Họ tên | Để trống | `""` | Báo lỗi required |
| Họ tên | Biên trên | 100 ký tự `A` | Hợp lệ |
| Họ tên | Vượt biên trên | 101 ký tự `A` | Báo lỗi vượt max |
| Họ tên | XSS `@Security` | `<script>alert(1)</script>` | Lưu dạng text, **không** thực thi script |
| Email | Đúng | `qa.user01@example.com` | Hợp lệ |
| Email | Thiếu `@` | `qa.user01example.com` | Báo lỗi format |
| Email | Trùng | email đã tạo ở TC trước | Báo lỗi trùng |
| SĐT | Thiếu số 0 đầu | 9 chữ số, không có 0 đầu | Báo lỗi |
| SĐT | Có chữ | `09abc12345` | Báo lỗi chỉ nhận số |
| Mật khẩu | Biên dưới | `Abcdef12` (8) | Hợp lệ |
| Mật khẩu | Dưới biên | `Abcde12` (7) | Báo lỗi min |
| Mật khẩu | Thiếu chữ hoa | `abcdef12` | Báo lỗi |
