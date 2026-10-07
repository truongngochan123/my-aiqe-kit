---
name: test-design-rbt
description: Viết hoặc review manual test case theo EP, BVA, Decision Table, State Transition, Risk-Based Testing; mode quick, full, maintain (requirement đổi). Dùng khi "viết test case", "sinh TC", "review bộ TC". Không dùng khi requirement còn mơ hồ → requirement-analysis; cần dataset cụ thể → test-data.
---

# Test Design (RBT)

> Chuẩn: `{{KIT}}/rules/test_design.md`, `{{KIT}}/rules/id_conventions.md`, `{{KIT}}/rules/evidence_labels.md`.
> Nguồn gốc: `rbt_manual_testing` của bộ gốc (đã làm sạch) + `test-design-rbt` của bộ mới.

## Khi dùng / Không dùng
- **Dùng:** viết TC từ requirement/AC; review bộ TC có sẵn; cập nhật TC khi requirement đổi.
- **Không dùng:**
  - Requirement còn nhiều chỗ mơ hồ, chưa có câu trả lời → `requirement-analysis` trước.
  - Cần bộ dữ liệu cụ thể, nhiều tổ hợp, có cleanup → `test-data`.
  - Viết code automation → `ui-automation` / `api-testing`.
  - Test fail cần biết lỗi do đâu → `incident-triage`.

## Mode
| Mode | Khi nào | Cách chạy |
|---|---|---|
| `quick` (mặc định) | 1 tính năng, AC rõ | Sinh một lượt theo mục Quy trình |
| `full` | Nhiều module, AC mơ hồ, cần đánh giá rủi ro | 6 bước theo `{{KIT}}/prompts/manual/01_context_and_roleplay.md` … `06_template_mapping.md`. **Dừng chờ user ở bước 2 (Q&A) và bước 4 (duyệt scenario).** Không gộp bước |
| `maintain` | Requirement đổi, **hoặc** luật của kit đổi | Requirement đổi: cần **2 phiên bản** requirement hoặc diff, không có → từ chối, hỏi user. Luật kit đổi: soát bộ TC cũ theo Self-check **hiện hành**. Output: TC giữ / sửa / chuyển sang mục thăm dò / lỗi thời (`status: deprecated`) / mới |
| `review` | Soát bộ TC có sẵn | Chạy Self-check ở cuối file lên bộ TC, liệt kê lỗi theo dòng |

User chọn mode bằng lời: "viết TC quick cho…", "/test-design-rbt full …".

## Đầu vào
- Requirement/AC có ID (`AC-<MODULE>-NN`), hoặc output của `requirement-analysis` (đọc front-matter `produced_by: requirement-analysis`).
- `project.aiqe.yml`: `output_language`, `tc_id_format`, `module_codes`, `excel_columns`, `sandbox_urls`.
- Mode `maintain`: bộ TC cũ + requirement cũ và mới (hoặc diff).
- **Thiếu AC có ID:** hỏi user. Nếu user chỉ có mô tả tự do, đánh ID tạm `HYP-<MODULE>-NN` và ghi rõ là giả định, không dùng `AC-`.

## Quy trình (quick)
0. **Kiểm tra bộ TC cũ trước khi làm gì khác** (áp dụng cả mode `full`). Nếu `<output_dir>/testcases/` đã có file TC của **cùng module** (`TC-<MODULE>*.md`): **dừng, hỏi user**, chưa ghi file nào:
   > "Đã có `<tên file>` (ngày …). Bạn muốn: (a) **cập nhật bộ cũ** theo luật hiện hành (mode `maintain`), hay (b) **viết mới** từ đầu?"
   - (a) → chạy mode `maintain`: soát từng TC cũ theo Self-check hiện hành, ghi rõ TC nào giữ / sửa / chuyển sang mục thăm dò, và vì sao.
   - (b) → **không mở, không đọc, không chép** nội dung file cũ. Viết từ requirement/quan sát của user. Ghi ra file mới `TC-<MODULE>.v<N>.md` (N tăng dần), **giữ nguyên** file cũ. Viết xong mới được so sánh với bản cũ nếu user yêu cầu.
   - Không có file cũ → làm tiếp, không hỏi.
