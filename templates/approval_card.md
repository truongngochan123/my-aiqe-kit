# Approval card / Phiếu duyệt: <G1 | G2 | G3 | G4> · <Run ID hoặc PR>

> Người duyệt đọc **phạm vi** trước khi đồng ý. Đồng ý không kèm phạm vi ("ok") không được tính (`rules/agent_safety.md` mục 2).
> Ghi một dòng vào `decisions/decision_log.md` sau khi quyết định.

| Trường | Giá trị |
|---|---|
| Gate | G1 chạy/ghi dữ liệu · G2 chạy lại / ghi chưa rõ kết quả · G3 sửa test/oracle/fixture · G4 publish/gửi ra ngoài |
| Việc cần duyệt | <ví dụ: chạy EMP-CREATE-01, tạo 1 nhân viên, dọn sau khi chạy> |
| Run ID / PR | |
| Môi trường | <URL; có thuộc sandbox_urls không> |
| Phạm vi | <test/tag/tool nào; số lần; số record ghi; prefix data> |
| Tác động phụ | <dữ liệu tạo/xóa; gửi ra ngoài ai> |
| Cách dọn / quay lại | <cleanup, rollback; UNKNOWN nếu chưa biết> |
| Người duyệt cần xem | <diff, trace, evidence manifest, bản external…> |
| Hết hạn / điều kiện dừng | <thời hạn; dừng khi nào> |
| Người đề xuất | <AI (AI-PROPOSAL) / tên người> |

**Quyết định:** Đồng ý / Từ chối · Người duyệt: ______ · Thời điểm: ______ · Lý do: ______
