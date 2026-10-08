# Selenium Java + TestNG (BETA)

> Khung: `{{KIT}}/templates/scaffold/selenium-java/` (đã compile và chạy smoke chỉ đọc trên OrangeHRM demo bằng Edge, 09/10/2026).
> Nguồn gốc: `antigravity-testing-kit-main/.agent/rules/selenium_rules.md`, `locator_strategy.md`, `prompt_03/04_*_selenium.txt`.
> Khác bộ gốc: bỏ "bắt buộc headed khi debug" (headed là tùy chọn `-Dheadless=false`); bỏ viewport cố định 1920×1080 (dùng 1366×900, đổi theo dự án); prompt gốc chứa tài khoản demo của site bên thứ ba: không chuyển sang.

## 1. Nhận diện
`pom.xml` hoặc `build.gradle` có `org.seleniumhq.selenium:selenium-java` + `org.testng:testng`. JUnit 5 thay TestNG → báo user, viết theo JUnit nhưng giữ các quy tắc dưới.

## 2. Locator
Thứ tự: thuộc tính test (`data-testid`, `data-test`, `data-qa`) → `id` (không phải id tự sinh) → `name` → CSS có scope → XPath theo **text/thuộc tính**, không theo vị trí.
- Có scope: tìm phần tử cha trước (dialog, row của bảng chứa đúng ID record), rồi tìm trong đó.
- Cấm: XPath tuyệt đối (`//div[3]/div[2]/…`), class động/hash, chuỗi `nth-child` khi có cách khác.
- Mọi locator là `DOM-OBSERVED` (người, env, ngày) hoặc ghi `// CẦN VERIFY LIVE`.

## 3. Chờ
- Chỉ explicit wait: `WebDriverWait` + `ExpectedConditions` (`BasePage.visible/click/type/waitUrlContains`).
- Không chờ cố định thời gian. Không bật implicit wait cùng explicit wait.
- Chờ điều kiện nghiệp vụ (row có ID record xuất hiện), không chờ "spinner biến mất" rồi đoán.

## 4. Cấu trúc
- `BaseTest`: WebDriver `ThreadLocal`; env đọc từ `-DbaseUrl`/`AIQE_BASE_URL`; không thuộc `sandboxUrls` → `SkipException`.
- Page object chỉ locator + hành động; **assertion trong test**, có message mô tả.
- Tên test/`description` chứa TC ID (`TC-PIM-001 …`); nhóm theo cột Tags (`groups = {"smoke"}`).
- Data mang prefix của run (`QA-r001-An`), có cleanup đúng record của run.

## 5. Chạy và kiểm tra
| Việc | Lệnh |
|---|---|
| Kiểm cú pháp (không chạy) | `mvn -q test-compile` |
| Chạy smoke (G1) | `mvn test -Dgroups=smoke -DbaseUrl=<url> -DsandboxUrls=<url>` |
| Debug có giao diện | thêm `-Dheadless=false -Dbrowser=edge` |
Kết quả: `target/surefire-reports/` → `evidence-reporting` (nhãn `LOCAL-RUN`). Fail → `incident-triage`. Surefire `rerunFailingTestsCount=0`: chạy lại là G2.

## 6. Giới hạn
- Không chặn request tới host lạ trong lúc chạy (Playwright có `context.route`); chỉ kiểm env lúc khởi động (🧯 yếu hơn).
- Không có trace; khi fail lưu screenshot + page source vào thư mục evidence của run.
