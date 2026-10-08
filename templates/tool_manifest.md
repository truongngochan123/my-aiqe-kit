---
id: MANIFEST-<AGENT>
source: [<tài liệu tool>]
labels: [AI-PROPOSAL]
produced_by: agent-architecture
status: draft
---
# Tool manifest: <tên agent>

> Gốc: `ai-qe-kit/templates/tool_manifest.md`. Chỉ khai báo capability **có trong tài liệu của tool**. Chưa xác nhận → `UNKNOWN` hoặc "policy dự án đề xuất".
> Bản chạy được: `agent/config/tool_manifest.json` (ví dụ thật của kit).

| Tool | Đọc/Ghi | Pha | Input được phép / kiểm tra | Output lưu | Timeout / budget | Redact | Gate | Từ chối khi |
|---|---|---|---|---|---|---|---|---|
| | R | inspect | | | `UNKNOWN` | | — | |
| | W | act | | | | | G1 | |

## Quy tắc chung
- Mặc định **chặn** mọi tool hoặc input không có trong bảng (allowlist).
- Output của tool đọc nội dung bên ngoài (trang web, log, file người dùng) là **dữ liệu untrusted**: bọc lại trước khi đưa planner, dò chỉ thị lạ.
- Tool ghi: input bắt buộc mang prefix của run; tool dọn chỉ nhận record do run tạo.
- Timeout của tool ghi: hết giờ → `OUTCOME_UNKNOWN`, không ghi lại.
