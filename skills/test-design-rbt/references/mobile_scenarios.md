# Case riêng cho app mobile

> Dùng khi tính năng chạy trên app mobile (native hoặc hybrid). Mỗi case cần ghi rõ **thiết bị, OS version, build app** trong Pre-condition.
> Expected không có trong requirement → `Not specified` + câu hỏi. Đừng tự đặt hành vi.

| Nhóm | Case | Điều cần kiểm tra |
|---|---|---|
| **Ngắt quãng** | Có cuộc gọi đến khi đang điền form / đang thanh toán | Quay lại app: dữ liệu còn, không gửi trùng |
| | Nhận thông báo và bấm vào giữa chừng | Luồng đang làm không bị hỏng |
| **Vòng đời app** | Đưa app xuống nền (background) 5 phút rồi mở lại | Phiên còn/hết theo quy định; dữ liệu nhập còn |
| | Hệ điều hành tắt app khi thiếu RAM | Mở lại không mất dữ liệu đã lưu, không tạo bản ghi nửa vời |
| **Mạng** | Chuyển Wi-Fi ↔ 4G giữa lúc gửi dữ liệu | Không gửi trùng; báo lỗi rõ nếu thất bại |
| | Chế độ máy bay khi bấm Lưu | Hành vi offline (xếp hàng gửi sau hay báo lỗi): thường `Not specified` |
| **Màn hình** | Xoay ngang/dọc khi đang nhập | Không mất dữ liệu; bố cục không vỡ |
| | Màn hình nhỏ, cỡ chữ hệ thống lớn nhất | Nút không bị che; chữ không bị cắt |
| | Chế độ tối (dark mode) | Chữ đọc được |
| **Quyền** | Từ chối quyền camera/vị trí/thông báo | Có thông báo giải thích; app không crash |
| | Thu hồi quyền trong Cài đặt khi app đang chạy | App xử lý được khi quay lại |
| **Bàn phím** | Bàn phím ảo che ô nhập ở cuối form | Màn hình cuộn lên được |
| | Bàn phím tiếng Việt (Telex/VNI), gõ có dấu | Nhập đúng, không lặp ký tự |
| **Cập nhật** | Cài bản mới đè bản cũ | Dữ liệu cục bộ và phiên đăng nhập theo quy định |
| **Pin / hiệu năng** | Chế độ tiết kiệm pin | Tác vụ nền (đồng bộ, thông báo) vẫn theo quy định |
| **Deep link** | Mở app từ link khi chưa đăng nhập | Đăng nhập xong quay về đúng màn hình |
