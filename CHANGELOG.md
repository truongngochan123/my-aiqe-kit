# CHANGELOG

Mỗi version có 3 mục: **Thêm / Sửa / Bỏ**. Version theo SemVer, ghi trong file `VERSION`.
Bản `-dev` là bản đang dựng, chưa chốt.

## 0.1.0-dev (đang dựng)

### Thêm
- Đợt 0 (06/10/2026): nền móng — `AGENTS.md`, `CLAUDE.md`, 8 rules, docs (BUILD_PLAN, SKILL_SPEC, threat model, tool support, checklist), adapter cho Codex và Claude, 2 hook dùng chung, script cài/gỡ/kiểm tra.

### Sửa (phát hiện khi kiểm tra Đợt 0)
- Hook: input có BOM (PowerShell 5.1 thêm khi pipe) làm hook không đọc được JSON và cho qua → bỏ BOM trước khi đọc.
- install.js: cài lại lần 2 làm mất danh sách permission do kit thêm, nên gỡ cài đặt không xóa được → cộng dồn qua các lần cài.
- install.js: backup file nằm khác ổ đĩa với home tạo đường dẫn có dấu ":" → bỏ dấu ":".
- install.ps1: lưu UTF-8 có BOM để PowerShell 5.1 đọc đúng tiếng Việt.
- settings.json (Claude): đổi pattern sang `//**/.env` (áp dụng mọi ổ đĩa trên Windows), thêm luật `PowerShell(...)`.

### Bỏ
- 15 file `adapters/codex/prompts/` có trong plan v4.1: Codex đã đánh dấu custom prompts là deprecated, dùng skill thay thế (xem `docs/tool_support.md`).
