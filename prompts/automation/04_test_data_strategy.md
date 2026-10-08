# Automation · Bước 4/6: Chiến lược dữ liệu test

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md`.
> Nguồn: `antigravity-testing-kit-main/plans/automation/04_test_data_strategy/prompt.txt`. Đổi: bản gốc dùng email domain có thật và số điện thoại ngẫu nhiên; nay dùng domain test `@example.com`, số điện thoại chỉ khi env đã tắt SMS.

---START---

Thiết kế **chiến lược dữ liệu test** để test không flaky và dọn được dữ liệu.

## 1. Truy vết
Mọi dữ liệu tạo ra mang **prefix của lần chạy**, kể cả tên người và tên record (để tìm và dọn trên môi trường dùng chung):
```
ID / mã:    QA-r001-emp01
Tên người:  First Name = QA-r001-An, Last Name = Test
Email:      qa.r001.an@example.com      (domain test, không gửi tới ai)
```
Số điện thoại: chỉ dùng khi môi trường test đã **tắt gửi SMS**; nếu không, ghi chú cảnh báo.
Field có format cứng (đúng N chữ số…): không chèn prefix, ghi vào sổ data (registry) để truy vết.

## 2. Bộ sinh dữ liệu
Một helper sinh từng loại dữ liệu (faker locale `vi` cho tên/địa chỉ **giả**), nhận prefix của lần chạy làm tham số.

## 3. Theo loại test
| Loại | Dữ liệu |
|---|---|
| Happy path | Hợp lệ, cụ thể |
| Negative | Sai định dạng, thiếu field, rỗng |
| Boundary | Đúng giá trị biên theo tài liệu (min, min+1, max, max+1). Tài liệu không cho giới hạn → hỏi, không đoán |

## 4. Dọn dữ liệu
- Mỗi test tạo dữ liệu có bước dọn đúng record của nó (`afterEach` hoặc fixture), lọc theo prefix.
- Dọn lỗi thì test không được coi là pass.

## 5. Luật
- Không hardcode dữ liệu cho field unique; không dùng chung dữ liệu giữa các test.
- Chạy song song không đụng nhau.
- Không dùng thông tin cá nhân thật.

Trình bày helper và cách dùng trong test để tôi xem trước khi sang bước 5.
