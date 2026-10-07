# Eval: bug-reporting

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat **mới**. Chấm: `node scripts/evals/grade.js <output_dir>` (đọc `produced_by`, chạy `check-bug.js`) + checklist dưới đây.
> Ô `[...]`: điền từ quan sát thật của bạn. Không điền chi tiết UI chưa tự thấy.

## Case dương (phải kích hoạt `bug-reporting`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **BR-P1** | Mình test tay OrangeHRM demo ngày [ngày], [trình duyệt]: PIM > Add Employee, nhập [dữ liệu], bấm Save thì [trang báo lỗi hệ thống / dữ liệu sau khi lưu khác dữ liệu đã nhập]. Ảnh: [đường dẫn]. Thử [x]/[y] lần. Viết báo lỗi giúp. | Tạo `BUG-PIM-…`; expected ghi `kỳ vọng hiển nhiên #1` hoặc `#2` + `AI-PROPOSAL` + "cần PO/BA xác nhận"; Actual `MANUAL-RUN: failed`; Priority gắn `AI-PROPOSAL`; báo "chưa kiểm tra trùng: thiếu CSV"; **`check-bug.js` ĐẠT** và dòng cuối được báo nguyên văn; có bản external |
| **BR-P2** 🪤 | Mình tạo 2 nhân viên cùng First Name "QA" và Last Name "Test" thì OrangeHRM vẫn cho tạo cả 2. Log bug giúp mình là hệ thống cho trùng tên nhân viên. | **Không** tạo bug; tạo file câu hỏi `Q-PIM-…` (`produced_by: bug-reporting`); giải thích trùng tên không thuộc 4 kỳ vọng hiển nhiên; `check-bug.js` chấm là câu hỏi, ĐẠT |
| **BR-P3** | Soát giúp bug này: "Tiêu đề: Lỗi nghiêm trọng ở PIM. Các bước: vào trang, bấm nút. Kết quả: bị lỗi. Mong đợi: không lỗi." | Mode `review`: bảng theo 7 điều kiện, chỉ ra thiếu evidence, thiếu nguồn expected, thiếu env/build, tiêu đề có nhận định, bước không đánh số; **không** viết lại bug thay người |
| **BR-P4** | Retest BUG-PIM-001 trên build [build mới], ngày [ngày]: làm lại đúng các bước thì [kết quả], ảnh [đường dẫn]. | Mode `retest`: thêm dòng vào "Lịch sử retest" (giữ lần trước); status `verified` hoặc `reopened`; nhãn `MANUAL-RUN`; không xóa thông tin cũ |

## Case âm (KHÔNG được kích hoạt `bug-reporting`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **BR-N1** 🪤 | Test tự động PIM-ADD-01 vừa fail: thêm nhân viên "QA-r002 Test" xong, tìm trong Employee List thì `expect(rows).toHaveCount(1)` nhưng nhận 0. Báo bug luôn đi. | `incident-triage` | Không có file `BUG-*`; có file incident (`produced_by: incident-triage`). Nếu `bug-reporting` được gọi nhưng tự dừng và chuyển sang triage → ghi "sai routing, guard đúng" |
| **BR-N2** | Hôm nay mình chạy tay 20 TC của bộ TC-PIM, 18 pass, 2 fail. Làm báo cáo lần chạy giúp. | `evidence-reporting` | Có execution report (`produced_by: evidence-reporting`); không tạo bug cho 2 TC fail khi chưa có evidence |
