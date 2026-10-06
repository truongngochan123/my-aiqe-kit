# Mức hỗ trợ của từng tool

> Tra ngày **06/10/2026** trên tài liệu chính thức. Các trang không ghi số phiên bản, nên ghi ngày tra.
> Chỗ nào chưa xác minh được thì ghi `UNKNOWN` kèm cách kiểm tra. Tra lại khi tool cập nhật lớn.
> Nguồn Codex: `learn.chatgpt.com` (tài liệu Codex của OpenAI, `developers.openai.com/codex/...` chuyển hướng về đây).
> Nguồn Claude Code: `code.claude.com/docs`.

## Tóm tắt

| # | Câu hỏi | Codex | Claude Code |
|---|---|---|---|
| 1 | Skill đặt ở đâu, định dạng gì | `~/.agents/skills/<tên>/SKILL.md` (user), `.agents/skills/` (repo). Frontmatter **bắt buộc** `name`, `description` | `~/.claude/skills/<tên>/SKILL.md` (user), `.claude/skills/` (repo). Frontmatter không bắt buộc, nên có `description` |
| 2 | Lệnh tắt (slash command) | **Custom prompts đã deprecated**, thay bằng skill. Gọi skill trực tiếp bằng `$tên-skill` | `~/.claude/commands/*.md` vẫn chạy; skill cũng gọi được bằng `/tên-skill` |
| 3 | Giới hạn file luật lõi | `AGENTS.md` tối đa `project_doc_max_bytes` = **32 KiB** mặc định, quá thì bị cắt. **Không** có `@import` | `CLAUDE.md` hỗ trợ `@đường-dẫn` để import |
| 4 | Sandbox trên Windows | **Có**: sandbox Windows native khi chạy trong PowerShell; chặn ghi ngoài workspace, chặn mạng trừ khi cho phép | **Không có** trên Windows native (chỉ macOS, Linux, WSL2) |
| 5 | Allowlist mạng theo domain | **Có**: `features.network_proxy.domains` (map `allow`/`deny`). Cách bật chính xác cần chạy thử: `UNKNOWN` | Có, nhưng chỉ khi sandbox chạy (không áp dụng trên Windows native) |
| 6 | MCP có nằm trong sandbox không | `UNKNOWN` (tài liệu sandbox không nói) | **Không**: MCP, hook và tool đọc/ghi file chạy ngoài sandbox |
| 7 | Hook | **Có**, `PreToolUse`, chặn bằng exit code 2 hoặc JSON `permissionDecision: deny`. **Mặc định tắt** (`[features] hooks = true` để bật) | **Có**, `PreToolUse`, chặn bằng exit code 2; stderr được đưa cho Claude đọc. Trên Windows chạy bằng Git Bash, không có thì PowerShell |
| 8 | Cấu hình MCP | `[mcp_servers.<id>]` trong `config.toml`: `command`, `args`, `env`, `enabled_tools`, `disabled_tools` | `claude mcp add` hoặc file `.mcp.json` (không tra lại trong đợt này) |
| 9 | Config cấp user và cấp project | `~/.codex/config.toml`; `.codex/config.toml` trong thư mục làm việc cũng được nạp. Extension VS Code dùng chung config với CLI (nguồn bên thứ ba, xem mục chi tiết) | `~/.claude/settings.json` (user), `.claude/settings.json` (project), `.claude/settings.local.json` |
| 10 | Duyệt riêng từng MCP tool | **Có**: `mcp_servers.<id>.tools.<tool>.approval_mode` = `auto` \| `prompt` \| `writes` \| `approve` | **Có**: luật permission `mcp__<server>__<tool>`. Luật có tham số trong ngoặc bị bỏ qua |

## Chi tiết và nguồn

### 1–2. Skill và lệnh tắt
- Codex tìm skill ở: `$CWD/.agents/skills`, các thư mục cha tới gốc repo, `$REPO_ROOT/.agents/skills`, `$HOME/.agents/skills`, `/etc/codex/skills`, và skill có sẵn. Skill được gọi tường minh (`$` trong Codex CLI) hoặc tự kích hoạt khi prompt khớp `description`. Nguồn: https://learn.chatgpt.com/docs/build-skills
- Codex: *"Custom prompts are deprecated. Use skills for reusable instructions that Codex can invoke explicitly or implicitly."* Trước đây lưu ở `~/.codex/prompts/`. Nguồn: https://learn.chatgpt.com/docs/custom-prompts.md
- Claude: skill cá nhân ở `~/.claude/skills/<skill-name>/SKILL.md`; file trong `.claude/commands/` vẫn chạy như skill; gọi tay bằng `/skill-name`. Nguồn: https://code.claude.com/docs/en/skills
- **Hệ quả cho kit:** bỏ 15 file `adapters/codex/prompts/`. Trên Codex gọi `$bug-reporting`. Lệnh tắt của Claude giữ lại vì ngắn hơn tên skill (`/bug` thay vì `/bug-reporting`).

