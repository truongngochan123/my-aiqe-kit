# Khung dự án Appium Java + TestNG (my-aiqe-kit, BETA)

> Beta: đã `mvn test-compile` được (09/10/2026, JDK 25, Maven 3.9.16). **Chưa chạy trên thiết bị** (máy dựng kit không có Appium server/emulator): hành vi lúc chạy là `UNKNOWN`.
> Quy tắc viết test: `skills/ui-automation/references/appium-java.md` của kit.

## Cần có
- Appium server 2.x hoặc 3.x + driver `uiautomator2` (`appium driver install uiautomator2`), Android SDK, emulator hoặc thiết bị.
- File `.apk` **bản test** (không dùng app production; không commit file `.apk`).

## Chạy
```powershell
mvn -q test-compile
mvn test -Dapp=D:\builds\app-qa.apk -DappPackage=com.example.app
mvn test -Dapp=... -DappPackage=... -Dudid=emulator-5554 -DappiumUrl=http://127.0.0.1:4723
```
Thiếu `app`/`appPackage` → test **SKIP**, không pass. Chạy trên thiết bị dùng chung/có dữ liệu thật là **G1**.

## Cấu trúc
| File | Vai trò |
|---|---|
| `pom.xml` | Appium java-client 11.0.0, TestNG 7.12.0, Java 17; không retry |
| `testng.xml` | Không chạy song song (một thiết bị một session) |
| `src/test/java/aiqe/core/BaseTest.java` | AndroidDriver + UiAutomator2Options, cấu hình từ `-D`/biến môi trường |
| `src/test/java/aiqe/screens/BaseScreen.java` | Locator accessibility id/resource-id, chờ theo điều kiện, cuộn trước khi chạm |
| `src/test/java/aiqe/tests/SmokeTest.java` | App mở đúng package |

## Khác bộ gốc (antigravity `appium_rules.md`)
- Không bật `autoGrantPermissions` mặc định: bật thì không test được hộp thoại xin quyền.
- Xoay màn hình, chạy nền: chỉ thêm khi TC yêu cầu; API cụ thể kiểm tra với tài liệu java-client đang dùng (`UNKNOWN` cho tới khi chạy thật).
