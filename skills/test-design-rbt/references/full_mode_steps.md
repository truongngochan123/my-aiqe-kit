# Mode `full`: mục và bảng bắt buộc từng bước

> Dùng khi chạy `test-design-rbt` mode `full` qua skill (gộp bước 1+2, dừng ở bước 2 và 4).
> Prompt gốc: `{{KIT}}/prompts/manual/01_…` → `06_…`. Bổ sung sau pilot T3 (08–09/10): Codex gộp/bỏ cột và bỏ mục "Điểm mờ", "Thiếu sót (gap)".

## Luật chung cho mọi bước
1. **Bảng giữ đúng tên cột và số cột như prompt mẫu.** Chép nguyên dòng tiêu đề bảng từ file prompt của bước đó. Không gộp 2 cột, không bỏ cột, không thêm cột, không đổi tên cột (kể cả dịch). Ô không có thông tin → `Not specified`, không xóa cột.
2. **Đủ các mục bắt buộc** liệt kê dưới đây, đúng thứ tự, đúng tiêu đề. Mục không có nội dung → ghi một dòng "Không có (vì …)", không bỏ mục.
3. Trước khi trả lời mỗi bước: tự đối chiếu danh sách mục và dòng tiêu đề bảng với prompt; thiếu thì bổ sung rồi mới gửi.

## Mục bắt buộc
| Bước | Mục bắt buộc (tiêu đề trong prompt) | Bảng phải giữ nguyên cột |
|---|---|---|
| 1 | "Đã hiểu bối cảnh"; scope trong/ngoài; tài liệu đã nhận / còn thiếu | — |
| 2 | `### 1. Các luồng` (happy / alternate / exception) · `### 2. Điểm mờ` (thiếu / mâu thuẫn / hiểu nhiều cách, **mỗi điểm trích dẫn tài liệu** hoặc ghi "tài liệu không nhắc tới") · `### 3. Câu hỏi` | Bảng câu hỏi của prompt 02 |
| 3 | `### 1. Danh sách module` (ghi cách phân rã đã chọn) · `### 2. Phụ thuộc giữa các module` | Bảng module, bảng phụ thuộc của prompt 03 |
| 4 | `### 1. Truy vết yêu cầu` · `### 2. Thiếu sót (gap)` (chức năng chưa map, điều kiện đầu vào chưa liệt kê, quy tắc bỏ sót; không có thì ghi "Không có gap: đã đối chiếu …") · `### 3. Scenario mức cao` | Bảng truy vết, bảng scenario của prompt 04 |
| 5 | Theo prompt 05 (bảng field có khối `<!-- sync -->`) | Bảng TC 12 cột |
| 6 | Bảng TC · bảng thăm dò · câu hỏi còn mở · dòng tổng đúng mẫu · "Bước tiếp theo"; chạy `check-tc` | Bảng TC 12 cột, bảng thăm dò 5 cột |

## Mã nguồn yêu cầu ở bước 4
- Có mã trong tài liệu (`AC-…`) → dùng mã đó.
- Yêu cầu có trong tài liệu nhưng **không đánh mã** → hỏi user mã; trong lúc chờ đánh `PRV-<MODULE>-NN` kèm trích dẫn đoạn tài liệu (nhãn `PROVIDED`).
- Quy tắc BA/dev **kể lại** không có tên + ngày hoặc ticket → `PRV-<MODULE>-NN` + câu hỏi xin nguồn.
- `HYP-<MODULE>-NN` **chỉ** cho hành vi **đã quan sát** trên app (có người, env, ngày: `DOM-OBSERVED`).
- Hành vi **chưa quan sát**, chỉ là suy đoán/kinh nghiệm → **không** đánh `HYP-`: đưa thành câu hỏi `Q-<MODULE>-NN` (hoặc mục thăm dò).

## Gợi ý scenario theo loại màn hình (bước 4)
Gợi ý là `AI-PROPOSAL`; expected chưa có nguồn thì đưa vào bảng thăm dò/câu hỏi, không tự đặt.

**Màn đăng nhập** (luôn đề xuất 2 scenario bảo mật sau, kể cả khi tài liệu không nhắc):
1. Ô mật khẩu **ẩn ký tự** khi nhập (input `type=password`, không hiện chữ thường; nếu có nút hiện/ẩn thì mặc định là ẩn).
2. **Thông báo lỗi giống nhau** khi sai username và khi sai password (không tiết lộ username nào tồn tại).
Nguồn expected: tài liệu nếu có; không có → kỳ vọng hiển nhiên #3 (lộ dữ liệu) cho scenario 2; scenario 1 là câu hỏi cho PO nếu tài liệu không nói.
