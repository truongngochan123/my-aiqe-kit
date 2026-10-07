---
id: BUG-<MODULE>-<NNN>
source: [AC-<MODULE>-NN, TC-<MODULE>-NNN]
labels: [MANUAL-RUN: failed]
produced_by: bug-reporting
status: draft
---
# [<Module>] <Hành động> → <kết quả sai>

<!-- Tiêu đề chỉ mô tả hành vi, không có nhận định ("nghiêm trọng", "rất tệ").
     Ví dụ: [Customers] Bấm Lưu 2 lần liên tiếp → tạo 2 khách hàng trùng mã -->

| Trường / Field | Giá trị / Value |
|---|---|
| Environment / Build | <env> / <build hoặc version> |
| Browser / Device | <ví dụ: Chrome 129, Windows 11> |
| Severity | S1–S4 (tester đánh giá; nếu AI đề xuất thì ghi `AI-PROPOSAL`) |
| Priority (đề xuất) | P1–P4 (`AI-PROPOSAL`, PO/lead quyết định) |
| Reproducibility | <số lần tái hiện>/<số lần thử>, ví dụ 3/5 |
| Related | TC-…, AC-… |
| Duplicate check | Đã kiểm tra trong <tên file CSV, ngày export> / Chưa kiểm tra: thiếu CSV |

## Pre-condition / Điều kiện trước
- <tài khoản test, quyền, dữ liệu có sẵn>

## Steps to reproduce / Các bước tái hiện
1. <bước, kèm data cụ thể>
2. …

## Expected / Kết quả mong đợi
<kết quả> — nguồn: `AC-…` (`REQ-CONFIRMED`)
<!-- Không có requirement? Chỉ dùng được khi khớp danh sách đóng ở rules/bug_report.md mục 1b:
     <kết quả> — nguồn: kỳ vọng hiển nhiên #<1-4> (`AI-PROPOSAL`), cần PO/BA xác nhận expected -->


## Actual / Kết quả thực tế
<kết quả> — `<nhãn evidence>` (người chạy, thời điểm)

## Evidence / Bằng chứng
| Loại | Ref | Đã che dữ liệu nhạy cảm? |
|---|---|---|
| Screenshot | <đường dẫn> | Có (người che) |
| Log | <đường dẫn> | Có (`redact.js`) |

## Notes / Ghi chú
- <giả thuyết nguyên nhân nếu có, gắn `HYPOTHESIS`>

## Retest history / Lịch sử retest
| Lần | Build | Người chạy | Thời điểm | Kết quả | Evidence |
|---|---|---|---|---|---|
