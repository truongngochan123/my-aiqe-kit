---
id: TC-<MODULE>
source: [AC-<MODULE>-01]
labels: [AI-PROPOSAL]
produced_by: test-design-rbt
status: draft
---
# Test cases: <Module>

## 1. Field / Trường dữ liệu
| Field | Loại | Required | Min/Max | Format | Unique | Nguồn |
|---|---|---|---|---|---|---|

## 2. Risk / Rủi ro
| Chức năng | Probability | Impact | Risk | Lý do |
|---|---|---|---|---|

**Tổng:** <N> TC chạy được · <M> mục thăm dò · <K> câu hỏi

## 3a. Test cases chạy được / Executable test cases
<!-- Chỉ TC có expected ĐÃ BIẾT, có nguồn (REQ-CONFIRMED, DOM-OBSERVED, kỳ vọng hiển nhiên #1-#4).
     Expected từ DOM-OBSERVED: ghi "(hành vi quan sát ngày …, chưa có requirement xác nhận)".
     Steps và Expected: đánh số, khớp 1-1, xuống dòng trong ô bằng <br>.
     Test Data cụ thể. Email dùng @example.com. Ký tự | trong ô viết là \|
     Priority theo Risk (rules/test_design.md mục 2b). Không dùng ký hiệu tắt tự đặt. -->

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-<MODULE>-001 | AC-<MODULE>-01 | | | 1. …<br>2. … | 1. …<br>2. … | | P1 | High | Yes | UI | @Smoke |

## 3b. Mục thăm dò / Exploration items (expected chưa biết)
<!-- KHÔNG có cột TC ID (để md_to_xlsx không xuất nhầm thành TC).
     Có câu trả lời của PO/BA hoặc đã quan sát → chuyển thành TC ở mục 3a. -->

| Q ID | Scenario cần thăm dò | Cần biết điều gì | Cách quan sát | Risk | TC sẽ viết khi có câu trả lời |
|---|---|---|---|---|---|
| Q-<MODULE>-01 | | | | | |

## 4. Traceability / Truy vết
| AC | TC | Ghi chú |
|---|---|---|

## 5. Open questions / Câu hỏi mở (`Not specified`)
| ID | Câu hỏi | Vì sao quan trọng | Ảnh hưởng nếu đoán sai |
|---|---|---|---|
