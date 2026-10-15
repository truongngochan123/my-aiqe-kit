# Thẻ cách ly test case (Quarantine Record)

> Chuẩn: `rules/retry_and_wait.md` mục 7, `skills/incident-triage`.
> Áp dụng khi test bị flaky (kết quả không ổn định ≥ 2 lần chạy cùng code/env) cần tạm thời cách ly khỏi suite CI chính.
> **4 thông tin bắt buộc:** Owner, Rủi ro khi bỏ qua, Kiểm tra thay thế, Hạn chót.

## 1. Thông tin kiểm thử & Hiện trạng Flaky

- **Mã test case (Case ID):** `TC-...`
- **Tên file spec / test method:** `...`
- **Mức độ ưu tiên (Priority):** P1 / P2 / P3 / P4
- **Bằng chứng flaky (Evidence):** Tỷ lệ tái hiện `.../...` lần chạy (ít nhất 2 lần chạy cùng code cho kết quả khác nhau); trace ref: `...`
- **Người chịu trách nhiệm (Owner):** `@username` / Tên người cụ thể *(bắt buộc)*
- **Ngày bắt đầu cách ly:** YYYY-MM-DD
- **Hạn chót cách ly (Expiry Date):** YYYY-MM-DD *(bắt buộc, tối đa 14 ngày từ ngày lập)*

## 2. Đánh giá rủi ro & Biện pháp kiểm soát thay thế

- **Rủi ro khi bỏ qua (Risk of Omission):** *(bắt buộc)* Mô tả rủi ro chất lượng hoặc chức năng sản phẩm có nguy cơ lọt lỗi khi test này không chạy trong CI.
- **Biện pháp kiểm tra thay thế (Compensating Control):** *(bắt buộc)* Biện pháp kiểm thử bù đắp trong thời gian cách ly (ví dụ: test manual trước release, health check API phụ).
- **Nguyên nhân nghi vấn (Hypothesis):** Chờ DOM chưa đủ / Locator động / Race condition dữ liệu test / Môi trường không ổn định.
- **Kế hoạch khắc phục (Remediation Plan):** Refactor sync assertion / tách riêng dữ liệu test / sửa locator.

## 3. Quyết định khi đến hạn (Expiry Resolution)

- Quá hạn mà chưa khắc phục xong: Tự động đưa lại suite chính hoặc xóa vĩnh viễn test case kèm lý do và **G3** (người duyệt).
