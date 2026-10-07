---
name: bug-reporting
description: Viết, review hoặc retest bug report có evidence và expected có nguồn; xuất bản internal và bản gửi khách. Dùng khi "viết bug", "log bug", "retest bug", soát bug người khác. Không dùng khi chưa rõ lỗi do test hay sản phẩm → incident-triage; báo cáo cả lần chạy → evidence-reporting.
---

# Bug Reporting

> Chuẩn bắt buộc: `{{KIT}}/rules/bug_report.md` (7 điều kiện, severity, vòng đời), `{{KIT}}/rules/evidence_labels.md`.
> Mẫu: `{{KIT}}/templates/bug_report.md`.

## Khi dùng / Không dùng
- **Dùng:** đã thấy lỗi **của sản phẩm** và có evidence; soát bug người khác viết; retest bug dev báo đã sửa.
- **Không dùng:**
  - Test automation fail, chưa biết do test, môi trường hay sản phẩm → `incident-triage` trước. Chỉ viết bug khi triage kết luận "product behavior".
  - Báo cáo kết quả cả một lần chạy (nhiều TC) → `evidence-reporting`.
  - Hành vi lạ nhưng requirement không nói phải thế nào, và **không** thuộc danh sách kỳ vọng hiển nhiên → **không phải bug**: tạo câu hỏi `Q-*` cho BA/PO (xem bước 2).

## Mode
| Mode | Việc | Ví dụ lời gọi |
|---|---|---|
| `write` (mặc định) | Viết bug mới | "viết bug: bấm Lưu khách hàng 2 lần tạo 2 bản ghi" |
| `review` | Soát bug người khác theo 7 điều kiện, chỉ ra lỗi theo dòng | "/bug-reporting review BUG-CUS-012" |
| `retest` | Kiểm tra lại bug đã sửa, ghi kết quả có evidence | "$bug-reporting retest BUG-CUS-012 trên build 1.4.2" |

## Đầu vào
| Cần | Bắt buộc? | Thiếu thì |
|---|---|---|
| Actual + evidence (screenshot/video/log, đã che dữ liệu nhạy cảm) | ✅ | Chỉ tạo **bản nháp**, ghi `Insufficient evidence` |
| Expected + nguồn: (a) `AC-*`/requirement/PO xác nhận, hoặc (b) **kỳ vọng hiển nhiên #1–#4** khi không có requirement | ✅ | Không thuộc (a) hay (b) → **không tạo bug**, tạo câu hỏi `Q-*` |
| Build/version, env, trình duyệt/thiết bị | ✅ | Hỏi user, không đoán |
| Các bước tái hiện, data đã dùng | ✅ | Hỏi user |
| Tỉ lệ tái hiện (ví dụ `3/5`) | Nên có | Ghi `Insufficient evidence` cho mục này |
| CSV danh sách bug do **người** export từ Jira/tool | Nên có | Ghi "Chưa kiểm tra trùng: thiếu CSV" |
| Output của `incident-triage` (front-matter `produced_by: incident-triage`) | Khi lỗi đến từ automation | Gợi ý chạy `incident-triage` trước |
| `project.aiqe.yml`: thang severity, `severity_mapping`, `output_language` | — | Thang mặc định S1–S4, tiếng Việt |

## Quy trình (write)
1. **Đọc yml** để lấy thang đo và ngôn ngữ.
2. **Kiểm tra 7 điều kiện** của `{{KIT}}/rules/bug_report.md` mục 1, theo thứ tự này:
   - Evidence của actual chỉ là `HYPOTHESIS`/`AI-PROPOSAL`, hoặc không có → dừng, tạo bản nháp `status: draft` + `Insufficient evidence`.
   - Tìm nguồn cho expected theo `{{KIT}}/rules/bug_report.md` điều kiện 3:
     (a) có requirement/AC → dùng; (b) không có requirement → so với **danh sách đóng 4 mục** ở mục 1b (lỗi hệ thống · dữ liệu lưu sai/mất · lộ dữ liệu/vượt quyền · tài khoản hợp lệ không đăng nhập được). Khớp → expected ghi `kỳ vọng hiển nhiên #n` + `AI-PROPOSAL` + "cần PO/BA xác nhận expected". **Không tự mở rộng danh sách**.
   - Không có nguồn (a) hay (b) → dừng, **không tạo bug**; viết câu hỏi `Q-<MODULE>-NN`: hành vi quan sát được, câu hỏi, vì sao quan trọng. Ví dụ trùng tên, độ dài tối đa, nội dung thông báo là câu hỏi, không phải bug.
   - Lỗi đến từ automation mà chưa có kết luận triage → dừng, chuyển `incident-triage`.
