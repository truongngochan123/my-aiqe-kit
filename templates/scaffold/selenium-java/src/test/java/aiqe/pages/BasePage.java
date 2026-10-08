package aiqe.pages;

import java.time.Duration;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Page object gốc: chỉ chứa locator và hành động, KHÔNG chứa assertion (assertion nằm trong test).
 * Mọi thao tác chờ bằng điều kiện (explicit wait), không chờ cố định thời gian.
 * Locator lấy từ DOM thật (DOM-OBSERVED); chưa xem DOM thì ghi chú "CẦN VERIFY LIVE" và không coi test là chạy được.
 */
public abstract class BasePage {
  protected final WebDriver driver;
  protected final WebDriverWait wait;

  protected BasePage(WebDriver driver) {
    this.driver = driver;
    this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
  }

  protected WebElement visible(By locator) {
    return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
  }

  protected void click(By locator) {
    wait.until(ExpectedConditions.elementToBeClickable(locator)).click();
  }

  protected void type(By locator, String text) {
    WebElement el = visible(locator);
    el.clear();
    el.sendKeys(text);
  }

  protected void waitUrlContains(String part) {
    wait.until(ExpectedConditions.urlContains(part));
  }
}
