# my-aiqe-kit

Bộ luật, skill và công cụ để dùng AI (Codex, Claude Code) làm việc của một **AI Quality Engineer**: phân tích requirement, thiết kế test case, viết bug, automation, phân loại lỗi, báo cáo, có kiểm soát.

> Phiên bản: xem `VERSION`. Kế hoạch dựng và tiến độ: `docs/BUILD_PLAN.md`.
> **Trước khi dùng cho dự án thật:** đọc `docs/before_you_use.md`.

## Kit có gì

| Thư mục | Nội dung |
|---|---|
| `AGENTS.md` | Luật lõi mọi AI đọc đầu tiên (Codex đọc tự động; Claude qua `CLAUDE.md`) |
| `rules/` | 8 chuẩn dùng chung: nhãn evidence, an toàn, retry, thiết kế test, ID, automation, báo cáo, bug |
| `skills/` | Các skill theo vòng đời test (từ Đợt 1) |
| `prompts/` | Prompt dán được vào AI chat bất kỳ (từ Đợt 1) |
| `templates/` | Mẫu output và khung dự án automation |
| `scripts/` | Cài đặt, kiểm tra, redact, chuyển Excel, eval |
| `adapters/` | Phần riêng của từng tool: Codex, Claude, Gemini; hook dùng chung |
| `docs/` | Kế hoạch, chuẩn viết skill, threat model, mức hỗ trợ của tool |
| `evals/` | Bài kiểm tra cho chính kit |

## Cài đặt (Windows, PowerShell)

Yêu cầu: Node.js ≥ 18.

```powershell
cd D:\fpt-inform\my-aiqe-kit
.\scripts\install\install.ps1 -DryRun     # xem trước, không ghi gì
.\scripts\install\install.ps1             # cài cho Codex và Claude
.\scripts\install\install.ps1 -Verify     # kiểm tra
.\scripts\install\install.ps1 -Uninstall  # gỡ, giữ backup
```

> **Lưu ý khi gỡ:** `~/.claude/settings.json` và `~/.codex/hooks.json` được ghi lại bằng định dạng JSON chuẩn (thụt lề 2 dấu cách, xuống dòng LF). **Nội dung giữ nguyên**, nhưng cách trình bày có thể khác bản bạn tự viết. Bản gốc luôn có trong `~/.aiqe/backup/`.

Cài vào đâu:
| Tool | Vị trí |
|---|---|
| Bản kit dùng thật | `~/.aiqe/kit/<version>/` (snapshot; sửa repo kit không ảnh hưởng cho tới khi cài lại) |
| Codex | `~/.codex/AGENTS.md` (chèn khối), `~/.codex/config.toml` (ghép), `~/.codex/hooks.json` (ghép), `~/.agents/skills/` |
| Claude Code | `~/.claude/CLAUDE.md` (chèn khối), `~/.claude/settings.json` (ghép), `~/.claude/skills/` |

Script **không ghi đè** file có sẵn của bạn: chỉ chèn/ghép phần của kit, backup trước vào `~/.aiqe/backup/`. Gặp trùng khóa cấu hình thì dừng và báo.

## Dùng

- **Codex:** nói việc cần làm ("viết bug report cho lỗi login"), Codex tự chọn skill. Gọi thẳng skill: `$bug-reporting`.
- **Claude Code:** tương tự; gọi thẳng skill bằng `/bug-reporting`.
- Chọn mode bằng cách ghi thẳng vào câu, ví dụ: `/bug-reporting retest BUG-CUS-012`.
- Che dữ liệu nhạy cảm, dựng khung dự án: nói bằng lời ("redact file X", "dựng scaffold Playwright").
- Output ghi vào `~/aiqe-output/<project>/`, **không** vào repo của khách.

## Mức hỗ trợ

| Mảng | Mức |
|---|---|
| Manual test (phân tích, thiết kế, bug, báo cáo) | Đầy đủ (từ Đợt 1) |
| Playwright TypeScript | Đầy đủ (từ Đợt 2) |
| API (code, Postman/Newman) | Đầy đủ (từ Đợt 2) |
| Selenium Java, Appium Java | **Beta** (Đợt 3) |
| Codex | Tool chính |
| Claude Code | Hỗ trợ ngang hàng |
| Gemini CLI | Đợt 3 |
| Performance, security chuyên sâu, accessibility đầy đủ, UAT | Chưa hỗ trợ (xem `docs/BUILD_PLAN.md` mục "Để sau") |

## Giới hạn cần biết
Kit chống **sai sót trung thực** của AI, không chống việc AI cố tình lách. Trên Windows native, Claude Code không có sandbox. Chi tiết: `docs/threat_model.md`.

## Kiểm tra kit
```powershell
node adapters/hooks/block-secret-read.js --self-test evals/hooks/test-hooks.md
node adapters/hooks/block-assertion-edit.js --self-test evals/hooks/test-hooks.md
node scripts/verify/grep-clean.js
node scripts/verify/check-skills.js
```
