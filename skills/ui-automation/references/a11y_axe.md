# Kiểm tra accessibility nhẹ bằng axe

> Thư viện: `@axe-core/playwright` (đã có trong `templates/scaffold/playwright-ts/package.json`).
> Mức: **WCAG 2.1 AA**. Mặc định **không làm fail test**: chỉ ghi kết quả để người xem.
> axe chỉ bắt được **một phần** lỗi accessibility (lỗi kiểm tra được bằng máy). Audit đầy đủ (screen reader, bàn phím, người dùng thật) nằm trong mục "Để sau" của `docs/BUILD_PLAN.md`.

## Mẫu
```ts
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test-base';

test('PIM: kiểm tra a11y trang Add Employee', { tag: '@a11y' }, async ({ page }, testInfo) => {
  await page.goto('/[đường dẫn quan sát được]');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Mặc định: chỉ GHI LẠI, không làm fail.
  await testInfo.attach('axe-results.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
  for (const v of results.violations) {
    testInfo.annotations.push({ type: `a11y-${v.impact}`, description: `${v.id}: ${v.help} (${v.nodes.length} chỗ)` });
  }

  // Dự án quyết định làm fail với lỗi nghiêm trọng → bật dòng dưới (cần lead đồng ý, ghi vào yml/README).
  // expect(results.violations.filter((v) => v.impact === 'critical')).toEqual([]);
});
```

## Đọc kết quả
| `impact` | Ý nghĩa | Gợi ý |
|---|---|---|
| critical | Chặn người dùng khuyết tật dùng chức năng | Tạo bug (expected: nguồn WCAG 2.1 AA + `AI-PROPOSAL`, cần PO xác nhận mức áp dụng) |
| serious | Gây khó khăn lớn | Tạo bug hoặc câu hỏi tùy dự án có cam kết WCAG không |
| moderate / minor | Ảnh hưởng nhỏ | Ghi vào báo cáo, không tự tạo bug |

Dự án **không cam kết** WCAG → kết quả axe là **thông tin**, không phải expected có nguồn. Tạo câu hỏi `Q-*` cho PO trước khi tạo bug.
