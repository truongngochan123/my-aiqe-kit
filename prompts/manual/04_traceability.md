# FULL RBT · Bước 4/6: Truy vết và scenario

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md` trước khi dán.
> **Điểm dừng do người quyết định:** bạn tự đánh giá rủi ro, bổ sung scenario AI bỏ sót, rồi mới cho sang bước 5.
> Nguồn gốc: `antigravity-testing-kit-main/plans/manual/04_traceability/prompt.txt`. Đổi `REQ-01` thành mã AC thật của tài liệu.

---START---

Từ kết quả phân rã ở bước 3, lập **ma trận truy vết** để chắc chắn mọi yêu cầu đều có scenario.

### 1. Truy vết yêu cầu
Dùng **mã AC có sẵn** trong tài liệu (ví dụ `AC-CUS-01`). Yêu cầu nào tài liệu không đánh mã → đánh mã tạm `HYP-<MODULE>-NN` và ghi rõ là giả định.

| Mã AC/HYP | Module | Mô tả yêu cầu | Trích dẫn tài liệu |
|---|---|---|---|

### 2. Thiếu sót (gap)
So lại với tài liệu gốc: chức năng chưa được map, điều kiện đầu vào chưa liệt kê, quy tắc nghiệp vụ bị bỏ sót. Báo cụ thể từng mục.

### 3. Scenario mức cao
Mỗi scenario 1 câu, tập trung: phân quyền/bảo mật · validation giao diện · logic nghiệp vụ · toàn vẹn dữ liệu · xử lý lỗi.

| Mã AC/HYP | Module | Scenario ID | Mô tả scenario | Rủi ro đề xuất (`AI-PROPOSAL`) |
|---|---|---|---|---|

---

⏸️ **DỪNG LẠI.** Chờ tôi duyệt, bổ sung scenario và chốt mức rủi ro từng module rồi mới sang bước 5.