### 3. AGENTS.md
- Thứ tự Codex đọc: `AGENTS.override.md` toàn cục → `~/.codex/AGENTS.md` → các file trong repo từ gốc tới thư mục hiện tại. Dừng khi tổng kích thước đạt `project_doc_max_bytes` (32 KiB mặc định). Không nhắc tới `@import`. Nguồn: https://learn.chatgpt.com/docs/agent-configuration/agents-md
- **Hệ quả:** `install.js` cảnh báo khi `~/.codex/AGENTS.md` vượt 32 KiB. Mọi đường dẫn trong `AGENTS.md` là tuyệt đối (thay `{{KIT}}` khi cài).

### 4–6. Sandbox
- Codex: chế độ `read-only` | `workspace-write` | `danger-full-access`; `approval_policy` = `on-request` | `never` | dạng `granular`. *"Codex uses the native Windows sandbox when you run in PowerShell and the Linux sandbox implementation when you run in WSL2."* Nguồn: https://learn.chatgpt.com/docs/sandboxing.md và https://learn.chatgpt.com/docs/config-file/config-reference
- Codex mạng: `[sandbox_workspace_write] network_access` (boolean); `features.network_proxy.domains`: *"Unset by default, which means no external destinations are allowed until you add allow rules"*; chỉ có hiệu lực khi proxy được bật (`features.network_proxy.enabled`). Nguồn: config-reference ở trên.
  - `UNKNOWN`: `localhost` có truy cập được khi `network_access = false` không. **Cách kiểm tra:** trong Codex, chạy `curl http://localhost:<port>` tới một server local.
- Claude: *"The sandbox runs on macOS, Linux, and WSL2. On native Windows, Claude Code runs commands unsandboxed."* *"The sandbox covers shell commands only. Claude's file tools, MCP servers, and hooks run outside it."* Nguồn: https://code.claude.com/docs/en/sandboxing
- **Hệ quả cho threat model:** trên máy Windows này, **Claude không có lớp chặn tầng hệ điều hành**; Codex có (cho lệnh shell). MCP browser của Claude chắc chắn chạy ngoài sandbox; của Codex `UNKNOWN`.

### 7. Hook
- Codex: vị trí `~/.codex/hooks.json`, `~/.codex/config.toml`, `<repo>/.codex/hooks.json`, `<repo>/.codex/config.toml`. Matcher: `Bash`, `apply_patch`/`Edit`/`Write`, `mcp__<server>__<tool>`. Input stdin có `tool_name`, `tool_input` (`tool_input.command` cho Bash và apply_patch), `cwd`. Có `commandWindows` để đặt lệnh riêng cho Windows. Hook mặc định tắt. Nguồn: https://learn.chatgpt.com/docs/hooks.md và config-reference.
- Claude: input stdin có `tool_name`, `tool_input`, `cwd`…; exit code 2 chặn lệnh và stderr được đưa cho Claude; matcher dạng `Edit|Write` là danh sách tên chính xác. Hook chạy trên Windows (Git Bash, không có thì PowerShell). Nguồn: https://code.claude.com/docs/en/hooks
- **Hệ quả:** một bộ script `adapters/hooks/*.js` dùng chung cho cả hai tool. Đã kiểm tra bằng `--self-test` (xem `evals/hooks/test-hooks.md`).
- `UNKNOWN`: định dạng chính xác của `tool_input` cho `Edit`/`Write` trong Codex. Hook xử lý cả hai kiểu (`file_path`, `path`). **Cách kiểm tra:** tạm cho hook ghi stdin ra file khi chạy Codex thật.

### 9. Extension VS Code
- Codex: "Both the CLI and IDE extension share ~/.codex/config.toml" là thông tin từ trang bên thứ ba (kết quả tìm kiếm), **chưa thấy trên trang chính thức**. Coi là `PROVIDED` (nguồn bên thứ ba).
- **Cách kiểm tra:** sau khi cài, mở Codex trong VS Code, hỏi một việc cần đọc `.env` và xem hook có chặn không.

### 10. Permission của Claude
- Thứ tự xét: *"deny, then ask, then allow. The first match in that order determines the outcome."*
- Trên Windows dùng `//**/.env` để khớp mọi ổ đĩa; `**/.env` chỉ khớp dưới thư mục hiện tại.
- Có luật riêng cho PowerShell: `PowerShell(git push *)`, không phân biệt hoa thường, nhận cả alias.
- Luật `mcp__...` có ngoặc (tham số) bị **bỏ qua**.
- Nguồn: https://code.claude.com/docs/en/permissions

### Eval routing (`codex exec --json`)
- Các loại sự kiện gồm `command_execution`, `file_change`, `mcp_tool_call`, `assistant_message`…, **không có loại "skill"**. Nguồn: trang bên thứ ba (codex.danielvaughan.com), `PROVIDED`.
- **Hệ quả:** eval chấm skill nào đã chạy bằng front-matter `produced_by` trong file output (xem `docs/SKILL_SPEC.md`), không dựa vào log của tool.

## Gemini (Đợt 3)
- Đọc `AGENTS.md` bằng cách đặt `"context": { "fileName": "AGENTS.md" }` trong `.gemini/settings.json`. Nguồn: tài liệu Gemini CLI (geminicli.com/docs, qua kết quả tìm kiếm). Kiểm tra lại ở Đợt 3.
