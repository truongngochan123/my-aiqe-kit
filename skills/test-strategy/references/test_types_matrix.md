# Bảng chọn loại test

> Dùng ở bước 3 của `test-strategy` mode `plan`. Cột "Kit hỗ trợ" cho biết skill nào của kit làm được; "Để sau" = kit chưa hỗ trợ, cần điều kiện ghi ở `docs/BUILD_PLAN.md` mục 8.
> Nguồn gốc: bảng "Scope of Testing" trong `antigravity-testing-kit-main/.agent/skills/qa_automation_engineer/references/TEST_STRATEGY.md`, thêm cột điều kiện và skill.

| Loại | Áp dụng khi | Cần có trước | Kit hỗ trợ | Ghi chú |
|---|---|---|---|---|
| Functional manual (EP/BVA/DT/ST) | Mọi tính năng có hành vi người dùng | AC hoặc quan sát app | `test-design-rbt` | Ưu tiên theo risk |
| Exploratory | Requirement mỏng, tính năng mới, sau khi sửa lớn | Charter, thời gian đóng khung | `exploratory-testing` | Không thay thế TC cho phần rủi ro cao |
| UI automation (Playwright TS) | Luồng ổn định, chạy lặp lại nhiều (smoke, regression) | TC bảng 3a, locator `DOM-OBSERVED`, env sandbox | `ui-automation` | Selenium/Appium Java: beta |
| API | Có API tài liệu hóa (OpenAPI/Postman) | Spec API, tài khoản test | `api-testing` | Chỉ GET khi chưa có G1 |
| Regression có chọn lọc | Có thay đổi code/config | Coverage map | `regression-selection` | Thiếu map → không chọn, chạy smoke |
| Accessibility (axe) cơ bản | Trang web công khai, yêu cầu WCAG | Chuẩn mục tiêu | `ui-automation` (`a11y_axe.md`) | Không làm fail test mặc định; a11y đầy đủ: Để sau |
| Mobile (Appium) | App native/hybrid | Thiết bị/emulator, build app | `ui-automation` beta | `references/appium-java.md` |
| Performance (k6, JMeter) | Có SLA, có env load riêng | SLA có nguồn, env, quyền | Để sau | Cấm gây tải trên site dùng chung |
| Security chuyên sâu | Có văn bản cho phép | Scope pháp lý, env cô lập | Để sau | Kiểm tra cơ bản (quyền, lộ dữ liệu) vẫn nằm trong functional |
| UAT | Người dùng nghiệp vụ nghiệm thu | Mẫu UAT của khách | Để sau | QA hỗ trợ chuẩn bị data |
| Test sản phẩm có AI (hallucination, RAG) | Sản phẩm có tính năng AI | Bộ câu hỏi/đáp án tham chiếu, ngưỡng PO đặt | Để sau (`ai-product-testing`) | Oracle là thống kê |

## Câu hỏi để chọn
1. Lỗi ở phần này gây hại gì (tiền, dữ liệu, pháp lý, nhiều người dùng)? → quyết định độ sâu.
2. Phần này đổi thường xuyên không? → đổi nhiều thì automation tốn công bảo trì.
3. Có oracle không (AC, kỳ vọng hiển nhiên `rules/bug_report.md` mục 1b)? → không có thì bắt đầu bằng exploratory + câu hỏi.
4. Có env và data an toàn không? → không có thì loại test ghi dữ liệu phải chờ.
