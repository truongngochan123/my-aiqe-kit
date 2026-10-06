# Oracle đọc lại dữ liệu bằng SQL

> Dùng khi muốn chứng minh dữ liệu **thật sự được lưu đúng**, mạnh hơn kiểm tra trên giao diện.
> Giới hạn cứng: **chỉ `SELECT`** · chỉ env thuộc `sandbox_urls` trong `project.aiqe.yml` · tài khoản DB **chỉ đọc**.

## Khi nào dùng
| Dùng | Không dùng |
|---|---|
| Kiểm tra field không hiện trên UI (trạng thái, cờ xóa mềm, `created_by`) | Env dùng chung (staging) hoặc production |
| Kiểm tra không tạo trùng (double submit) | Chưa có tài khoản DB chỉ đọc |
| Kiểm tra cleanup đã xóa đúng record của run | Chưa biết tên bảng/cột thật |

## Điều kiện trước khi viết oracle SQL
1. Có **schema thật** (tên bảng, cột) do dev hoặc tài liệu cung cấp (`PROVIDED`, ghi nguồn) hoặc tự xem trên DB sandbox (`DOM-OBSERVED` không áp dụng; ghi "quan sát schema trên <env> ngày <ngày>").
2. **Không có schema → ghi `UNKNOWN`**, không đoán tên bảng như `customers`, `tbl_customer`.
3. Có tài khoản DB **chỉ có quyền SELECT**. Tài khoản có quyền ghi thì dừng, báo user.

## Cách viết trong test case
- Cột Expected: ghi oracle UI trước, oracle SQL sau.
- Lọc theo **ID hoặc prefix của chính run**, không đọc dữ liệu của người khác.
- Không `SELECT *` trên bảng chứa PII; chỉ chọn cột cần kiểm tra.

Ví dụ (tên bảng/cột là **minh họa**, phải thay bằng schema thật):
```sql
-- Oracle cho TC-CUS-005: tạo khách hàng, kiểm tra lưu đúng và không trùng
SELECT code, company_name, status, COUNT(*) OVER () AS total
FROM <bảng_khách_hàng>
WHERE code = 'QA-r005-cus01';
-- Mong đợi: đúng 1 dòng; company_name = 'QA Công ty Thử Nghiệm 05'; status = 'active'
```

## Cấm
- `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `DROP`, `ALTER`, `CREATE`, `GRANT`, gọi stored procedure có ghi dữ liệu.
- Dùng SQL để **tạo** hoặc **sửa** dữ liệu test (dùng API/UI hoặc script data có G1).
- Đưa connection string, mật khẩu DB vào test case, prompt hay báo cáo.
- Chạy SQL lên env không thuộc `sandbox_urls`.

## Cleanup check
Sau khi chạy, kiểm tra cleanup bằng `SELECT COUNT(*) ... WHERE code LIKE '<id_prefix>-r<run>-%'`. Mong đợi `0`. Khác `0` → `CLEANUP_PENDING`, không ghi pass.
