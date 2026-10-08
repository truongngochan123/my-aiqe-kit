package aiqe.core;

import java.net.URI;
import java.time.Duration;
import java.util.Arrays;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.testng.SkipException;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

/**
 * Khởi tạo WebDriver cho mỗi test (ThreadLocal: chạy song song không lẫn session).
 *
 * Cấu hình qua -D hoặc biến môi trường (KHÔNG hardcode URL/tài khoản):
 *   baseUrl / AIQE_BASE_URL          URL env cần test
 *   sandboxUrls / AIQE_SANDBOX_URLS  danh sách URL được phép, cách nhau dấu phẩy (chép từ sandbox_urls của project.aiqe.yml)
 *   browser   chrome | edge (mặc định chrome)
 *   headless  true | false (mặc định true; debug trên máy: -Dheadless=false)
 *
 * baseUrl không thuộc sandboxUrls → test bị SKIP, không chạy (chống sai sót, không phải chốt chặn thật:
 * Selenium không chặn được request tới host khác như hostGuard của scaffold Playwright).
 */
public abstract class BaseTest {
  private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

  protected static String setting(String prop, String env, String fallback) {
    String v = System.getProperty(prop);
    if (v == null || v.isBlank()) v = System.getenv(env);
    return (v == null || v.isBlank()) ? fallback : v.trim();
  }

  protected String baseUrl() {
    return setting("baseUrl", "AIQE_BASE_URL", "");
  }

  protected static boolean inSandbox(String url, String sandboxList) {
    if (url.isEmpty() || sandboxList.isEmpty()) return false;
    try {
      String origin = origin(url);
      return Arrays.stream(sandboxList.split(",")).map(String::trim).filter(s -> !s.isEmpty())
          .anyMatch(s -> origin.equals(origin(s)));
    } catch (IllegalArgumentException e) {
      return false;
    }
  }

  protected static String origin(String url) {
    URI u = URI.create(url);
    if (u.getScheme() == null || u.getHost() == null) throw new IllegalArgumentException("URL không hợp lệ: " + url);
    return u.getScheme() + "://" + u.getHost() + (u.getPort() == -1 ? "" : ":" + u.getPort());
  }

  protected WebDriver driver() {
    return DRIVER.get();
  }

  @BeforeMethod(alwaysRun = true)
  public void startDriver() {
    String url = baseUrl();
    String sandbox = setting("sandboxUrls", "AIQE_SANDBOX_URLS", "");
    if (!inSandbox(url, sandbox)) {
      throw new SkipException("baseUrl \"" + url + "\" không thuộc sandboxUrls: không chạy (G1 cần env sandbox).");
    }
    boolean headless = Boolean.parseBoolean(setting("headless", "AIQE_HEADLESS", "true"));
    WebDriver d;
    if ("edge".equalsIgnoreCase(setting("browser", "AIQE_BROWSER", "chrome"))) {
      EdgeOptions o = new EdgeOptions();
      if (headless) o.addArguments("--headless=new");
      o.addArguments("--window-size=1366,900");
      d = new EdgeDriver(o);
    } else {
      ChromeOptions o = new ChromeOptions();
      if (headless) o.addArguments("--headless=new");
      o.addArguments("--window-size=1366,900");
      d = new ChromeDriver(o);
    }
    // Không dùng implicit wait (trộn với explicit wait gây chờ khó đoán). Chờ bằng BasePage.
    d.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));
    DRIVER.set(d);
  }

  @AfterMethod(alwaysRun = true)
  public void stopDriver() {
    WebDriver d = DRIVER.get();
    if (d != null) {
      d.quit();
      DRIVER.remove();
    }
  }
}
