---
id: CONTRACT-<CASE-ID>
source: [AC-<MODULE>-01, TC-<MODULE>-001]
labels: [AI-PROPOSAL]
produced_by: run-contract
status: draft
---
# Run contract: <Case ID>

> Gốc: `ai-qe-kit/templates/run_contract.md`. Đổi `OBS-PACKET` → `DOM-OBSERVED` (quan sát có người, env, ngày) hoặc `CẦN VERIFY LIVE`.
> Ví dụ chạy được: `agent/cases/EMP-CREATE-01/`.

## 1. Hợp đồng
| Mục | Nội dung | Nguồn / nhãn |
|---|---|---|
| Precondition | | |
| Setup (tạo data, prefix của run) | | |
| Action (bước WRITE) | | |
| Oracle 1 (dữ liệu nghiệp vụ: đúng ID + đúng giá trị cùng row) | | `AC-…` |
| Oracle 2 | | `AC-…` |
| Evidence cần thu (trace, screenshot, response) | | |
| Cleanup (chỉ record của run) | | |
| Owner (người chịu trách nhiệm run và cleanup) | | |
| Stop condition (thiếu evidence, hết budget, vượt approval, ghi chưa rõ) | | |

## 2. Giả định UI (tách khỏi requirement)
| Giả định | Nhãn (`DOM-OBSERVED` người/env/ngày, hoặc `CẦN VERIFY LIVE`) | Cần kiểm gì trên live |
|---|---|---|

## 3. Workflow trước và sau WRITE
Ranh giới WRITE: trước bước ghi chỉ đọc; từ bước ghi trở đi phải tính tới ghi không rõ kết quả và cleanup.
| # | Bước | Tool | Input | Output mong đợi | Cập nhật trạng thái | Guard | Thiếu evidence thì |
|---|---|---|---|---|---|---|---|

## 4. Runner contract
- **Input:** caseId, env (thuộc `sandbox_urls`), runId (mới, chưa dùng), revision/SHA, approval ref (G1)
- **Output:** attemptId, trạng thái reporter, chi tiết assertion, artifact ref, kết quả cleanup
- **Chống trùng runId:** tra evidence store; trùng thì từ chối, không ghi đè
- **Ghi không rõ kết quả:** `OUTCOME_UNKNOWN` → chỉ tra cứu chỉ-đọc theo ID của run; tạo lại cần G2 + run mới

## 5. Locator và oracle
| Element | Locator (có scope) | Nhãn | Cần verify trên live |
|---|---|---|---|

Vì sao click hoặc toast không đủ làm oracle:

## 6. Phạm vi approval
| Bước | Có trong G1 đã duyệt? | Nếu vượt: chặn / xin gate nào |
|---|---|---|

## 7. Unknowns
-
