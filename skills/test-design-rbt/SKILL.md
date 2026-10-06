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
| `maintain` | Requirement đổi | Cần **2 phiên bản** requirement hoặc diff. Không có → từ chối, hỏi user. Output: TC giữ / sửa / lỗi thời (`status: deprecated`) / mới |
| `review` | Soát bộ TC có sẵn | Chạy Self-check ở cuối file lên bộ TC, liệt kê lỗi theo dòng |

User chọn mode bằng lời: "viết TC quick cho…", "/test-design-rbt full …".

## Đầu vào
- Requirement/AC có ID (`AC-<MODULE>-NN`), hoặc output của `requirement-analysis` (đọc front-matter `produced_by: requirement-analysis`).
- `project.aiqe.yml`: `output_language`, `tc_id_format`, `module_codes`, `excel_columns`, `sandbox_urls`.
- Mode `maintain`: bộ TC cũ + requirement cũ và mới (hoặc diff).
- **Thiếu AC có ID:** hỏi user. Nếu user chỉ có mô tả tự do, đánh ID tạm `HYP-<MODULE>-NN` và ghi rõ là giả định, không dùng `AC-`.

## Quy trình (quick)
1. **Liệt kê field và luồng** trước khi viết TC: bảng `Field | Loại | Required | Min/Max | Format | Unique | Nguồn`. Field nào requirement không nói → ghi `Not specified` và đưa vào danh sách câu hỏi, **không tự đặt quy tắc**.
2. **Đánh giá rủi ro** từng chức năng: Probability × Impact → Critical/High/Medium/Low (`AI-PROPOSAL`, user có thể sửa).
3. **Chọn kỹ thuật** theo bảng ở `{{KIT}}/rules/test_design.md` mục 1: EP, BVA (min-1, min, min+1, max-1, max, max+1), Decision Table, State Transition (cả chuyển trạng thái **không** hợp lệ), Pairwise.
4. **Validation từng field** theo `references/field_validation_15.md`: mỗi field ≥ 1 positive + ≥ 2 negative/boundary, **mỗi field một TC riêng**.
5. **Case nâng cao** khi phù hợp: `references/advanced_scenarios.md`; app mobile: `references/mobile_scenarios.md`.
6. **Oracle mạnh:** expected phải kiểm tra **dữ liệu nghiệp vụ** (tìm lại record theo ID, đúng giá trị trong cùng row), không dừng ở toast hay HTTP 200. Có quyền đọc DB sandbox → oracle SQL theo `references/sql_oracle.md`.
7. **Viết TC** theo `{{KIT}}/templates/test_case_table.md`: Source, Steps và Expected đánh số khớp 1-1, Test Data cụ thể (`QA-r001-...`, email `@example.com`), Priority, Risk, Automatable, Auto Type, Tags.
8. **Traceability** `AC × TC`: mọi AC có ≥ 1 TC; AC không có TC thì ghi lý do.
9. Chạy Self-check, sửa, rồi mới trả kết quả.

## Output
- File `<output_dir>/testcases/TC-<MODULE>.md`, front-matter:
  ```yaml
  id: TC-<MODULE>
  source: [AC-..., ...]
  labels: [AI-PROPOSAL]        # bộ TC do AI viết, chưa QA duyệt
  produced_by: test-design-rbt
  status: draft
  ```
- Nội dung: (1) bảng field, (2) bảng rủi ro, (3) bảng TC, (4) traceability `AC × TC`, (5) **câu hỏi mở / `Not specified`** (`Q-<MODULE>-NN`).
- Excel (nếu user cần): `node {{KIT}}/scripts/convert/md_to_xlsx.js <file.md>`; cột theo `excel_columns` trong yml.
- Bản gửi khách: `node {{KIT}}/scripts/export/to-external.js <file.md>`.

## Gate và giới hạn
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
- [ ] Mode `maintain`: mỗi TC cũ có trạng thái giữ/sửa/lỗi thời, không xóa TC cũ
