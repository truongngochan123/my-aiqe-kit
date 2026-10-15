# Phiếu thẩm định chéo đa mô hình (Cross-Model Review Card)

> Chuẩn: Unit 4 AOCE (Cross-Model Verification & Quality Governance).
> Nguyên tắc: Model A sinh nội dung, Model B độc lập phản biện để loại bỏ thiên vị (Self-bias).

## 1. Thông tin phiên thẩm định

- **Đối tượng thẩm định:** `TC-...` / `BUG-...` / `PR-...`
- **Model tác giả (Author Model):** `claude-3-5-sonnet` (hoặc `gpt-4o`)
- **Model thẩm định (Reviewer Model):** `gpt-4o` (hoặc `gemini-1.5-flash`)
- **Thời điểm:** YYYY-MM-DD HH:mm:ss
- **Quyết định chung:** `CONSENSUS_ACCEPTED` / `DISAGREEMENT_NEEDS_HUMAN` / `REJECTED`

## 2. Bảng đối chiếu quan điểm (Model Comparison)

| Tiêu chí thẩm định | Đánh giá Model A (Tác giả) | Đánh giá Model B (Thẩm định) | Trạng thái đồng thuận | Nhận xét chi tiết |
|---|---|---|---|---|
| **Tính hợp lệ của Expected (Oracle)** | Đạt (theo quan sát) | Cảnh báo thiếu nguồn | ⚠️ BẤT ĐỒNG | Model B chỉ ra expected chưa có tài liệu BA xác nhận |
| **Độ bao phủ biên (BVA/EP)** | Đầy đủ 4 partitions | Đồng ý | ✅ ĐỒNG THUẬN | Đã phủ đủ case rỗng, case dài, case âm |
| **Phân loại rủi ro / Priority** | P1 (Blocker) | P2 (Major) | ⚠️ BẤT ĐỒNG | Model B cho rằng có workaround nên chỉ tính P2 |
| **Không sửa Assertion để pass** | Tuân thủ | Tuân thủ | ✅ ĐỒNG THUẬN | Không phát hiện hành vi hạ thấp tiêu chuẩn test |

## 3. Khuyến nghị & Hành động tiếp theo

- **Điểm đồng thuận:** Phê duyệt các bước thực thi và dữ liệu test.
- **Điểm cần người duyệt (G4/Human Gate):** Xác nhận lại độ ưu tiên P1 hay P2 và nguồn expected value với Product Owner.
