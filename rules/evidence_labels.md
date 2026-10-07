# Rule: Nhãn evidence

> Mục đích: người đọc phân biệt ngay đâu là **sự thật đã kiểm chứng**, đâu là **thông tin được cung cấp**, đâu là **AI đoán**.

## 1. Bảng nhãn

| Nhãn | Dùng khi | Bắt buộc kèm |
|---|---|---|
| `REQ-CONFIRMED` | Lấy từ requirement hoặc AC có ID, hoặc PO/BA đã xác nhận | ID nguồn (`AC-LOGIN-01`) hoặc tên người xác nhận + ngày |
| `PROVIDED` | Thông tin do **người hoặc nguồn khác** cung cấp, QA chưa tự xem: khách, BA, dev, đồng nghiệp, tài liệu, ticket, bộ kit gốc (AI sinh) | **Nguồn** (ai/tài liệu nào) |
| `DOM-OBSERVED` | **QA tự quan sát** giao diện/DOM/hành vi trên môi trường thật. Gồm cả khi QA **kể lại quan sát của chính mình** trong prompt cho AI | **Người quan sát + env + ngày**. Cũ đi sau mỗi lần deploy |
| `AI-PROPOSAL` | Đề xuất của AI, chưa ai duyệt | — |
| `QA-ACCEPTED` | `AI-PROPOSAL` đã được QA duyệt | Dòng trong decision log |
| `HYPOTHESIS` | Giải thích chưa kiểm chứng | — |
| `VERIFIED` | Hypothesis đã được discriminating check **xác nhận** | Artifact của check |
| `REFUTED` | Hypothesis đã được discriminating check **bác bỏ** | Artifact của check |
| `MANUAL-RUN: passed\|failed` | Tester chạy TC bằng tay | build/version app, env, người chạy, thời điểm. **`failed` bắt buộc có evidence** (screenshot, video hoặc log) |
| `LOCAL-RUN: passed\|failed\|flaky` | Automation chạy trên máy cá nhân | commit/SHA nếu có, env, reporter ref |
| `CI-RUN: passed\|failed\|flaky` | CI chạy trên SHA **chưa** được người khác review | SHA, link job |
| `RUN-PASSED` / `RUN-FAILED` | CI chạy trên SHA **đã được người khác review** (hoặc SHA đã merge khi branch protection bật), đủ reporter, trace, oracle đạt, cleanup DONE | SHA, link job, trace ref |
| `UNKNOWN` | Không có nguồn để kết luận | — |

**Phân biệt `DOM-OBSERVED` và `PROVIDED`: hỏi "ai đã tự nhìn thấy?"**

| Tình huống | Nhãn |
|---|---|
| User (QA) viết: "mình quan sát ngày 07/10 trên OrangeHRM demo: form có 3 field…" | `DOM-OBSERVED` (người quan sát: user, env: OrangeHRM demo, ngày: 07/10) |
| AI tự xem DOM qua MCP browser | `DOM-OBSERVED` (người quan sát: AI qua MCP, env, ngày) |
| User viết: "dev bảo field này tối đa 50 ký tự" | `PROVIDED` (nguồn: dev) |
| User dán đoạn trong tài liệu/ticket/email của khách | `PROVIDED` (nguồn: tên tài liệu/ticket) |
| Quan sát không ghi ngày hoặc env | Vẫn là `DOM-OBSERVED` nhưng ghi `env/ngày: UNKNOWN` và hỏi lại user |

AI không kiểm chứng được lời kể của user; nhãn ghi **ai** quan sát để người đọc biết độ tin cậy. `DOM-OBSERVED` cho biết **hành vi hiện tại**, không chứng minh hành vi đó **đúng** (xem `test_design.md` mục 2).

**Hai cụm cố định:**
- `Not specified`: requirement **không quy định** hành vi này.
- `Insufficient evidence`: thiếu artifact hoặc assertion để kết luận.

`flaky` = fail rồi pass ở lần retry. Ghi `flaky`, **không** ghi `passed`, và giữ lần fail đầu (xem `retry_and_wait.md`).

## 2. Luật chuyển nhãn

```
Cấm (không bao giờ được nâng):
PROVIDED     ──✗──▶ DOM-OBSERVED     (phải tự quan sát lại)
AI-PROPOSAL  ──✗──▶ REQ-CONFIRMED    (AI không phải nguồn requirement)
QA-ACCEPTED  ──✗──▶ REQ-CONFIRMED    (QA chấp nhận ≠ PO/BA xác nhận)
LOCAL-RUN    ──✗──▶ RUN-PASSED
MANUAL-RUN   ──✗──▶ RUN-PASSED
CI-RUN       ──✗──▶ RUN-PASSED       (khi SHA chưa được người khác review)
dry-run      ──✗──▶ bất kỳ nhãn *-RUN nào

Được phép (có điều kiện):
AI-PROPOSAL  ──✓──▶ QA-ACCEPTED      (có dòng decision log ghi lý do)
HYPOTHESIS   ──✓──▶ VERIFIED/REFUTED (có discriminating check + artifact)
QA-ACCEPTED  ──✓──▶ REQ-CONFIRMED    (chỉ khi PO/BA xác nhận, ghi tên + ngày)
```

Dự án có `server_review: no` hoặc `UNKNOWN` → nhãn run cao nhất là `CI-RUN`.

## 3. Claim nào bắt buộc gắn nhãn
- Mọi claim trong: báo cáo phân tích, bug report, execution report, exit report, decision log.
- Mọi expected result, mọi nguyên nhân lỗi, mọi số liệu.
- Không cần gắn cho: câu dẫn dắt, tiêu đề, hướng dẫn thao tác.

## 4. Cách gắn
- Trong bảng: thêm cột `Label` (và `Source` nếu cần).
- Trong câu: nhãn trong ngoặc ngay sau claim. Ví dụ: *"Mã nhân viên phải duy nhất (`REQ-CONFIRMED`, AC-EMP-01)."*

## 5. Bản external (gửi khách): chuyển nhãn thành lời, KHÔNG xóa

| Nhãn | Viết thành (vi) | Viết thành (en) |
|---|---|---|
| `REQ-CONFIRMED` | (bỏ nhãn, giữ mã AC) | (drop label, keep AC ID) |
| `PROVIDED` | "theo thông tin từ <nguồn>" | "according to <source>" |
| `DOM-OBSERVED` | "quan sát trên <env> ngày <ngày>" | "observed on <env> at <date>" |
| `AI-PROPOSAL`, `QA-ACCEPTED` | "đề xuất của QA" | "QA recommendation" |
| `HYPOTHESIS` | "nguyên nhân nghi ngờ, chưa xác minh" | "suspected, not yet verified" |
| `VERIFIED` / `REFUTED` | "đã xác minh" / "đã loại trừ" | "verified" / "ruled out" |
| `*-RUN` | "kết quả chạy <loại> ngày <ngày>" | "<type> run result on <date>" |
| `UNKNOWN` | "chưa xác định" | "not yet determined" |

Xóa nhãn mà không chuyển thành lời là **giấu sự không chắc chắn** với khách. Ví dụ sai: *"Nguyên nhân: index chậm"* (bản internal là `HYPOTHESIS`).

## 6. Self-check
- [ ] Mọi claim bắt buộc ở mục 3 đã có nhãn
- [ ] Không nhãn nào bị nâng trái luật ở mục 2
- [ ] `PROVIDED` có nguồn; `DOM-OBSERVED` có env và ngày; `MANUAL-RUN: failed` có evidence
- [ ] Chi tiết không có trong nguồn đều ghi `UNKNOWN` hoặc `Not specified`
