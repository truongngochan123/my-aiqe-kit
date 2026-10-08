---
name: test-strategy
description: Lập test plan cho dự án/release (phạm vi, rủi ro, loại test, môi trường, tiêu chí entry/exit, ước lượng) hoặc tổng kết release (metrics, đề xuất go/no-go). Dùng khi "lập test plan", "chiến lược test", "tổng kết release". Không dùng cho báo cáo một lần chạy → evidence-reporting.
---

# Test Strategy

> Chuẩn: `{{KIT}}/rules/evidence_labels.md`, `{{KIT}}/rules/reporting_and_data.md`.
> Mẫu: `{{KIT}}/templates/test_plan.md`, `{{KIT}}/templates/test_summary_report.md`. Bảng loại test: `references/test_types_matrix.md`.
> Nguồn gốc: `TEST_STRATEGY.md` + workflow `generate_application_test_plan` của antigravity-testing-kit; **bỏ** phần tự khám phá app để đoán module (việc đó thuộc `requirement-analysis` mode reverse) và bỏ sinh automation skeleton.

## Khi dùng / Không dùng
- **Dùng:** lập kế hoạch test cho dự án, release, sprint lớn; chọn loại test nào áp dụng; viết tiêu chí exit; tổng kết cuối release và đề xuất go/no-go.
- **Không dùng:**
  - Báo cáo một lần chạy (một RUN) → `evidence-reporting`.
  - Viết test case → `test-design-rbt`. Phân tích requirement mơ hồ → `requirement-analysis`.
  - Chọn TC cần chạy lại sau một thay đổi → `regression-selection`.

## Mode
| Mode | Khi nào | Output |
|---|---|---|
| `plan` (mặc định) | Đầu dự án/release | `PLAN-<PROJECT>-<NN>.md` theo `test_plan.md` |
| `close` | Cuối release, đã có run/bug | `SUMMARY-<PROJECT>-<NN>.md` theo `test_summary_report.md` |

## Đầu vào
| Cần | Thiếu thì |
|---|---|
| Phạm vi: module, AC/requirement (output `requirement-analysis` nếu có) | Hỏi; không tự liệt kê module bằng cách đoán |
| `project.aiqe.yml`: `sandbox_urls`, `server_review`, `sms_gateway_disabled`, `stack` | Dùng mặc định chặt nhất, ghi `UNKNOWN` |
| Ràng buộc: deadline, số người, env có sẵn | Hỏi; không có → ước lượng ghi giả định rõ |
| Mode `close`: file run (`runs/`), bug (`bugs/`), `traceability_index.md` | Chạy `node {{KIT}}/scripts/trace/build-trace-index.js <output_dir>` trước; thiếu run → metric ghi `UNKNOWN` |

## Quy trình
**`plan`**
1. Phạm vi trong/ngoài, mỗi dòng có nguồn (`AC-*`, cuộc họp ngày …, `PROVIDED`).
2. Rủi ro theo module: cao/trung bình/thấp, **lý do có nguồn** (ảnh hưởng tiền, dữ liệu, nhiều người dùng, thay đổi nhiều). Mức rủi ro là `AI-PROPOSAL` cho tới khi lead duyệt.
3. Chọn loại test theo `references/test_types_matrix.md`. Loại trong mục "Để sau" của kit (performance, security chuyên sâu, a11y đầy đủ, UAT) ghi rõ **cần gì** để làm, không tự lên lịch.
4. Môi trường + dữ liệu: env thuộc `sandbox_urls`; prefix data; người dọn data; SMS/email thật đã tắt chưa.
5. Tiêu chí entry/exit/suspend: viết đo được ("0 bug S1 mở", "100% TC P1 đã chạy"). Ngưỡng là quyết định của lead: đề xuất, ghi `AI-PROPOSAL`.
6. Ước lượng: ghi **cách tính** (số TC × phút/TC, hoặc so dự án trước có nguồn) và giả định. Không có cơ sở → `UNKNOWN`, không đưa số đẹp.
7. Unknowns + câu hỏi cho lead/PO; "Bước tiếp theo".

**`close`**
1. Đếm từ nguồn: TC chạy/chưa chạy, passed/failed/flaky/blocked, bug theo severity, requirement chưa có TC (trace index). Mỗi số ghi file nguồn.
2. Nhãn kết quả: cao nhất là nhãn trong file run (`LOCAL-RUN`/`CI-RUN`/`MANUAL-RUN`). `RUN-PASSED` chỉ khi `server_review: yes` và run ghi SHA đã review.
3. So từng tiêu chí exit của test plan: đạt / không đạt / không đủ bằng chứng.
4. Đề xuất go / no-go / go có điều kiện, ghi `AI-PROPOSAL`, liệt kê rủi ro còn lại. **Người quyết định là QA lead + PO.**
5. Không làm đẹp: giữ nguyên lần fail, flaky, phần chưa test và lý do.

## Output
- `<output_dir>/decisions/PLAN-<PROJECT>-<NN>.md` hoặc `SUMMARY-<PROJECT>-<NN>.md`, front-matter `produced_by: test-strategy`, `labels: [AI-PROPOSAL]`, `source`, `status: draft`.
- Bản gửi khách: `node {{KIT}}/scripts/export/to-external.js <file>` (chuyển nhãn thành lời) rồi **G4**.

## Gate và giới hạn
- **G4** trước khi gửi plan/summary ra ngoài nhóm (khách, kênh chung).
- Không tự đặt SLA, deadline, ngưỡng exit như đã chốt. Không chạy test (việc của `ui-automation`/`api-testing`).
- Metric bắt nguồn từ file do AI ghi → độ tin cậy giới hạn bởi file đó; báo cáo ghi `Enforcement: local-only` khi `server_review` khác `yes` (📝 + 🛡️ khi có review server).

## Self-check
- [ ] Mỗi dòng phạm vi/rủi ro có nguồn hoặc ghi `UNKNOWN`
- [ ] Ước lượng có cách tính và giả định; không có số không nguồn
- [ ] Tiêu chí exit đo được, ghi `AI-PROPOSAL`
- [ ] Mode `close`: mọi metric trỏ tới file nguồn; flaky/fail không bị bỏ
- [ ] Không có `RUN-PASSED` khi `server_review` khác `yes`
- [ ] Go/no-go ghi rõ người quyết định là lead + PO
- [ ] Có Unknowns và "Bước tiếp theo"
