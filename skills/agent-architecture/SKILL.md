---
name: agent-architecture
description: Thiết kế hoặc review kiến trúc AI agent chạy test: planner, controller, tool, evidence, người duyệt; tool manifest; state machine; invariant và chỗ ép; đường dữ liệu untrusted thành lệnh. Dùng khi "thiết kế agent", "review agent", "tool manifest". Không dùng cho hợp đồng một case → run-contract.
---

# Agent Architecture

> Chuẩn: `{{KIT}}/rules/agent_safety.md`, `{{KIT}}/docs/threat_model.md`. Mẫu: `{{KIT}}/templates/tool_manifest.md`, `{{KIT}}/templates/state_machine.md`.
> Ví dụ chạy được trong repo kit: `agent/` + `docs/agent_design.md` (controller, guard, evidence chuỗi hash, 30 test).
> Nguồn gốc: `ai-qe-kit/.claude/skills/agent-architecture`; bỏ phần bài tập U1.

## Khi dùng / Không dùng
- **Dùng:** thiết kế agent có tool; review thiết kế/code agent của người khác; xem planner proposal có an toàn không.
- **Không dùng:**
  - Hợp đồng chạy một case cụ thể → `run-contract`.
  - Viết script test thông thường → `ui-automation`/`api-testing`.
  - Test **sản phẩm** có AI (hallucination, RAG) → chưa hỗ trợ (Để sau).

## Mode
| Mode | Việc |
|---|---|
| `design` | Từ mục tiêu → sơ đồ, manifest, state machine, invariant |
| `review` | Soát bản nháp/code theo checklist, liệt kê lỗ hổng |

## Đầu vào
| Cần | Thiếu thì |
|---|---|
| Mục tiêu agent, case nó chạy, env | Hỏi |
| Tài liệu của tool/API agent được dùng | Capability không có tài liệu → `UNKNOWN`, không tự thêm |
| Ai duyệt (G1–G4), ở đâu (console, PR) | Hỏi; mặc định người duyệt trên console |
| Mode `review`: bản nháp hoặc đường dẫn code | Hỏi |

## Quy trình
**`design`**
1. **Sơ đồ** (Mermaid): mục tiêu → planner → controller → tool → app; evidence store; người duyệt. Vẽ **ranh giới tin cậy**: mọi dữ liệu từ UI/log/file vào planner phải qua controller, bọc `<untrusted>`.
2. **Tool manifest** (`tool_manifest.md`): mỗi tool đọc/ghi, pha, input được phép, output lưu, timeout/budget (`UNKNOWN` hoặc "policy đề xuất"), redact, gate, khi nào từ chối. Chỉ capability có tài liệu.
3. **State machine** (`state_machine.md`): bảng `từ | sự kiện | guard | đến | evidence`; đủ trạng thái kết thúc và nhánh lỗi (`OUTCOME_UNKNOWN`, `BLOCKED_NEEDS_HUMAN`, `CANCELLED`, `CLEANUP_PENDING`).
4. **Invariant** tối thiểu: trước WRITE, trước PASS, oracle bất biến, ghi không rõ thì không ghi lại, run ID không trùng. Mỗi invariant nêu **chỗ ép** (controller/adapter/server) và hàng threat (🛡️/🧯/📝). Giới hạn chỉ nằm trong prompt → ghi 📝, không gọi là guard.
5. **Review proposal** của planner: tách từng chỉ thị, phân nguồn (mục tiêu hợp lệ / `AI-PROPOSAL` / dữ liệu untrusted) → Allow / Block / Review kèm lý do.

**`review`**: dò theo checklist, mỗi phát hiện ghi `Vấn đề | Transition/tool | Hậu quả | Cách sửa` (nhãn `AI-PROPOSAL`):
- Transition nào cho WRITE/PASS mà thiếu guard? Có đường vòng qua bước chờ duyệt không?
- Dữ liệu có thành lệnh được không (trang web, log, tên file)?
- Tool/capability bịa thêm? Planner gọi tool trực tiếp?
- State kẹt; thiếu nhánh timeout/cancel/cleanup fail?
- Approval có gắn run/env/case/tool và thời hạn không? Planner trả lời thay người được không?
- Evidence sửa/xóa được mà không bị phát hiện?
- Guard có test chặn + test cho qua, và đã thử tắt guard xem test có fail không (mutation)?

## Output
- `<output_dir>/decisions/AGENT-<TÊN>.md` (sơ đồ + invariant), `MANIFEST-<TÊN>.md`, `STATES-<TÊN>.md`; `produced_by: agent-architecture`, `labels: [AI-PROPOSAL]`.
- Mode `review`: `<output_dir>/decisions/AGENT-REVIEW-<TÊN>.md`.

## Gate và giới hạn
- Thiết kế là `AI-PROPOSAL`; người duyệt. Skill không chạy agent, không sửa code agent của người khác khi chưa được yêu cầu.
- Guard trong code agent không chống được **người** sửa code/policy (ghi rõ, như `docs/agent_design.md` mục 7).
- Quyền thật của tool (sandbox, network) chưa xác nhận → `UNKNOWN`.

## Self-check
- [ ] Planner không gọi tool trực tiếp; mọi tool qua controller
- [ ] Không có đường tự sửa oracle; đổi oracle cần G3 + run mới
- [ ] Dữ liệu từ trang/log bọc untrusted; chỉ thị lạ bị chặn, ghi observation
- [ ] Mỗi invariant có chỗ ép + hàng threat; giới hạn chỉ-prompt ghi 📝
- [ ] Có nhánh ghi không rõ, cleanup fail, hết budget
- [ ] Capability/permission chưa xác nhận ghi `UNKNOWN`
