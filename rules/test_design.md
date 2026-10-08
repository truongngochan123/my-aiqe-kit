# Rule: Thiết kế test case

> Kế thừa `ai-qe-kit/rules/test_design.md`. Thêm cột Auto Type, bộ tag, quy ước Source cho TC từ reverse spec.

## 1. Kỹ thuật bắt buộc cân nhắc
| Kỹ thuật | Dùng khi |
|---|---|
| Equivalence Partitioning | Input có nhóm giá trị được xử lý giống nhau |
| Boundary Value Analysis | Có min, max, độ dài, khoảng |
| Decision Table | Nhiều điều kiện kết hợp ra kết quả khác nhau |
| State Transition | Có trạng thái và luồng (đơn hàng, phê duyệt) |
| Pairwise | Nhiều chiều kết hợp, số tổ hợp lớn |
| Risk-Based Testing | Ưu tiên theo xác suất × mức ảnh hưởng |

## 2. Format test case
```markdown
| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
```
- **TC ID:** theo `id_conventions.md` (mặc định `TC-<MODULE>-<NNN>`).
- **Source:** mọi TC trỏ về ít nhất một `AC-*`. TC dựng từ hành vi **đã quan sát** trên app ghi `HYP-<id>`, **không** ghi `AC-`; hành vi chưa quan sát → câu hỏi `Q-`, không phải TC. Quy tắc do BA/dev kể lại qua user, chưa có tên + ngày hoặc mã ticket → `PRV-<MODULE>-NN` (nhãn `PROVIDED` + câu hỏi xin nguồn), **không** `HYP-`. Không có nguồn thì ghi `Not specified` và đưa vào danh sách câu hỏi.
- **Steps và Expected:** đánh số khớp 1-1.
- **Test Data:** giá trị cụ thể (`QA-r042-emp01`), không viết "dữ liệu hợp lệ". Email dùng `@example.com`. **Tên người/tên record cũng mang prefix** (First Name `QA-r001-An`) để tìm và dọn được trên site dùng chung.
- **Mỗi field có validation TC riêng**, không gộp nhiều field vào một TC.
- **Priority:** P1–P4. **Risk:** Critical / High / Medium / Low. Cách đặt: mục 2b.
- **Automatable:** Yes / No / Partial. **Auto Type:** UI / API / Unit / N/A.
- **Tags:** `@Smoke`, `@Regression`, `@CriticalPath`, `@Security`, `@Boundary`, `@A11y`, `@Mobile`.
- **Không dùng ký hiệu tắt tự đặt** (ví dụ `C0`, `E`, `R`, `N1`). Cần phân loại thì viết chữ đầy đủ (Happy / Negative / Boundary / Edge). Ký hiệu nào thật sự cần thì phải có bảng chú thích ngay trong file.

## 2a. TC chạy được và mục thăm dò: không trộn chung
| | **TC chạy được** | **Mục thăm dò / câu hỏi** |
|---|---|---|
| Khi nào | Expected **đã biết** và có nguồn | Expected **chưa biết** (`UNKNOWN` / `Not specified`) |
| Nguồn expected | `REQ-CONFIRMED`, `DOM-OBSERVED`, kỳ vọng hiển nhiên #1–#4 (`bug_report.md` mục 1b) | Không có |
| Nằm ở | Bảng TC (có cột `TC ID`) | Bảng riêng, khóa bằng mã câu hỏi `Q-<MODULE>-NN` (**không** có cột `TC ID`, nên không bị xuất sang Excel như TC) |
| Chạy thế nào | Pass/fail theo expected | Quan sát rồi ghi lại hành vi; có câu trả lời của PO/BA hoặc quan sát xong thì **chuyển thành TC** |

- TC có expected từ `DOM-OBSERVED` kiểm tra **hành vi hiện tại không đổi**, không chứng minh hành vi đó đúng. Ghi rõ trong cột Expected: "(hành vi quan sát ngày …, chưa có requirement xác nhận)".
- **Không** viết TC với expected "UNKNOWN", "cần xác nhận", "tùy hệ thống".

## 2b. Đặt Priority theo rủi ro thật
1. Đánh **Risk** = khả năng xảy ra × mức ảnh hưởng (nghiệp vụ, dữ liệu, bảo mật, số người dùng bị ảnh hưởng).
2. Quy đổi mặc định (dự án có quy ước khác thì theo dự án):

| Priority | Khi nào |
|---|---|
| P1 | Luồng chính bắt buộc phải chạy được (smoke), hoặc Risk Critical (mất/sai dữ liệu, bảo mật, chặn người dùng) |
| P2 | Risk High: chức năng quan trọng, có cách vòng |
| P3 | Risk Medium |
| P4 | Risk Low: hiển thị, trường hợp hiếm |

3. **"Chưa biết expected" không phải lý do tăng priority.** Điểm chưa rõ đi vào bảng thăm dò (mục 2a), không đội priority của TC.

## 3. Oracle tốt và oracle yếu
| Oracle yếu ❌ | Oracle mạnh ✅ |
|---|---|
| Click Save không báo lỗi | Tìm theo ID vừa tạo, thấy đúng row |
| Thấy toast "Thành công" | Trong **chính row đó** có đúng giá trị nghiệp vụ (ví dụ department) |
| HTTP 200 | Đọc lại record và so từng field với input |

## 4. Payload tấn công
TC dùng payload XSS hoặc SQL injection phải gắn tag `@Security`, chỉ chạy trên env thuộc `sandbox_urls`, và cần G1.

## 5. Self-check
- [ ] Mỗi TC có Source; mọi AC có ít nhất một TC
- [ ] Đủ Positive, Negative, Boundary, Edge
- [ ] Test Data cụ thể, không chứa PII hay secret thật
- [ ] Không TC nào chỉ dùng oracle yếu
- [ ] Điểm mơ hồ hoặc `Not specified` được tách riêng để hỏi
- [ ] Không TC nào có expected chưa biết; những mục đó nằm ở bảng thăm dò
- [ ] Priority dựa trên Risk; không có ký hiệu tắt chưa chú thích
