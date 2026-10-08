# Thiết kế agent 0.2.0

> Agent chạy một case E2E (`EMP-CREATE-01` trên OrangeHRM demo) có kiểm soát: guard, gate, state machine, evidence.
> Lõi: 08/10. Tool thật (`inspect_ui`, `run_case`, `lookup`, `cleanup`) và demo: 09/10.
> Mẫu tool lấy theo `TOOL-PACKET-01` của đề bài khóa học (`L3_AIQE_AAALE_exercises_vi (1).md:59-66`), chỉ dùng làm tham khảo thiết kế.

## 1. Nguyên tắc
**Planner đề xuất, controller quyết định, người duyệt.**
- Planner (mock, Codex hoặc API) **chỉ trả về một hành động dạng JSON**. Planner không có quyền gọi tool hay shell của agent.
- Controller (code TypeScript) kiểm tra guard rồi mới gọi tool. Guard là **ranh giới thật đối với planner**: planner muốn gì cũng phải qua controller.
- Guard **không** chặn được người vận hành (người sửa code hoặc config của agent). Xem mục 7.

## 2. Thành phần
```
            đề xuất Action (JSON)                 gọi tool đã qua guard
 Planner ───────────────────────▶ Controller ──────────────────────────▶ Tool executor ──▶ app (sandbox)
 (mock/codex/api)                  │  ▲   │                                   │
        ▲   observation bọc        │  │   └─ hỏi G1/G2 ──▶ ApprovalProvider (người, console)
        └── <untrusted>…</untrusted>┘  │
                                       └──── ghi mọi sự kiện ──▶ EvidenceStore (JSONL, chỉ ghi thêm, chuỗi hash)
```
| File | Vai trò |
|---|---|
| `agent/src/types.ts` | Kiểu dữ liệu: Action, State, ToolSpec, Policy, Approval… |
| `agent/src/state_machine.ts` | Trạng thái và chuyển trạng thái hợp lệ |
| `agent/src/guards.ts` | Các invariant, hàm thuần, dễ test |
| `agent/src/controller.ts` | Vòng lặp: planner → guard → tool → evidence → state |
| `agent/src/approvals.ts` | Hỏi người duyệt G1/G2 (console hoặc kịch bản cho test) |
| `agent/src/evidence_store.ts` | Ghi evidence chỉ thêm, phát hiện sửa/xóa bằng chuỗi hash |
| `agent/src/planner/*` | 3 chế độ planner + bọc dữ liệu untrusted |
| `agent/config/policy.json` | Luật do **người** viết: sandbox, prefix, budget, thời hạn approval |
| `agent/config/tool_manifest.json` | Khai báo tool: đọc/ghi, input được phép, timeout, gate |

## 3. Trạng thái
```
PLANNED ──▶ AWAIT_G1 ──▶ SETUP ──▶ ACT ──▶ VERIFY ──▶ CLEANUP ──▶ DONE
                │          │        │         │           └──▶ CLEANUP_PENDING (dọn lỗi)
                │          └────────┴──▶ OUTCOME_UNKNOWN (ghi dữ liệu bị timeout)
                │                          ├──▶ VERIFY (tra cứu thấy record của run)
                │                          └──▶ BLOCKED_NEEDS_HUMAN (không thấy / không tra được)
                └──▶ BLOCKED (bị từ chối duyệt, vi phạm guard nặng)      · CANCELLED · FAILED
```
Trạng thái kết thúc: `DONE`, `CLEANUP_PENDING`, `BLOCKED`, `BLOCKED_NEEDS_HUMAN`, `CANCELLED`, `FAILED`.
**Kết luận pass** (`verdict: pass`) chỉ khi: `DONE` + verify đạt + cleanup xong (hoặc run không tạo record nào).

