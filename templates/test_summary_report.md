---
id: SUMMARY-<PROJECT>-<NN>
source: [PLAN-<PROJECT>-<NN>, RUN-<YYYYMMDD>-<NN>]
labels: [AI-PROPOSAL]
produced_by: test-strategy
status: draft
---
# Test summary report / Báo cáo tổng kết: <release>

Enforcement: local-only
<!-- server-review chỉ khi project.aiqe.yml có server_review: yes. -->

## 1. Kết luận đề xuất / Recommendation (`AI-PROPOSAL`)
- **Go / No-go / Go có điều kiện:** … (QA lead và PO quyết định, không phải AI)
- **Vì sao:** (mỗi lý do trỏ về run/bug cụ thể)
- **Rủi ro còn lại khi go:**

## 2. Số liệu / Metrics
Chỉ ghi số đếm được từ nguồn. Không có nguồn → `UNKNOWN`.
| Metric | Giá trị | Nguồn (file, run) |
|---|---|---|
| TC kế hoạch / đã chạy | | |
| Passed / Failed / Flaky / Blocked / Not run | | |
| Bug mở theo severity (S1/S2/S3/S4) | | |
| Requirement chưa có TC (trace index) | | `traceability_index.md` |

## 3. So với tiêu chí exit / Exit criteria
| Tiêu chí (từ test plan) | Đạt? | Bằng chứng |
|---|---|---|

## 4. Việc chưa làm và lý do / Not tested
| Phạm vi | Lý do | Rủi ro |
|---|---|---|

## 5. Bug còn mở ảnh hưởng release
| Bug | Severity | Workaround | Người quyết |
|---|---|---|---|

## 6. Unknowns / Insufficient evidence
-

## 7. Bước tiếp theo
-
