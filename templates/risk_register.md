# Sổ theo dõi rủi ro kiểm thử (Testing Risk Register)

> Chuẩn: `rules/reporting_and_data.md`, `skills/test-strategy`.
> Mã rủi ro: `RSK-<MODULE>-<NNN>` (ví dụ `RSK-AUTH-001`). Mọi rủi ro bắt buộc có **Owner** chịu trách nhiệm, **Biện pháp kiểm soát** và **Hạn chót**.

## Bảng theo dõi rủi ro

| Risk ID | Mô tả rủi ro (Risk Statement) | Khả năng (Likelihood) | Mức ảnh hưởng (Impact) | Cấp độ rủi ro | Biện pháp kiểm soát / Giảm thiểu (Mitigation & Controls) | Người chịu trách nhiệm (Owner) | Hạn xử lý (Target Date) | Trạng thái (Status) |
|---|---|---|---|---|---|---|---|---|
| `RSK-AUTH-001` | Màn đăng nhập chưa có rate-limiting, nguy cơ brute-force trong release | Cao | Cao | Critical | Bổ sung 2 security test scenario; yêu cầu Dev bật lockout sau 5 lần sai | Dev Lead (Nam) | YYYY-MM-DD | Open |
| `RSK-PAY-002` | Môi trường sandbox bên thứ ba thường xuyên timeout ngắt quãng | TB | Cao | High | Mock response trong CI; chạy smoke trực tiếp trên sandbox có retry có kiểm soát | QA Lead (Han) | YYYY-MM-DD | Mitigated |
| `RSK-DATA-003` | Dữ liệu test dùng chung bị ghi đè lẫn nhau giữa các luồng test song song | Cao | TB | Medium | Áp dụng data prefix độc lập theo từng run ID (`rules/id_conventions.md`); dọn dẹp bắt buộc | QA Eng (Binh) | YYYY-MM-DD | Open |

## Định nghĩa thang đo

- **Khả năng (Likelihood):** Thấp (hiếm khi xảy ra), TB (có thể xảy ra trong chu kỳ kiểm thử), Cao (chắc chắn hoặc thường xuyên xuất hiện).
- **Mức ảnh hưởng (Impact):** Thấp (ảnh hưởng UI/thẩm mỹ), TB (ảnh hưởng chức năng phụ), Cao (ảnh hưởng luồng tiền, bảo mật, mất mát dữ liệu khách hàng).
- **Trạng thái:** `Open` (đang mở), `Mitigated` (đã có biện pháp kiểm soát), `Accepted` (chấp nhận rủi ro có ký duyệt G4), `Closed` (đã giải quyết).
