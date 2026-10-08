# Checklist duyệt Đợt 3 + agent (khoảng 30 phút)

Trả lời Có/Không. Câu "Không" thì ghi lại và báo sửa trước khi chốt 0.1.0 / 0.2.0 (10/10).

## A. Chạy lệnh (12 phút, từ thư mục repo kit)
| # | Lệnh | Mong đợi (dòng cuối) | Có/Không |
|---|---|---|---|
| 1 | `node scripts/verify/check-skills.js` | `Đã kiểm tra 16 skill, 0 lỗi.` | |
| 2 | `node scripts/jira/jira_fetcher.js --self-test` và `node scripts/jira/xray_importer.js --self-test` | `7/7 đúng` và `6/6 đúng` | |
| 3 | `node scripts/trace/build-trace-index.js --self-test` | `trace-index self-test: 8/8 đúng` | |
| 4 | `cd agent; npm test` | `# pass 30` · `# fail 0` | |
| 5 | `cd agent; npm run agent -- demo` | Bảng 5 kịch bản, cột Kết quả ghi "MÔ PHỎNG", `Evidence: nguyên vẹn` | |
| 6 | Chép `templates/scaffold/selenium-java` ra thư mục tạm, `mvn -q test-compile` | exit 0 | |

## B. Đọc kỹ (10 phút)
| # | Câu hỏi | Có/Không |
|---|---|---|
| 7 | `skills/jira-xray/SKILL.md`: AI **không** tự chạy lệnh có `--env-file`, không nhận token qua chat; `--push` là G4 do người chạy? | |
| 8 | `scripts/jira/xray_importer.js` phần đầu file: thấy đủ các lỗi của bản gốc đã sửa (map key sai, flaky, trace có cookie, bỏ test không key)? | |
| 9 | `agent/src/tools/cleanup_owned_record.ts`: chỉ xóa `empNumber` run đã ghi, tra lại sau khi xóa? | |
| 10 | `skills/regression-selection/SKILL.md`: thiếu coverage map thì **từ chối chọn**? | |

## C. Chạy thật (8 phút, người chạy)
| # | Việc | Có/Không |
|---|---|---|
| 11 | Tạo `.env.sandbox` (tài khoản demo OrangeHRM), chạy luồng **tạo nhân viên** của agent (README agent, `--scenario happy --tools real`), gõ `dong y <run ID>` khi được hỏi G1. Kết quả `LOCAL-RUN: passed` hoặc lý do rõ; record `QA-r…` đã bị xóa (tra lại trên site) | |
| 12 | Cài kit với `--tool gemini` (nếu dùng Gemini): `install.ps1 -Verify` báo `Tất cả khớp.` | |
| 13 | Routing Đợt 3 trên Codex theo `evals/routing.md` (có thể làm 10/10) | |

## Chưa làm ở Đợt 3 (không tính là lỗi)
- Golden Selenium/Appium: đề đã có, đáp án do Codex viết.
- Appium chưa chạy trên thiết bị; Gemini chưa kiểm chứng việc đọc skill/hook (`UNKNOWN`).
- Planner `codex` của agent: chờ output Q11.
