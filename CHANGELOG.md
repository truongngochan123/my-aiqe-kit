# CHANGELOG

Mỗi version có 3 mục: **Thêm / Sửa / Bỏ**. Version theo SemVer, ghi trong file `VERSION`.
Bản `-dev` là bản đang dựng, chưa chốt. Agent có version riêng trong `agent/package.json`.

## 0.1.1-dev (12/10/2026) · Đợt 4: Chuẩn hóa độ tin cậy kiểm thử

Triển khai trọn vẹn 5 hạng mục Đợt 4 theo đối chiếu học phần AOCE.

### Thêm
- `agent/config/flows.json`: Flow catalog cho phép agent chạy theo danh mục các test flow đã phê duyệt; `agent/src/catalog.ts` nạp và ánh xạ allowlist động.
- `ci/github/live-smoke.yml`: Template workflow live smoke CI GitHub Actions với 5 chốt chặn: preflight check, concurrency lock, fail khi 0 test chạy, reconcile data với `always()`, upload artifact.
- `templates/metrics.md`: Chuẩn hóa bảng metric kiểm thử bắt buộc có mẫu số (`X/Y, %`), không ghi số đơn lẻ thiếu bối cảnh.
- `templates/risk_register.md`: Sổ theo dõi rủi ro kiểm thử có Risk ID, owner, biện pháp kiểm soát và hạn hoàn thành.
- `templates/quarantine_record.md`: Thẻ cách ly test flaky với 4 thông tin bắt buộc (owner, risk of omission, compensating control, expiry date).
- `agent/tests/agent.test.ts`: Thêm 2 unit test xác minh telemetry usage (`UNKNOWN` khi planner không báo, không ghi 0) và flow catalog (chặn case lạ ngoài catalog).

### Sửa
- `agent/src/types.ts`: Bổ sung kiểu `PlannerUsage`, các trường `kitVersion`, `promptVersion`, `usage` và `plannerCalls`.
- `agent/src/controller.ts`: Ghi nhận `kitVersion`, `promptVersion` ở `run_start`/`run_end`, đếm lượt gọi planner và trích xuất usage (hoặc `UNKNOWN`), kiểm tra case thuộc flow catalog (chặn case lạ).
- `agent/src/report.ts`: Xuất `kit_version`, `prompt_version`, `usage` trong front-matter và thân báo cáo (không ghi 0).
- `agent/src/tools/read_case.ts`, `run_case.ts`, `index.ts`: Nhận catalog tùy chọn để kiểm tra tính hợp lệ của caseId.
- `agent/src/cli.ts`: Nạp catalog từ `config/flows.json` và cập nhật tool manifest.
- `rules/retry_and_wait.md`: Thêm mục 7 về Quy trình cách ly test flaky (Quarantine Protocol).
- `skills/test-strategy/SKILL.md`: Tích hợp `templates/metrics.md` và `templates/risk_register.md` vào quy trình lập kế hoạch và đóng release.
- `skills/incident-triage/SKILL.md`: Tích hợp lập thẻ `quarantine_record.md` khi phát hiện test flaky tái diễn.
- `docs/BUILD_PLAN.md`: Đánh dấu hoàn tất 5 việc của Đợt 4.

## 0.1.0 (10/10/2026) · agent 0.2.0-rc.1

Chốt sau khi Han review 2 commit Đợt 3 + agent. Lượt test gộp trên Codex: `evals/round_0.1.0.md`; lỗi tìm được sẽ sửa ở 0.1.1.
Agent giữ `0.2.0-rc.1` cho tới khi luồng tạo nhân viên có G1 chạy thật (Q14).

### Sửa (10/10)
- `check-tc`: dòng tổng chỉ nhận dòng ngoài bảng bắt đầu bằng `**Tổng` / `Tổng:` (trước đây `\bTổng\b` khớp nhầm "tổng hợp"); không có thì báo "thiếu dòng tổng". Self-test 19/19.
- `test-design-rbt` mode `full`: `references/full_mode_steps.md` (mục bắt buộc từng bước, giữ đúng tên + số cột bảng, gợi ý 2 scenario bảo mật cho màn đăng nhập); prompt 02/03/04 ghi rõ.
- `HYP-` chỉ cho hành vi **đã quan sát**; chưa quan sát → câu hỏi `Q-`; yêu cầu trong tài liệu không có mã → `PRV-` (`id_conventions`, `test_design`, `requirement-analysis`, prompt 04/05).
- Hook `block-secret-read`: chặn **mọi** `--env-file`/`--env-file-if-exists` trừ `.env.sandbox` (file token có thể đặt tên bất kỳ). 27/27 case.
- `install.js`: nâng version thì xóa snapshot cũ trong `~/.aiqe/kit/` (trước đây bỏ sót, gỡ cài không xóa).

### Thêm (10/10)
- `docs/BUILD_PLAN.md`: mục "ĐỢT 4 (sau 0.1.0, chưa làm)" (5 việc từ đối chiếu học phần AOCE).
- `evals/round_0.1.0.md`: danh sách test gộp theo ưu tiên + ước lượng lượt Codex.

## Lịch sử dựng 0.1.0 (06–09/10)

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
- Agent: 6 tool thật (`src/tools/`), `report.ts`, `cli.ts` (`run`/`report`/`verify`/`demo`), case `EMP-CREATE-01`, kịch bản `readonly`; 30 test. Luồng chỉ đọc chạy thật trên OrangeHRM demo.
- Đợt 3 (làm sớm, lịch là 09/10): 6 skill `test-strategy`, `regression-selection`, `jira-xray`, `run-contract`, `agent-architecture`, `qe-coach` (+ 2 reference); `scripts/jira/` (5 file, viết lại từ bản gốc, có self-test); `scripts/trace/build-trace-index.js` (đọc regex từ `rules/id_conventions.md`); subagent `qe-reviewer` cho Claude; Selenium Java + Appium Java beta (2 reference, 2 scaffold); adapter Gemini + `install.js --tool gemini`; 6 template; eval 6 skill, đề golden Selenium/Appium, `evals/routing.md`; `review_checklist_dot3.md`; 3 case hook mới (lệnh `--env-file`).

### Sửa (08/10)
- Agent: run dùng tool giả ghi nhãn "MÔ PHỎNG", không còn `LOCAL-RUN` (phát hiện khi chạy demo). Timeout tool có đăng nhập 30 s → 60 s (site demo chậm, đo ≈ 21 s); báo cáo nêu lỗi tool ở "Bước tiếp theo". Tool báo `created: false` thì không cần dọn; trạng thái `unknown` xử lý như timeout.
- `ui-automation`: Bước 0 nhận Selenium/Appium Java (beta) thay vì từ chối.
- Sau pilot T2/T3 (quyết định #35): script kiểm tra là cổng bắt buộc (`AGENTS.md`, `test-design-rbt`, `bug-reporting`); mã `PRV-` cho quy tắc kể lại (`id_conventions`, `evidence_labels`, `test_design`, prompt 04); `check-tc` bắt dòng tổng sai mẫu/sai số, dòng bảng vỡ, `REQ-CONFIRMED` không nguồn, giảm cảnh báo ngày giả; mode `full` gộp bước 1+2, marker `aiqe-stop-in-skill` trong 6 prompt, `check-skills` so điểm dừng; prompt 06 dùng đúng mẫu dòng tổng; 4 eval case mới.
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
