# Checklist duyệt Đợt 1 (khoảng 20 phút)

Trả lời Có/Không. Câu "Không" thì ghi lại và báo Claude/Codex sửa trước khi sang Đợt 2.

## A. Chạy lệnh (5 phút): PowerShell tại `D:\fpt-inform\my-aiqe-kit`
| # | Lệnh | Mong đợi (dòng cuối) | Có/Không |
|---|---|---|---|
| 1 | `node scripts/verify/check-skills.js` | `Đã kiểm tra 8 skill, 0 lỗi.` | |
| 2 | `node scripts/verify/check-tc.js --self-test` và `node scripts/verify/check-bug.js --self-test` | `… 13/13 đúng` và `… 15/15 đúng` | |
| 3 | `node scripts/verify/grep-clean.js` | `Sạch: …` | |

## B. Đọc kỹ 3 file (10 phút), không đọc lướt toàn bộ
| # | Câu hỏi | Có/Không |
|---|---|---|
| 4 | Mở `skills/requirement-analysis/SKILL.md` mục mode B: có cảnh báo "requirement dựng ngược có thể chứa bug", và cột **Quyết định để trống cho người**? | |
| 5 | Mở `skills/evidence-reporting/SKILL.md`: `failed` không có evidence thì ghi `Insufficient evidence`; có dòng `Enforcement`; không có `RUN-PASSED` khi chưa có review trên server? | |
| 6 | Mở `skills/ai-output-review/SKILL.md` mục Gate: **không ép phải có Reject**; toàn Accept thì ghi "đã kiểm tra những gì"? | |

## C. Pilot trên Codex (5 phút xem lại kết quả đã chạy)
| # | Câu hỏi | Có/Không |
|---|---|---|
| 7 | Đã cài lại kit → khởi động lại VS Code → chat mới trước khi chạy pilot? | |
| 8 | 9 prompt pilot + `TDR-EXISTING-01`: đúng skill, `grade.js` ĐẠT với các file có output? | |
| 9 | Đề bài golden (`evals/golden/bug-reporting.task.md`) đã đưa cho Codex; đáp án ghi `DRAFT-BY: Codex`, Han đã duyệt và điền `REVIEWED-BY`? | |

## Chưa làm ở Đợt 1 (không tính là lỗi)
- Automation (Playwright, API), CI: Đợt 2.
- Đáp án golden: Codex viết, không phải Claude.
