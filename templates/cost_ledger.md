# Sổ cái chi phí kiểm thử AI & Phân tích ROI (AI Cost Ledger)

> Chuẩn: `rules/reporting_and_data.md`, Unit 1 AOCE (Economic Viability & Cost Management).
> Bắt buộc ghi nhận chi phí token thực tế và quy đổi ra USD theo bảng giá `agent/config/model_pricing.json`.

## 1. Nhật ký chi phí theo Run / Sprint (Cost by Run)

| Run ID / Ngày | Model sử dụng | Prompt Tokens (In) | Completion Tokens (Out) | Cached Tokens | Tổng chi phí ($ USD) | Số TC Pass | Chi phí / Test Pass ($) | Thời gian tiết kiệm (giờ) |
|---|---|---|---|---|---|---|---|---|
| `RUN-...` | `claude-3-5-sonnet` | `...` | `...` | `...` | `$0.0...` | `...` | `$0.0...` | `...h` |
| `RUN-...` | `gpt-4o` | `...` | `...` | `...` | `$0.0...` | `...` | `$0.0...` | `...h` |
| **Tổng đợt** | — | `...` | `...` | `...` | `$...` | `...` | `$...` | `...h` |

## 2. Phân tích hiệu quả kinh tế (ROI Analysis)

- **Chi phí kiểm thử AI:** `$... USD` (tổng tiền API token tiêu thụ).
- **Chi phí tương đương kiểm thử thủ công:** `[Số giờ tiết kiệm] × [Đơn giá tester/giờ] = $... USD`.
- **Hệ số ROI:** `(Chi phí Manual - Chi phí AI) / Chi phí AI = ...%` (hoặc tỷ lệ tiết kiệm chi phí).
- **Ngưỡng ngắt cầu dao (Budget Hard-Cap):** Tối đa `$... USD / run` hoặc `$... USD / release`. Vượt ngưỡng -> Chặn agent tiếp tục gọi LLM.
