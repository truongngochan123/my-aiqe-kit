# aiqe-agent 0.2.0 (đang dựng)

Agent chạy một case E2E **có kiểm soát**: planner (AI hoặc kịch bản) chỉ **đề xuất** hành động; controller kiểm tra guard, hỏi người duyệt khi cần, rồi mới gọi tool; mọi sự kiện ghi vào evidence chỉ ghi thêm.
Thiết kế: `../docs/agent_design.md`.

## Trạng thái
| Phần | Ngày | Trạng thái |
|---|---|---|
| Lõi: controller, guard, state machine, evidence store, approval, planner mock/codex/api | 08/10 | ✅ 18 test đạt |
| Tool thật (`inspect_ui`, `run_case`, `lookup_owned_record`, `cleanup_owned_record`…), báo cáo, CLI | 09/10 | ⏳ |
| Demo trên OrangeHRM: luồng chỉ đọc trước; luồng tạo nhân viên chỉ khi có G1 và dọn đúng record | 09–10/10 | ⏳ |

## Chạy test
```powershell
cd D:\fpt-inform\my-aiqe-kit\agent
npm install
npm test          # node --experimental-strip-types --test
npm run typecheck # tsc --noEmit
```
Yêu cầu Node ≥ 22.6 (chạy TypeScript trực tiếp, không cần build).

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
| `src/planner/` | `mock` (kịch bản), `codex` (`codex exec`, **chưa kiểm chứng**), `api` (chưa có key → báo chưa cấu hình); `untrusted.ts` bọc dữ liệu từ tool |
| `scenarios/scenarios.json` | 11 kịch bản: happy, thiếu G1, ghi timeout, dọn lỗi, đổi oracle, prompt injection… |
| `tests/agent.test.ts` | Test theo kịch bản + test riêng cho trùng run ID, evidence bị sửa, state machine |

## Những gì test chứng minh (và không chứng minh)
- ✅ Planner không vượt được guard: thiếu G1 bị chặn, trùng run ID bị từ chối, ghi timeout không ghi lại, dọn lỗi không pass, đổi oracle bị chặn, URL ngoài sandbox bị chặn, dọn record không thuộc run bị chặn.
- ✅ Mỗi guard đã được kiểm tra ngược (tắt guard → có test fail).
- ❌ Chưa chạy với tool thật và site thật (09/10).
- ❌ Planner `codex` chưa chạy thử; mức cách ly của `codex exec` là `UNKNOWN`.
- ❌ Guard không chống được **người** sửa code/policy của agent (`docs/agent_design.md` mục 7).
