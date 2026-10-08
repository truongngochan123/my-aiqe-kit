# Đề xuất cho lead: chốt chặn khi dùng AI để viết và chạy test

> Tài liệu để QA mang đi đề xuất. QA **không** tự cấu hình repo, CI hay quyền; lead/người có quyền quyết định.

## Vấn đề
Khi dùng AI (Codex, Claude) để viết hoặc sửa test, rủi ro lớn nhất không phải AI viết sai, mà là AI **làm test xanh giả**:
- sửa expected/assertion cho khớp với kết quả sai,
- thêm `.skip`/`.only` để bỏ qua test đỏ,
- sửa dữ liệu fixture,
- xóa test.

Kit của QA có hook và luật để **báo sớm** các việc này trên máy cá nhân, nhưng đó chỉ là lớp **chống sai sót**: chạy trên máy, nên lách được. **Chốt chặn thật chỉ có ở server**: CI + người thứ hai review.

## Đề xuất (theo mức ưu tiên)

| # | Việc | Ai làm | Công sức | Chặn được gì |
|---|---|---|---|---|
| 1 | Bật branch protection cho nhánh chính: bắt buộc PR, bắt buộc review, **người review khác tác giả** | Lead / admin repo | 10 phút | Không ai (kể cả AI dùng tài khoản của QA) tự merge |
| 2 | Thêm job `aiqe-check` (mẫu: `ci/github/aiqe-check.yml` hoặc `ci/gitlab/…`) và đặt là **required check** | Lead / DevOps | 30 phút | PR sửa assertion, thêm skip, sửa fixture, xóa test → đỏ cho tới khi người khác approve |
| 3 | CODEOWNERS cho `tests/`, `fixtures/`, cấu hình test, **`.github/`, `ci/aiqe/`** (mẫu: `ci/CODEOWNERS.example`) | Lead | 15 phút | PR không tự sửa được chính workflow kiểm tra |
| 4 | **Tách token**: QA/AI chỉ có token **đọc** Jira; token **ghi** Jira/Xray chỉ ở CI secret hoặc người duyệt | Admin Jira | 30 phút | AI không publish được kết quả/bug khi chưa duyệt (G4) |
| 5 | Env **sandbox riêng** cho test tự động, **tắt gửi SMS/email thật** | DevOps | tùy dự án | Test không ghi bẩn env dùng chung, không gửi tin cho người thật |
| 6 | Xác nhận chính sách: có được dùng AI với code/tài liệu của khách không, tool nào, tài khoản cá nhân hay doanh nghiệp | Lead + pháp chế/khách | 1 buổi trao đổi | Tránh vi phạm NDA |

## Nếu chưa làm được
- QA vẫn chạy `aiqe-verify.js` trên máy trước khi tạo PR (`node ci/aiqe/aiqe-verify.js --base origin/main`) và ghi kết quả vào mô tả PR.
- Mọi báo cáo của QA ghi `Enforcement: local-only`, kết quả cao nhất là `CI-RUN`/`LOCAL-RUN`, **không** có `RUN-PASSED`. Lead biết mức tin cậy thật của báo cáo.

## Không làm thì sao (ví dụ thực tế)
AI sửa `expect(total).toBe(100000)` thành `toBe(99000)` cho khớp với lỗi làm tròn tiền. Test xanh, báo cáo PASS, lỗi lên production. Không có job #2 và review #1 thì không ai thấy thay đổi đó trước khi merge.

## Câu hỏi cho lead
1. Repo dùng GitHub hay GitLab? Gói nào (để biết Code Owners có bắt buộc được không)?
2. Ai sẽ là người review (CODEOWNER) cho thư mục test?
3. Có env sandbox riêng chưa? SMS/email trên env test đã tắt chưa?
4. Chính sách dùng AI với dự án này là gì?
