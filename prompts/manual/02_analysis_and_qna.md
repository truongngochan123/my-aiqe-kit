# FULL RBT · Bước 2/6: Phân tích yêu cầu và Q&A

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md` (chính sách AI, che dữ liệu nhạy cảm) trước khi dán.
> **Điểm dừng quan trọng nhất.** AI phải dừng chờ bạn (hoặc BA/PO) trả lời câu hỏi. Nếu AI tự trả lời hoặc đi tiếp, nhắc nó quay lại.
> Nguồn gốc: `antigravity-testing-kit-main/plans/manual/02_analysis_and_qna/prompt.txt`.

---START---

Dựa trên tài liệu và bối cảnh ở bước 1, phân tích yêu cầu.

### 1. Các luồng
- **Happy path:** luồng chính
- **Alternate path:** rẽ nhánh hợp lệ
- **Exception path:** lỗi, ngoại lệ (mất kết nối, timeout, sai định dạng, thao tác đồng thời, upload quá dung lượng…)

### 2. Điểm mờ
Liệt kê, **mỗi điểm trích dẫn đoạn tài liệu liên quan** (hoặc ghi "tài liệu không nhắc tới"):
- **Thiếu:** ví dụ độ dài tối đa field, timeout, hành vi khi mất mạng, quy tắc phân quyền, định dạng ngày/SĐT, thông báo lỗi
- **Mâu thuẫn:** hai yêu cầu trái nhau
- **Hiểu được nhiều cách:** câu có thể hiểu theo 2 nghĩa trở lên

### 3. Câu hỏi
Đánh số `Q1, Q2…`. Mỗi câu gồm:
| # | Câu hỏi | Vì sao cần hỏi | Ảnh hưởng nếu đoán sai | Giả định tạm (`AI-PROPOSAL`) |
|---|---|---|---|---|

Sắp xếp theo mức ảnh hưởng, câu quan trọng nhất lên đầu.

---

Trình bày bằng Markdown.
⏸️ **DỪNG LẠI.** Không trả lời thay tôi, không sang bước 3. Chờ tôi trả lời các câu hỏi.
