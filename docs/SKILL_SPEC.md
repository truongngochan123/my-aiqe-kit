# Chuẩn viết một skill

> Mọi skill trong `skills/` phải theo chuẩn này. `scripts/verify/check-skills.js` kiểm tra tự động phần cấu trúc.
> Skill mẫu để chép theo (Đợt 1): `bug-reporting`, `test-design-rbt`, `incident-triage`.

## 1. Vị trí và tên
```
skills/<tên-skill>/
├── SKILL.md                 ← tối đa 150 dòng
└── references/              ← phần dài: checklist, bảng tra, ví dụ. Chỉ đọc khi cần
    └── <tên>.md
```
- `<tên-skill>`: chữ thường, số, dấu gạch ngang. Trùng với `name` trong frontmatter.
- Một skill = một giai đoạn công việc. Không gộp hai việc khác nhau vào một skill.

## 2. Frontmatter
```yaml
---
name: bug-reporting
description: <Làm gì>. Dùng khi <tình huống, từ khóa người dùng hay gõ>. Không dùng khi <tình huống> → <skill khác>.
---
```
**Chuẩn description** (Codex bắt buộc có `name` và `description`; cả Codex và Claude chọn skill dựa vào `description`):
- Tối đa **300 ký tự**.
- Đủ 3 phần theo thứ tự: **Làm gì · Dùng khi · Không dùng khi → skill khác**.
- Có **từ khóa người dùng thật sự gõ** ("viết bug", "test fail", "chạy lại"), không chỉ thuật ngữ.
- Không nhắc tới bài tập, unit, rubric.
- Hai skill không được có phần "Dùng khi" chồng nhau. Nghi ngờ chồng nhau thì thêm cặp đó vào `evals/routing.md`.

Ví dụ:
```
description: Viết, review hoặc retest bug report có evidence và nguồn expected. Dùng khi gặp lỗi cần báo, "viết bug", "log bug", kiểm tra lại bug đã fix. Không dùng cho báo cáo cả lần chạy → evidence-reporting.
```

## 3. Sáu mục bắt buộc (đúng tên tiêu đề)

| Mục | Nội dung |
|---|---|
| `## Khi dùng / Không dùng` | Tình huống dùng; tình huống không dùng kèm **skill thay thế** (`→ tên-skill`) |
| `## Đầu vào` | Cần gì từ người dùng (file, ID, quyết định), đọc gì từ output của skill trước. Thiếu đầu vào bắt buộc thì **hỏi**, không đoán |
| `## Quy trình` | Các bước đánh số. Bước nào có gate thì ghi rõ (G1–G4) |
| `## Output` | File gì, tên file, đặt ở đâu, front-matter (mục 4) |
| `## Gate và giới hạn` | Gate cần duyệt; việc skill **không** làm; guard liên quan và hàng threat (🛡️/🧯/📝) |
| `## Self-check` | Checklist có/không, kiểm tra trước khi trả kết quả |

Có thể thêm mục khác (ví dụ `## Mode`) nhưng không bỏ mục nào trong 6 mục trên.

## 4. Hợp đồng handoff (output → skill sau)
- Output ghi vào `<output_dir>/<thư mục theo loại>/<ID>.md`. Thư mục theo loại: `analysis/`, `testcases/`, `data/`, `exploratory/`, `bugs/`, `runs/<RUN-ID>/`, `decisions/`, `external/`.
- Mỗi file output có front-matter:
```yaml
---
id: BUG-CUS-012              # theo rules/id_conventions.md
source: [AC-CUS-03, TC-CUS-007]
labels: [MANUAL-RUN: failed]
produced_by: bug-reporting    # tên skill tạo ra file; eval chấm routing bằng trường này
status: draft                 # draft | ready | submitted | verified | closed | deprecated
---
```
- Skill sau **đọc front-matter** để biết nguồn và trạng thái, không đọc lại toàn bộ hội thoại.
- Bản external (gửi khách) do `scripts/export/to-external.js` tạo: bỏ front-matter, chuyển nhãn thành lời.

## 5. Tham chiếu tới file khác
- Rule, template, script của kit: viết **`{{KIT}}/rules/...`**, **`{{KIT}}/templates/...`**. Script cài thay `{{KIT}}` bằng đường dẫn tuyệt đối. Viết `rules/...` tương đối sẽ **gãy** khi skill được chép sang `~/.claude/skills/` hoặc `~/.agents/skills/`.
- File trong `references/` của chính skill: viết `references/<tên>.md`.
- Khẳng định về nội dung một file nguồn phải kèm `file:line`.

## 6. Ngôn ngữ
- Viết skill bằng tiếng Việt, giữ thuật ngữ tiếng Anh.
- Skill phải yêu cầu output theo `output_language` trong yml (vi/en). Template có tiêu đề song ngữ.

## 7. Nghiệm thu một skill mới
- [ ] `node scripts/verify/check-skills.js` không lỗi
- [ ] `node scripts/verify/grep-clean.js` không lỗi
- [ ] Có `evals/<tên-skill>/cases.md`: 3 case phải kích hoạt, 2 case không được kích hoạt, checklist chấm output
- [ ] Chạy thử 3 prompt: đúng skill được gọi (`produced_by` khớp)
- [ ] `node scripts/install/gen-routing.js` đã chạy để cập nhật bảng trong `AGENTS.md`
- [ ] Đã thêm dòng vào `CHANGELOG.md`
