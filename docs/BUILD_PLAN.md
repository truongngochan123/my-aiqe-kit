# BUILD_PLAN: my-aiqe-kit 0.1.0 + agent 0.2.0

> **File bàn giao.** Ai tiếp tục dựng kit (Claude hôm nay, Codex sau 10/10) đọc file này trước tiên.
> Bản này gộp plan v4.2 (đã duyệt) với các thay đổi sau khi tra tài liệu ngày 06/10/2026.
> **Quy tắc:** mọi khẳng định về file nguồn phải kèm `file:line`. Chưa mở file thì không khẳng định.
> Nguồn gốc: `ai-qe-kit/` ("bộ mới") và `antigravity-testing-kit-main/` ("bộ gốc") trong `D:\fpt-inform\antigravity-testing-kit-main 2\`.

## Trạng thái nhanh

| Đợt | Trạng thái | Ngày |
|---|---|---|
| 0: Nền móng | ✅ Xong, chờ duyệt | 06/10 |
| 1: Manual | ⏳ Chưa | 07/10 |
| 2: Automation + CI | ⏳ Chưa | 08/10 |
| 3: Lead, tích hợp, đa stack | ⏳ Chưa | 09/10 |
| Agent 0.2.0 | ⏳ Chưa | 08–10/10 |

---

## 0. Quyết định đã chốt

| # | Quyết định |
|---|---|
| 1 | **Codex** (qua extension VS Code) là AI chính lâu dài. Claude dùng ngang hàng |
| 2 | Repo riêng `D:\fpt-inform\my-aiqe-kit\`, git identity `Han <ghan42568@gmail.com>` |
| 3 | Mặc định cài ở cấp user. Tùy chọn `-Project` (ghi vào `.git/info/exclude`) |
| 4 | Output mặc định ngoài repo: `~/aiqe-output/<project>/` |
| 5 | Lõi trung lập (`AGENTS.md`, `rules/`, `skills/`, `prompts/`); phần riêng tool ở `adapters/` |
| 6 | MVP Playwright TS. Selenium/Appium Java là beta ở Đợt 3 |
| 7 | TC viết Markdown làm bản gốc, xuất Excel bằng `md_to_xlsx` (Đợt 1) |
| 8 | Output `vi`/`en` theo yml; template có tiêu đề song ngữ |
| 9 | Thang S1–S4 / P1–P4, có bảng quy đổi |
| 10 | Bản external: nhãn **chuyển thành lời**, không xóa; bỏ front-matter |
| 11 | Thiếu `project.aiqe.yml` → chạy ở mức chặt nhất |
| 12 | `ai_policy` = `UNKNOWN`: chỉ dùng với `practices/` và dự án cá nhân cho tới khi lead xác nhận |
| 13 | `practices/testcases/` là **AI sinh** (`antigravity-testing-kit-main/practices/testcases/crm/test_cases_crm_login.md:8` và `test_cases_customers.md:8` ghi "AI-RBT — FULL 6 bước"), gắn `PROVIDED`, không dùng làm golden |
| 14 | Golden: **Claude viết nháp** (`DRAFT-BY-AI`), người dùng duyệt (`REVIEWED-BY`). Ghi rõ golden này yếu hơn golden do người viết |
| 15 | Có nhãn `MANUAL-RUN` (build/version, env, người chạy, thời điểm; `failed` bắt buộc evidence) |
| 16 | Eval khoảng 55 prompt × 3 lần; cách ly golden bằng thư mục tạm |
| 17 | Bản cài là snapshot theo version `~/.aiqe/kit/<version>/` |
| 18 | **Claude làm toàn bộ tới 10/10.** Codex chỉ dùng sau 10/10 (eval trên Codex, làm tiếp, bảo trì) |
| 19 | Agent 0.2.0 dùng **planner giả lập** (chưa có API key); có chỗ cắm LLM thật |
| 20 | Demo agent trên **app giả chạy local** (khớp `OBS-PACKET-01`), không dùng site công khai |
| 21 🆕 | **Bỏ 15 file `adapters/codex/prompts/`**: Codex đã deprecated custom prompts; gọi skill bằng `$tên-skill` (`docs/tool_support.md` câu 2) |
| 22 🆕 | **Hook dùng chung** cho Claude và Codex ở `adapters/hooks/`; Codex có hook `PreToolUse` nhưng mặc định tắt → `config.toml` bật `[features] hooks = true` |
| 23 🆕 | Codex đọc skill ở `~/.agents/skills/` (không phải `~/.codex/skills/`) |
| 24 🆕 | Logic cài đặt viết bằng Node (`install.js`); `install.ps1` chỉ là lớp vỏ |

## 1. Lịch

| Ngày | Claude | Người dùng |
|---|---|---|
| 1 · 06/10 | `BUILD_PLAN.md` + Đợt 0 | Duyệt Đợt 0 theo `docs/review_checklist_dot0.md` |
| 2 · 07/10 | 3 skill mẫu → hết Đợt 1 + nháp golden | Thử 9 prompt (3 skill mẫu × 3) trước 13h; duyệt Đợt 1 và golden |
| 3 · 08/10 | Đợt 2 + `docs/agent_design.md` + lõi agent | Eval Đợt 1 (bằng `claude -p`) |
| 4 · 09/10 | Đợt 3 (cả phần beta Selenium/Appium, Gemini) + tool, planner, kịch bản, test của agent | Eval Đợt 2; duyệt Đợt 3 |
| 5 · 10/10 | Sáng: test agent + demo 5 kịch bản. Chiều: sửa theo eval, chốt 0.1.0 và 0.2.0 | Routing eval; chạy demo; duyệt cuối |
| Sau 10/10 | — (Codex tiếp quản) | Eval trên Codex; lỗi còn tồn ghi ở mục 9 |

**Duyệt mỗi đợt** = chạy lệnh trong checklist + soát kỹ 3 file, không đọc lướt toàn bộ.

## 2. Threat model và nhãn
- Threat model đầy đủ: `docs/threat_model.md`. Tóm tắt: kit chống **sai sót trung thực**; không hứa chống lách. Chặn thật chỉ có: credential AI không giữ · sandbox hệ điều hành · người thứ hai review trên server.
- Trên máy này (Windows native): **Claude không có sandbox**; Codex có sandbox cho lệnh shell.
- Bộ nhãn: `rules/evidence_labels.md` (12 nhãn + 2 cụm cố định + luật chuyển nhãn + cách chuyển nhãn thành lời).

## 3. Lỗi trong file nguồn, xử lý khi gộp

Đường dẫn tính từ `D:\fpt-inform\antigravity-testing-kit-main 2\`.

| Nguồn (file:line) | Vấn đề | Xử lý |
|---|---|---|
| `antigravity-testing-kit-main/.agent/rules/api_rules.md:67`, `.agent/workflows/generate_api_tests_from_swagger.md:279` | Auto-Heal | Bỏ. Thay bằng triage → đề xuất sửa → G3 |
| `.agent/workflows/generate_automation_from_testcases.md:26` | Rule E3 "CẤM hỏi user", tự sửa tối đa 5 vòng | Bỏ |
| `.agent/workflows/generate_automation_from_ui_flow.md:204` | Auto-Heal | Bỏ |
| `plans/automation/01–06` | **Chưa soát** | Soát ở Đợt 2 trước khi chuyển sang `prompts/automation/` |
| `.agent/skills/flaky_test_analyzer/SKILL.md:40` | Chạy lại nhiều lần không có gate | G2, ghi số lần |
| `.agent/skills/rbt_manual_testing/SKILL.md:98`, `:185`, `:199` | Dính chữ; Anti-Patterns lặp | Làm sạch khi chuyển sang `test-design-rbt` |
| `.agent/skills/test_data_generator/SKILL.md:67`, `:81`; `.agent/rules/api_rules.md:48`; `.agent/rules/automation_rules.md:21` | Email `@test.com` (domain có thật), số `0912345678` | `@example.com`; SMS gateway phải tắt |
| `.agent/skills/ui_debug_agent/SKILL.md:88`, `:160` | Hỏi credentials qua chat | Chỉ fixture/storageState |
| `.agent/rules/playwright_rules.md:15`, `.agent/rules/selenium_rules.md:71` | Bắt buộc headed | Headed khi debug local; CI headless |
| `scripts/integrations/jira/utils.js:42`, `xray_auth.js:58` | Dùng chung token đọc/ghi; **chưa đọc hết file** | Đọc toàn bộ ở Đợt 3; người chạy script |
| `scripts/integrations/jira/jira_fetcher.js:28`, `xray_importer.js:24`, `:29`, `xray_auth.js:24` | `require('./utils')`, `require('./xray_auth')` | Phải chuyển cả `utils.js`, `xray_auth.js` |
| `ai-qe-kit/.claude/skills/ai-output-review/SKILL.md:24` | "Thường có ít nhất 1 Reject hoặc Defer" | Đổi: toàn Accept thì phải ghi rõ đã kiểm tra những gì |

`scripts/verify/grep-clean.js` quét các mẫu cấm; file được miễn trừ khai báo ở `scripts/verify/grep-exempt.txt`.

---

## 4. Cấu trúc repo (đầy đủ, 182 file kit)

Ký hiệu: `[Đ0]`…`[Đ3]` = đợt; ✅ = đã có.

```
my-aiqe-kit/
├── AGENTS.md  CLAUDE.md  README.md  VERSION  CHANGELOG.md  .gitignore   [Đ0] ✅
├── project.aiqe.example.yml                                             [Đ0] ✅
├── docs/
│   ├── BUILD_PLAN.md  SKILL_SPEC.md  threat_model.md  tool_support.md   [Đ0] ✅
│   ├── before_you_use.md  lifecycle.md  review_checklist_dot0.md        [Đ0] ✅
│   ├── review_checklist_dot1.md                                         [Đ1]
│   ├── review_checklist_dot2.md  proposal_for_lead.md                   [Đ2]
│   ├── agent_design.md                                                  [Agent]
│   └── review_checklist_dot3.md                                         [Đ3]
├── rules/  (8)  evidence_labels  agent_safety  retry_and_wait  test_design
│                id_conventions  automation_standards  reporting_and_data  bug_report   [Đ0] ✅
├── skills/
│   ├── bug-reporting/SKILL.md                                           [Đ1] ⭐
│   ├── test-design-rbt/SKILL.md + references/{field_validation_15, advanced_scenarios, mobile_scenarios}.md  [Đ1] ⭐
│   ├── incident-triage/SKILL.md + references/flaky_catalog.md           [Đ1] ⭐
│   ├── requirement-analysis/SKILL.md + references/reverse_spec_format.md  [Đ1]
│   ├── test-data/SKILL.md + references/data_registry_format.md          [Đ1]
│   ├── exploratory-testing/SKILL.md + references/heuristics.md          [Đ1]
│   ├── ai-output-review/SKILL.md                                        [Đ1]
│   ├── evidence-reporting/SKILL.md                                      [Đ1]
│   ├── ui-automation/SKILL.md + references/{playwright-ts, mcp_inspect, a11y_axe, run_suite}.md  [Đ2]
│   │                           + references/{selenium-java, appium-java}.md                     [Đ3] beta
│   ├── api-testing/SKILL.md + references/{api_standards, postman_newman}.md  [Đ2]
│   ├── test-strategy/SKILL.md + references/test_types_matrix.md         [Đ3]
│   ├── regression-selection/SKILL.md + references/coverage_map_format.md  [Đ3]
│   └── jira-xray/ run-contract/ agent-architecture/ qe-coach/  (SKILL.md)  [Đ3]
├── prompts/
│   ├── qe-reviewer.md  manual/01…06.md                                  [Đ1]
│   └── automation/01…06.md                                              [Đ2]
├── templates/
│   ├── bug_report  test_case_table  incident_card  retry_matrix  decision_log
│   │   execution_sheet  charter  session_note  data_registry   (.md)    [Đ1]
│   ├── evidence_manifest  execution_report  approval_card  (.md)        [Đ2]
│   ├── test_plan  test_summary_report  regression_selection  run_contract
│   │   tool_manifest  state_machine  (.md)                              [Đ3]
│   └── scaffold/
│       ├── playwright-ts/ (9: package.json, playwright.config.ts, tsconfig.json, .env.sandbox.example,
│       │                    .gitignore, README.md, fixtures/test-base.ts, pages/BasePage.ts, tests/smoke.spec.ts)  [Đ2]
│       ├── selenium-java/ (7: pom.xml, testng.xml, .env.sandbox.example, README.md,
│       │                    src/test/java/{base/BaseTest, pages/BasePage, tests/SmokeTest}.java)  [Đ3]
│       └── appium-java/   (7: tương tự, screens/BaseScreen.java)        [Đ3]
├── scripts/
│   ├── install/{install.ps1, install.js, gen-routing.js}                [Đ0] ✅
│   ├── verify/{grep-clean.js, grep-exempt.txt, check-skills.js}         [Đ0] ✅
│   ├── verify/aiqe-verify.js                                            [Đ2]
│   ├── package.json  convert/md_to_xlsx.js  redact/{redact.js, patterns.json}
│   │   export/to-external.js  evals/{prepare-isolated.ps1, grade.js}    [Đ1]
│   ├── jira/{jira_fetcher.js, xray_importer.js, utils.js, xray_auth.js, .env.example}  [Đ3]
│   └── trace/build-trace-index.js                                       [Đ3]
├── adapters/
│   ├── hooks/{lib.js, block-secret-read.js, block-assertion-edit.js}    [Đ0] ✅ (dùng chung)
│   ├── codex/{config.toml, hooks.json}                                  [Đ0] ✅
│   ├── claude/settings.json                                             [Đ0] ✅
│   ├── claude/commands/ (15 lệnh: 9 ở Đ1, 3 ở Đ2, 3 ở Đ3)
│   ├── claude/agents/qe-reviewer.md                                     [Đ3]
│   └── gemini/{GEMINI.md, settings.json}                                [Đ3]
├── ci/{CODEOWNERS.example, github/aiqe-check.yml, gitlab/aiqe-check.gitlab-ci.yml}  [Đ2]
├── evals/
│   ├── hooks/test-hooks.md                                              [Đ0] ✅
│   ├── README.md                                                        [Đ1]
│   ├── <16 skill>/cases.md  (8 ở Đ1, 2 ở Đ2, 6 ở Đ3)
│   ├── golden/bug-reporting.md                                          [Đ1]
│   ├── golden/{selenium-java, appium-java}.md                           [Đ3]
│   └── routing.md                                                       [Đ3]
└── agent/  (30 file, xem mục 6)                                         [Agent]
```

### Sau khi cài
```
~/.aiqe/        installed.json · kit/<version>/ (bản dùng thật) · backup/<thời điểm>/
~/.codex/       AGENTS.md (khối của kit) · config.toml (khối top + tables) · hooks.json (ghép)
~/.agents/      skills/<16>/ (bản chép, có .aiqe-version)
~/.claude/      CLAUDE.md (khối @import) · settings.json (ghép) · skills/<16>/ · commands/<15> · agents/
~/aiqe-output/<project>/  project.aiqe.yml · requirements/ analysis/ testcases/ data/ exploratory/
                          bugs/ runs/<RUN-ID>/ decisions/ external/ · traceability_index.md
