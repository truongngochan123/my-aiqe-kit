# Vòng đời test và skill

```
 PLAN ──────▶ ANALYZE ─────▶ DESIGN ──────────▶ AUTOMATE ──────▶ EXECUTE ─────────▶ REPORT
 test-strategy requirement-   test-design-rbt     ui-automation     (chạy manual/auto)  evidence-reporting
 (plan)        analysis       test-data           api-testing        incident-triage    bug-reporting
 regression-                  exploratory-                           run-contract       test-strategy (close)
 selection                    testing                                                   jira-xray
                         ▲                                                    │
                         └──────────── requirement đổi: test-design-rbt (maintain) ◀───┘

 Mọi giai đoạn: ai-output-review (soát output của AI) · qe-coach (khi QA muốn tự làm, không làm hộ)
 Agent tự chạy test: agent-architecture
```

| Giai đoạn | Skill | Đợt | Đầu vào chính | Output | Chuyển tiếp |
|---|---|---|---|---|---|
| Plan | `test-strategy` (mode `plan`) | 3 | Phạm vi release, rủi ro | Test plan | → requirement-analysis |
| Plan | `regression-selection` | 3 | git diff, `coverage_map.md` | Must/Should/Skip | → chạy suite (ui-automation mode `run`) |
| Analyze | `requirement-analysis` | 1 | Requirement/AC, hoặc app đang chạy (mode B) | Phân tích, câu hỏi `Q-*` | → test-design-rbt |
| Design | `test-design-rbt` | 1 | Requirement đã làm rõ | TC (`TC-*`) md + xlsx | → test-data, ui-automation, evidence-reporting (manual-run) |
| Design | `test-data` | 1 | Partition, giá trị biên từ TC | Dataset + registry | → ui-automation, api-testing |
| Design | `exploratory-testing` | 1 | Charter | Session note | → bug-reporting / test-design-rbt / câu hỏi |
| Automate | `ui-automation` | 2 | TC, DOM thật (MCP) | Test code; mode `run` chạy suite | → evidence-reporting; fail → incident-triage |
| Automate | `api-testing` | 2 | Swagger hoặc request mẫu | Test API hoặc collection Postman | → evidence-reporting; fail → incident-triage |
| Execute | `incident-triage` | 1 (mẫu) | Kết quả fail, trace, log | Phân loại + skill tiếp theo | product → bug-reporting; test code → ui-automation; infra → người |
| Execute | `run-contract` | 3 | Một case E2E | Run contract | → agent hoặc người chạy |
| Report | `evidence-reporting` | 1 | Kết quả 1 lần chạy (auto hoặc manual) | Execution report | → test-strategy (close) |
| Report | `bug-reporting` | 1 | Lỗi có evidence | Bug report internal/external | → người đẩy lên tool (G4) |
| Report | `test-strategy` (mode `close`) | 3 | Các execution report, bug | Exit report, go/no-go đề xuất | → lead quyết định |
| Report | `jira-xray` | 3 | File kết quả | Payload + dry-run | → người push (G4) |
| Mọi lúc | `ai-output-review` | 1 | Output của AI | Decision log | — |
| Agent | `agent-architecture` | 3 | Yêu cầu agent | Thiết kế, state machine | → agent 0.2.0 |
| Học | `qe-coach` | 3 | User gọi `$qe-coach` / `/qe-coach` | Câu hỏi gợi mở | — |
