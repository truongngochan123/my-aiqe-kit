# BUILD_PLAN: my-aiqe-kit 0.1.0 + agent 0.2.0

> **File bàn giao.** Ai tiếp tục dựng kit (Claude hôm nay, Codex sau 10/10) đọc file này trước tiên.
> Bản này gộp plan v4.2 (đã duyệt) với các thay đổi sau khi tra tài liệu ngày 06/10/2026.
> **Quy tắc:** mọi khẳng định về file nguồn phải kèm `file:line`. Chưa mở file thì không khẳng định.
> Nguồn gốc: `ai-qe-kit/` ("bộ mới") và `antigravity-testing-kit-main/` ("bộ gốc") trong `D:\fpt-inform\antigravity-testing-kit-main 2\`.

## Trạng thái nhanh

| Đợt | Trạng thái | Ngày |
|---|---|---|
| 0: Nền móng | ✅ Đã duyệt | 06/10 |
| 1: Manual | 🔄 Bước 1 xong (3 skill mẫu) · chờ pilot trên Codex | 06/10 |
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
| 14 | Golden: **Claude viết đề bài**, **Codex viết đáp án** (khác model với bên dựng skill), Han duyệt. Ghi `DRAFT-BY: Codex` → `REVIEWED-BY: Han`. Golden do AI viết vẫn yếu hơn golden do người viết; ghi rõ trong `evals/README.md` |
| 15 | Có nhãn `MANUAL-RUN` (build/version, env, người chạy, thời điểm; `failed` bắt buộc evidence) |
| 16 | Eval khoảng 55 prompt × 3 lần; cách ly golden bằng thư mục tạm |
| 17 | Bản cài là snapshot theo version `~/.aiqe/kit/<version>/` |
| 18 | **Claude dựng toàn bộ kit tới 10/10. Codex dùng trước 10/10 chỉ để test routing và viết golden.** Codex không dựng file nào của kit trước 10/10. Sau 10/10 Codex tiếp quản (eval, làm tiếp, bảo trì) |
| 19 | Agent 0.2.0 dùng **planner giả lập** (chưa có API key); có chỗ cắm LLM thật |
| 20 | Demo agent trên **app giả chạy local** (khớp `OBS-PACKET-01`), không dùng site công khai |
| 21 🆕 | **Bỏ 15 file `adapters/codex/prompts/`**: Codex đã deprecated custom prompts; gọi skill bằng `$tên-skill` (`docs/tool_support.md` câu 2) |
| 22 🆕 | **Hook dùng chung** cho Claude và Codex ở `adapters/hooks/`; Codex có hook `PreToolUse` nhưng mặc định tắt → `config.toml` bật `[features] hooks = true` |
| 23 🆕 | Codex đọc skill ở `~/.agents/skills/` (không phải `~/.codex/skills/`) |
| 24 🆕 | Logic cài đặt viết bằng Node (`install.js`); `install.ps1` chỉ là lớp vỏ |
| 25 🆕 | **Bỏ cả 15 lệnh tắt của Claude.** Gọi skill bằng tên đầy đủ: `/tên-skill` (Claude), `$tên-skill` (Codex). Tham số mode ghi thẳng vào câu: `/bug-reporting retest BUG-CUS-012`. Sanitize và scaffold: nói bằng lời, `AGENTS.md` mục "Việc không có skill riêng" hướng dẫn |
| 26 🆕 | `.gitattributes`: văn bản dùng LF, `.ps1` dùng CRLF, Excel/ảnh/zip là binary |
| 27 🆕 | Test database: `test-design-rbt/references/sql_oracle.md` (oracle đọc lại dữ liệu bằng SQL, **chỉ SELECT**, chỉ trên env sandbox) ở Đợt 1 |
| 30 🆕 | Sau pilot T1 (07/10): quan sát QA tự làm (kể cả kể lại trong prompt) là `DOM-OBSERVED`, thông tin từ người khác là `PROVIDED`; output test case tách **TC chạy được** và **mục thăm dò** (expected chưa biết, khóa `Q-*`); Priority theo Risk; cấm ký hiệu tắt tự đặt |
| 29 🆕 | **Kỳ vọng hiển nhiên** (chọn phương án b, 07/10): khi sản phẩm không có requirement, bug được tạo nếu hành vi khớp **danh sách đóng 4 mục** trong `rules/bug_report.md` mục 1b (lỗi hệ thống · dữ liệu lưu sai/mất · lộ dữ liệu/vượt quyền · tài khoản hợp lệ không đăng nhập được). Expected gắn `AI-PROPOSAL` + "cần PO/BA xác nhận". Ngoài danh sách → câu hỏi `Q-*` |
| 28 🆕 | Đợt 1 làm theo thứ tự **pilot**: 3 skill mẫu → dừng → Han cài kit thật cho Codex và test 9 prompt → ổn mới làm 5 skill còn lại |

## 1. Lịch

| Ngày | Claude | Codex (Han giao việc) | Han |
|---|---|---|---|
| 1 · 06/10 | `BUILD_PLAN.md` + Đợt 0 ✅ | — | Duyệt Đợt 0 ✅ |
| 2 · 07/10 | **Bước 1:** 3 skill mẫu → **dừng**. **Bước 3:** 5 skill còn lại + script, template, prompt, eval. **Bước 4:** đề bài golden | Test routing 9 prompt (Bước 2); viết đáp án golden | Cài kit thật cho Codex; báo kết quả 9 prompt; duyệt Đợt 1 và golden |
| 3 · 08/10 | Đợt 2 + `docs/agent_design.md` + lõi agent | Eval routing Đợt 1 | Duyệt Đợt 2 |
| 4 · 09/10 | Đợt 3 (cả beta Selenium/Appium, Gemini) + tool, planner, kịch bản, test của agent | Eval Đợt 2 | Duyệt Đợt 3 |
| 5 · 10/10 | Sáng: test agent + demo 5 kịch bản. Chiều: sửa theo eval, chốt 0.1.0 và 0.2.0 | Routing eval toàn bộ | Chạy demo; duyệt cuối |
| Sau 10/10 | — | Tiếp quản: làm tiếp, bảo trì | Lỗi còn tồn ghi ở mục 9 |

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

## 4. Cấu trúc repo (đầy đủ, 174 file kit)

Ký hiệu: `[Đ0]`…`[Đ3]` = đợt; ✅ = đã có.

```
my-aiqe-kit/
├── AGENTS.md  CLAUDE.md  README.md  VERSION  CHANGELOG.md  .gitignore   [Đ0] ✅
├── .gitattributes                                                       [Đ0] ✅
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
│   ├── test-design-rbt/SKILL.md + references/{field_validation_15, advanced_scenarios, mobile_scenarios, sql_oracle}.md  [Đ1] ⭐
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
│   ├── package.json  package-lock.json  lib/config.js  convert/md_to_xlsx.js  redact/{redact.js, patterns.json}
│   │   export/to-external.js  evals/{prepare-isolated.ps1, grade.js}    [Đ1]
│   ├── project/{new-project.ps1, new-project.js}                       [Đ1] ✅
│   ├── jira/{jira_fetcher.js, xray_importer.js, utils.js, xray_auth.js, .env.example}  [Đ3]
│   └── trace/build-trace-index.js                                       [Đ3]
├── adapters/
│   ├── hooks/{lib.js, block-secret-read.js, block-assertion-edit.js}    [Đ0] ✅ (dùng chung)
│   ├── codex/{config.toml, hooks.json}                                  [Đ0] ✅
│   ├── claude/settings.json                                             [Đ0] ✅
│   ├── claude/agents/qe-reviewer.md                                     [Đ3]
│   └── gemini/{GEMINI.md, settings.json}                                [Đ3]
├── ci/{CODEOWNERS.example, github/aiqe-check.yml, gitlab/aiqe-check.gitlab-ci.yml}  [Đ2]
├── evals/
│   ├── hooks/test-hooks.md                                              [Đ0] ✅
│   ├── README.md                                                        [Đ1]
│   ├── <16 skill>/cases.md  (8 ở Đ1, 2 ở Đ2, 6 ở Đ3)
│   ├── golden/bug-reporting.task.md  (đề bài, Claude viết)              [Đ1]
│   ├── golden/bug-reporting.md       (đáp án, Codex viết, Han duyệt)    [Đ1]
│   ├── golden/{selenium-java, appium-java}.md                           [Đ3]
│   └── routing.md                                                       [Đ3]
└── agent/  (30 file, xem mục 6)                                         [Agent]
```

### Sau khi cài
```
~/.aiqe/        installed.json · kit/<version>/ (bản dùng thật) · backup/<thời điểm>/
~/.codex/       AGENTS.md (khối của kit) · config.toml (khối top + tables) · hooks.json (ghép)
~/.agents/      skills/<16>/ (bản chép, có .aiqe-version)
~/.claude/      CLAUDE.md (khối @import) · settings.json (ghép) · skills/<16>/ · agents/
~/aiqe-output/<project>/  project.aiqe.yml · requirements/ analysis/ testcases/ data/ exploratory/
                          bugs/ runs/<RUN-ID>/ decisions/ external/ · traceability_index.md