3. **Kiểm tra trùng** trong CSV: so module, tiêu đề, bước tái hiện. Nghi trùng → báo ID bug cũ và hỏi user, không tạo mới.
4. **Che dữ liệu nhạy cảm** trong log/HAR đính kèm: `node {{KIT}}/scripts/redact/redact.js <file>`; nhắc user tự che screenshot.
5. **Viết bug** theo `{{KIT}}/templates/bug_report.md`:
   - Tiêu đề `[Module] Hành động → kết quả sai`, không chứa nhận định ("nghiêm trọng", "rất tệ").
   - Bước tái hiện đánh số, có data cụ thể.
   - Expected kèm nguồn; Actual kèm nhãn evidence.
   - **Severity:** dùng giá trị tester đưa. Tester chưa đưa → đề xuất kèm lý do theo bảng định nghĩa, gắn `AI-PROPOSAL`, hỏi tester xác nhận.
   - **Priority:** luôn là `AI-PROPOSAL`; quyết định thuộc PO/lead.
   - Giả thuyết nguyên nhân (nếu có) để ở mục Notes, gắn `HYPOTHESIS`.
6. **Xuất 2 bản:**
   - Internal: `<output_dir>/bugs/BUG-<MODULE>-<NNN>.md` (có front-matter, giữ nhãn).
   - External: `node {{KIT}}/scripts/export/to-external.js <file>` → `<output_dir>/external/` (bỏ front-matter, nhãn chuyển thành lời, bỏ priority đề xuất).
7. **Không tự đẩy lên Jira.** Đưa user file để **người** đẩy lên sau G4.

## Quy trình (review)
Chấm bug theo 7 điều kiện + format. Output: bảng `# | Điều kiện | Đạt? | Dòng | Cần sửa`. Không viết lại thay người viết trừ khi được yêu cầu.

## Quy trình (retest)
1. Ghi build/version mới, env, người chạy, thời điểm.
2. Chạy lại đúng các bước tái hiện (người chạy hoặc automation; skill này không tự chạy test).
3. Kết quả có evidence → `MANUAL-RUN: passed|failed` (hoặc `LOCAL-RUN`/`CI-RUN`). Fail không có evidence → `Insufficient evidence`.
4. Cập nhật `status`: `verified` (pass) hoặc `reopened` (fail), thêm mục "Lịch sử retest" (giữ mọi lần, không xóa lần trước).

## Output
- Front-matter:
  ```yaml
  id: BUG-<MODULE>-<NNN>
  source: [AC-..., TC-...]
  labels: [MANUAL-RUN: failed]
  produced_by: bug-reporting
  status: draft | ready | submitted | verified | reopened | closed
  ```
- Bị chặn ở bước 2 → output là bản nháp hoặc file câu hỏi `Q-*` (`produced_by: bug-reporting`, `status: draft`), kèm lý do rõ ràng.

## Gate và giới hạn
- **G4:** đẩy bug lên Jira/tool hoặc gửi khách → **người** làm. AI không giữ token (🛡️ khi token không nằm trong môi trường AI, xem `{{KIT}}/docs/threat_model.md`).
- Không bịa message lỗi, mã lỗi, log, build number. Không có → hỏi hoặc `UNKNOWN`.
- Không nâng severity/priority để bug "được chú ý".
- Không viết bug cho hành vi requirement không quy định.

## Self-check
- [ ] Actual có evidence thật (không phải `HYPOTHESIS`/`AI-PROPOSAL`); thiếu thì status là `draft`
- [ ] Expected có nguồn (a) requirement hoặc (b) kỳ vọng hiển nhiên #1–#4 kèm `AI-PROPOSAL` + "cần PO/BA xác nhận"; không có thì đã chuyển thành câu hỏi, không tạo bug
- [ ] Không dùng kỳ vọng hiển nhiên cho thứ ngoài danh sách (trùng lặp, độ dài, định dạng, nội dung thông báo, UX, tốc độ)
- [ ] Đã kiểm tra trùng hoặc ghi rõ chưa kiểm tra vì thiếu CSV
- [ ] Bước tái hiện đánh số, có data cụ thể, người khác làm lại được
- [ ] Có build/version, env, tỉ lệ tái hiện
- [ ] Severity do tester đưa hoặc gắn `AI-PROPOSAL`; priority gắn `AI-PROPOSAL`
- [ ] Log/HAR đã redact; đã nhắc che screenshot
- [ ] Tiêu đề mô tả hành vi, không có nhận định
- [ ] Có bản external; bản external không còn nhãn kỹ thuật và không còn front-matter