1. **Liệt kê field và luồng** trước khi viết TC: bảng `Field | Loại | Required | Min/Max | Format | Unique | Nguồn`. Field nào requirement không nói → ghi `Not specified` và đưa vào danh sách câu hỏi, **không tự đặt quy tắc**.
2. **Đánh giá rủi ro** từng chức năng: Probability × Impact → Critical/High/Medium/Low (`AI-PROPOSAL`, user có thể sửa).
3. **Chọn kỹ thuật** theo bảng ở `{{KIT}}/rules/test_design.md` mục 1: EP, BVA (min-1, min, min+1, max-1, max, max+1), Decision Table, State Transition (cả chuyển trạng thái **không** hợp lệ), Pairwise.
4. **Validation từng field** theo `references/field_validation_15.md`: mỗi field ≥ 1 positive + ≥ 2 negative/boundary, **mỗi field một TC riêng**.
5. **Case nâng cao** khi phù hợp: `references/advanced_scenarios.md`; app mobile: `references/mobile_scenarios.md`.
6. **Oracle mạnh:** expected phải kiểm tra **dữ liệu nghiệp vụ** (tìm lại record theo ID, đúng giá trị trong cùng row), không dừng ở toast hay HTTP 200. Có quyền đọc DB sandbox → oracle SQL theo `references/sql_oracle.md`.
7. **Chia 2 nhóm** theo `{{KIT}}/rules/test_design.md` mục 2a:
   - **TC chạy được:** expected đã biết, có nguồn (`REQ-CONFIRMED`, `DOM-OBSERVED`, kỳ vọng hiển nhiên #1–#4). Expected từ `DOM-OBSERVED` ghi kèm "(hành vi quan sát ngày …, chưa có requirement xác nhận)".
   - **Mục thăm dò:** expected chưa biết → bảng riêng khóa bằng `Q-<MODULE>-NN`, **không** viết thành TC với expected "UNKNOWN"/"cần xác nhận".
   Quan sát của chính user kể trong prompt gắn `DOM-OBSERVED` (ghi người quan sát, env, ngày), **không** gắn `PROVIDED`.
8. **Viết TC** theo `{{KIT}}/templates/test_case_table.md`: Source, Steps và Expected đánh số khớp 1-1, Test Data cụ thể (`QA-r001-...`, email `@example.com`), Risk, Priority (đặt theo Risk, `{{KIT}}/rules/test_design.md` mục 2b; chưa biết expected **không** phải lý do đặt P1), Automatable, Auto Type, Tags. **Không dùng ký hiệu tắt tự đặt** (`C0`, `E`, `R`…).
9. **Traceability** `AC × TC`: mọi AC có ≥ 1 TC hoặc ≥ 1 mục thăm dò; ghi lý do nếu không có.
10. Chạy Self-check, sửa, rồi mới trả kết quả.

## Output
- File `<output_dir>/testcases/TC-<MODULE>.md`, front-matter:
  ```yaml
  id: TC-<MODULE>
  source: [AC-..., ...]
  labels: [AI-PROPOSAL]        # bộ TC do AI viết, chưa QA duyệt
  produced_by: test-design-rbt
  status: draft
  ```
- Nội dung: (1) bảng field, (2) bảng rủi ro, (3a) **bảng TC chạy được**, (3b) **bảng mục thăm dò** (khóa `Q-<MODULE>-NN`), (4) traceability `AC × TC`, (5) **câu hỏi mở / `Not specified`**. Đầu file in số lượng: "N TC chạy được · M mục thăm dò · K câu hỏi".
- Excel (nếu user cần): `node {{KIT}}/scripts/convert/md_to_xlsx.js <file.md>`; cột theo `excel_columns` trong yml.
- Bản gửi khách: `node {{KIT}}/scripts/export/to-external.js <file.md>`.

## Gate và giới hạn
- Bước 0 (hỏi trước khi đụng tới bộ TC cũ) là **📝 lời dặn**: không có cơ chế ép. Eval `evals/test-design-rbt/cases.md` case `TDR-EXISTING-01` kiểm tra skill có làm đúng không.
- TC có payload XSS/SQLi: tag `@Security`, ghi rõ "chỉ chạy trên env thuộc `sandbox_urls`, cần G1". Skill này **không chạy** TC.
- Oracle SQL: **chỉ `SELECT`**, chỉ env sandbox, tài khoản DB chỉ đọc. Không có thì ghi `UNKNOWN`, không đoán tên bảng/cột.
- Không bịa field label, message lỗi, giới hạn ký tự. Message lỗi requirement không cho → expected ghi "hiển thị thông báo lỗi (nội dung: `Not specified`)".
- Mode `full`: **không tự trả lời câu hỏi Q&A thay user**; không sang bước 3 khi chưa có câu trả lời.
- Hệ thống lớn: sinh **từng module**, hỏi user trước khi sang module tiếp.

## Self-check
- [ ] Đã liệt kê field trước khi viết TC; field `Not specified` nằm trong danh sách câu hỏi, không bị tự đặt quy tắc
- [ ] TC ID không trùng, đúng `{{KIT}}/rules/id_conventions.md`
- [ ] Mọi TC có Source (`AC-` hoặc `HYP-`); mọi AC có ≥ 1 TC
- [ ] Steps và Expected đánh số khớp 1-1
- [ ] Test Data cụ thể; không có "dữ liệu hợp lệ"; email `@example.com`; không PII thật
- [ ] Mỗi field ≥ 1 positive + ≥ 2 negative/boundary, không gộp field
- [ ] Không TC nào chỉ dùng oracle yếu (toast, click không lỗi, HTTP 200)
- [ ] Có BVA đủ 6 điểm cho field có min/max
- [ ] Đủ metadata: Priority, Risk, Automatable, Auto Type, Tags
- [ ] Không TC nào có expected chưa biết; những điểm đó nằm ở bảng thăm dò, khóa bằng `Q-*`
- [ ] Quan sát của chính user gắn `DOM-OBSERVED` (có người quan sát, env, ngày), không gắn `PROVIDED`
- [ ] Priority khớp Risk; không có TC nào được đặt P1 chỉ vì chưa biết expected
- [ ] Không có ký hiệu tắt tự đặt (`C0`, `E`, `R`…) chưa chú thích
- [ ] Mode `maintain`: mỗi TC cũ có trạng thái giữ/sửa/chuyển sang thăm dò/lỗi thời, không xóa TC cũ
- [ ] Đã có TC cùng module → đã hỏi user (a) cập nhật hay (b) viết mới **trước khi** ghi file; chọn (b) thì không có dòng nào chép nguyên từ file cũ, file cũ còn nguyên
