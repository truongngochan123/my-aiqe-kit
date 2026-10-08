package aiqe.tests;

import aiqe.core.BaseTest;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Smoke CHỈ ĐỌC: app mở được và đang ở đúng package. Không đăng nhập, không ghi dữ liệu.
 */
public class SmokeTest extends BaseTest {

  @Test(groups = {"smoke", "mobile"}, description = "SMOKE-M01 app bản test mở được")
  public void appLaunches() {
    Assert.assertEquals(driver().getCurrentPackage(), expectedPackage(),
        "App đang hiển thị phải là package của bản test");
  }
}
