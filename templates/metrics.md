# Mẫu bảng chỉ số kiểm thử (Metrics with Denominator)

> Chuẩn: `rules/reporting_and_data.md`, `rules/evidence_labels.md`.
> **Quy tắc bắt buộc:** Mọi chỉ số số lượng **bắt buộc phải có mẫu số** (định dạng `X/Y (Tỷ lệ %)`), ví dụ `12/40 TC P1 (30%)`, tuyệt đối không ghi số đếm trơ trọi như `12 TC`. Số liệu không có nguồn đối chiếu ghi `UNKNOWN`, không ghi 0 hoặc số phỏng đoán.

## 1. Tiến độ thực thi kiểm thử (Execution Progress)

| Hạng mục / Phân loại | Đã chạy / Tổng số | Tỷ lệ (%) | Passed | Failed | Blocked | Flaky | Ghi chú & Nguồn |
|---|---|---|---|---|---|---|---|
| Test Case P1 (Critical) | `.../...` | `...%` | `.../...` | `.../...` | `.../...` | `.../...` | file nguồn |
| Test Case P2 (Major) | `.../...` | `...%` | `.../...` | `.../...` | `.../...` | `.../...` | file nguồn |
| Test Case P3 (Minor) | `.../...` | `...%` | `.../...` | `.../...` | `.../...` | `.../...` | file nguồn |
| Test Case P4 (Trivial) | `.../...` | `...%` | `.../...` | `.../...` | `.../...` | `.../...` | file nguồn |
| **Tổng cộng** | `.../...` | `...%` | `.../...` | `.../...` | `.../...` | `.../...` | `traceability_index.md` |

## 2. Tỷ lệ bao phủ yêu cầu (Requirement Coverage)

| Module | AC có TC / Tổng AC | Tỷ lệ (%) | TC Automation / Tổng TC | Ghi chú |
|---|---|---|---|---|
| `<MODULE_1>` | `.../...` | `...%` | `.../...` | |
| `<MODULE_2>` | `.../...` | `...%` | `.../...` | |
| **Toàn bộ dự án** | `.../...` | `...%` | `.../...` | |

## 3. Phân bố lỗi theo mức độ nghiêm trọng (Defect Distribution)

| Severity | Số bug đã phát hiện / Tổng bug | Tỷ lệ (%) | Đã đóng / Đã phát hiện | Trạng thái tồn đọng |
|---|---|---|---|---|
| S1 (Blocker) | `.../...` | `...%` | `.../...` | 0 mở (tiêu chí exit) |
| S2 (Critical) | `.../...` | `...%` | `.../...` | ... mở |
| S3 (Major) | `.../...` | `...%` | `.../...` | ... mở |
| S4 (Minor) | `.../...` | `...%` | `.../...` | ... mở |
| **Tổng cộng** | `.../...` | `100%` | `.../...` | |

## 4. Độ ổn định tự động hóa (Automation Stability & Flakiness)

| Tiêu chí | Đo lường có mẫu số | Ngưỡng chấp nhận | Trạng thái |
|---|---|---|---|
| Tỷ lệ Flaky Run | `.../... run flaky` | ≤ 2% | Đạt / Chưa đạt |
| Test trong Quarantine | `.../... TC` | 0 quá hạn | Đang cách ly |
| Thời gian chạy suite | `... phút / ... TC` | Theo SLA dự án | |
