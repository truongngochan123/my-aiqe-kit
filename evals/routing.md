# Eval routing toàn kit (Đợt 3)

> Mục tiêu: **≥ 90%** prompt chọn đúng skill trên Codex, **mỗi prompt chạy 3 lần** (chat mới mỗi lần). Cách chạy một case: `evals/README.md`.
> Nguồn prompt: case dương và âm trong `evals/<skill>/cases.md` của 16 skill, cộng các cặp dễ nhầm dưới đây.

## 1. Danh sách file case
| Skill | File | Số case (dương + âm) |
|---|---|---|
| requirement-analysis, test-design-rbt, test-data, exploratory-testing | `evals/<skill>/cases.md` | xem từng file |
| bug-reporting, incident-triage, ai-output-review, evidence-reporting | `evals/<skill>/cases.md` | xem từng file |
| ui-automation, api-testing | `evals/<skill>/cases.md` | xem từng file |
| test-strategy, regression-selection, jira-xray | `evals/<skill>/cases.md` | 3 + 2 mỗi skill |
| run-contract, agent-architecture, qe-coach | `evals/<skill>/cases.md` | 3 + 2 mỗi skill |

## 2. Cặp dễ nhầm (thêm khi 2 skill có "Dùng khi" gần nhau)
| # | Prompt | Skill đúng | Dễ nhầm với | Vì sao |
|---|---|---|---|---|
| R1 | Tổng kết đợt test tuần này cho cả release, đề xuất có phát hành không. | `test-strategy` (close) | `evidence-reporting` | Cả release, nhiều run, go/no-go |
| R2 | Báo cáo kết quả RUN-20261009-02 cho team. | `evidence-reporting` | `test-strategy` | Một run |
| R3 | PR này đổi API tạo nhân viên, chạy lại test nào? | `regression-selection` | `api-testing` | Hỏi chọn, chưa hỏi chạy |
| R4 | Kéo story KAN-7 về rồi phân tích điểm mờ giúp mình. | `jira-xray` → rồi `requirement-analysis` | `requirement-analysis` | Bước đầu là lấy dữ liệu; chấm: có lệnh fetch cho người chạy trước |
| R5 | Chuẩn bị cho agent chạy case xóa nhân viên: precondition, oracle, cleanup. | `run-contract` | `agent-architecture` | Một case cụ thể |
| R6 | Review kiến trúc agent của team: planner có quyền gọi Playwright trực tiếp. | `agent-architecture` | `run-contract`, `ai-output-review` | Thiết kế hệ thống |
| R7 | Hướng dẫn mình tự triage test fail này, đừng làm hộ. | `qe-coach` | `incident-triage` | Người dùng muốn tự làm |
| R8 | Test fail này vì sao? Mình cần kết luận gấp. | `incident-triage` | `qe-coach` | Cần kết quả |
| R9 | Dự án mình dùng Selenium Java, viết test cho TC-PIM-001. | `ui-automation` (beta Selenium) | `test-design-rbt` | Code test, stack Java |
| R10 | Kiểm tra output AI vừa viết test plan này có bịa không. | `ai-output-review` | `test-strategy` | Soát output AI |

## 3. Cách tính
- Mỗi prompt 3 lần → 3 dòng kết quả. Routing đúng khi `produced_by` (hoặc skill AI khai đã đọc, với case không ghi file) khớp cột "Skill đúng".
- Tỉ lệ = số lần đúng / tổng số lần. Ghi riêng tỉ lệ của case 🪤 (bẫy).
- Prompt sai ≥ 2/3 lần → xem lại `description` của 2 skill liên quan, thêm từ khóa phân biệt, chạy lại.

## 4. Kết quả (điền tay)
| Ngày | Tool | Tổng lần chạy | Đúng | Tỉ lệ | Prompt sai nhiều nhất | Ghi chú |
|---|---|---|---|---|---|---|
