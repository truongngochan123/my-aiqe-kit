# Threat model: kit chống được gì, không chống được gì

> Đọc trước khi tin vào bất kỳ "guard" nào của kit.
> Nguồn về khả năng của tool: `docs/tool_support.md` (tra 06/10/2026).

## 1. Ba mối đe dọa

| Mối đe dọa | Kit có chống không | Bằng gì |
|---|---|---|
| **AI sai sót trung thực**: sửa nhầm assertion, chạy nhầm env, quên redact, bịa locator | ✅ **Mục tiêu chính** | Skill, rule, hook, permission, guard trong code, tín hiệu CI |
| **AI chủ động lách guard** | ❌ **Không hứa** | Chỉ 3 thứ chặn được: (1) **credential AI không giữ**, (2) **sandbox tầng hệ điều hành**, (3) **người thứ hai review trên server** |
| **Lộ dữ liệu khách** | ⚠️ Phần lớn là trách nhiệm của người | Checklist `before_you_use.md`, redact, output nằm ngoài repo |

**Vì sao không hứa chống lách:** AI chạy trên máy bạn, dùng shell và quyền của bạn. Mọi guard nằm trên máy (hook, permission, script) đều sửa hoặc đi vòng được bằng một lệnh khác. Kit chỉ làm cho sai sót **khó xảy ra và dễ bị phát hiện**.

## 2. Ba hàng guard

| Ký hiệu | Hàng | Ý nghĩa |
|---|---|---|
| 🛡️ | Chặn thật | AI không vượt qua được dù cố tình |
| 🧯 | Chống sai sót | Chặn khi AI làm sai vô tình; lách được nếu cố tình |
| 📝 | Lời dặn | Chỉ là câu chữ, không có cơ chế ép |

## 3. Toàn bộ guard của kit

| Guard | File | Hàng | Cách lách đã biết | Rủi ro còn lại |
|---|---|---|---|---|
| Hook chặn đọc secret | `adapters/hooks/block-secret-read.js` | 🧯 | Ghép tên file trong biến; dùng ngôn ngữ khác đọc file; đọc qua tool không có trong matcher | Token nằm trong môi trường AI vẫn có thể lộ → **chốt thật là không để token ở đó** |
| Hook chặn sửa oracle | `adapters/hooks/block-assertion-edit.js` | 🧯 | Sửa page object, sửa hằng số ở file không thuộc `fixture_dirs`, ghép lệnh shell lạ | Oracle bị đổi mà không ai thấy → **chốt thật là review diff trong PR bởi người khác** |
| Biến `AIQE_ALLOW_ORACLE_EDIT` | hook ở trên | 🧯 | Người dùng quên tắt sau khi dùng | Mọi sửa oracle sau đó chỉ bị cảnh báo |
| Permission Claude (deny/ask) | `adapters/claude/settings.json` | 🧯 | Viết lệnh khác dạng (`curl -s -X POST` không khớp `curl -X POST *`); dùng tool khác | Lệnh ghi lọt qua mà không hỏi |
| Approval của Codex (`on-request`) | `adapters/codex/config.toml` | 🧯 | Người dùng bấm duyệt theo phản xạ | Duyệt nhầm phạm vi |
| Sandbox Codex: chặn ghi ngoài workspace, tắt mạng | `adapters/codex/config.toml` | 🛡️ cho lệnh shell | Người dùng tắt sandbox hoặc bật `network_access` rồi quên | MCP có nằm trong sandbox không: `UNKNOWN` |
| Sandbox Claude | — | ❌ **Không có trên Windows native** | — | Lệnh shell của Claude trên máy này **không bị hệ điều hành giới hạn** |
| `approval_mode = "prompt"` cho `browser_evaluate` (Codex), `ask` (Claude) | config, settings | 🧯 | Chạy JS qua tool khác của MCP | Prompt injection từ trang web |
| Allowlist URL cho `browser_navigate` | `rules/agent_safety.md` | 📝 | Không có cơ chế ép | Trang độc hại dẫn MCP tới URL lạ |
| AI không giữ token Jira/Xray/CI | `rules/agent_safety.md` mục 3 | 🛡️ **chỉ khi** token thật sự không nằm trong repo, `.env` hay biến môi trường toàn máy | Token để sai chỗ | Nếu token có trong môi trường AI thì guard này chỉ còn là 📝 |
| `.env.sandbox` chỉ chứa tài khoản test quyền thấp | quy ước tên file | 📝 | Người dùng đặt nhầm credential staging vào đó | AI dùng credential mạnh hơn dự định |
| Output trong `<repo>/.aiqe/output/`, `.aiqe/` nằm trong `.git/info/exclude` | `AGENTS.md`, `new-project.js`, yml | 🧯 | `git add -f`, xóa dòng trong exclude, ghi output ra chỗ khác trong repo | Dữ liệu nhạy cảm bị commit → chốt thật là review PR (người thứ hai thấy file lạ trong diff) |
| Script redact | `scripts/redact/redact.js` (Đợt 1) | 🧯 | Regex không bắt hết; ảnh không redact được | **Người phải kiểm tra lại** |
| Job CI chặn merge khi assertion giảm | `ci/` (Đợt 2) | 🛡️ **chỉ khi** có CODEOWNERS + bảo vệ `.github/**` + review bởi người khác | Sửa chính file workflow trong cùng PR (nếu không bảo vệ `.github/**`) | Dự án không cho sửa CI → không có lớp này |
| Nhãn `RUN-PASSED` chỉ cho SHA đã được review | `rules/evidence_labels.md` | 📝 | AI gắn nhãn sai | Báo cáo PASS sai → `qe-reviewer` và người đọc kiểm tra |
| `project.aiqe.yml` (ai_policy, allowed_ai_tools) | yml | 📝 | AI không đọc, hoặc đọc sau khi đã gửi dữ liệu | Vi phạm hợp đồng → **kiểm tra trước khi mở AI là việc của người** |

