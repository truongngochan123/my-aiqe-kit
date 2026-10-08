# Trước khi dùng kit cho một dự án thật

> Làm checklist này **trước khi mở AI** trong repo của dự án. Mở AI rồi mới kiểm tra thì code đã được gửi đi.
> Câu trả lời ghi vào `project.aiqe.yml` của dự án (mẫu: `project.aiqe.example.yml`).
> Dùng với `practices/` hoặc dự án cá nhân thì không cần checklist này.

## Checklist

| # | Câu hỏi | Ghi vào yml | Nếu chưa biết (`UNKNOWN`) |
|---|---|---|---|
| 1 | Hợp đồng hoặc NDA với khách có **cho phép dùng AI** với code và tài liệu của họ không? Cho phép **tool nào**? | `ai_policy`, `allowed_ai_tools` | **Không** đưa code/tài liệu thật vào AI. Hỏi lead |
| 2 | Công ty có cho dùng **tài khoản AI cá nhân** (không phải gói doanh nghiệp) với dữ liệu khách không? | `ai_policy` | Như trên |
| 3 | Mức bảo mật dữ liệu của dự án là gì? | `data_classification` | Dùng `confidential` |
| 4 | Env nào được phép chạy test và tạo dữ liệu? (URL cụ thể) | `sandbox_urls` | Không chạy test lên env nào ngoài `localhost` |
| 5 | Env test đã **tắt gửi SMS/email thật** chưa? | `sms_gateway_disabled` | Không chạy test có số điện thoại hoặc email |
| 6 | Dự án có **CI + người thứ hai review PR** không? | `server_review` | Báo cáo ghi `Enforcement: local-only`, nhãn cao nhất `CI-RUN` |
| 7 | Token Jira/Xray/CI của bạn đang nằm ở đâu? Phải: **không** trong repo, **không** trong `.env` của repo, **không** ở biến môi trường toàn máy (System/User Environment Variables) | — | Dời token ra trước khi mở AI (xem dưới) |
| 8 | File `.env.sandbox` (nếu có) chỉ chứa **tài khoản test quyền thấp**? | — | Không tạo `.env.sandbox` |

Chỉ cần **một** câu 1–2 là `UNKNOWN` hoặc "không" → kit chạy ở mức chặt nhất: tắt `prompts/` (dán sang AI web) và tắt review chéo giữa các AI.

## Kiểm tra câu 7 trên Windows
Mở PowerShell **của bạn** (không qua AI) và chạy:
```powershell
[Environment]::GetEnvironmentVariables('User').Keys   | Where-Object { $_ -match 'TOKEN|SECRET|PASSWORD|_PAT|API_?KEY' }
[Environment]::GetEnvironmentVariables('Machine').Keys | Where-Object { $_ -match 'TOKEN|SECRET|PASSWORD|_PAT|API_?KEY' }
```
Lệnh chỉ in **tên** biến. Có tên nào hiện ra thì token đó đang lộ cho mọi chương trình, kể cả AI. Cách làm đúng: xóa khỏi biến môi trường toàn máy, chỉ đặt trong terminal riêng khi cần chạy script:
```powershell
$env:JIRA_API_TOKEN = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText   # PowerShell 7
```

## Sau khi trả lời
1. Tạo `<repo>/.aiqe/project.aiqe.yml` bằng `scripts/project/new-project.ps1` (hoặc chép `project.aiqe.example.yml`) và điền. `.aiqe/` phải nằm trong `.git/info/exclude`. Dự án không cho để file trong repo thì đặt ở `~/aiqe-output/<tên thư mục repo>/project.aiqe.yml`.
2. Chạy `scripts/install/install.ps1 -Verify` để chắc kit đã cài đúng.
3. Mở AI trong repo dự án. AI sẽ đọc yml và nói rõ đang chạy ở mức nào.
