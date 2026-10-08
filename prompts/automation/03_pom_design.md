# Automation · Bước 3/6: Thiết kế Page Object

> ⚠️ Xem cảnh báo ở `01_context_and_roleplay.md`.
> Nguồn: `antigravity-testing-kit-main/plans/automation/03_pom_design/prompt.txt`.

---START---

Dựa trên bảng locator **đã lấy từ DOM thật** ở bước 2, thiết kế **Page Object Model**.

1. **Mỗi trang/khu vực một class**, tên có nghĩa (`LoginPage`, `EmployeeListPage`).
2. **Dùng đúng locator của bước 2.** Không tự đổi; muốn đổi thì nêu lý do. Locator "CẦN VERIFY" giữ nguyên chú thích.
3. **Method theo hành động nghiệp vụ**, mỗi method một việc: `addEmployee()`, `searchByName()` (không đặt `clickButton()`, `inputText()`).
4. Page class **không chứa assertion**. Method có thể trả về locator để test assert (ví dụ `rowByName(name)`).
5. **Chưa viết file test** ở bước này.

Ví dụ Playwright:
```ts
readonly searchBox = this.page.getByRole('textbox', { name: '[name lấy ở bước 2]' });
rowByName(name: string) { return this.page.getByRole('row').filter({ hasText: name }); }
```

Trình bày cấu trúc file, tên class, locator, chữ ký method để tôi xem trước khi sang bước 4.
