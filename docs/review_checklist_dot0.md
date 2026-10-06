# Checklist duyệt Đợt 0 (khoảng 15 phút)

Trả lời Có/Không. Có câu "Không" thì ghi lại và báo Claude sửa trước khi sang Đợt 1.

## A. Chạy lệnh (5 phút): mở PowerShell tại `D:\fpt-inform\my-aiqe-kit`
| # | Lệnh | Mong đợi | Có/Không |
|---|---|---|---|
| 1 | `node adapters/hooks/block-secret-read.js --self-test evals/hooks/test-hooks.md` | Dòng cuối `20/20 case đúng` | |
| 2 | `node adapters/hooks/block-assertion-edit.js --self-test evals/hooks/test-hooks.md` | Dòng cuối `25/25 case đúng` | |
| 3 | `node scripts/verify/grep-clean.js` | Dòng cuối `Sạch: ...` | |
| 4 | `.\scripts\install\install.ps1 -HomeDir $env:TEMP\aiqe-fake -DryRun` | Liệt kê việc sẽ làm, **không** ghi file thật | |

## B. Đọc (10 phút): soát kỹ 3 file, không đọc lướt toàn bộ
| # | Câu hỏi | Có/Không |
|---|---|---|
| 5 | Mở `AGENTS.md`: bạn hiểu được 9 nguyên tắc mà không cần hỏi lại? | |
| 6 | Mở `docs/threat_model.md` mục 3: chọn 1 guard bất kỳ, bạn giải thích được vì sao nó là 🛡️, 🧯 hay 📝? | |
| 7 | Mở `rules/bug_report.md` mục 1: 7 điều kiện tạo bug khớp với những gì đã thống nhất? | |
| 8 | Mở `project.aiqe.example.yml`: mỗi field đều có giải thích và giá trị mặc định? | |
| 9 | Mở `docs/tool_support.md`: các câu ghi `UNKNOWN` có kèm cách kiểm tra? | |

## C. Chưa làm ở Đợt 0 (không tính là lỗi)
- Chưa có skill nào (Đợt 1).
- Chưa cài kit vào máy thật: chỉ cài thử vào thư mục giả. Cài thật khi bạn đồng ý.
