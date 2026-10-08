# Khung dự án Selenium Java + TestNG (my-aiqe-kit, BETA)

> Beta: đã `mvn test-compile` được (09/10/2026, JDK 25, Maven 3.9.16). Chưa chạy thật trên dự án nào.
> Quy tắc viết test: `skills/ui-automation/references/selenium-java.md` của kit.

## Bắt đầu
```powershell
mvn -q test-compile                       # tải thư viện + compile, không chạy test
mvn test -DbaseUrl=https://qa-sandbox.example.com -DsandboxUrls=https://qa-sandbox.example.com
mvn test -Dgroups=smoke ...               # chỉ nhóm smoke
mvn test -Dheadless=false -Dbrowser=edge ...  # debug trên máy, Edge có giao diện
```
Driver do **Selenium Manager** tự tải (có sẵn trong Selenium 4), không cần WebDriverManager.

Chạy test lên một env là **G1**. `baseUrl` phải nằm trong `sandboxUrls` (chép từ `sandbox_urls` của `.aiqe/project.aiqe.yml`); không khớp thì test bị **SKIP**, không chạy.

## Cấu trúc
| File | Vai trò |
|---|---|
| `pom.xml` | Selenium 4.50.0, TestNG 7.12.0, Java 17; surefire không retry |
| `testng.xml` | Suite chạy song song theo class |
| `src/test/java/aiqe/core/BaseTest.java` | WebDriver ThreadLocal, cấu hình từ `-D`/biến môi trường, chặn env ngoài sandbox |
| `src/test/java/aiqe/pages/BasePage.java` | Hàm chờ theo điều kiện; page object không chứa assertion |
| `src/test/java/aiqe/tests/SmokeTest.java` | Smoke chỉ đọc |

## Giới hạn so với scaffold Playwright
- Không chặn được request tới host lạ trong lúc chạy (Playwright có `context.route`). Kiểm tra env chỉ ở lúc khởi động.
- Không có trace như Playwright. Khi fail: chụp màn hình + lưu `driver.getPageSource()` vào thư mục evidence của run (tự thêm khi cần).
- Tài khoản test: đọc từ biến môi trường do người cấp, không hardcode, không hỏi qua chat.
