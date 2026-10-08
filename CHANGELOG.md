# CHANGELOG

Mỗi version có 3 mục: **Thêm / Sửa / Bỏ**. Version theo SemVer, ghi trong file `VERSION`.
Bản `-dev` là bản đang dựng, chưa chốt.

## 0.1.0-dev (đang dựng)

### Thêm
- Đợt 0 (06/10/2026): nền móng — `AGENTS.md`, `CLAUDE.md`, 8 rules, docs (BUILD_PLAN, SKILL_SPEC, threat model, tool support, checklist), adapter cho Codex và Claude, 2 hook dùng chung, script cài/gỡ/kiểm tra.
- `.gitattributes`: LF cho file văn bản, CRLF cho `.ps1`, binary cho Excel/ảnh/zip.
- `docs/BUILD_PLAN.md`: quyết định #14 (Codex viết đáp án golden), #18 (Codex dùng trước 10/10 chỉ để test routing và viết golden), #25–#28; thêm `sql_oracle.md`; thêm ai-product-testing vào "Để sau".

- Đợt 1 Bước 1: 3 skill mẫu (`bug-reporting`, `test-design-rbt`, `incident-triage`) + references; 6 prompt FULL RBT; 4 template; script `md_to_xlsx`, `redact`, `to-external`, `lib/config`.

- `scripts/project/new-project.ps1` + `new-project.js`: tạo thư mục dự án mới và `.aiqe/project.aiqe.yml` (điền tên, URL, module, ngôn ngữ; còn lại mặc định chặt nhất; không ghi đè).

- `rules/bug_report.md` mục 1b: danh sách đóng 4 **kỳ vọng hiển nhiên** dùng làm nguồn expected khi không có requirement; skill `bug-reporting`, template bug và `to-external.js` cập nhật theo.

- Đợt 1 (07/10): 5 skill `requirement-analysis`, `test-data`, `exploratory-testing`, `ai-output-review`, `evidence-reporting`; `check-tc.js`, `check-bug.js` (bắt buộc chạy trong 2 skill mẫu); 7 template; eval cho 8 skill; `grade.js`, `prepare-isolated.ps1`; đề bài golden `bug-reporting`; `md_to_xlsx --all-columns`; `AGENTS.md` thêm cách tạo dự án và cài/cập nhật kit.

### Thêm (08/10)
- Đợt 2: skill `ui-automation`, `api-testing` (+ references); scaffold Playwright TS; `aiqe-verify.js`, `oracle-patterns.js`; CI GitHub/GitLab, `CODEOWNERS.example`, `docs/proposal_for_lead.md`; `approval_card.md`; 6 prompt automation; eval 2 skill; `review_checklist_dot2.md`.
- Agent 0.2.0 lõi: `docs/agent_design.md`, `agent/` (controller, guard, state machine, evidence store, approval, planner mock/codex/api, 11 kịch bản, 18 test).
- Q9: `check-skills.js` so bảng field giữa bản gốc và prompt 05. Q10: output mặc định `<repo>/.aiqe/output/`, `new-project` thêm `.aiqe/` vào `.git/info/exclude`.

### Sửa (08/10)
- Tên người/record trong data mang prefix; regex ID data cho phép chữ hoa. `test-design-rbt` luôn có "Bước tiếp theo".
- Fixture chỉ tính file dữ liệu (tránh báo nhầm tài liệu `.md`).
- Agent: lỗ hổng tự gây ra khi viết controller (đi vòng qua AWAIT_G1 để quay lại ACT sau VERIFY) đã sửa trước khi commit.

### Sửa (07/10)
- `install.js`: chạy từ bản đã cài (`~/.aiqe/kit/...`) sẽ xóa chính thư mục nguồn → từ chối, chỉ ra đường dẫn repo kit; `installed.json` thêm trường `source`.
- `ai-output-review`: bỏ "thường có ít nhất 1 Reject"; toàn Accept thì ghi rõ đã kiểm tra những gì.

### Sửa (từ pilot T1 lần 2, 07/10)
- `test-design-rbt` bước 0: đã có bộ TC cùng module thì hỏi (a) cập nhật hay (b) viết mới trước khi ghi file; viết mới thì không đọc/chép file cũ. Mode `maintain` nhận thêm trường hợp "luật kit đổi".
- Thêm `evals/test-design-rbt/cases.md` với case `TDR-EXISTING-01` (đã có TC cũ) và `TDR-EXISTING-02` (case âm).

### Sửa (từ pilot T1 trên Codex, 07/10)
- `rules/evidence_labels.md`: phân biệt rõ `DOM-OBSERVED` (QA tự quan sát, kể cả kể lại trong prompt) và `PROVIDED` (nguồn khác); bảng tình huống mẫu.
- `rules/test_design.md` mục 2a, 2b: tách TC chạy được / mục thăm dò; Priority theo Risk; cấm ký hiệu tắt tự đặt.
- Skill `test-design-rbt`, template `test_case_table.md`, prompt 05 và 06 cập nhật theo.

### Sửa (phát hiện khi kiểm tra Đợt 1 Bước 1)
- `redact.js --check` trên file đã che vẫn báo còn dữ liệu (khớp lại chữ `[REDACTED]`) → bỏ qua chỗ đã che.
- `install.js` không chép `scripts/node_modules` vào bản cài → `md_to_xlsx` chạy từ bản cài báo thiếu thư viện. Sửa: chép kèm, cảnh báo nếu chưa `npm install`.
- `exceljs` kéo theo `uuid@8` có cảnh báo bảo mật → ép `uuid@11.1.1` (`overrides`).

### Sửa (phát hiện khi kiểm tra Đợt 0)
- Hook: input có BOM (PowerShell 5.1 thêm khi pipe) làm hook không đọc được JSON và cho qua → bỏ BOM trước khi đọc.
- install.js: cài lại lần 2 làm mất danh sách permission do kit thêm, nên gỡ cài đặt không xóa được → cộng dồn qua các lần cài.
- install.js: backup file nằm khác ổ đĩa với home tạo đường dẫn có dấu ":" → bỏ dấu ":".
- install.ps1: lưu UTF-8 có BOM để PowerShell 5.1 đọc đúng tiếng Việt.
- settings.json (Claude): đổi pattern sang `//**/.env` (áp dụng mọi ổ đĩa trên Windows), thêm luật `PowerShell(...)`.

### Bỏ
- 15 lệnh tắt của Claude (`adapters/claude/commands/`): gọi skill bằng tên đầy đủ trên cả hai tool, đỡ bảo trì và đỡ trùng trong danh sách skill.
- 15 file `adapters/codex/prompts/` có trong plan v4.1: Codex đã đánh dấu custom prompts là deprecated, dùng skill thay thế (xem `docs/tool_support.md`).
