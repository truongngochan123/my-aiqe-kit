# Hợp đồng chuyển giao luồng kiểm thử (Flow Contract)

> Chuẩn: Unit 3 AOCE (Multi-flow Design & Tenant/Data Isolation).
> Quy định giao tiếp giữa các flow chạy liên hoàn: Đảm bảo tính cô lập dữ liệu (Data Isolation) và kiểm soát handoff giữa các module.

## 1. Thông tin định danh chuỗi luồng (Sequence Metadata)

- **Tên chuỗi (Sequence Name):** `SEQ-...`
- **Mục tiêu E2E:** Kiểm thử trọn vẹn chu kỳ dữ liệu xuyên qua nhiều module.
- **Danh sách flow thực thi theo thứ tự:**
  1. `FLOW-01`: `<Mã case>` (ví dụ `EMP-CREATE-01`)
  2. `FLOW-02`: `<Mã case>` (ví dụ `EMP-ASSIGN-ROLE-01`)

## 2. Hợp đồng chuyển giao dữ liệu (Handoff Contract)

| Flow xuất (Producer) | Trường xuất (Outputs) | Flow nhận (Consumer) | Trường nhận (Inputs) | Quy tắc kiểm tra (Validation) |
|---|---|---|---|---|
| `FLOW-01` | `recordName`, `empNumber` | `FLOW-02` | `targetEmployeeId` | `empNumber` phải là số nguyên > 0, tồn tại trên DB |
| `FLOW-02` | `roleAssigned` | `FLOW-03` | `expectedRole` | Quyền gán thành công, status = 'ACTIVE' |

## 3. Quy chuẩn cách ly dữ liệu (Data Isolation Rules)

1. **Prefix độc lập:** Mỗi chuỗi flow phải mang một `dataPrefix` duy nhất gắn với Run ID chính (ví dụ `AIQE-seq01-r001-`).
2. **Tenant State Reset:** Sau khi kết thúc mỗi flow:
   - Toàn bộ browser context, session cookie phụ phải được dọn sạch.
   - Bắt buộc kiểm tra các record tạm không bị rò rỉ sang flow tiếp theo.
3. **Cơ chế dừng khi lỗi (Fail-Fast):** Nếu một flow trong chuỗi bị `FAIL` hoặc `BLOCKED`, toàn bộ các flow phía sau lập tức bị `CANCELLED` và kích hoạt bước cleanup khẩn cấp.
