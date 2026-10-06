# Retry matrix

> Số lần và thời gian là **policy của dự án**, không phải SLA của sản phẩm. Chuẩn: `{{KIT}}/rules/retry_and_wait.md`.

| Loại | Được retry? | Tối đa (lần / thời gian) | Điều kiện | Evidence phải giữ | Gate |
|---|---|---|---|---|---|
| Thao tác chỉ đọc | Có, giới hạn | | Không có side effect | Mọi lần thử kèm lỗi | — |
| Assertion polling | Trong timeout của assertion | | Expected không đổi | Thời gian chờ thực tế | — |
| Retry cấp framework | Được bật | | Report hiện `flaky` + lần fail đầu | Trace lần fail đầu | — |
| Chạy lại cả test | Chỉ khi duyệt | | Attempt ID mới, giữ attempt cũ | Cả lần fail và lần mới | G2 |
| Ghi dữ liệu khi chưa rõ kết quả | **Không** | 0 | Tra cứu chỉ-đọc trước | Timeline + kết quả tra cứu | G2 |

## Termination / Dừng an toàn
| Nhánh | Dừng ghi mới | Giữ evidence | Trạng thái cleanup | Trạng thái kết thúc | Người phụ trách |
|---|---|---|---|---|---|
| Hết budget | | | | | |
| Bị từ chối duyệt | | | | | |
| Cleanup fail | | | | CLEANUP_PENDING | |
| User hủy | | | | CANCELLED | |
