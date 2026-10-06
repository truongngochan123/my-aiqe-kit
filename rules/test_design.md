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
- **Source:** mọi TC trỏ về ít nhất một `AC-*`. TC dựng từ reverse spec (requirement dựng ngược từ app) ghi `HYP-<id>`, **không** ghi `AC-`. Không có nguồn thì ghi `Not specified` và đưa vào danh sách câu hỏi.
- **Steps và Expected:** đánh số khớp 1-1.
- **Test Data:** giá trị cụ thể (`QA-r042-emp01`), không viết "dữ liệu hợp lệ". Email dùng `@example.com`.
- **Mỗi field có validation TC riêng**, không gộp nhiều field vào một TC.
- **Priority:** P1–P4. **Risk:** Critical / High / Medium / Low.
- **Automatable:** Yes / No / Partial. **Auto Type:** UI / API / Unit / N/A.
- **Tags:** `@Smoke`, `@Regression`, `@CriticalPath`, `@Security`, `@Boundary`, `@A11y`, `@Mobile`.

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
