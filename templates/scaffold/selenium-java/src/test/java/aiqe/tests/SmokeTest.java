package aiqe.tests;

import aiqe.core.BaseTest;
import java.time.Duration;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Smoke CHỈ ĐỌC: mở baseUrl, trang tải xong và vẫn ở đúng host. Không đăng nhập, không ghi dữ liệu.
 * Test thật viết từ TC bảng 3a (test-design-rbt); tên test chứa TC ID để truy vết.
 */
public class SmokeTest extends BaseTest {

  @Test(groups = {"smoke"}, description = "SMOKE-01 trang chủ env sandbox mở được")
  public void homePageLoads() {
    driver().get(baseUrl());
    new WebDriverWait(driver(), Duration.ofSeconds(30)).until(ExpectedConditions.visibilityOfElementLocated(By.tagName("body")));
    Assert.assertEquals(origin(driver().getCurrentUrl()), origin(baseUrl()),
        "Sau khi mở trang vẫn phải ở đúng host của env sandbox");
    Assert.assertFalse(driver().getTitle().isBlank(), "Trang phải có tiêu đề (đã tải xong)");
  }
}
