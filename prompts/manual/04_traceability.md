# FULL RBT · Bước 4/6: Truy vết và scenario
<!-- aiqe-stop-in-skill: yes -->

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md` trước khi dán.
> **Điểm dừng do người quyết định:** bạn tự đánh giá rủi ro, bổ sung scenario AI bỏ sót, rồi mới cho sang bước 5.
> Nguồn gốc: `antigravity-testing-kit-main/plans/manual/04_traceability/prompt.txt`. Đổi `REQ-01` thành mã AC thật của tài liệu.

---START---

> **Giữ đúng tên cột và số cột** của mọi bảng dưới đây (không gộp, bỏ, thêm, đổi tên cột). Đủ các mục `###` theo thứ tự; mục không có nội dung ghi "Không có (vì …)", không bỏ mục.

Từ kết quả phân rã ở bước 3, lập **ma trận truy vết** để chắc chắn mọi yêu cầu đều có scenario.

### 1. Truy vết yêu cầu
Dùng **mã AC có sẵn** trong tài liệu (ví dụ `AC-CUS-01`). Yêu cầu có trong tài liệu nhưng không đánh mã → hỏi tôi mã; tạm đánh `PRV-<MODULE>-NN` kèm trích dẫn đoạn tài liệu. `HYP-<MODULE>-NN` **chỉ** cho hành vi đã quan sát trên app (có người, env, ngày); hành vi chưa quan sát → câu hỏi `Q-<MODULE>-NN`, không đánh `HYP-`. Quy tắc do BA/dev **kể lại qua tôi** mà chưa có tên + ngày hoặc mã ticket → mã `PRV-<MODULE>-NN`, nhãn `PROVIDED`, kèm câu hỏi xin tên BA + ngày hoặc mã ticket (không dùng `HYP-`, không `REQ-CONFIRMED`).

| Mã AC/PRV/HYP | Module | Mô tả yêu cầu | Trích dẫn tài liệu |
|---|---|---|---|

### 2. Thiếu sót (gap)
So lại với tài liệu gốc: chức năng chưa được map, điều kiện đầu vào chưa liệt kê, quy tắc nghiệp vụ bị bỏ sót. Báo cụ thể từng mục. **Mục này bắt buộc**: không có gap thì ghi "Không có gap: đã đối chiếu <các phần tài liệu>".

### 3. Scenario mức cao
Mỗi scenario 1 câu, tập trung: phân quyền/bảo mật · validation giao diện · logic nghiệp vụ · toàn vẹn dữ liệu · xử lý lỗi.

Nếu có **màn đăng nhập**, luôn có 2 scenario bảo mật (kể cả khi tài liệu không nhắc; expected chưa có nguồn thì đưa thành câu hỏi):
- Ô mật khẩu ẩn ký tự khi nhập.
- Thông báo lỗi giống nhau khi sai username và khi sai password (không lộ username nào tồn tại).

| Mã AC/PRV/HYP | Module | Scenario ID | Mô tả scenario | Rủi ro đề xuất (`AI-PROPOSAL`) |
|---|---|---|---|---|

---

⏸️ **DỪNG LẠI.** Chờ tôi duyệt, bổ sung scenario và chốt mức rủi ro từng module rồi mới sang bước 5.
