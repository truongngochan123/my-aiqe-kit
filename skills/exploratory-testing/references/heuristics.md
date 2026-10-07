# Heuristic cho exploratory testing

> Dùng để **gợi ý ý tưởng test**, không phải checklist phải chạy hết. Mỗi ý tưởng ghi heuristic nguồn.

## 1. SFDIPOT (phân tích sản phẩm theo 7 góc)
| Chữ | Góc nhìn | Câu hỏi gợi ý | Ví dụ (màn Add Employee) |
|---|---|---|---|
| **S** · Structure | Cấu trúc | App gồm những phần nào? Phần nào phụ thuộc phần nào? | Form, upload ảnh, danh sách nhân viên dùng chung dữ liệu |
| **F** · Function | Chức năng | Nó làm được gì? Làm sai thì sao? | Lưu, hủy, tạo tài khoản đăng nhập kèm theo |
| **D** · Data | Dữ liệu | Dữ liệu vào/ra, giới hạn, ký tự lạ, rỗng, trùng? | Tên tiếng Việt có dấu, emoji, 300 ký tự, trùng tên |
| **I** · Interfaces | Giao tiếp | Giao diện, API, import/export, tích hợp? | Ảnh đại diện, tìm kiếm ở Employee List |
| **P** · Platform | Nền tảng | Trình duyệt, kích thước màn hình, mạng? | Màn hình nhỏ, mạng chậm, Firefox |
| **O** · Operations | Cách dùng thật | Người dùng thật dùng thế nào, sai thế nào? | Bấm Save 2 lần, mở 2 tab, quay lại bằng nút Back |
| **T** · Time | Thời gian | Hết phiên, thao tác chậm/nhanh, thứ tự? | Để form mở 30 phút rồi bấm Save |

## 2. Tour (đi một vòng theo chủ đề)
| Tour | Cách đi | Hay phát hiện |
|---|---|---|
| **Tour chính** | Đi luồng người dùng hay làm nhất | Lỗi chặn luồng chính |
| **Tour dữ liệu** | Đưa dữ liệu "khó" vào mọi field | Lỗi validation, lưu sai dữ liệu |
| **Tour ngược** | Làm ngược thứ tự thông thường (sửa trước khi tạo, xóa khi đang mở) | Lỗi trạng thái |
| **Tour hủy bỏ** | Bấm Cancel/Back/đóng tab giữa chừng | Dữ liệu nửa vời, mất dữ liệu |
| **Tour phân quyền** | Làm cùng việc với các vai trò khác nhau | Vượt quyền, lộ dữ liệu |
| **Tour thông báo** | Gây ra mọi thông báo lỗi có thể | Thông báo sai, khó hiểu, lộ thông tin kỹ thuật |
| **Tour bền bỉ** | Lặp lại thao tác nhiều lần, dữ liệu nhiều | Chậm dần, rò bộ nhớ, trùng |

## 3. Gợi ý khi bí ý tưởng
- **Kỳ vọng hiển nhiên** (`{{KIT}}/rules/bug_report.md` mục 1b): thử những thao tác có thể gây lỗi hệ thống, lưu sai dữ liệu, lộ dữ liệu, không đăng nhập được.
- **Biên:** rỗng, 1 ký tự, giới hạn, vượt giới hạn, số âm, số 0.
- **Đồng thời:** 2 người/2 tab cùng thao tác một bản ghi.
- **Khôi phục:** mất mạng giữa chừng, tải lại trang, hết phiên.
