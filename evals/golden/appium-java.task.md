# Golden task: ui-automation / Appium Java (đề bài)

> **Người viết đề:** Claude (09/10/2026). **Người viết đáp án:** Codex. **Người duyệt:** Han.
> Đáp án ghi vào `evals/golden/appium-java.md`. Khi chạy eval, file đáp án nằm ngoài thư mục eval.

## Hướng dẫn cho người viết đáp án (Codex)
- Đọc: `skills/ui-automation/references/appium-java.md`, `rules/automation_standards.md`, `skills/test-design-rbt/references/mobile_scenarios.md`.
- Liệt kê **mọi** vi phạm (dòng, luật nào, sửa thế nào). Chỗ không chắc API của java-client 11 → ghi `UNKNOWN`, không đoán.

## Đoạn code cần soát (dự án dùng khung `templates/scaffold/appium-java/`)

```java
public class CheckoutTest extends BaseTest {
  @BeforeClass
  public void caps() {
    // trong BaseTest đã sửa: options.setCapability("autoGrantPermissions", true);
  }

  @Test
  public void payWithCard() throws InterruptedException {
    driver().findElement(By.xpath("//android.widget.FrameLayout[1]/android.widget.LinearLayout[2]/android.widget.Button[3]")).click();
    Thread.sleep(5000);
    driver().findElement(AppiumBy.id("com.shop.app:id/card_number")).sendKeys("4111111111111111");
    driver().findElement(AppiumBy.accessibilityId("pay_button")).click();
    Assert.assertTrue(driver().findElement(AppiumBy.accessibilityId("toast_success")).isDisplayed());
  }

  @Test
  public void locationPermissionDialog() {
    // TC-MOB-007: lần đầu mở bản đồ phải hiện hộp thoại xin quyền vị trí
    driver().findElement(AppiumBy.accessibilityId("open_map")).click();
    Assert.assertTrue(driver().findElement(AppiumBy.id("com.android.permissioncontroller:id/permission_message")).isDisplayed());
  }
}
```

## Định dạng đáp án
| # | Dòng/đoạn | Vi phạm | Luật | Sửa |
|---|---|---|---|---|

Kèm: vi phạm nào làm test **không thể** đúng (ví dụ cấu hình mâu thuẫn với TC) xếp lên đầu.

## Cách chấm skill bằng golden
Chạy `ui-automation` mode `review` (chat mới) → so với đáp án: bắt được / tổng; báo sai ghi riêng.
