package aiqe.core;

import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import java.net.MalformedURLException;
import java.net.URI;
import java.time.Duration;
import org.testng.SkipException;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

/**
 * Khởi tạo AndroidDriver (UiAutomator2) cho mỗi test. iOS (XCUITest) thêm sau khi có dự án thật.
 *
 * Cấu hình qua -D hoặc biến môi trường (không hardcode):
 *   appiumUrl / AIQE_APPIUM_URL     mặc định http://127.0.0.1:4723
 *   app / AIQE_APP                  đường dẫn file .apk của BẢN TEST (không dùng app production)
 *   appPackage / AIQE_APP_PACKAGE   package mong đợi, ví dụ com.example.app
 *   udid / AIQE_UDID                thiết bị/emulator (tùy chọn)
 *
 * Thiếu app hoặc appPackage → SKIP (không coi là pass).
 * KHÔNG bật autoGrantPermissions mặc định: bật thì không còn thấy và không test được hộp thoại xin quyền.
 */
public abstract class BaseTest {
  private static final ThreadLocal<AndroidDriver> DRIVER = new ThreadLocal<>();

  protected static String setting(String prop, String env, String fallback) {
    String v = System.getProperty(prop);
    if (v == null || v.isBlank()) v = System.getenv(env);
    return (v == null || v.isBlank()) ? fallback : v.trim();
  }

  protected AndroidDriver driver() {
    return DRIVER.get();
  }

  protected String expectedPackage() {
    return setting("appPackage", "AIQE_APP_PACKAGE", "");
  }

  @BeforeMethod(alwaysRun = true)
  public void startDriver() throws MalformedURLException {
    String app = setting("app", "AIQE_APP", "");
    if (app.isEmpty() || expectedPackage().isEmpty()) {
      throw new SkipException("Chưa cấu hình app/appPackage: không chạy.");
    }
    UiAutomator2Options o = new UiAutomator2Options()
        .setApp(app)
        .setAppPackage(expectedPackage())
        .setNewCommandTimeout(Duration.ofSeconds(120));
    String udid = setting("udid", "AIQE_UDID", "");
    if (!udid.isEmpty()) o.setUdid(udid);
    String server = setting("appiumUrl", "AIQE_APPIUM_URL", "http://127.0.0.1:4723");
    DRIVER.set(new AndroidDriver(URI.create(server).toURL(), o));
  }

  @AfterMethod(alwaysRun = true)
  public void stopDriver() {
    AndroidDriver d = DRIVER.get();
    if (d != null) {
      d.quit();
      DRIVER.remove();
    }
  }
}
