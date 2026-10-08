---
name: test-data
description: Biến partition và giá trị biên của test case thành dữ liệu test cụ thể, unique, truy vết được, có người chịu trách nhiệm dọn; gồm tổ hợp nhiều chiều và chuỗi data qua nhiều module. Dùng khi "sinh test data", "data cho TC". Không dùng để chọn kỹ thuật/partition → test-design-rbt.
---

# Test Data

> Chuẩn: `{{KIT}}/rules/id_conventions.md` (ID data), `{{KIT}}/rules/reporting_and_data.md` mục 4 (data synthetic).
> Nguồn gốc: `test_data_generator` của bộ gốc (phần chuỗi data, tổ hợp), đã đổi email sang domain test `@example.com` (bộ gốc dùng một domain có thật) và bỏ đọc credential.

## Khi dùng / Không dùng
- **Dùng:** đã có TC (hoặc partition/giá trị biên) và cần **giá trị cụ thể** để chạy; cần data cho nhiều tổ hợp; data phải đi qua nhiều module nối tiếp.
- **Không dùng:**
  - Chưa có TC, còn đang chọn partition/kỹ thuật → `test-design-rbt`.
  - Muốn **tạo data thật** trên env → skill này chỉ **sinh bộ data**. Tạo thật là việc của người chạy test hoặc automation, cần **G1**.
  - Cần tài khoản đăng nhập → dùng tài khoản test trong `.env.sandbox`, skill **không** sinh hay đọc mật khẩu.

## Mode
| Mode | Khi nào |
|---|---|
| `dataset` (mặc định) | Mỗi TC một bộ data |
| `combinatorial` | Có ma trận tổ hợp (pairwise hoặc đủ tổ hợp); mỗi tổ hợp một bộ data |
| `chain` | Data module sau phụ thuộc output module trước (ví dụ tạo nhân viên → gán phòng ban → chấm công) |

## Đầu vào
- File TC (đọc front-matter `produced_by: test-design-rbt`) hoặc danh sách partition/giá trị biên.
- `project.aiqe.yml`: `id_prefix`, `sms_gateway_disabled`, `output_dir`.
- Run ID (`RUN-<YYYYMMDD>-<NN>`) nếu data gắn với một lần chạy; chưa có thì dùng số thứ tự tạm `r001`.
- Mode `combinatorial`: ma trận tổ hợp. Mode `chain`: danh sách module theo thứ tự và field tham chiếu.

## Quy trình
1. **Phân loại field** (cả 3 mode):
   | Loại | Cách sinh |
   |---|---|
   | Field chiều (thuộc partition/ma trận) | Lấy **đúng** giá trị từ TC/ma trận, không random |
   | Field phụ (bắt buộc nhưng không phải chiều kiểm thử) | Synthetic, unique, có ID truy vết |
   | Field tham chiếu (ID từ module trước) | Chép từ output module trước, ghi rõ lấy từ đâu |
   | Field tính toán | Tính theo công thức **có nguồn**; không có nguồn → `UNKNOWN` |
2. **ID truy vết** theo `{{KIT}}/rules/id_conventions.md`: `<id_prefix>-r<NNN>-<tên>`, ví dụ `QA-r001-emp01`. Mode `chain`/`combinatorial` thêm mã tổ hợp vào tên: `QA-r001-c01-emp`.
   **Tên người và tên record cũng mang prefix** (First Name `QA-r001-An`, Last Name `Test`; tên phòng ban `QA-r001-Kho`), không chỉ ID và tên file: để tìm lại và dọn đúng dữ liệu của mình trên site dùng chung.
3. **Field có format cứng** (ví dụ mã đúng 8 chữ số, CCCD 12 số) → **không** chèn prefix (sẽ sai format, biến TC positive thành negative). Dùng giá trị hợp lệ và ghi vào **data registry** để truy vết.
4. **Dữ liệu an toàn:** email `@example.com`; tên, địa chỉ synthetic tiếng Việt (ví dụ `Nguyễn QA Thử Nghiệm`); số điện thoại chỉ dùng khi `sms_gateway_disabled: yes`, nếu không thì ghi cảnh báo trong cột Ghi chú. Không dùng dữ liệu người thật.
5. **Giá trị biên** phải đúng con số: "chuỗi 101 ký tự `A`", không viết "chuỗi dài".
6. **Cleanup:** mỗi bộ data có `cleanup owner` (ai dọn) và cách dọn (UI/API/script, `UNKNOWN` nếu chưa biết). Data dùng chung giữa nhiều test → ghi rõ, không ai được xóa riêng.
7. Ghi data registry theo `references/data_registry_format.md`.

## Output
- `<output_dir>/data/DATA-<MODULE>-<run>.md` theo `{{KIT}}/templates/data_registry.md`; mode `combinatorial`/`chain` kèm khối JSON cho automation.
- Front-matter: `id: DATA-<MODULE>-<run>`, `source: [TC-…]`, `labels: [AI-PROPOSAL]`, `produced_by: test-data`, `status: draft`.
- Dòng tổng: "N bộ data · M field tham chiếu · K mục cần dọn".

## Gate và giới hạn
- Skill **không** tạo data trên env. Tạo thật cần G1 (env thuộc `sandbox_urls`).
- Không sinh, không đọc mật khẩu/token. Tài khoản đăng nhập: "dùng tài khoản test trong `.env.sandbox`".
- Email ngoài domain test, số điện thoại khi SMS chưa tắt: không có hook chặn; chỉ Self-check bên dưới và người duyệt bắt được (📝).

## Self-check
- [ ] Field chiều lấy đúng giá trị từ TC/ma trận, không random
- [ ] ID truy vết đúng `<prefix>-r<NNN>-<tên>`; tên người/tên record cũng mang prefix; field format cứng không bị chèn prefix mà có trong registry
- [ ] Email `@example.com`; không PII thật; số điện thoại có cảnh báo nếu SMS chưa tắt
- [ ] Giá trị biên ghi đúng con số
- [ ] Mỗi bộ data có cleanup owner và cách dọn
- [ ] Mode `chain`: field tham chiếu ghi rõ lấy từ module nào
- [ ] Có dòng tổng và front-matter `produced_by: test-data`
