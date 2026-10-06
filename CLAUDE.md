# my-aiqe-kit cho Claude Code

Luật chung nằm trong `AGENTS.md`. Khi cài, `scripts/install/install.js` chèn dòng import với **đường dẫn tuyệt đối** tới bản kit đã cài vào `~/.claude/CLAUDE.md`, ví dụ:

```
@C:/Users/<bạn>/.aiqe/kit/0.1.0/AGENTS.md
```

File này **không chép lại luật**. Chỉ ghi phần riêng của Claude:

- Skill nằm ở `~/.claude/skills/<tên>/` (bản chép từ kit, có file `.aiqe-version`). Không sửa trực tiếp ở đó; sửa trong repo kit rồi cài lại.
- Lệnh tắt nằm ở `~/.claude/commands/` (ví dụ `/bug`, `/gen-testcases`).
- Hook dùng chung với Codex: `{{KIT}}/adapters/hooks/`. Hook chỉ là lớp **chống sai sót**.
- Trên **Windows native**, Claude Code **không có sandbox** cho lệnh shell (chỉ có trên macOS, Linux, WSL2). Xem `docs/threat_model.md`.
