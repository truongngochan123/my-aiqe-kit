# Rule: Bug report

> Chuẩn cho skill `bug-reporting` (Đợt 1). Thang đo có thể đổi trong `project.aiqe.yml`.

## 1. Bảy điều kiện tạo bug
1. **Actual phải có evidence**: `MANUAL-RUN: failed`, `LOCAL-RUN: failed`, `CI-RUN: failed`, `RUN-FAILED` hoặc `DOM-OBSERVED`, kèm screenshot/video/log. **Không** tạo bug từ `HYPOTHESIS` hay `AI-PROPOSAL`. Thiếu evidence → chỉ tạo **bản nháp**, ghi `Insufficient evidence`.
2. **Severity do tester đánh giá. Priority chỉ là đề xuất** (`AI-PROPOSAL`); quyết định priority thuộc PO hoặc lead.
3. **Expected phải có nguồn**, theo thứ tự ưu tiên:
   - (a) Requirement/AC: `AC-*`, `REQ-CONFIRMED`.
   - (b) Không có requirement nhưng hành vi thuộc **danh sách kỳ vọng hiển nhiên** ở mục 1b → expected ghi nguồn `kỳ vọng hiển nhiên #n`, gắn `AI-PROPOSAL`, kèm ghi chú **"cần PO/BA xác nhận expected"**.
   - Không thuộc (a) hay (b) → ghi `Not specified`, chuyển thành **câu hỏi làm rõ requirement** (`Q-*`), **không** tạo bug.
   - Requirement có nói và **mâu thuẫn** với kỳ vọng hiển nhiên → theo requirement, đồng thời đặt câu hỏi cho PO.
4. **Kiểm tra trùng trước khi tạo**, dựa trên file CSV danh sách bug do **người** export từ tool quản lý bug (AI không giữ token Jira).
5. **Redact** log, HAR bằng `redact.js`. Screenshot do người tự che.
6. **Retest/verify fix** là một mode của skill, không phải skill riêng.
7. **Đẩy lên Jira/tool quản lý bug do người làm, sau G4.** Skill chỉ chuẩn bị file.

## 1b. Danh sách kỳ vọng hiển nhiên (danh sách ĐÓNG)

Dùng khi sản phẩm **không có requirement** cho hành vi đó (ví dụ app demo, hệ thống cũ không tài liệu). Chỉ 4 mục dưới đây; **không tự thêm mục**. Muốn thêm mục mới thì sửa file này và ghi vào `CHANGELOG.md`.

| # | Kỳ vọng | Ví dụ là lỗi | Ví dụ **không** thuộc mục này |
|---|---|---|---|
| 1 | **Không có lỗi hệ thống**: không trang lỗi máy chủ (HTTP 5xx), không stack trace hiện cho người dùng, không crash, không treo, không màn hình trắng | Bấm Save → trang báo lỗi 500 | Hiện thông báo lỗi nghiệp vụ dễ hiểu ("Required") |
| 2 | **Dữ liệu đã lưu đúng như đã nhập và không mất**: đọc lại thấy khớp; thao tác báo thành công thì phải có tác dụng | Nhập "QA-r001", lưu xong mở lại thấy "QA-r00"; báo "Saved" nhưng danh sách không có | Hệ thống tự cắt khoảng trắng đầu/cuối; định dạng ngày hiển thị khác cách nhập |
| 3 | **Không lộ dữ liệu, không vượt quyền**: không thấy/sửa được dữ liệu của tài khoản khác khi không được cấp quyền; không hiện mật khẩu/token trên giao diện, URL | User thường mở URL trang admin và sửa được dữ liệu | Admin thấy dữ liệu mọi người (có thể là thiết kế) |
| 4 | **Tài khoản hợp lệ đăng nhập được**: tài khoản trước đó đăng nhập được (có quan sát), cùng thông tin, nay không đăng nhập được mà không có thông báo khóa/hết hạn | Admin đăng nhập ngày 06/10 được, 07/10 cùng mật khẩu báo sai | Tài khoản bị khóa sau nhiều lần sai (có thể là chính sách) |

