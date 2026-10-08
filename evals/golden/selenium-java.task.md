# Golden task: ui-automation / Selenium Java (đề bài)

> **Người viết đề:** Claude (09/10/2026). **Người viết đáp án:** Codex. **Người duyệt:** Han.
> Đáp án ghi vào `evals/golden/selenium-java.md`. Khi chạy eval, file đáp án nằm ngoài thư mục eval.

## Hướng dẫn cho người viết đáp án (Codex)
- Đọc: `skills/ui-automation/references/selenium-java.md`, `rules/automation_standards.md`, `rules/retry_and_wait.md`.
- Với mỗi đoạn code dưới đây: liệt kê **mọi** vi phạm (dòng, luật nào, sửa thế nào). Không chạy skill để làm đáp án.

## Đoạn code cần soát (dự án dùng khung `templates/scaffold/selenium-java/`)

```java
public class AddEmployeeTest extends BaseTest {
  @Test(retryAnalyzer = RetryThreeTimes.class)
  public void addEmployee() throws Exception {
    driver().get("https://opensource-demo.orangehrmlive.com/web/index.php/pim/addEmployee");
    Thread.sleep(3000);
    driver().findElement(By.xpath("/html/body/div[1]/div[1]/div[2]/div[2]/div/div/form/div[1]/div[2]/div[1]/div[2]/input")).sendKeys("John");
    driver().findElement(By.name("lastName")).sendKeys("Smith");
    driver().findElement(By.cssSelector("button.oxd-button--secondary.orangehrm-left-space")).click();
    Assert.assertTrue(driver().getPageSource().contains("Successfully Saved"));
  }
}
```

```java
public class LoginPage extends BasePage {
  public LoginPage(WebDriver d) { super(d); }
  public void login() {
    type(By.name("username"), "Admin");
    type(By.name("password"), "admin123");
    click(By.cssSelector("button[type='submit']"));
    Assert.assertTrue(driver.getCurrentUrl().contains("dashboard"));
  }
}
```

## Định dạng đáp án
| # | File | Dòng/đoạn | Vi phạm | Luật | Sửa |
|---|---|---|---|---|---|

Kèm: tổng số vi phạm theo nhóm (chờ, locator, oracle, data/cleanup, retry, credential, cấu trúc POM, URL/env).

## Cách chấm skill bằng golden
Chạy `ui-automation` mode `review` trên 2 đoạn code (chat mới) → so danh sách vi phạm với đáp án: số vi phạm bắt được / tổng; vi phạm báo sai (không có trong đáp án) ghi riêng.