```

---

## 5. File theo đợt: chức năng và nghiệm thu

### ĐỢT 0 ✅ (36 file, gồm `.gitattributes` thêm sau khi duyệt)

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

### ĐỢT 1: Manual (51 file)

**Thứ tự (pilot):**
1. **Bước 1:** 3 skill mẫu `bug-reporting`, `test-design-rbt` (kèm references, có `sql_oracle.md`), `incident-triage` (kèm `flaky_catalog.md`). Chạy `check-skills` + `grep-clean`.
2. **Bước 2 — DỪNG:** Han chạy `install.ps1 -Tool codex -DryRun` rồi cài thật; test 9 prompt trên Codex; báo kết quả. Skill gọi sai thì sửa description trước.
3. **Bước 3:** 5 skill còn lại + script, template, prompt, eval.
4. **Bước 4:** đề bài golden `bug-reporting` (có bẫy). Han đưa đề cho Codex viết đáp án.

**Tiến độ Bước 1 (06/10) ✅**
- 3 skill mẫu + references: `bug-reporting`, `test-design-rbt` (4 references, có `sql_oracle.md`), `incident-triage` (`flaky_catalog.md`).
- **Làm sớm từ Bước 3** (vì 3 skill mẫu gọi tới, thiếu thì pilot trên Codex sẽ trỏ vào file không tồn tại): 6 prompt `prompts/manual/`, 4 template (`bug_report`, `test_case_table`, `incident_card`, `retry_matrix`), `md_to_xlsx.js`, `redact.js` + `patterns.json`, `to-external.js`, `scripts/package.json`.
- **Phát sinh +2 file:** `scripts/lib/config.js` (đọc `project.aiqe.yml`, dùng chung cho các script) và `scripts/package-lock.json` (khóa version thư viện).
- `md_to_xlsx` viết lại bằng `exceljs` (bản gốc dùng `xlsx` 0.18.5 không còn cập nhật trên npm, và lấy cột theo vị trí). `uuid` ép lên 11.1.1 qua `overrides` để hết cảnh báo GHSA-w5hq-g745-h8pq (`npm audit`: 0 lỗ hổng).
- Kiểm chứng: `check-skills` 3 skill 0 lỗi · `grep-clean` sạch · chạy thử 3 script với file mẫu · cài thử vào home giả: 16/16 đường dẫn trong skill tồn tại, script chạy được từ bản cài.
- **07/10:** thêm `scripts/project/new-project.ps1` + `.js` (tạo thư mục dự án + `.aiqe/project.aiqe.yml`, không ghi đè). Pilot đổi sang **OrangeHRM** (`D:\fpt-inform\aiqe-pilot`, yml do Han tạo tay, script xác nhận không ghi đè).
- **Pilot trên Codex (OrangeHRM):** T1 ✅ đúng skill (`test-design-rbt`), không đoán required, không bịa message, Source `HYP-PIM`. 3 điểm cần sửa đã sửa (quyết định #30). Cần **cài lại kit** để Codex nhận bản sửa. Còn 8 prompt.
- Bảng `field_validation_15.md` có **bản sao** trong `prompts/manual/05_…md` (để dán sang AI khác). Sửa bảng thì sửa cả hai (có comment `sync` đánh dấu). Câu hỏi mở Q9.

| File | Chức năng | Phải có / Nghiệm thu |
|---|---|---|
| `skills/bug-reporting/SKILL.md` ⭐ | Viết, review, retest bug | 7 điều kiện của `rules/bug_report.md`; kiểm tra trùng bằng CSV người export; tỉ lệ tái hiện; xuất internal + external; người push sau G4 |
| `skills/test-design-rbt/SKILL.md` ⭐ | TC theo QUICK, FULL, mode `maintain` | FULL trỏ tới `prompts/manual/` (nguồn duy nhất); `maintain` cần 2 phiên bản requirement hoặc diff, không có thì từ chối |
| `…/references/field_validation_15.md` | Checklist validation 15 loại field | Lấy từ `rbt_manual_testing` (đã làm sạch); XSS/SQLi gắn `@Security`, cần G1 |
| `…/references/advanced_scenarios.md` | Race condition, session, l10n | — |
| `…/references/mobile_scenarios.md` | Cuộc gọi đến, mất mạng, background, xoay màn hình, quyền | — |
| `…/references/sql_oracle.md` 🆕 | Oracle đọc lại dữ liệu bằng SQL | **Chỉ SELECT**, chỉ trên env thuộc `sandbox_urls`, tài khoản DB chỉ đọc; không có thì ghi `UNKNOWN` |
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
| `evals/README.md`, `scripts/evals/prepare-isolated.ps1`, `grade.js` | Cách chạy eval (`codex exec`, `claude -p`), cách ly golden, chấm điểm | — |
| `evals/golden/bug-reporting.task.md` 🆕 | **Đề bài** golden (Claude viết), có bẫy: thiếu evidence; requirement không rõ → đáp án đúng là không tạo bug mà đặt câu hỏi | Không chứa đáp án |
| `evals/golden/bug-reporting.md` | **Đáp án** (Codex viết, Han duyệt) | `DRAFT-BY: Codex` → `REVIEWED-BY: Han` |
| `docs/review_checklist_dot1.md` | Checklist duyệt | — |

**Nghiệm thu:** `check-skills` + `grep-clean` sạch; 9 prompt pilot trên Codex đúng skill; routing smoke 3 prompt/skill đúng 100%; chạy thử `md_to_xlsx`/`redact`/`to-external` với file mẫu; golden đạt checklist; Han duyệt.

### ĐỢT 2: Automation + CI (34 file)

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
| `docs/review_checklist_dot2.md` | Checklist duyệt | — |

**Nghiệm thu:** scaffold chạy `npx playwright test --list`; YAML CI hợp lệ; `plans/automation` đã soát; eval Đợt 2 đạt.

### ĐỢT 3: Lead, tích hợp, đa stack (49 file)

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
| `docs/review_checklist_dot3.md` | Checklist duyệt | — |

**Nghiệm thu:** đã đọc toàn bộ script Jira; routing ≥ 90% trên Codex; Han duyệt.

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
| **Test routing pilot và eval trên Codex** (cả trước 10/10) | Han chạy, Claude chuẩn bị prompt và cách chấm |
| **Đáp án golden** | Codex viết, Han duyệt |
| Cài kit vào máy thật | Han chạy `install.ps1` |
| Duyệt từng đợt | Han |
| Hỏi lead về `ai_policy`; đề xuất CI/CODEOWNERS (`proposal_for_lead.md`) | Người dùng |

## 8. Để sau
| Mảng | Lý do hoãn | Cần gì |
|---|---|---|
| Performance (k6, JMeter) | Cần env riêng, baseline, SLA | Requirement có SLA, env load test, quyền |
| Security chuyên sâu | Cần văn bản cho phép và scope pháp lý | Giấy phép, env cô lập, người chuyên security |
| Accessibility đầy đủ | Phần lớn cần người kiểm tra bằng tay | Chuẩn WCAG mục tiêu, thiết bị, người có kinh nghiệm |
| UAT | Do người dùng nghiệp vụ thực hiện | Mẫu UAT của khách, tiêu chí chấp nhận |
| **ai-product-testing** (test sản phẩm có AI: hallucination, prompt injection, RAG, eval model) | Phương pháp khác hẳn test phần mềm thường: oracle là thống kê, cần bộ dữ liệu eval và ngưỡng chấp nhận | Sản phẩm AI thật cần test, bộ câu hỏi/đáp án tham chiếu, ngưỡng do PO đặt, công cụ eval |

## 9. Câu hỏi mở và lỗi còn tồn

| # | File / phạm vi | Câu hỏi | Cách kiểm tra |
|---|---|---|---|
| Q1 | `adapters/codex/config.toml` | `localhost` có truy cập được khi `network_access = false`? Cách bật allowlist domain chính xác? | Chạy `curl` tới server local trong Codex |
| Q2 | `adapters/codex/hooks.json` | Định dạng `tool_input` của `Edit`/`Write` trong Codex | Cho hook ghi stdin ra file khi chạy Codex thật |
| Q3 | `adapters/codex/config.toml` | Codex trên Windows có cần `npx.cmd` cho MCP không | Chạy MCP Playwright trong Codex |
| Q4 | Toàn kit | Extension VS Code của Codex có dùng chung `~/.codex/config.toml` và hook không (nguồn hiện là bên thứ ba) | Hỏi Codex đọc `.env`, xem hook chặn không |
| ~~Q5~~ | ~~Lệnh tắt Claude~~ | Đã chốt: bỏ cả 15 (quyết định #25) | — |
| Q10 | `output_dir` mặc định | Mặc định `~/aiqe-output/` nằm **ngoài workspace** nên sandbox Codex hỏi duyệt mỗi lần ghi. Tạm thời dùng `new-project -OutputInProject`. Có đổi mặc định không? | Quyết định sau pilot |
| Q9 | `prompts/manual/05_…md` | Bảng field bị chép 2 nơi; có cần script kiểm tra 2 bản khớp nhau không | Thêm vào `check-skills.js` ở Đợt 2 nếu thấy lệch |
| Q6 | `test-strategy` | Ước lượng theo phương pháp nào; metric nào được ghi `UNKNOWN` | Đợt 3 |
| Q7 | `regression-selection` | Ai lập coverage map lần đầu | Đợt 3 |
| Q8 | `jira-xray` | Công ty dùng TestRail hoặc Excel thì sao | Đợt 3 |

## 10. Bảng đếm file

| Phần | Số file |
|---|---|
| Đợt 0 | 36 |
| Đợt 1 | 55 |
| Đợt 2 | 34 |
| Đợt 3 | 49 |
| **Kit 0.1.0** | **174** |
| Agent 0.2.0 (30 trong `agent/` + `docs/agent_design.md`) | 31 |
| **Tổng** | **205** |

Thay đổi so với plan v4.2 (194 file kit):
- −15: bỏ lệnh tắt Codex (quyết định #21)
- +3: Đợt 0 thêm `codex/hooks.json`, `hooks/lib.js`, `install.js` (#22, #24)
- −15: bỏ lệnh tắt Claude (#25)
- +1: `.gitattributes` (#26)
- +1: `test-design-rbt/references/sql_oracle.md` (#27)
- +1: `evals/golden/bug-reporting.task.md` (tách đề bài khỏi đáp án)
- +2: `scripts/lib/config.js`, `scripts/package-lock.json` (phát sinh ở Bước 1)
- +2: `scripts/project/new-project.ps1` + `new-project.js` (yêu cầu ngày 07/10: tạo dự án mới kèm yml)
- = **174**