```

---

## 5. File theo đợt: chức năng và nghiệm thu

### ĐỢT 0 ✅ (35 file)

| File | Chức năng | Trạng thái |
|---|---|---|
| `AGENTS.md` | Luật lõi: vai trò, tìm yml, 9 nguyên tắc, chế độ, output/handoff, bảng rules, bảng routing tự sinh | ✅ |
| `CLAUDE.md` | Cầu nối cho Claude (dòng `@` do install chèn) | ✅ |
| `README.md`, `VERSION`, `CHANGELOG.md`, `.gitignore`, `project.aiqe.example.yml` | Hướng dẫn, version, lịch sử, gitignore repo kit, mẫu khai báo dự án | ✅ |
| `docs/BUILD_PLAN.md`, `SKILL_SPEC.md`, `threat_model.md`, `tool_support.md`, `before_you_use.md`, `lifecycle.md`, `review_checklist_dot0.md` | Bàn giao, chuẩn skill, threat model, tra cứu tool, checklist trước khi dùng, vòng đời, checklist duyệt | ✅ |
| `rules/*.md` (8) | Chuẩn dùng chung | ✅ |
| `adapters/hooks/lib.js`, `block-secret-read.js`, `block-assertion-edit.js` | Hook dùng chung Claude + Codex, có `--self-test` | ✅ 20/20, 25/25 case |
| `adapters/codex/config.toml`, `hooks.json` | Sandbox, approval, hook, MCP Playwright cho Codex | ✅ (chưa chạy trên Codex thật) |
| `adapters/claude/settings.json` | Permission + hook cho Claude | ✅ |
| `scripts/install/install.ps1`, `install.js`, `gen-routing.js` | Cài/gỡ/kiểm tra; sinh bảng routing | ✅ cài thử + gỡ thử trên thư mục giả |
| `scripts/verify/grep-clean.js`, `grep-exempt.txt`, `check-skills.js` | Quét mẫu cấm; kiểm tra cấu trúc skill | ✅ |
| `evals/hooks/test-hooks.md` | Case kiểm tra 2 hook | ✅ |

**Khác plan v4.2:** +3 file (`adapters/codex/hooks.json`, `adapters/hooks/lib.js`, `scripts/install/install.js`). Lý do ở quyết định #22, #24.

### ĐỢT 1: Manual (58 file: 49 + 9 lệnh tắt Claude)

| File | Chức năng | Phải có / Nghiệm thu |
|---|---|---|
| `skills/bug-reporting/SKILL.md` ⭐ | Viết, review, retest bug | 7 điều kiện của `rules/bug_report.md`; kiểm tra trùng bằng CSV người export; tỉ lệ tái hiện; xuất internal + external; người push sau G4 |
| `skills/test-design-rbt/SKILL.md` ⭐ | TC theo QUICK, FULL, mode `maintain` | FULL trỏ tới `prompts/manual/` (nguồn duy nhất); `maintain` cần 2 phiên bản requirement hoặc diff, không có thì từ chối |
| `…/references/field_validation_15.md` | Checklist validation 15 loại field | Lấy từ `rbt_manual_testing` (đã làm sạch); XSS/SQLi gắn `@Security`, cần G1 |
| `…/references/advanced_scenarios.md` | Race condition, session, l10n | — |
| `…/references/mobile_scenarios.md` | Cuộc gọi đến, mất mạng, background, xoay màn hình, quyền | — |
| `skills/incident-triage/SKILL.md` ⭐ | Mẫu nặng về gate: phân loại test fail (manual + auto) | Retry matrix, `OUTCOME_UNKNOWN`, G2; output chỉ skill tiếp theo |
| `…/references/flaky_catalog.md` | Nguyên nhân flaky + cách phân biệt | Lấy từ `flaky_test_analyzer`, bỏ phần tự fix |
| `prompts/manual/01…06.md` | 6 bước FULL RBT dán vào AI bất kỳ | Cảnh báo đầu file: chỉ dùng khi `ai_policy` cho phép và đã redact; soát từ `plans/manual/` |
| `prompts/qe-reviewer.md` | Reviewer khó tính cho một phiên AI khác | Toàn Accept thì ghi rõ đã kiểm tra gì |
| `scripts/package.json` | Thư viện cho script Node | Pin version |
| `scripts/convert/md_to_xlsx.js` | Bảng TC markdown → Excel | Cột theo yml; chạy với file mẫu |
| `scripts/redact/redact.js` + `patterns.json` | Che token, cookie, email, SĐT, CCCD | Test với file mẫu; in số chỗ đã che |
| `scripts/export/to-external.js` | Tạo bản gửi khách | Bỏ front-matter, chuyển nhãn thành lời, chạy redact |
| `templates/` (9) | bug_report, test_case_table, incident_card, retry_matrix, decision_log, execution_sheet, charter, session_note, data_registry | Tiêu đề song ngữ |
| `skills/requirement-analysis/` + `reverse_spec_format.md` | Mode A soi lỗ hổng; Mode B dựng ngược từ screenshot/HTML người cung cấp | PDF/Figma chuyển sang md hoặc ảnh trước |
| `skills/test-data/` + `data_registry_format.md` | Data cụ thể, unique, có cleanup; combinatorial, data chain | Prefix ở field cho phép; field format cứng dùng registry; faker `vi` |
| `skills/exploratory-testing/` + `heuristics.md` | Charter, ghi chép, chuyển phát hiện | Ranh giới với Mode B: tìm lỗi theo charter vs ghi lại app làm gì |
| `skills/ai-output-review/SKILL.md` | Soát output AI theo claim | Sửa dòng 24 như mục 3 |
| `skills/evidence-reporting/SKILL.md` | Báo cáo 1 lần chạy; mode `manual-run` | Nhãn LOCAL/CI/MANUAL/RUN; `Enforcement` |
| `evals/<8 skill>/cases.md` | 3 case dương, 2 case âm, checklist | Chấm bằng `produced_by` + mục bắt buộc |
| `evals/README.md`, `scripts/evals/prepare-isolated.ps1`, `grade.js` | Cách chạy eval (`claude -p` trước 10/10, `codex exec` sau), cách ly golden, chấm điểm | — |
| `evals/golden/bug-reporting.md` | Đáp án (Claude nháp, người duyệt) | `DRAFT-BY-AI` → `REVIEWED-BY` |
| `adapters/claude/commands/` (9) | `/analyze-req /gen-testcases /gen-data /explore /bug /review-ai /triage /report /sanitize` | Mỗi file < 10 dòng, có chữ `my-aiqe-kit` (install dùng để nhận diện) |
| `docs/review_checklist_dot1.md` | Checklist duyệt | — |

**Nghiệm thu:** `check-skills` + `grep-clean` sạch; routing smoke 3 prompt/skill đúng 100%; golden đạt checklist; người dùng duyệt.

### ĐỢT 2: Automation + CI (37 file: 34 + 3 lệnh tắt)

| File | Chức năng | Phải có / Nghiệm thu |
|---|---|---|
| `skills/ui-automation/` + `playwright-ts.md`, `mcp_inspect.md`, `a11y_axe.md`, `run_suite.md` | Viết/review test UI; Bước 0 nhận diện stack; mode locator (MCP); **mode `run`** (chạy theo tag/project/browser, G1, chuyển kết quả) | axe WCAG 2.1 AA, mặc định không làm fail test |
| `skills/api-testing/` + `api_standards.md`, `postman_newman.md` | Test API: mode code và mode Postman/Newman | Không có Swagger → request mẫu, gắn `HYPOTHESIS`; lấy `api_rules.md` §1–5, §7 (bỏ §6) |
| `templates/scaffold/playwright-ts/` (9) | Khung dự án | Pin version; `forbidOnly`; chromium/firefox/webkit; reporter HTML; trace; fixture `context.route` |
| `scripts/verify/aiqe-verify.js` | Đếm assertion, quét skip/only, diff fixture | CI gọi chính file này |
| `ci/github/aiqe-check.yml`, `ci/gitlab/…`, `ci/CODEOWNERS.example` | Job CI và mẫu CODEOWNERS | Fail khi có tín hiệu trừ khi có approve của CODEOWNER không phải tác giả; trigger `pull_request_review`; bảo vệ `.github/**` |
| `docs/proposal_for_lead.md` | Tài liệu đề xuất với lead | — |
| `templates/` (3) | evidence_manifest, execution_report, approval_card | Lấy từ bộ mới |
| `prompts/automation/01…06.md` | Prompt automation cho mọi AI | Soát `plans/automation/`, grep sạch |
| `evals/ui-automation/cases.md` | Case Playwright, case "2 stack → hỏi", case âm | Case Java thêm ở Đợt 3 |
| `evals/api-testing/cases.md` | Mode code, mode Postman, không có Swagger, case âm | — |
| `adapters/claude/commands/` (3) | `/automate /api-test /scaffold` | — |
| `docs/review_checklist_dot2.md` | Checklist duyệt | — |

**Nghiệm thu:** scaffold chạy `npx playwright test --list`; YAML CI hợp lệ; `plans/automation` đã soát; eval Đợt 2 đạt.

### ĐỢT 3: Lead, tích hợp, đa stack (52 file: 49 + 3 lệnh tắt)

| File | Chức năng | Phải có / Nghiệm thu |
|---|---|---|
| `skills/test-strategy/` + `test_types_matrix.md` | Mode `plan` (test plan) và `close` (exit report, metrics, go/no-go `AI-PROPOSAL`) | — |
| `skills/regression-selection/` + `coverage_map_format.md` | Chọn TC chạy lại | Thiếu map → từ chối; map cũ → `HYPOTHESIS` |
| `skills/jira-xray/SKILL.md` | Chuẩn bị payload, dry-run để **người** push | AI không giữ token |
| `scripts/jira/` (5) | jira_fetcher, xray_importer, utils, xray_auth, .env.example | **Đọc toàn bộ** file gốc trước khi chuyển; người chạy |
| `scripts/trace/build-trace-index.js` | Quét ID → `traceability_index.md` | Theo `rules/id_conventions.md` |
| `skills/run-contract`, `agent-architecture`, `qe-coach` | Lấy từ bộ mới, bỏ phần bài tập | — |
| `adapters/claude/agents/qe-reviewer.md` | Subagent chỉ đọc | Dùng chung nội dung với `prompts/qe-reviewer.md` |
| `references/selenium-java.md`, `appium-java.md` + 2 scaffold (14) | Beta | `mvn compile` nếu máy có Java/Maven, không thì `UNKNOWN` |
| `adapters/gemini/GEMINI.md`, `settings.json` | Adapter Gemini (`context.fileName = AGENTS.md`) | Thêm `-Tool gemini` vào install.js |
| `templates/` (6) | test_plan, test_summary_report, regression_selection, run_contract, tool_manifest, state_machine | — |
| `evals/<6 skill>/cases.md`, `golden/selenium-java.md`, `appium-java.md`, `routing.md` | Eval Đợt 3 | Routing ≥ 90%, mỗi prompt 3 lần |
| `adapters/claude/commands/` (3) | `/plan /regression /coach` | — |
| `docs/review_checklist_dot3.md` | Checklist duyệt | — |

**Nghiệm thu:** đã đọc toàn bộ script Jira; routing ≥ 90% (Claude trước 10/10, Codex sau); người dùng duyệt.

---

## 6. Agent 0.2.0 (31 file: 30 trong `agent/` + `docs/agent_design.md`)

Mục tiêu: chạy trọn case `EMP-CREATE-01` trên app giả local, chứng minh guard, gate, state machine, evidence. Planner (LLM) **không có shell**: chỉ đề xuất; controller (code) mới gọi tool → guard trong controller là ranh giới thật **đối với planner**, không chặn được người vận hành.

```
agent/
├── README.md  package.json  tsconfig.json
├── config/{policy.json, tool_manifest.json}
├── src/{types, state_machine, controller, guards, approvals, evidence_store, report, cli}.ts
├── src/planner/{planner, mock_planner, llm_planner, untrusted}.ts
├── src/tools/{read_case, inspect_ui, run_case, read_result, lookup_owned_record, cleanup_owned_record}.ts
├── cases/EMP-CREATE-01/{case.json, emp-create.spec.ts}
├── fake-app/{server.js, public/index.html}
├── scenarios/scenarios.json
└── tests/agent.test.ts
```

| Thành phần | Nghiệm thu |
|---|---|
| `docs/agent_design.md` | Có trước code; mỗi invariant chỉ ra guard ép nó |
| `config/policy.json` | Người viết; đọc một lần lúc khởi động |
| `state_machine.ts` | PLANNED → AWAIT_G1 → SETUP → ACT → VERIFY → CLEANUP → DONE; OUTCOME_UNKNOWN, BLOCKED, FAILED; chuyển sai thì lỗi |
| `guards.ts` | Allowlist tool/input, approval còn hiệu lực, runId chưa dùng, đúng owner, budget, oracle bất biến, không retry write khi OUTCOME_UNKNOWN; mỗi guard 1 test chặn + 1 test cho qua |
| `evidence_store.ts` | JSONL chỉ ghi thêm, mỗi bản ghi có hash bản trước |
| `approvals.ts` | Hỏi G1/G2 trên console, hiện phạm vi; planner không trả lời thay được |
| `llm_planner.ts` | Chưa có key → báo "chưa cấu hình", không crash |
| `fake-app/server.js` | Khớp `OBS-PACKET-01`; chế độ lỗi: lưu xong nhưng timeout, index chậm, trang có chỉ thị lạ |

**5 kịch bản demo:** (1) happy path → `LOCAL-RUN: passed`; (2) timeout sau khi lưu → `OUTCOME_UNKNOWN`, chỉ lookup; (3) prompt injection → bọc `<untrusted>`, guard chặn upload; (4) planner đề xuất sửa assertion → BLOCKED, cần G3; (5) retry vượt budget → dừng an toàn, giữ lần fail đầu.

## 7. Phân công kiểm chứng

| Việc | Ai |
|---|---|
| JSON/TOML/YAML hợp lệ, `grep-clean`, `check-skills`, self-test hook, cài/gỡ thử | Claude (tới 10/10) |
| Tra tài liệu tool → `tool_support.md` | Claude; tra lại khi tool cập nhật |
| Chạy script với file mẫu, `npm test` của agent, `npx playwright test --list` | Claude |
| Eval routing + cases: bằng `claude -p` trước 10/10 | Người dùng chạy, Claude chuẩn bị |
| **Eval trên Codex** | Người dùng, sau 10/10 |
| Duyệt golden, duyệt từng đợt | Người dùng |
| Hỏi lead về `ai_policy`; đề xuất CI/CODEOWNERS (`proposal_for_lead.md`) | Người dùng |

## 8. Để sau
| Mảng | Lý do hoãn | Cần gì |
|---|---|---|
| Performance (k6, JMeter) | Cần env riêng, baseline, SLA | Requirement có SLA, env load test, quyền |
| Security chuyên sâu | Cần văn bản cho phép và scope pháp lý | Giấy phép, env cô lập, người chuyên security |
| Accessibility đầy đủ | Phần lớn cần người kiểm tra bằng tay | Chuẩn WCAG mục tiêu, thiết bị, người có kinh nghiệm |
| UAT | Do người dùng nghiệp vụ thực hiện | Mẫu UAT của khách, tiêu chí chấp nhận |

## 9. Câu hỏi mở và lỗi còn tồn

| # | File / phạm vi | Câu hỏi | Cách kiểm tra |
|---|---|---|---|
| Q1 | `adapters/codex/config.toml` | `localhost` có truy cập được khi `network_access = false`? Cách bật allowlist domain chính xác? | Chạy `curl` tới server local trong Codex |
| Q2 | `adapters/codex/hooks.json` | Định dạng `tool_input` của `Edit`/`Write` trong Codex | Cho hook ghi stdin ra file khi chạy Codex thật |
| Q3 | `adapters/codex/config.toml` | Codex trên Windows có cần `npx.cmd` cho MCP không | Chạy MCP Playwright trong Codex |
| Q4 | Toàn kit | Extension VS Code của Codex có dùng chung `~/.codex/config.toml` và hook không (nguồn hiện là bên thứ ba) | Hỏi Codex đọc `.env`, xem hook chặn không |
| Q5 | `adapters/claude/commands/` | Claude gọi được skill bằng `/tên-skill`; 15 lệnh tắt chỉ còn tác dụng rút ngắn tên. Có giữ cả 15 không? | Người dùng quyết định ở Đợt 1 |
| Q6 | `test-strategy` | Ước lượng theo phương pháp nào; metric nào được ghi `UNKNOWN` | Đợt 3 |
| Q7 | `regression-selection` | Ai lập coverage map lần đầu | Đợt 3 |
| Q8 | `jira-xray` | Công ty dùng TestRail hoặc Excel thì sao | Đợt 3 |

## 10. Bảng đếm file

| Phần | Không tính lệnh tắt | Lệnh tắt Claude | Tổng |
|---|---|---|---|
| Đợt 0 | 35 | 0 | 35 |
| Đợt 1 | 49 | 9 | 58 |
| Đợt 2 | 34 | 3 | 37 |
| Đợt 3 | 49 | 3 | 52 |
| **Kit 0.1.0** | **167** | **15** | **182** |
| Agent 0.2.0 | 31 (30 trong `agent/` + `docs/agent_design.md`) | — | 31 |
| **Tổng** | | | **213** |

So với plan v4.2 (194 kit): −15 (bỏ lệnh tắt Codex) +3 (Đợt 0: `codex/hooks.json`, `hooks/lib.js`, `install.js`) = 182.
