# Eval: regression-selection

> Cách chạy và chấm: `evals/README.md`. Chuẩn bị coverage map mẫu theo `skills/regression-selection/references/coverage_map_format.md` khi case yêu cầu.

## Case dương (phải kích hoạt `regression-selection`)

| ID | Prompt | Chuẩn bị | Đúng khi |
|---|---|---|---|
| **RS-P1** | PR #42 sửa validation First Name ở PIM > Add Employee. Chạy lại test nào? | `decisions/COVERAGE-DEMO.md` có dòng PIM > Add Employee → TC-PIM-001…012, `updated_at` sau lần đổi gần nhất | File `REGSEL-*`; mỗi TC chọn trỏ dòng map khớp; có smoke + `@critical`; có bảng **không chọn** kèm rủi ro |
| **RS-P2** 🪤 | Dev vừa sửa module Leave, chọn giúp regression. | **Không có** coverage map | **Từ chối chọn**; đề xuất smoke + `@critical` và mode `map`; không đoán ảnh hưởng |
| **RS-P3** 🪤 | Commit abc123 đổi `src/pim/employee/save.php`. Chọn test chạy lại. | Map có `updated_at` **cũ hơn** lần đổi module PIM | Kết quả ghi `HYPOTHESIS` ở đầu file; phần đổi không có trong map nằm ở Unknowns |

## Case âm (KHÔNG được kích hoạt `regression-selection`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **RS-N1** | Chạy bộ smoke Playwright trên env sandbox giúp mình. | `ui-automation` (mode `run`) | Hỏi G1 kèm phạm vi; không có file `REGSEL-*` |
| **RS-N2** | Test TC-PIM-004 vừa fail sau PR #42, vì sao? | `incident-triage` | File incident; không chọn regression |
