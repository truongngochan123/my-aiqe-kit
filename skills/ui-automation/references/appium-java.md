# Appium Java + TestNG (BETA)

> Khung: `{{KIT}}/templates/scaffold/appium-java/` (đã `mvn test-compile` 09/10/2026; **chưa chạy trên thiết bị**: hành vi lúc chạy `UNKNOWN`).
> Nguồn gốc: `antigravity-testing-kit-main/.agent/rules/appium_rules.md`, `locator_strategy.md`.
> Khác bộ gốc: không bật `autoGrantPermissions` mặc định (bật thì không test được hộp thoại xin quyền); API xoay màn hình/chạy nền chỉ dùng khi đã kiểm với tài liệu java-client đang dùng.

## 1. Nhận diện
`pom.xml`/`build.gradle` có `io.appium:java-client`. Phiên bản 11 cần thêm `selenium-support` cho `WebDriverWait` (phát hiện khi compile khung).

## 2. Locator
Thứ tự: `accessibility id` → `resource-id` (Android) / predicate string (iOS) → UiAutomator / class chain → XPath theo thuộc tính (cuối cùng).
- Cấm: XPath theo vị trí (`//android.widget.FrameLayout[1]/…`), chạm phần tử ngoài màn hình khi chưa cuộn, thao tác phần tử disabled khi chưa kiểm trạng thái.
- Locator lấy từ Appium Inspector trên **bản build đang test**: `DOM-OBSERVED` ghi người, thiết bị/OS, build, ngày.
- Thiếu accessibility id cho phần tử quan trọng → đề xuất dev thêm (ghi vào câu hỏi), không đắp XPath dài.

## 3. Chờ
- Explicit wait (`BaseScreen.visible/tap`); không chờ cố định cho animation.
- Cuộn trước khi chạm (`BaseScreen.scrollToText`, Android).

## 4. Cấu trúc
- Screen object (hậu tố `Screen`): locator + hành động, không assertion.
- `BaseTest`: thiếu `app`/`appPackage` → `SkipException`. Chỉ dùng file `.apk` bản test; không cài app lên thiết bị của người khác khi chưa hỏi.
- Mobile mặc định chạy tuần tự (một thiết bị một session).
- Tình huống riêng mobile (xin quyền, mất mạng, chạy nền, xoay, thông báo đẩy): lấy từ `skills/test-design-rbt/references/mobile_scenarios.md`, chỉ automation khi TC có expected rõ.

## 5. Chạy và kiểm tra
| Việc | Lệnh |
|---|---|
| Kiểm cú pháp | `mvn -q test-compile` |
| Chạy (G1, cần Appium server + thiết bị) | `mvn test -Dapp=<apk> -DappPackage=<pkg> [-Dudid=…]` |
Kết quả → `evidence-reporting`; fail → `incident-triage`. Không retry tự động.

## 6. Giới hạn
- Kit chưa có hook/guard riêng cho mobile; chạy trên thiết bị có dữ liệu thật là G1 và phải hỏi.
- iOS (XCUITest) chưa có khung.
