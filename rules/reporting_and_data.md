# Rule: Báo cáo, dữ liệu và redact

> Kế thừa `ai-qe-kit/rules/reporting_and_data.md`. Thêm: redact bằng script, HAR/video/ticket Jira, data synthetic, lưu trữ, `Enforcement`.

## 1. Evidence manifest (mỗi attempt một dòng)
```markdown
| Run ID | Attempt ID | Build/Version | Environment | Source AC | Reporter | Trace ref | Cleanup | Approval ref | Label | Thiếu gì |
```
Trace ref chỉ là **chỗ trỏ tới file**. Chưa mở hoặc kiểm tra file thật thì ghi `Insufficient evidence`.

## 2. Luật viết báo cáo
- Giữ **lần fail đầu tiên** và mọi lần retry, theo thứ tự thời gian.
- Ghi rõ approval nào đã có, approval nào thiếu cho mỗi hành động.
- Thiếu thông tin thì ghi `Not specified` hoặc `Insufficient evidence`. **Không điền cho đẹp.**
- Phân biệt rõ dry-run (thiết kế) và lần chạy thật.
- Dòng bắt buộc: `Enforcement: server-review` hoặc `Enforcement: local-only` (theo `server_review` trong yml).
- Kết luận cuối nêu: trạng thái, độ tin cậy, unknowns, bước tiếp theo, người phụ trách.

## 3. Redact
**Công cụ:** `node scripts/redact/redact.js <file>` (Đợt 1). Script che theo danh sách regex trong `scripts/redact/patterns.json` và in ra số chỗ đã che. Sau đó **người kiểm tra lại**: regex không bắt được hết.

Phải che trước khi đưa vào prompt, file chia sẻ hoặc báo cáo:
- [ ] Token, cookie, header `Authorization`, API key, session ID
- [ ] Credential, mật khẩu, OTP
- [ ] PII: tên thật, email thật, số điện thoại, CCCD, địa chỉ, số tài khoản
- [ ] URL nội bộ, hostname, IP production
- [ ] **HAR**: chứa toàn bộ header và body, coi như secret; không đưa nguyên file cho AI
- [ ] **Video, screenshot**: AI không redact được ảnh; **người tự che**
- [ ] **Ticket Jira**: có thể chứa ảnh và dữ liệu khách; redact ngay lúc fetch
- [ ] Chỉ gửi cho AI **phần tối thiểu** cần để phân tích

## 4. Data test
- Email: `@example.com` hoặc domain `.test` (RFC 2606). **Không dùng** `@test.com` vì đó là domain có thật.
- Số điện thoại: env test phải **tắt SMS gateway** (`sms_gateway_disabled: yes` trong yml). Data generator không kiểm soát được số nào là của người thật.
- Tên, địa chỉ: synthetic (faker), không lấy từ dữ liệu khách.
- Mỗi record có prefix hoặc nằm trong data registry để cleanup.

## 5. Lưu trữ
- Output nằm trong `output_dir` (mặc định `~/aiqe-output/<project>/`), **không nằm trong repo khách**.
- Xóa output sau `retention_days` (mặc định 90 ngày), hoặc sớm hơn nếu hợp đồng yêu cầu.
- Trace, screenshot, video lưu ở nơi có phân quyền; report chỉ chứa **ref**.
- Publish hoặc chia sẻ ra ngoài cần **G4**.
