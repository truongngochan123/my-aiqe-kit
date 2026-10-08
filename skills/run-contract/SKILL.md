---
name: run-contract
description: Viết run contract cho một case E2E trước khi cho agent hoặc script chạy thật: precondition, setup, bước ghi, oracle gắn AC, evidence, cleanup, owner, điều kiện dừng, chống trùng run ID. Dùng khi "run contract", "chuẩn bị cho agent chạy case". Không dùng để thiết kế cả agent → agent-architecture.
---

# Run Contract

> Mẫu: `{{KIT}}/templates/run_contract.md`. Chuẩn: `{{KIT}}/rules/agent_safety.md`, `{{KIT}}/rules/automation_standards.md`, `{{KIT}}/rules/retry_and_wait.md`.
> Ví dụ chạy được (trong repo kit, không có trong bản cài): `agent/cases/EMP-CREATE-01/` (`case.json` + spec ghi `save-clicked.json`/`created.json`).
> Nguồn gốc: `ai-qe-kit/.claude/skills/run-contract`; bỏ phần bài tập U2; `OBS-PACKET` đổi thành `DOM-OBSERVED`/`CẦN VERIFY LIVE`.

## Khi dùng / Không dùng
- **Dùng:** trước khi một case có **ghi dữ liệu** được chạy tự động (agent hoặc pipeline); review contract người khác viết.
- **Không dùng:**
  - Thiết kế agent (planner, controller, tool, state) → `agent-architecture`.
  - Viết code test → `ui-automation`/`api-testing`. Viết TC → `test-design-rbt`.

## Đầu vào
| Cần | Thiếu thì |
|---|---|
| TC (bảng 3a) hoặc AC có ID | Hỏi. Oracle không có AC/kỳ vọng hiển nhiên → không viết contract, chuyển câu hỏi |
| Quan sát UI/API (locator, endpoint) có người/env/ngày | Ghi `CẦN VERIFY LIVE`, không bịa |
| `project.aiqe.yml`: `sandbox_urls`, `id_prefix` | Mặc định chặt nhất: không env nào được ghi |
| Ai là owner run + cleanup | Hỏi; thiếu owner thì contract chưa dùng được |

## Quy trình
1. **Hợp đồng 9 mục** (mẫu mục 1). Oracle là **dữ liệu nghiệp vụ**: tra lại theo ID của run, đúng giá trị trong cùng row. Click thành công hay toast **không** đủ: giải thích vì sao.
2. **Tách giả định UI** khỏi requirement (mẫu mục 2): mỗi locator/endpoint có nhãn `DOM-OBSERVED` (người, env, ngày) hoặc `CẦN VERIFY LIVE`.
3. **Workflow trước/sau WRITE**: mỗi bước `tool | input | output mong đợi | cập nhật trạng thái | guard | thiếu evidence thì`. Đánh dấu ranh giới WRITE. Sau ranh giới phải có nhánh:
   - ghi timeout / không rõ → `OUTCOME_UNKNOWN`, chỉ tra cứu chỉ-đọc theo ID của run, không ghi lại;
   - verify fail → vẫn cleanup, kết quả fail;
   - cleanup fail → `CLEANUP_PENDING`, không pass.
4. **Phân biệt "chưa ghi" / "đã ghi" / "không rõ"**: chỉ ra dấu hiệu (ví dụ file đánh dấu trước khi bấm Lưu, ID trả về sau khi lưu).
5. **Runner contract**: input (caseId, env, runId mới, SHA, approval ref), output (attemptId, trạng thái, assertion, artifact, cleanup). **Chống trùng runId**: tra evidence, trùng thì từ chối.
6. **Approval scope**: so từng bước với G1 đã/định xin. Bước vượt scope (chạy lại, sửa code, đẩy ra ngoài) → chặn, ghi gate cần.
7. Unknowns + "Bước tiếp theo".

## Output
`<output_dir>/decisions/CONTRACT-<CASE-ID>.md` theo `run_contract.md`, front-matter `produced_by: run-contract`, `labels: [AI-PROPOSAL]`, `source: [AC-…, TC-…]`, `status: draft`.

## Gate và giới hạn
- Contract là `AI-PROPOSAL`; QA duyệt trước khi chạy. Chạy thật cần **G1**; chạy lại **G2**; đổi oracle **G3** (run mới).
- Không kết luận `RUN-PASSED` từ quan sát hay dry-run. Không bịa locator/endpoint.
- Cleanup chỉ đụng record mang prefix của run **và** do run tạo.

## Self-check
- [ ] Đủ 9 mục; oracle gắn `AC-*` (hoặc kỳ vọng hiển nhiên #) và kiểm dữ liệu nghiệp vụ
- [ ] Giả định UI tách riêng, có nhãn; không có locator/endpoint bịa
- [ ] Có nhánh `OUTCOME_UNKNOWN`, verify fail, cleanup fail
- [ ] Phân biệt được chưa ghi / đã ghi / không rõ
- [ ] Có chống trùng runId; cleanup chỉ record của run
- [ ] Có điều kiện dừng: thiếu evidence, hết budget, vượt approval
