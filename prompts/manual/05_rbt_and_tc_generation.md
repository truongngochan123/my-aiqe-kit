# FULL RBT · Bước 5/6: Sinh test case theo rủi ro
<!-- aiqe-stop-in-skill: no -->

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md` trước khi dán.
> Gửi **sau khi** đã duyệt scenario và chốt rủi ro ở bước 4. Nhiều module → yêu cầu AI làm **từng module một**.
> Nguồn gốc: `antigravity-testing-kit-main/plans/manual/05_rbt_and_tc_generation/prompt.txt`. Đã đổi data mẫu (email `@example.com`, không dùng số điện thoại cụ thể), thêm cột Source và oracle mạnh.

---START---

Mức rủi ro tôi đã chốt cho từng module:
[Ví dụ: Tạo khách hàng: High · Danh sách: Medium · Xuất Excel: Low]

Áp dụng **Risk-Based Testing**: module High test kỹ (nhiều case, đủ negative/boundary), Medium vừa phải, Low cơ bản.

## 1. Mỗi test case phải có
| Cột | Yêu cầu |
|---|---|
| TC ID | `TC-<MODULE>-<NNN>`, ví dụ `TC-CUS-001`, không trùng |
| Source | Mã `AC-…` (hoặc `PRV-…`, `HYP-…` của hành vi đã quan sát) mà TC kiểm tra |
| Scenario | Ngắn, rõ mục đích |
| Pre-condition | Tài khoản, quyền, dữ liệu có sẵn |
| Steps | Đánh số `1. 2. 3.` |
| Expected | Đánh số **khớp 1-1** với Steps |
| Test Data | **Cụ thể** (xem mục 3) |
| Priority | P1–P4 **theo Risk**: P1 = luồng chính bắt buộc chạy được hoặc Risk Critical; P2 = High; P3 = Medium; P4 = Low. "Chưa biết expected" **không** phải lý do đặt P1 |
| Risk | Critical / High / Medium / Low |
| Automatable / Auto Type / Tags | Yes·No·Partial / UI·API·Unit·N/A / @Smoke @Regression @CriticalPath @Security @Boundary |

## 2. Oracle phải mạnh
Expected phải kiểm tra **dữ liệu nghiệp vụ**, không dừng ở thông báo:
- ❌ "Hiển thị thông báo thành công"
- ✅ "Tìm theo mã `QA-r001-cus01` thấy đúng 1 dòng; cột Công ty = `QA Công ty 01`"

Thông báo lỗi mà tài liệu không cho nội dung → ghi "hiển thị thông báo lỗi (nội dung: Not specified)", **không** tự đặt câu chữ.

## 2b. Expected chưa biết: tách riêng, không viết thành test case
- **Bảng test case** chỉ gồm TC có expected **đã biết**: từ tài liệu, hoặc từ quan sát của tôi (ghi "hành vi quan sát ngày …, chưa có requirement xác nhận").
- Tình huống **chưa biết expected** → đưa vào **bảng thăm dò riêng**, cột: `Q ID | Scenario cần thăm dò | Cần biết điều gì | Cách quan sát | Risk`. Không viết test case có expected "chưa rõ", "cần xác nhận".
- Quan sát tôi tự làm và kể lại là **quan sát trực tiếp** (ghi người quan sát, môi trường, ngày), không phải "thông tin được cung cấp".
- Không dùng ký hiệu tắt tự đặt (ví dụ `C0`, `E`, `R`); cần phân loại thì viết chữ đầy đủ.

## 3. Test data cụ thể
```
❌ "Nhập email hợp lệ"          ✅ "Nhập email: qa.cus01@example.com"
❌ "Nhập mã hợp lệ"             ✅ "Nhập mã: QA-r001-cus01"
❌ "Nhập SĐT sai định dạng"     ✅ "Nhập SĐT: 09abc12345 (có chữ)"
❌ "Nhập tên quá dài"           ✅ "Nhập tên: chuỗi 256 ký tự 'A' (giới hạn 255)"
```
Không dùng email/tên/SĐT của người thật.

## 4. Độ bao phủ
Happy path · Negative (sai, thiếu, sai định dạng) · Boundary (min-1, min, min+1, max-1, max, max+1) · Edge (timeout, mất mạng, thao tác đồng thời, bấm Lưu 2 lần) · Phân quyền.

## 5. Validation từng field
Liệt kê **mọi field** trước, rồi sinh TC validation **riêng cho từng field** (không gộp). Mỗi field ≥ 1 positive, ≥ 2 negative/boundary. Chỉ dùng quy tắc có trong tài liệu; quy tắc tài liệu không nói → `Not specified` + đưa vào câu hỏi.

<!-- sync: skills/test-design-rbt/references/field_validation_15.md — sửa bảng ở file đó rồi chép sang đây -->
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
<!-- /sync -->

## 6. Kỹ thuật thiết kế
- **Phân lớp tương đương:** mỗi lớp test 1 giá trị đại diện. Ví dụ Tuổi hợp lệ 18–60: test 25, 10, 70.
- **Giá trị biên:** Mật khẩu 6–20 ký tự → test 5, 6, 7, 19, 20, 21.
- **Bảng quyết định:** nhiều điều kiện kết hợp (ví dụ đăng nhập: email đúng/sai × mật khẩu đúng/sai × tài khoản active/bị khóa).
- **Chuyển trạng thái:** test cả chuyển **hợp lệ** và **không hợp lệ** (ví dụ đơn "Hoàn thành" → "Mới tạo" phải bị chặn).

## 7. Case nâng cao (nếu phù hợp)
Bấm Lưu 2 lần · 2 người sửa cùng lúc · hết phiên giữa chừng · mất mạng khi gửi · tiếng Việt có dấu, emoji · điều hướng bằng bàn phím · mã lỗi API (400, 401, 403, 404, 409, 422, 429, 5xx).

---

Bắt đầu với: [tên module]. Sau mỗi module, dừng lại hỏi tôi có làm module tiếp không.