## 4. Invariant và guard ép nó
| # | Invariant | Guard (`guards.ts`) | Kết quả khi vi phạm |
|---|---|---|---|
| I1 | Chỉ gọi tool có trong manifest | `checkAllowlist` | Chặn hành động, ghi evidence |
| I2 | Input đúng manifest; URL thuộc `sandboxUrls` | `checkInput` | Chặn |
| I3 | Tool **ghi** cần G1 còn hiệu lực, đúng run, đúng env, đúng tool | `checkApproval` (controller hỏi người khi thiếu) | Người từ chối → `BLOCKED` |
| I4 | Run ID đúng định dạng và **chưa dùng** | `checkRunId` (dựa trên evidence store) | Từ chối run, không chạy gì |
| I5 | Record được tra/dọn phải **thuộc run** (prefix của run; dọn: phải do run tạo) | `checkOwner` | Chặn |
| I6 | Không vượt budget (số lần gọi tool, thời gian, số lần bị chặn) | `checkBudget` | `BLOCKED` |
| I7 | **Oracle bất biến trong run** | controller chặn `change_oracle`; hash oracle ghi lúc bắt đầu | `BLOCKED`, cần G3 + run mới |
| I8 | Ghi dữ liệu timeout → **không ghi lại**, chỉ tra cứu chỉ-đọc | `checkOutcomeUnknown` | Chặn mọi tool ghi |
| I9 | Không pass khi cleanup chưa xong | controller khi `finish` | `CLEANUP_PENDING`, verdict không phải pass |
| I10 | Evidence chỉ ghi thêm | `EvidenceStore` không có hàm sửa/xóa; `verify()` kiểm chuỗi hash | Phát hiện được khi bị sửa |
| I11 | Dữ liệu từ tool là untrusted | `untrusted.ts` bọc trước khi đưa planner; dò chỉ thị lạ | Ghi `security_observation`, báo người |

## 5. Approval
- Controller hỏi người qua `ApprovalProvider` khi tool ghi chưa có G1.
- Console: hiện **phạm vi** (run ID, env, case, tool) và yêu cầu gõ đúng `dong y <run ID>`; gõ "ok" hay Enter **không** được tính.
- Approval có thời hạn (`approvalTtlMs` trong policy) và chỉ áp dụng cho run ID đó.
- Mọi quyết định (đồng ý/từ chối) ghi vào evidence store.

## 6. Planner
| Chế độ | Trạng thái 08/10 | Ghi chú |
|---|---|---|
| `mock` | Chạy được | Đọc kịch bản viết sẵn (`agent/scenarios/scenarios.json`); dùng cho test và demo |
| `codex` | Có code, **chưa kiểm chứng** | Gọi `codex exec` trong thư mục tạm rỗng, sandbox chỉ đọc; lấy JSON hành động từ câu trả lời cuối. Codex tự có tool của nó: đây là rủi ro, xem mục 7 |
| `api` | Interface sẵn | Chưa có API key → báo "chưa cấu hình", không crash |

Planner nhận: trạng thái, lịch sử (hành động, kết quả, lý do bị chặn), observation cuối **đã bọc `<untrusted>`**.

## 7. Giới hạn (threat model của agent)
| Guard | Hàng | Giới hạn |
|---|---|---|
| Guard trong controller (I1–I9) | 🛡️ đối với planner | Người vận hành sửa code/policy là bỏ được. Không chống người |
| Approval console | 🛡️ đối với planner | Người gõ đồng ý mà không đọc phạm vi |
| Evidence chuỗi hash | 🧯 | Phát hiện sửa/xóa giữa chừng; người xóa cả file thì không có gì để so |
| Planner `codex` | ⚠️ | `codex exec` có tool riêng (đọc file, chạy lệnh trong sandbox của Codex). Giảm rủi ro: thư mục tạm rỗng, sandbox chỉ đọc, mạng tắt. Mức cách ly thật: `UNKNOWN` cho tới khi kiểm chứng |
| Dò prompt injection | 🧯 | Regex bắt được mẫu phổ biến; không bắt hết |

## 8. Demo (09/10)
1. **Luồng chỉ đọc trước**: đăng nhập + tìm nhân viên trên OrangeHRM demo. Không cần G1 cho thao tác ghi.
2. **Luồng tạo nhân viên**: chỉ khi có G1; tên mang prefix của run (`QA-r001-An`); cleanup đúng record của run; cleanup lỗi → `CLEANUP_PENDING`.
3. Tài khoản test đọc từ `.env.sandbox`, không qua chat.