**Không** thuộc danh sách (luôn là câu hỏi `Q-*` khi không có requirement): quy tắc trùng lặp (trùng tên, trùng email), độ dài tối đa, định dạng field, nội dung thông báo lỗi, thứ tự sắp xếp, giao diện/UX, tốc độ, quy tắc khóa tài khoản.

Bug dùng nguồn (b) vẫn phải đủ điều kiện 1 (evidence thật). Trong bản external, nguồn này viết là "kỳ vọng chung của phần mềm, chờ PO xác nhận".

Bổ sung:
- Ghi **tỉ lệ tái hiện** (ví dụ `3/5`) theo `retry_and_wait.md`.
- Bản **external** chuyển nhãn thành lời (xem `evidence_labels.md` mục 5), không xóa nhãn.

## 2. Format
```markdown
---
id: BUG-<MODULE>-<NNN>
source: [AC-..., TC-...]
labels: [MANUAL-RUN: failed, ...]
produced_by: bug-reporting
status: draft | ready | submitted | verified | closed
---
# [<Module>] <Hành động> → <kết quả sai> (ngắn, cụ thể)

| Trường | Giá trị |
|---|---|
| Environment / Build | ... |
| Severity | S1–S4 (tester đánh giá) |
| Priority (đề xuất) | P1–P4 (`AI-PROPOSAL`) |
| Reproducibility | 5/5 |
| Related | TC-..., AC-... |

## Pre-condition
## Steps to reproduce   (đánh số, có data cụ thể)
## Expected             (kèm nguồn AC)
## Actual               (kèm nhãn evidence)
## Evidence             (ref tới screenshot/video/log đã redact)
## Notes                (giả thuyết nguyên nhân gắn HYPOTHESIS, nếu có)
```
Tiêu đề không chứa nhận định ("lỗi nghiêm trọng", "rất tệ"); chỉ mô tả hành vi.

## 3. Severity: định nghĩa có ví dụ
| Mức | Định nghĩa | Ví dụ |
|---|---|---|
| **S1** | Chặn luồng chính, mất hoặc hỏng dữ liệu, lỗ hổng bảo mật, không có cách vòng | Không đăng nhập được; lưu đơn hàng trừ tiền 2 lần; lộ dữ liệu khách khác |
| **S2** | Chức năng chính sai nhưng có cách vòng, hoặc ảnh hưởng nhiều người dùng | Lọc khách hàng theo ngày trả sai kết quả; phải tải lại trang mới thấy record mới |
| **S3** | Chức năng phụ sai, ảnh hưởng hạn chế | Sắp xếp cột "Ngày tạo" sai ở trang danh sách; thông báo lỗi không rõ nghĩa |
| **S4** | Giao diện, chính tả, không ảnh hưởng chức năng | Lệch căn lề nút; lỗi chính tả trong tooltip |

## 4. Priority (chỉ đề xuất)
| Mức | Gợi ý |
|---|---|
| P1 | Sửa ngay, chặn release |
| P2 | Sửa trong sprint hiện tại |
| P3 | Lên kế hoạch sprint sau |
| P4 | Khi có thời gian |

## 5. Quy đổi thang (mặc định, đổi trong yml `severity_mapping`)
| Kit | Jira/thang phổ biến |
|---|---|
| S1 | Blocker |
| S2 | Critical |
| S3 | Major |
| S4 | Minor |
| — | Trivial (không dùng trong thang mặc định; dự án dùng thì khai báo) |

## 6. Vòng đời
`draft` → `ready` (đủ 7 điều kiện) → `submitted` (người đẩy lên tool, G4) → `fixed` (dev báo) → `verified` (retest pass, có evidence) hoặc `reopened` → `closed`.

## 7. Internal và external
| | Internal | External (gửi khách) |
|---|---|---|
| Front-matter | Có | Bỏ |
| Nhãn evidence | Giữ nguyên | Chuyển thành lời |
| Priority đề xuất | Có | Bỏ, trừ khi lead duyệt |
| Giả thuyết nguyên nhân | Có (gắn `HYPOTHESIS`) | Chỉ giữ nếu viết "nghi ngờ, chưa xác minh" |
| Redact | Theo rule | Bắt buộc chạy `to-external.js` |
