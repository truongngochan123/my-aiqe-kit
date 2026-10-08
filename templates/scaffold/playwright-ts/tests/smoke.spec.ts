import { test, expect } from '../fixtures/test-base';
import { BasePage } from '../pages/BasePage';

// Test mẫu, CHỈ ĐỌC: mở trang gốc của BASE_URL.
// Oracle ở đây là oracle TẠM (chỉ kiểm tra trang phản hồi). Sau khi quan sát DOM thật,
// thay bằng oracle nghiệp vụ (ví dụ tìm đúng record theo ID, đúng giá trị trong cùng row).
test('trang gốc phản hồi không lỗi', { tag: '@smoke' }, async ({ page }) => {
  const response = await new BasePage(page).open('/');
  expect(response, 'không nhận được phản hồi từ BASE_URL').not.toBeNull();
  expect(response!.status(), 'trang gốc trả mã lỗi').toBeLessThan(400);
});