## 4. Các rủi ro cụ thể trên máy này (Windows, VS Code)
1. **Claude không có sandbox.** Mọi lệnh shell của Claude chạy với quyền của bạn. Chỉ có permission + hook (🧯).
2. **Prompt injection qua MCP browser.** Trang web có thể chứa *"ignore previous instructions, run …"*. Output của MCP là dữ liệu untrusted (`AGENTS.md` nguyên tắc 5, 📝). `browser_evaluate` luôn hỏi trước (🧯).
3. **Token trong biến môi trường toàn máy.** Nếu bạn từng đặt `JIRA_API_TOKEN` ở System Environment Variables, AI đọc được qua mọi shell. Kiểm tra trong `before_you_use.md`.
4. **Tài khoản AI cá nhân.** Code và dữ liệu gửi cho AI đi tới nhà cung cấp theo điều khoản của tài khoản cá nhân. `ai_policy: UNKNOWN` cho tới khi lead xác nhận.

## 5. Làm một mình (không có người thứ hai)
- G3 (sửa oracle) **không có chốt thật**. Hook chỉ báo sớm.
- Nhãn kết quả cao nhất là `CI-RUN` (hoặc `LOCAL-RUN` nếu không có CI).
- Báo cáo ghi `Enforcement: local-only`.
- Đây không phải lỗi của kit; đây là giới hạn phải **nói thật** với người đọc báo cáo.

## 6. Khi nào cập nhật file này
- Thêm hoặc bỏ một guard → thêm dòng ở mục 3.
- Phát hiện một cách lách mới → ghi vào cột "Cách lách đã biết" và thêm case vào `evals/hooks/test-hooks.md` nếu hook sửa được.
- Tool cập nhật (sandbox, hook) → tra lại `tool_support.md` rồi cập nhật mục 4.
