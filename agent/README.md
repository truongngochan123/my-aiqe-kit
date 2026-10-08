# aiqe-agent 0.2.0 (đang dựng)

Agent chạy một case E2E **có kiểm soát**: planner (AI hoặc kịch bản) chỉ **đề xuất** hành động; controller kiểm tra guard, hỏi người duyệt khi cần, rồi mới gọi tool; mọi sự kiện ghi vào evidence chỉ ghi thêm.
Thiết kế: `../docs/agent_design.md`.

## Trạng thái
| Phần | Ngày | Trạng thái |
|---|---|---|
| Lõi: controller, guard, state machine, evidence store, approval, planner mock/codex/api | 08/10 | ✅ |
| 6 tool thật, báo cáo, CLI, case `EMP-CREATE-01` | 09/10 | ✅ 30 test đạt (tool dùng client/runner giả trong test) |
| Luồng chỉ đọc trên OrangeHRM demo | 09/10 | ✅ chạy thật (`RUN-20261009-02`) |
| Luồng tạo nhân viên trên OrangeHRM demo (cần G1) | 10/10 | ⏳ Han chạy |

## Cài và test
```powershell
cd D:\fpt-inform\my-aiqe-kit\agent
npm install
npm test           # 30 test, không chạm site nào
npm run typecheck  # tsc --noEmit
```
Node ≥ 22.6 (chạy TypeScript trực tiếp). Trình duyệt: `npx playwright install chromium`, hoặc dùng Edge có sẵn: `$env:AIQE_BROWSER_CHANNEL = "msedge"`.

## Chạy
```powershell
# 5 kịch bản mô phỏng (tool giả, không chạm site): kết quả ghi "MÔ PHỎNG"
npm run agent -- demo

# Luồng chỉ đọc trên site thật (không có tool ghi)
node --env-file=D:\duong-dan\.env.sandbox --experimental-strip-types src/cli.ts run --scenario readonly --tools real --run-id RUN-20261010-01

# Luồng tạo nhân viên (G1: phải gõ "dong y <run ID>"; dọn đúng record của run)
node --env-file=D:\duong-dan\.env.sandbox --experimental-strip-types src/cli.ts run --scenario happy --tools real --run-id RUN-20261010-02 --prefix QA-r002

npm run agent -- report --run-id RUN-20261010-02   # tạo lại báo cáo
npm run agent -- verify                            # kiểm tra chuỗi hash evidence
```
`.env.sandbox` chứa `AIQE_SANDBOX_USER=` và `AIQE_SANDBOX_PASS=` của **tài khoản test**. Mỗi run một run ID mới (trùng là bị từ chối). Output ở `agent/runs/` (không commit).
Exit code: 0 khi pass, 1 khi fail/không kết luận/bị chặn, 2 khi sai tham số.

## Cấu trúc
| Đường dẫn | Vai trò |
|---|---|
| `config/policy.json` | Luật do **người** viết: sandbox, prefix, budget, thời hạn approval |
| `config/tool_manifest.json` | Allowlist tool: đọc/ghi, input được phép, timeout, gate |
| `src/controller.ts` | Vòng lặp planner → guard → người duyệt → tool → evidence → trạng thái |
| `src/guards.ts` | Invariant I1–I8 dạng hàm thuần |
| `src/state_machine.ts` | Trạng thái và chuyển trạng thái hợp lệ |
| `src/evidence_store.ts` | JSONL chỉ ghi thêm, chuỗi hash phát hiện sửa/xóa |
| `src/approvals.ts` | Hỏi người trên console (phải gõ `dong y <run ID>`), hoặc kịch bản cho test |
| `src/planner/` | `mock` (kịch bản), `codex` (`codex exec`, **chưa kiểm chứng**, Q11), `api` (chưa có key → báo chưa cấu hình); `untrusted.ts` bọc dữ liệu từ tool |
| `src/tools/` | `read_case`, `inspect_ui`, `run_case`, `read_result`, `lookup_owned_record`, `cleanup_owned_record`; `sandbox_client.ts`; `fake.ts` |
| `src/report.ts`, `src/cli.ts` | Báo cáo từ evidence; CLI |
| `cases/EMP-CREATE-01/` | Case + spec Playwright; `cases/playwright.config.ts` (retries 0, trace on) |
| `scenarios/scenarios.json` | 12 kịch bản: readonly, happy, thiếu G1, ghi timeout, dọn lỗi, đổi oracle, prompt injection… |
| `tests/` | `agent.test.ts` (lõi), `tools.test.ts` (tool, report, CLI) |

## Những gì đã chứng minh (và chưa)
- ✅ Planner không vượt được guard (thiếu G1, trùng run ID, ghi chưa rõ không ghi lại, dọn lỗi không pass, đổi oracle, URL ngoài sandbox, dọn record không thuộc run). Mỗi guard đã kiểm tra ngược.
- ✅ Tool: chỉ dọn `empNumber` run đã ghi (người khác trùng tên không bị xóa); xóa xong tra lại; flaky không phải pass; không đọc kết quả của run khác; đã bấm Save mà không xác nhận được → `OUTCOME_UNKNOWN`. 5 chốt này đã kiểm tra ngược.
- ✅ Luồng chỉ đọc chạy thật trên OrangeHRM demo; evidence không chứa mật khẩu.
- ❌ Luồng ghi chưa chạy thật (chờ G1 của Han). API xóa chưa kiểm chứng.
- ❌ Planner `codex` chưa chạy thử (Q11).
- ❌ Guard không chống được **người** sửa code/policy của agent (`docs/agent_design.md` mục 7).
