# Eval: test-design-rbt

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat **mới**. Chấm: `node scripts/evals/grade.js <output_dir>` (đọc `produced_by`, chạy `check-tc.js`) + checklist.
> Ô `[...]`: điền từ quan sát thật của bạn.

## Case dương (phải kích hoạt `test-design-rbt`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **TDR-P1** | OrangeHRM (https://opensource-demo.orangehrmlive.com) không có tài liệu requirement. Quan sát của mình ngày [ngày], màn PIM > Add Employee: các field là [liệt kê, field nào có dấu *]; bỏ trống field bắt buộc rồi bấm Save thì hiện [message]. Viết test case cho Add Employee, làm nhanh một lượt. | Source `HYP-PIM-…`, không có `AC-`/`REQ-CONFIRMED`; quan sát gắn `DOM-OBSERVED` (người, env, ngày); bảng 3a và 3b tách riêng; dòng tổng đúng; **`check-tc.js` ĐẠT** và dòng cuối được báo nguyên văn |
| **TDR-P2** | Sinh test case cho màn Login của OrangeHRM theo đầy đủ quy trình 6 bước có phân tích rủi ro. Quan sát của mình ngày [ngày]: form có [các field]; sai mật khẩu thì hiện [message]; bỏ trống thì hiện [message]. | Mode `full`: **dừng ở bước 2** với câu hỏi đánh số; không tự trả lời; chưa ghi file TC |
| **TDR-P3** | Soát giúp bộ test case Employee List này: `\| TC1 \| Tìm nhân viên \| Nhập tên hợp lệ, bấm Search \| Hiện thông báo thành công \|`, `\| TC2 \| Xóa nhân viên \| Chọn 1 người, bấm Delete \| Không lỗi \|` | Mode `review`: chỉ ra thiếu Source, data mơ hồ, oracle yếu, không đánh số; không viết lại cả bộ khi chưa được yêu cầu |

## Case âm (KHÔNG được kích hoạt `test-design-rbt`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **TDR-N1** | Requirement nghỉ phép này còn thiếu gì? Chưa cần viết test case: "AC-LEAVE-01: Nhân viên gửi đơn nghỉ phép. AC-LEAVE-02: Quản lý duyệt hoặc từ chối đơn." | `requirement-analysis` | File `produced_by: requirement-analysis`; không có file TC |
| **TDR-N2** | Sinh giúp 10 bộ dữ liệu cụ thể cho TC-PIM-001 đến TC-PIM-003, có người dọn dữ liệu. | `test-data` | File `produced_by: test-data`; không viết lại TC |

---

## Case bổ sung: đã có bộ TC cũ (từ pilot T1 lần 2)

## TDR-EXISTING-01: đã có bộ TC cũ cùng module → phải hỏi trước

**Chuẩn bị** (trong thư mục dự án pilot, `output_dir` theo `.aiqe/project.aiqe.yml`):
1. Tạo file `<output_dir>/testcases/TC-PIM.md` với nội dung **bản cũ cố ý sai luật hiện hành** (dưới đây).
2. Mở chat **mới** của tool (Codex hoặc Claude).

Nội dung bản cũ:
```markdown
---
id: TC-PIM
source: [HYP-PIM-01]
labels: [AI-PROPOSAL]
produced_by: test-design-rbt
status: draft
---
# Test cases: PIM

| TC ID | Source | Scenario | Pre-condition | Steps | Expected | Test Data | Priority | Risk | Automatable | Auto Type | Tags |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-PIM-001 | HYP-PIM-01 | C0 Add employee | Đăng nhập | 1. Mở Add Employee<br>2. Bấm Save | 1. Form mở<br>2. Lưu được (`PROVIDED`) | QA-r001 | P1 | High | Yes | UI | @Smoke |
| TC-PIM-002 | HYP-PIM-02 | E Max length First Name | Đăng nhập | 1. Nhập 300 ký tự | 1. UNKNOWN, cần xác nhận | 300 ký tự A | P1 | Medium | Yes | UI | @Boundary |
```
Bản cũ cố ý có 4 lỗi theo luật hiện hành: quan sát của QA gắn `PROVIDED`; TC-PIM-002 có expected chưa biết nhưng nằm trong bảng TC; TC-PIM-002 đặt P1 vì chưa biết expected; ký hiệu tắt `C0`, `E`.

**Prompt** (giống pilot T1):
> OrangeHRM (https://opensource-demo.orangehrmlive.com) không có tài liệu requirement. Đây là quan sát của mình ngày [ngày], màn PIM > Add Employee: các field là [liệt kê]; bỏ trống field bắt buộc rồi bấm Save thì hiện [message]. Viết test case cho chức năng Add Employee, làm nhanh một lượt.

**Đúng khi (lượt trả lời đầu tiên):**
- [ ] Nhắc tới file `TC-PIM.md` đã có
- [ ] **Hỏi** user chọn (a) cập nhật bộ cũ hay (b) viết mới
- [ ] **Chưa ghi** file nào trong `testcases/` (kiểm tra thời gian sửa file)

**Lượt 2, user trả lời "(b) viết mới". Đúng khi:**
- [ ] Có file mới `TC-PIM.v2.md` (hoặc `v<N>` tiếp theo); `TC-PIM.md` cũ **không đổi** (so hash trước/sau)
- [ ] Không có dòng TC nào **giống nguyên văn** bản cũ (lệnh kiểm tra bên dưới)
- [ ] Quan sát của user gắn `DOM-OBSERVED` (có người quan sát, env, ngày), không gắn `PROVIDED`
- [ ] Có bảng **3a TC chạy được** và **3b mục thăm dò**; max length First Name nằm ở 3b với mã `Q-PIM-…`, không phải TC
- [ ] Không có ký hiệu tắt `C0`, `E`, `R`; không TC nào P1 chỉ vì chưa biết expected
- [ ] Front-matter `produced_by: test-design-rbt`

**Lượt 2 (thay thế), user trả lời "(a) cập nhật". Đúng khi:**
- [ ] Liệt kê từng TC cũ với trạng thái: giữ / sửa / chuyển sang thăm dò / lỗi thời, kèm lý do
- [ ] TC-PIM-002 được **chuyển sang mục thăm dò**; TC-PIM-001 được sửa nhãn thành `DOM-OBSERVED` và bỏ `C0`
- [ ] Không xóa TC cũ (TC lỗi thời ghi `status: deprecated`)

**Kiểm tra "không chép nguyên văn"** (PowerShell, thay đường dẫn `output`):
```powershell
$old = Get-Content <output>\testcases\TC-PIM.md | Where-Object { $_ -match '^\| TC-' }
$new = Get-Content <output>\testcases\TC-PIM.v2.md | Where-Object { $_ -match '^\| TC-' }
($new | Where-Object { $old -contains $_ }).Count   # mong đợi: 0
```

---

## TDR-EXISTING-02 (case âm): chưa có bộ TC cũ → không hỏi, làm luôn

**Chuẩn bị:** `<output_dir>/testcases/` **không có** file `TC-PIM*.md` (đổi tên hoặc chuyển đi chỗ khác).
**Prompt:** như TDR-EXISTING-01.
**Đúng khi:**
- [ ] **Không** hỏi (a)/(b); viết luôn
- [ ] Tạo `TC-PIM.md` với `produced_by: test-design-rbt`
- [ ] Có bảng 3a và 3b như luật hiện hành
