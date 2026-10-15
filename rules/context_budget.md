# Rule: Quản trị ngân sách ngữ cảnh & Prompt Caching (Context Budget)

> Chuẩn: Unit 2 AOCE (Context Management & Economic Viability).
> Mục tiêu: Chống phình ngữ cảnh (Context Bloat), tối ưu hóa chi phí token bằng Prompt Caching và kiểm soát độ dài observation.

## 1. Phân vùng ngữ cảnh (Context Partitioning)

Mọi yêu cầu gửi tới LLM Planner phải được chia thành 2 vùng rõ rệt:

1. **Khối tĩnh (Static Cacheable Block):**
   - Chứa: System instructions, nguyên tắc an toàn, khai báo `tool_manifest.json`, định dạng JSON mong muốn.
   - Kích thước: Khuyến nghị cố định dưới 8,000 tokens.
   - Cơ chế: Đánh dấu cờ Cache Control (ví dụ `type: "ephemeral"` đối với Claude API hoặc cached prompt của OpenAI/Gemini) để hưởng mức giá ưu đãi (giảm 75% - 90% chi phí đọc lại).
2. **Khối động (Dynamic Execution Block):**
   - Chứa: Trạng thái hiện tại của state machine, lịch sử tương tác (`history`), và kết quả quan sát mới nhất (`lastObservation`).
   - Kích thước: Tối ưu dưới 6,000 tokens.

## 2. Kiểm soát độ dài quan sát (Observation Truncation)

- Dữ liệu DOM từ `inspect_ui` hoặc phản hồi API từ `read_result` là dữ liệu không tin cậy (`<untrusted>`).
- Cấm đưa toàn bộ cây HTML thô 100,000 dòng vào prompt. Bắt buộc:
  - Chỉ trích xuất vùng DOM tương tác (theo `scope` được phép, ví dụ `login`, `add-employee`).
  - Lược bỏ các thẻ style, script, SVG, base64 ảnh.
  - Trần giới hạn: Mỗi quan sát tối đa 4,000 tokens. Dữ liệu dài hơn phải được cắt gọn và thêm dòng `[...TRUNCATED: còn n ký tự...]`.

## 3. Nén lịch sử khi chạy dài (History Compaction)

- Khi một run vượt quá 8 bước hành động:
  - Controller/Planner kích hoạt nén lịch sử (`compactHistory`).
  - Giữ nguyên bước đầu tiên (thiết lập/setup) và 4 bước gần nhất.
  - Các bước trung gian được nén thành 1 dòng tóm tắt: `[Đã thực thi N bước: gọi tool X, Y, Z với trạng thái ok]`.
- Tuyệt đối không xóa bỏ các vi phạm bảo mật (`security_observation`) hoặc hành động bị chặn (`blocked`) khi nén lịch sử.
