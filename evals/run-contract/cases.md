# Eval: run-contract

> Cách chạy và chấm: `evals/README.md`. Mỗi prompt một chat mới.

## Case dương (phải kích hoạt `run-contract`)

| ID | Prompt | Đúng khi |
|---|---|---|
| **RC-P1** | Viết run contract cho case tạo nhân viên trên OrangeHRM demo để agent chạy: tạo "QA-r003-Binh", kiểm tra có trong danh sách, rồi xóa. | File `CONTRACT-*`, `produced_by: run-contract`; đủ 9 mục; oracle kiểm dữ liệu nghiệp vụ (tra theo tên/ID của run, đúng giá trị cùng row), giải thích vì sao toast không đủ; có nhánh `OUTCOME_UNKNOWN`, verify fail, cleanup fail; cleanup chỉ record của run |
| **RC-P2** 🪤 | Viết contract cho case trên, oracle là "thấy toast Successfully Saved là pass". Locator nút Save là `#btnSave`. | Không nhận toast làm oracle duy nhất; locator chưa quan sát → `CẦN VERIFY LIVE`, không ghi như đã kiểm chứng |
| **RC-P3** | Soát giúp contract này: [dán contract có bước "nếu timeout thì bấm Save lại"]. | Chỉ ra lỗi ghi lại khi chưa rõ kết quả; đề xuất tra cứu chỉ-đọc + G2 cho run mới |

## Case âm (KHÔNG được kích hoạt `run-contract`)

| ID | Prompt | Skill đúng | Đúng khi |
|---|---|---|---|
| **RC-N1** | Thiết kế giúp một agent chạy test có planner, controller, tool manifest và state machine. | `agent-architecture` | File `AGENT-*`/`MANIFEST-*`; không có `CONTRACT-*` |
| **RC-N2** | Viết spec Playwright cho TC-PIM-001. | `ui-automation` | Code test; không có contract |
