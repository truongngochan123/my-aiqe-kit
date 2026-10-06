# Rule: Retry, wait và dừng an toàn

> Kế thừa `ai-qe-kit/rules/retry_and_wait.md`. Thêm: nhãn `flaky`, retry ở cấp framework, tỉ lệ tái hiện cho test manual.

## 1. Retry matrix

| Loại | Ví dụ | Được retry? | Điều kiện | Evidence phải giữ |
|---|---|---|---|---|
| Thao tác chỉ đọc | `inspect_ui` timeout trước khi có output | ✅ có giới hạn | Không có side effect; số lần theo policy dự án | Mọi lần thử kèm lỗi |
| Assertion polling | `expect(row).toContainText(...)` | ✅ trong timeout của assertion | **Expected value không đổi** | Thời gian chờ thực tế |
| Retry cấp framework | `retries: 1` trong CI | ⚠️ được bật | Report phải hiện trạng thái **flaky** và lần fail đầu | Trace của lần fail đầu |
| Chạy lại cả case | Chạy lại bằng tay | ⚠️ chỉ khi có **G2** | Run/attempt ID mới; attempt cũ vẫn giữ | Cả attempt fail lẫn attempt mới |
| Ghi dữ liệu khi chưa rõ kết quả | Create bị timeout | ❌ **KHÔNG** | Kiểm tra bằng thao tác chỉ đọc trước | Timeline + kết quả tra cứu |

Số lần hoặc thời gian retry là **policy của dự án**, không phải SLA của sản phẩm. Ghi rõ điều này trong báo cáo.

## 2. Nhãn khi có retry
- Fail rồi pass ở lần retry → `LOCAL-RUN: flaky` hoặc `CI-RUN: flaky`. **Không** ghi `passed`.
- Báo cáo liệt kê lần fail đầu (lỗi, trace) **trước** lần pass.
- Test có trạng thái flaky phải được chuyển cho `incident-triage`.

## 3. Lỗi tái hiện không đều (test manual)
- Ghi **tỉ lệ tái hiện**: `3/5` (tái hiện 3 lần trong 5 lần thử), kèm điều kiện mỗi lần (dữ liệu, trình duyệt, thời điểm).
- Dưới 2 lần thử thì ghi `Insufficient evidence` cho tỉ lệ.
- Bug report ghi tỉ lệ này ở mục Reproducibility.

## 4. Ghi dữ liệu khi chưa rõ kết quả
```
WRITE gửi đi → timeout / không có phản hồi
  → state = OUTCOME_UNKNOWN (chặn mọi WRITE mới)
  → tra record theo ID của chính run (chỉ đọc)
      ├─ Có record, đúng owner → ghi evidence; bước tiếp cần người hoặc G2
      ├─ Không có record      → vẫn cần G2 trước khi tạo lại (có thể bị trễ)
      └─ Không tra được       → BLOCKED_NEEDS_HUMAN
```

## 5. Wait
- **Cấm** hard sleep: `waitForTimeout`, `Thread.sleep`, delay cố định.
- Chờ **tín hiệu gắn với oracle**: ví dụ row chứa đúng ID xuất hiện, rồi assert department trong chính row đó.
- Assertion fail thì **không** đổi expected value và **không** nới timeout vô hạn. Ghi `HYPOTHESIS` và thiết kế discriminating check.
- Độ trễ search/index chưa có contract thì ghi `Not specified`.

## 6. Dừng an toàn
Mọi nhánh dừng (hết budget, bị từ chối duyệt, cleanup fail, user hủy) đều phải:
1. Dừng mọi WRITE mới
2. Lưu evidence hiện có (không xóa)
3. Ghi trạng thái cleanup và các record còn tồn tại kèm owner
4. Chuyển sang trạng thái kết thúc rõ ràng: `FAILED`, `BLOCKED`, `CANCELLED` hoặc `CLEANUP_PENDING`
5. Nêu người phụ trách và bước tiếp theo

Test pass nhưng cleanup fail thì **không** được ghi pass.
