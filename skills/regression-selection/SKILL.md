---
name: regression-selection
description: Chọn test case cần chạy lại sau một thay đổi (PR, commit, ticket) dựa trên coverage map, ghi rõ vì sao chọn, vì sao bỏ và rủi ro. Dùng khi "chạy lại test nào", "regression cho PR này", "thay đổi này ảnh hưởng gì". Không dùng để chạy test → ui-automation.
---

# Regression Selection

> Chuẩn: `{{KIT}}/rules/evidence_labels.md`, `{{KIT}}/rules/id_conventions.md`.
> Mẫu: `{{KIT}}/templates/regression_selection.md`. Format coverage map: `references/coverage_map_format.md`.

## Khi dùng / Không dùng
- **Dùng:** có một thay đổi cụ thể và cần quyết định chạy lại TC nào; lập coverage map lần đầu (mode `map`).
- **Không dùng:**
  - Chạy test đã chọn → `ui-automation` mode `run` / `api-testing` (cần G1).
  - Test fail sau khi chạy → `incident-triage`.
  - Lập kế hoạch test cả release → `test-strategy`.

## Mode
| Mode | Việc |
|---|---|
| `select` (mặc định) | Thay đổi + coverage map → danh sách TC chọn/bỏ |
| `map` | Dựng **bản nháp** coverage map từ bộ TC và code test; QA duyệt mới dùng được |

## Đầu vào
| Cần | Thiếu thì |
|---|---|
| Thay đổi: PR/commit/ticket, **file hoặc module bị đổi** | Hỏi. Chỉ có mô tả bằng lời → nhãn `PROVIDED`, độ tin cậy thấp |
| Coverage map (`<output_dir>/decisions/COVERAGE-<PROJECT>.md`) | **Từ chối chọn.** Đề xuất: chạy smoke + `@critical`, và chạy mode `map` |
| Bộ TC (`testcases/`), tag | Không có → không chọn được theo TC, báo user |
| Ngày cập nhật map, ngày thay đổi gần nhất của module | Không rõ → coi map là cũ |

Đọc diff thật (`git diff`, `git show` chỉ đọc) nếu có quyền: thay đổi đã đọc diff ghi `VERIFIED`; chỉ nghe kể ghi `PROVIDED`.

## Quy trình
**`select`**
1. Liệt kê phần bị đổi (file, module, endpoint, config), nhãn theo nguồn.
2. Kiểm tra map: có map không; map cập nhật trước hay sau lần đổi gần nhất của module. **Map cũ hơn → mọi kết quả chọn là `HYPOTHESIS`**, ghi rõ ở đầu file.
3. Với mỗi phần bị đổi, tra map → TC. Mỗi TC chọn ghi **dòng map nào khớp**. Không suy diễn ngoài map ("chắc module này dùng chung") trừ khi ghi `HYPOTHESIS` kèm lý do.
4. Phân mức: **bắt buộc** (map khớp trực tiếp) · **nên** (phụ thuộc gián tiếp có trong map) · **tùy chọn**.
5. Luôn thêm smoke và TC tag `@critical`, không phụ thuộc kết quả chọn.
6. Bảng **không chọn**: nhóm TC bỏ, lý do, rủi ro nếu bỏ.
7. Phần thay đổi **không có trong map** → mục Unknowns + đề xuất cập nhật map. Không âm thầm bỏ qua.

**`map`**
1. Đọc TC (`Tags`, module trong ID) và code test (file spec import page/endpoint nào) → bản nháp theo `references/coverage_map_format.md`.
2. Mọi dòng là `HYPOTHESIS` (AI suy ra), `status: draft`. QA duyệt từng dòng → `QA-ACCEPTED`.
3. Ghi người lập, ngày; nhắc cập nhật map khi thêm module/TC.

## Output
- `select`: `<output_dir>/decisions/REGSEL-<MODULE>-<NN>.md` theo `regression_selection.md`, `produced_by: regression-selection`, `labels: [AI-PROPOSAL]` (+ `HYPOTHESIS` nếu map cũ).
- `map`: `<output_dir>/decisions/COVERAGE-<PROJECT>.md`, `status: draft`.

## Gate và giới hạn
- Skill **không chạy test**. Chạy suite đã chọn: **G1** ở `ui-automation`/`api-testing`.
- Thu hẹp phạm vi regression là quyết định của QA lead: danh sách là `AI-PROPOSAL`.
- Không có map thì không chọn (không đoán ảnh hưởng). Chỉ đọc git, không chạy lệnh git làm đổi trạng thái.

## Self-check
- [ ] Có coverage map; không có thì đã từ chối và đề xuất smoke + `map`
- [ ] Đã so ngày map với ngày thay đổi; map cũ → `HYPOTHESIS` ở đầu file
- [ ] Mỗi TC chọn trỏ tới dòng map khớp
- [ ] Có smoke + `@critical`; có bảng không chọn kèm rủi ro
- [ ] Phần đổi không có trong map nằm ở Unknowns
- [ ] Nhãn thay đổi đúng: đọc diff → `VERIFIED`, nghe kể → `PROVIDED`
