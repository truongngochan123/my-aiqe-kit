# Định dạng data registry

> Sổ ghi lại **mọi dữ liệu test được tạo**, để biết data nào của run nào, ai dọn, đã dọn chưa.
> Bắt buộc khi field có format cứng (không chèn được prefix), và khi data dùng chung giữa nhiều test.

## Khi nào dùng prefix, khi nào dùng registry
| Trường hợp | Cách truy vết | Ví dụ |
|---|---|---|
| Field text tự do (tên, mô tả, mã tự do) | **Prefix** trong giá trị | First Name = `QA-r001-emp01` |
| Field format cứng (đúng N chữ số, CCCD, mã bưu chính) | **Registry**: giá trị hợp lệ + ghi lại | Employee Id = `90100001` → ghi registry |
| Field có giá trị bị hệ thống tự sinh (ID tự tăng) | **Registry**: ghi ID hệ thống trả về sau khi tạo | Record ID = `UNKNOWN` cho tới khi tạo xong |
| Data dùng chung nhiều test (tài khoản, phòng ban gốc) | **Registry** + đánh dấu "dùng chung, không xóa riêng" | Phòng ban `QA-shared-dept01` |

## Cột bắt buộc
| Cột | Ý nghĩa |
|---|---|
| Data ID | ID truy vết (`QA-r001-emp01`) |
| Run ID | Lần chạy tạo ra data (`RUN-20261007-01`), chưa chạy thì `r001` |
| Màn hình / bảng | Nơi data được tạo |
| Field: giá trị | Các field quan trọng và giá trị |
| Dùng cho TC | `TC-…` |
| Tham chiếu từ | Data ID của module trước (mode chain), hoặc `—` |
| Dùng chung? | Có / Không |
| Cleanup owner | Ai dọn (tên người, hoặc "teardown của test") |
| Cách dọn | UI / API / script / `UNKNOWN` |
| Trạng thái | Chưa tạo · Đã tạo · Đã dọn · Dọn lỗi |

## Quy tắc
- Không xóa dòng khỏi registry; dọn xong thì đổi trạng thái.
- Dọn lỗi → trạng thái `Dọn lỗi`, ghi lý do; run đó không được ghi pass (`{{KIT}}/rules/retry_and_wait.md` mục 6).
- Registry nằm trong `output_dir`, **không** trong repo của khách.
