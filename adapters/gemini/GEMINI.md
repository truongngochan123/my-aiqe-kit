## Dành riêng cho Gemini CLI (my-aiqe-kit)

> Phần này được `scripts/install/install.js --tool gemini` ghép SAU nội dung `AGENTS.md` vào `~/.gemini/GEMINI.md`.
> Mức hỗ trợ: **beta**. Xem `{{KIT}}/docs/tool_support.md` mục Gemini.

1. **Skill:** bản cài này không chép skill vào thư mục riêng của Gemini (Gemini CLI có đọc `SKILL.md` tự động hay không: `UNKNOWN`). Khi bảng routing ở trên chọn skill `<tên>`, **đọc `{{KIT}}/skills/<tên>/SKILL.md` trước khi làm**, rồi làm đúng theo file đó, kể cả script kiểm tra ở cuối.
2. **Ghi `produced_by`** đúng tên skill đã đọc ở bước 1 (eval chấm routing bằng trường này).
3. **Không có hook của kit trên Gemini.** Hai hook `block-secret-read`, `block-assertion-edit` **không** chạy ở đây, nên các luật sau chỉ là lời dặn (📝), hãy tự giữ:
   - Không đọc `.env*` (trừ `.env.sandbox`), `*.har`, `storageState*.json`, cookie, `~/.aiqe/secrets/`; không in biến môi trường chứa TOKEN/SECRET/PASSWORD.
   - Không chạy lệnh có `--env-file` (trừ `.env.sandbox`): file env có thể chứa token dù tên là gì; đưa lệnh cho người dùng tự chạy.
   - Không sửa assertion/expected/fixture/`.skip` khi chưa có G3.
4. Khuyến nghị cho người dùng: chạy Gemini CLI với sandbox (`gemini --sandbox`) và chế độ hỏi trước khi chạy lệnh; mức cách ly thật trên máy: `UNKNOWN`.
