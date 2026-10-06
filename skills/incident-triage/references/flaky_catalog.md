# Danh mục nguyên nhân test flaky

> Lấy từ `antigravity-testing-kit-main/.agent/skills/flaky_test_analyzer/SKILL.md:24-30` (5 nhóm nguyên nhân).
> **Bỏ** bước "Fix — tự áp dụng" (`:39`) và "Verify — chạy lại nhiều lần" không có gate (`:40`, `:98`):
> ở kit này, sửa là `AI-PROPOSAL`, chạy lại để xác nhận cần **G2** và ghi rõ số lần.

Flaky = cùng code, cùng env, chạy nhiều lần cho kết quả khác nhau. Phải có ≥ 2 lần chạy làm bằng chứng mới gọi là flaky.

| # | Nhóm | Dấu hiệu trong evidence | Discriminating check | Hướng sửa (đề xuất) |
|---|---|---|---|---|
| 1 | **Locator không ổn định** | "element not found", "strict mode violation: resolved to 2 elements"; locator dùng class động, `nth-child`, XPath tuyệt đối | Mở trace ở lần fail: element có tồn tại nhưng thuộc tính đổi? Có 2 element khớp? | Đổi sang locator có scope theo thứ tự ưu tiên ở `{{KIT}}/rules/automation_standards.md` mục 1 |
| 2 | **Thời điểm (timing)** | Fail ở bước ngay sau thao tác mở dialog/tải trang; pass khi chạy chậm (headed, debug) | So thời điểm trong trace: action diễn ra trước khi element sẵn sàng? | Chờ đúng tín hiệu (auto-wait, `expect` polling); **không** thêm sleep |
| 3 | **Chờ sai cách** | Có `waitForTimeout`, `Thread.sleep`, delay cố định trong code | Tìm hard sleep trong file test và page object | Thay bằng chờ tín hiệu gắn với oracle |
| 4 | **Môi trường / phụ thuộc ngoài** | Lỗi 5xx, timeout mạng, dịch vụ bên thứ ba, chỉ fail ở một số giờ | Kiểm tra log/health của dịch vụ cùng thời điểm; chạy test khác cùng dịch vụ | Báo người phụ trách env; cô lập bằng mock nếu được phép |
| 5 | **Xung đột data test** | Fail khi chạy song song, pass khi chạy riêng; "duplicate key", record không đúng mong đợi | Chạy riêng lẻ (1 worker) vs song song, cùng commit: kết quả khác nhau? | Data riêng cho mỗi test/run (prefix hoặc registry), cleanup đúng owner |
| 6 | **Thứ tự test / phụ thuộc lẫn nhau** | Fail khi đổi thứ tự hoặc chạy một mình | Chạy test đó một mình | Bỏ phụ thuộc: mỗi test tự tạo dữ liệu của nó |
| 7 | **Trạng thái còn sót** | Fail sau một test khác bị lỗi giữa chừng; cookie/phiên cũ | Kiểm tra cleanup của test trước; dữ liệu còn sót theo prefix | Cleanup trong `afterEach`/fixture; context mới cho mỗi test |

Nhóm 6 và 7 là bổ sung, không có trong bộ gốc.

## Sau khi sửa: kiểm tra độ ổn định
- [ ] Locator chỉ khớp 1 element, vẫn đúng sau reload
- [ ] Không còn hard sleep
- [ ] Data mỗi test là riêng
- [ ] Test chạy độc lập, không phụ thuộc test khác
- [ ] Chạy lại N lần để xác nhận: **cần G2**; N do policy dự án đặt và **ghi vào báo cáo**; giữ mọi lần fail trong báo cáo
