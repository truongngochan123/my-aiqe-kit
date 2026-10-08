# Mode Postman: collection + Newman

> Newman là trình chạy collection Postman từ dòng lệnh. Pin version khi cài: `npm install --save-dev newman@6.2.2`.

## 1. Cấu trúc collection
```
<Dự án> API (collection)
├── 00 setup        ← lấy token, tạo data nền (nếu cần)
├── <Module A>      ← mỗi endpoint một folder, mỗi case một request
│   ├── TC-API-001 tạo nhân viên hợp lệ
│   └── TC-API-002 thiếu firstName → 400
└── 99 teardown     ← DELETE đúng record của run
```
- Tên request bắt đầu bằng TC ID để truy vết.
- Biến dùng `{{baseUrl}}`, `{{token}}`, `{{runPrefix}}`, không ghi giá trị thật vào collection.

## 2. Biến môi trường và secret
- File `<env>.postman_environment.json` chỉ chứa **tên biến** và giá trị không nhạy cảm (`baseUrl`, `runPrefix`).
- Mật khẩu/tài khoản test: truyền lúc chạy, từ terminal của bạn, không commit:
  ```
  npx newman run api.postman_collection.json -e sandbox.postman_environment.json --env-var "password=<từ .env.sandbox>"
  ```
- File environment xuất từ Postman app hay chứa token cũ trong `currentValue`: xóa trước khi commit.

## 3. Test script (`pm.test`) với oracle mạnh
```js
// Tests của request "TC-API-001 tạo nhân viên hợp lệ"
pm.test('TC-API-001 status 201', () => pm.response.to.have.status(201));
const body = pm.response.json();
pm.test('TC-API-001 trả đúng firstName', () => pm.expect(body.firstName).to.eql(pm.variables.get('runPrefix') + '-An'));
pm.collectionVariables.set('employeeId', body.id);   // để request sau GET lại và teardown xóa
```
Request kế tiếp `GET {{baseUrl}}/<đường dẫn>/{{employeeId}}` kiểm tra lại từng field (đọc lại dữ liệu, không tin response của POST).
Tên field, đường dẫn: lấy từ contract. Không có → `UNKNOWN`, không đoán.

## 4. Chạy
| Lệnh | Việc |
|---|---|
| `npx newman run api.postman_collection.json -e sandbox.postman_environment.json` | Chạy tất cả |
| `… --folder "<Module A>"` | Chỉ một folder |
| `… --reporters cli,junit --reporter-junit-export results/newman.xml` | Xuất kết quả cho CI/báo cáo |
| `… --bail` | Dừng ở lỗi đầu tiên |

Chạy có `POST/PUT/PATCH/DELETE` là **G1**. Folder `99 teardown` luôn chạy cuối; teardown lỗi → không ghi pass.

## 5. Không được
- Dùng `pm.test` chỉ kiểm `status 200` cho mọi request.
- Lấy expected từ chính response (`pm.expect(body).to.eql(body)` kiểu ghi lại hành vi hiện tại).
- Để token thật trong collection/environment.
- Chạy kiểm tra gây tải (bắn nhiều request) trên site dùng chung.
