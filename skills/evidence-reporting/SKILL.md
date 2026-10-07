---
name: evidence-reporting
description: Báo cáo một lần chạy test (automation hoặc chạy tay): evidence manifest, execution report giữ lần fail đầu, nhãn LOCAL/CI/MANUAL-RUN, dòng Enforcement; mode manual-run tạo execution sheet. Dùng khi "báo cáo lần chạy", "chạy tay TC". Không dùng cho báo cáo cả sprint → test-strategy.
---

# Evidence Reporting

> Chuẩn: `{{KIT}}/rules/evidence_labels.md`, `{{KIT}}/rules/reporting_and_data.md`, `{{KIT}}/rules/retry_and_wait.md`.
> Mẫu: `{{KIT}}/templates/execution_sheet.md`, `{{KIT}}/templates/evidence_manifest.md`, `{{KIT}}/templates/execution_report.md`.

## Khi dùng / Không dùng
- **Dùng:** báo cáo **một lần chạy** (một run ID): automation chạy local/CI, hoặc tester chạy tay bộ TC.
- **Không dùng:**
  - Báo cáo cả sprint/release, go/no-go → `test-strategy` mode `close` (Đợt 3).
  - Test fail chưa rõ nguyên nhân → `incident-triage` trước, rồi đưa kết luận vào báo cáo.
  - Viết từng bug → `bug-reporting`; báo cáo chỉ **link** bug ID, không chép nội dung bug.

## Mode
| Mode | Việc |
|---|---|
| `run` (mặc định) | Từ reporter output/log của automation → evidence manifest + execution report |
| `manual-run` | (1) sinh **execution sheet** từ bộ TC; (2) nhận pass/fail tester điền; (3) execution report |

## Đầu vào
- Run ID `RUN-<YYYYMMDD>-<NN>`, build/version, env, người chạy, thời điểm.
- `project.aiqe.yml`: `server_review` (quyết định nhãn cao nhất và dòng `Enforcement`), `output_language`.
- Mode `run`: reporter output (JSON/HTML/console), trace/screenshot ref, kết luận `incident-triage` cho các test fail (nếu có).
- Mode `manual-run`: file TC (`produced_by: test-design-rbt`, **chỉ bảng 3a**: TC chạy được); sau đó là sheet đã được tester điền.
- Không có reporter/trace → `Insufficient evidence`, không tự điền kết quả.

## Quy trình (mode `manual-run`)
1. **Sinh execution sheet** theo `{{KIT}}/templates/execution_sheet.md`: mỗi TC chạy được một dòng; cột Result, Actual, Evidence, Bug ID để trống cho tester. Mục thăm dò (`Q-*`) **không** đưa vào sheet.
2. Cần Excel → `node {{KIT}}/scripts/convert/md_to_xlsx.js <sheet.md> --all-columns` (giữ đủ cột của sheet).
3. **Nhận kết quả** tester điền (md, xlsx đã chuyển lại, hoặc dán vào chat). Mỗi dòng:
   - `MANUAL-RUN: passed` hoặc `MANUAL-RUN: failed`, kèm build, env, người chạy, thời điểm.
   - `failed` **bắt buộc có evidence** (screenshot/video/log). Không có → ghi `Insufficient evidence`, **không** coi là failed đã xác nhận, không tạo bug.
   - `failed` có evidence → có Bug ID, hoặc ghi "chưa có bug → `bug-reporting`"; chưa rõ do sản phẩm hay do TC/data → "→ `incident-triage`".
   - TC không chạy được (thiếu data, env lỗi) → `Blocked` kèm lý do; chưa chạy → `Not run`. **Không** gộp vào failed hay passed.
4. Viết execution report (bước chung bên dưới).

## Quy trình (mode `run`)
1. **Evidence manifest** theo `{{KIT}}/templates/evidence_manifest.md`: mỗi attempt một dòng; cột "Thiếu gì" bắt buộc. Trace ref chưa mở/kiểm tra → `Insufficient evidence`.
2. Nhãn mỗi attempt: `LOCAL-RUN` (máy cá nhân) hoặc `CI-RUN` (CI, SHA chưa review); `RUN-PASSED/RUN-FAILED` **chỉ** khi CI chạy trên SHA đã được người khác review và `server_review: yes`. Pass ở lần retry → `flaky`.
3. Approval audit: mỗi hành động (chạy, chạy lại, dọn data, publish) ghi gate đã có hay thiếu.

## Execution report (chung cho 2 mode)
Theo `{{KIT}}/templates/execution_report.md`:
- Thứ tự thời gian; **giữ lần fail đầu** và mọi lần chạy lại.
- Bảng tổng: passed / failed / flaky / blocked / not run / insufficient evidence.
- Dòng bắt buộc: `Enforcement: server-review` (khi `server_review: yes`) hoặc `Enforcement: local-only`.
- Unknowns, `Not specified`, cleanup (dữ liệu nào còn, ai dọn), bước tiếp theo, người phụ trách.
- Bug: chỉ ghi ID + link.

## Output
- Mode `manual-run`: `<output_dir>/runs/<RUN-ID>/execution-sheet.md` (+ `.xlsx`), sau đó `execution-report.md`.
- Mode `run`: `<output_dir>/runs/<RUN-ID>/evidence-manifest.md` + `execution-report.md`.
- Front-matter: `id: <RUN-ID>`, `source: [TC-…]`, `labels: [MANUAL-RUN: … | LOCAL-RUN: … | CI-RUN: …]`, `produced_by: evidence-reporting`, `status: draft | done`.
- Bản gửi khách: `node {{KIT}}/scripts/export/to-external.js <report>` (G4: người gửi).

## Gate và giới hạn
- Không ghi pass khi thiếu evidence, thiếu trace, hoặc cleanup chưa xong.
- Không xóa attempt fail vì attempt sau pass.
- Không tự điền kết quả cho TC tester chưa chạy.
- Gửi báo cáo ra ngoài: **G4**, người làm.

## Self-check
- [ ] Mọi kết quả có nhãn đúng loại chạy (MANUAL/LOCAL/CI/RUN); không có `RUN-PASSED` khi `server_review` khác `yes`
- [ ] Mọi `failed` có evidence; thiếu evidence ghi `Insufficient evidence`
- [ ] Blocked/Not run tách riêng, không gộp vào passed/failed
- [ ] Lần fail đầu còn trong báo cáo; flaky ghi là flaky
- [ ] Có dòng `Enforcement`
- [ ] Bug chỉ link ID; failed chưa có bug ghi skill tiếp theo
- [ ] Execution sheet không chứa mục thăm dò `Q-*`
- [ ] Có front-matter `produced_by: evidence-reporting`
