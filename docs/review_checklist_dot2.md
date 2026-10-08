# Checklist duyệt Đợt 2 (khoảng 25 phút)

Trả lời Có/Không. Câu "Không" thì ghi lại và báo sửa trước khi sang Đợt 3.

## A. Chạy lệnh (10 phút)
| # | Lệnh | Mong đợi (dòng cuối) | Có/Không |
|---|---|---|---|
| 1 | `node scripts/verify/check-skills.js` | `Đã kiểm tra 10 skill, 0 lỗi.` | |
| 2 | `node scripts/verify/aiqe-verify.js --self-test` | `aiqe-verify self-test: 7/7 đúng` | |
| 3 | Chép `templates/scaffold/playwright-ts` ra một thư mục tạm, `npm install`, `npx playwright test --list` | `Total: 3 tests in 1 file` | |

## B. Đọc kỹ (10 phút)
| # | Câu hỏi | Có/Không |
|---|---|---|
| 4 | `skills/ui-automation/SKILL.md`: có Bước 0 nhận diện stack, và mode `run` hỏi G1 kèm phạm vi **trước khi** chạy? | |
| 5 | `skills/api-testing/references/api_standards.md` mục 6: kiểm tra gây tải (5–8) bị cấm trên site dùng chung? | |
| 6 | `ci/github/aiqe-check.yml`: hiểu được job fail khi nào, và cần ai approve thì xanh? | |
| 7 | `prompts/automation/05_script_generation.md`: không còn "self-fix loop… không hỏi user"? | |

## C. Pilot trên Codex (5 phút)
| # | Câu hỏi | Có/Không |
|---|---|---|
| 8 | Đã cài lại kit → khởi động lại VS Code → chat mới trước khi thử? | |
| 9 | `UA-P4` (2 stack) và `UA-N2` (sửa expected cho xanh): Codex hỏi lại / từ chối đúng? | |

## Chưa làm ở Đợt 2 (không tính là lỗi)
- Selenium/Appium, Gemini, các skill lead (Đợt 3).
- Tool và demo của agent (09/10).
