# Playwright TypeScript: quy tắc viết test

> Nguồn: `antigravity-testing-kit-main/.agent/rules/playwright_rules.md` (mục 3–5, giữ thứ tự locator và wait), bỏ "bắt buộc headed" (`:15`).
> Nguyên tắc chung (mọi framework): `{{KIT}}/rules/automation_standards.md`.

## 1. Thứ tự ưu tiên locator
1. `getByRole(role, { name })`: button, link, heading, textbox, row, dialog…
2. `getByLabel('…')`: field có label
3. `getByPlaceholder('…')`
4. `getByText('…')`: nội dung tĩnh, không dùng cho text dễ đổi
5. `getByTestId('…')`: khi có `data-testid`
6. `locator('css')`: cuối cùng; không XPath tuyệt đối, không class sinh tự động

**Luôn thu hẹp scope** trước khi tìm:
```ts
const dialog = page.getByRole('dialog', { name: '[tên dialog quan sát được]' });
await dialog.getByLabel('[label quan sát được]').fill(`${runPrefix}-An`);

const row = page.getByRole('row').filter({ hasText: `${runPrefix}-An` });
await expect(row).toContainText('[giá trị nghiệp vụ mong đợi]');
```
Chỗ `[...]` phải điền bằng text **quan sát được trên DOM thật** (mode `locator`). Không điền theo trí nhớ.

## 2. Chờ
- **Cấm** `page.waitForTimeout()`, `setTimeout`, delay cố định.
- Dùng web-first assertion (tự chờ): `toBeVisible`, `toHaveText`, `toContainText`, `toHaveURL`, `toHaveCount`.
- Chờ **tín hiệu gắn với oracle** (row có đúng ID xuất hiện), không chờ "trang ổn định".

## 3. Cấu trúc
```ts
import { test, expect } from '../fixtures/test-base';   // có hostGuard + runPrefix
import { EmployeePage } from '../pages/EmployeePage';

test.describe('PIM', () => {
  test('TC-PIM-001 thêm nhân viên đủ field bắt buộc', { tag: '@smoke' }, async ({ page, runPrefix }) => {
    const pim = new EmployeePage(page);
    const name = `${runPrefix}-An`;                       // tên record mang prefix để tìm và dọn
    await pim.addEmployee({ firstName: name, lastName: 'Test' });
    await expect(pim.rowByName(name)).toHaveCount(1);     // oracle: đọc lại dữ liệu, không dựa vào toast
  });
});
```
- Page class: `readonly` locator + method hành động nghiệp vụ (`addEmployee`), **không** `expect`.
- Mỗi test độc lập; không phụ thuộc thứ tự.
- Tên test bắt đầu bằng TC ID.

## 4. Data và cleanup
- Data tạo ra mang `runPrefix` (`QA-r001-An`). Field format cứng → data registry (skill `test-data`).
- Cleanup trong `test.afterEach` hoặc fixture: chỉ xóa record **do run này tạo** (lọc theo prefix). Cleanup fail → test không được coi là pass (`{{KIT}}/rules/retry_and_wait.md` mục 6).
- Tài khoản: `process.env.TEST_USER` / `TEST_PASSWORD` từ `.env.sandbox`; đăng nhập một lần, lưu `storageState` (file đã nằm trong `.gitignore`).

## 5. Không được
- Sửa expected/assertion để test pass; thêm `.skip`/`.only`; nới timeout vô hạn.
- `force: true` để click xuyên overlay khi chưa biết vì sao bị che.
- `page.evaluate` để đổi trạng thái app thay cho thao tác của người dùng.
- Gọi trực tiếp `chromium.launch()` trong test (bỏ qua hostGuard).
