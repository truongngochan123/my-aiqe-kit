# Case nâng cao hay bị quên

> Lấy từ `antigravity-testing-kit-main/.agent/skills/rbt_manual_testing/SKILL.md:147-164`, bổ sung oracle.
> Chỉ thêm case khi phù hợp với tính năng. Expected không có trong requirement → `Not specified` + câu hỏi.

| Nhóm | Case | Oracle gợi ý |
|---|---|---|
| **Double submit** | Bấm Lưu 2 lần liên tiếp thật nhanh | Tìm theo dữ liệu vừa nhập: chỉ có **1** record |
| **Sửa đồng thời** | 2 tab/2 user cùng sửa 1 record, lưu lần lượt | Hành vi mong đợi (ghi đè, báo xung đột, khóa)? Thường `Not specified` → hỏi |
| **Hết phiên** | Phiên hết hạn khi đang điền form, rồi bấm Lưu | Không mất dữ liệu đã nhập, hoặc báo rõ phải đăng nhập lại; không tạo record nửa vời |
| **Mất mạng** | Ngắt mạng đúng lúc bấm Lưu | Không tạo trùng khi mạng có lại; trạng thái hiển thị đúng với dữ liệu thật trong hệ thống |
| **Mạng chậm** | Giả lập mạng chậm (DevTools) | Có trạng thái đang tải; không cho bấm lại gây trùng |
| **Tiếng Việt / Unicode** | `Nguyễn Thị Ánh Tuyết`, `Phạm Ước`, emoji `😀🚀` | Lưu và hiển thị lại đúng; tìm kiếm có dấu/không dấu (`Not specified` → hỏi) |
| **Ngôn ngữ khác** | Tiếng Trung, Nhật, Ả Rập (viết phải sang trái) | Không vỡ giao diện; lưu đúng |
| **Bàn phím (a11y)** | Tab qua form, Enter/Space để bấm | Thứ tự hợp lý; thấy rõ ô đang focus |
| **Phân quyền** | User không có quyền mở URL trực tiếp | Bị chặn ở **server** (403), không chỉ ẩn nút |
| **API status code** | Gọi API với dữ liệu sai/thiếu quyền | `400`, `401`, `403`, `404`, `409`, `422`, `429`, `5xx` đúng từng trường hợp; body không lộ stack trace |
| **Dữ liệu lớn** | Danh sách 1000+ record | Phân trang, sắp xếp, tìm kiếm vẫn đúng; thời gian phản hồi: `Not specified` nếu không có SLA |
| **Xóa dữ liệu liên quan** | Xóa record đang được record khác tham chiếu | Chặn xóa hay xóa dây chuyền? Thường `Not specified` → hỏi |
