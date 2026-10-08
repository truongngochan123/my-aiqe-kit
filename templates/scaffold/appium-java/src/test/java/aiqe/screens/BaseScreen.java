package aiqe.screens;

import io.appium.java_client.AppiumBy;
import io.appium.java_client.android.AndroidDriver;
import java.time.Duration;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Screen object gốc (tương đương page object trên web): chỉ locator + hành động, không assertion.
 * Locator ưu tiên accessibility id → resource-id → UiAutomator; XPath là lựa chọn cuối, không XPath theo vị trí.
 * Locator lấy từ Appium Inspector trên bản build đang test (DOM-OBSERVED: người, thiết bị, build, ngày).
 */
public abstract class BaseScreen {
  protected final AndroidDriver driver;
  protected final WebDriverWait wait;

  protected BaseScreen(AndroidDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, Duration.ofSeconds(20));
  }

  protected static By a11y(String id) {
    return AppiumBy.accessibilityId(id);
  }

  protected static By resId(String id) {
    return AppiumBy.id(id);
  }

  protected WebElement visible(By locator) {
    return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
  }

  protected void tap(By locator) {
    wait.until(ExpectedConditions.elementToBeClickable(locator)).click();
  }

  /** Cuộn tới phần tử có text (Android). Không tương tác với phần tử ngoài màn hình khi chưa cuộn. */
  protected WebElement scrollToText(String text) {
    return driver.findElement(AppiumBy.androidUIAutomator(
        "new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text(\"" + text.replace("\"", "\\\"") + "\"))"));
  }
}
