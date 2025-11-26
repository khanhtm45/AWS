# Hướng dẫn chạy backend (Windows PowerShell)

Tệp này mô tả các bước cơ bản để thiết lập và chạy backend của project trên Windows (PowerShell). Phù hợp cho các thành viên mới trong nhóm.

## Yêu cầu môi trường

- Java 17 (JDK 17) — đảm bảo `JAVA_HOME` trỏ tới JDK 17
- Maven 3.6+
- Node.js + npm (nếu muốn chạy frontend từ máy local)
- Docker & Docker Compose (tùy chọn, để chạy OpenSearch / MailHog)
- AWS CLI (nếu cần thao tác DynamoDB local/remote)

## Thiết lập biến môi trường (PowerShell)

Mở PowerShell và chạy:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path += ";$env:JAVA_HOME\bin"
```

Nếu dùng OpenSearch + MailHog local (docker-compose):

```powershell
cd D:\AWS-FCJ\leaf-shop\backend
docker compose up -d opensearch mailhog
```

## Chạy backend (maven)

Từ thư mục `backend`:

```powershell
cd D:\AWS-FCJ\leaf-shop\backend
mvn -f .\pom.xml spring-boot:run
```

Lưu ý: nếu bạn gặp lỗi liên quan đến `PathPattern` hoặc security matcher, hãy pull code mới nhất từ branch `backend`.

## Chạy frontend (tùy chọn)

Từ thư mục `frontend`:

```powershell
cd D:\AWS-FCJ\leaf-shop\frontend
npm install
npm start
```

Frontend mặc định chạy trên `http://localhost:3000` (hoặc `3001` tuỳ cấu hình). Biến `REACT_APP_API_BASE` có thể được dùng để chỉ định backend (mặc định `http://localhost:8080`).

## Tạo tài khoản admin/staff trực tiếp vào DynamoDB

Trường hợp bạn muốn tạo user (username/password) trực tiếp trong DynamoDB (ví dụ để đăng nhập staff), lưu ý:

- `password` **phải** là BCrypt hash (KHÔNG lưu plain text)
- `PK` phải có dạng `USER#<uuid>` và `SK` = `ACCOUNT` cho bản ghi account
- `roleId` hoặc `role` phải là `ADMIN`, `MANAGER` hoặc `STAFF` để `login-staff` cho phép đăng nhập

Ví dụ sinh BCrypt hash nhanh bằng Node (PowerShell):

```powershell
npm install -g bcryptjs
node -e "console.log(require('bcryptjs').hashSync('YourPasswordHere', 10))"
```

Sao chép giá trị hash trả về và dùng `aws dynamodb put-item` hoặc `update-item` để lưu.

Ví dụ `user.json` (dùng với `aws dynamodb put-item --item file://user.json`):

```json
{
  "PK": { "S": "USER#<uuid>" },
  "SK": { "S": "ACCOUNT" },
  "username": { "S": "admin" },
  "email": { "S": "admin@example.com" },
  "password": { "S": "$2a$10$...BCryptHash..." },
  "firstName": { "S": "Admin" },
  "lastName": { "S": "User" },
  "roleId": { "S": "ADMIN" },
  "role": { "S": "ADMIN" },
  "isActive": { "BOOL": true },
  "createdAt": { "N": "1764080677223" }
}
```

Command (local DynamoDB endpoint example):

```powershell
aws dynamodb put-item --table-name UserTable --item file://user.json --endpoint-url http://localhost:8000
```

Nếu bạn không dùng local DynamoDB, bỏ `--endpoint-url` và đảm bảo AWS credentials đã cấu hình.

## Tùy chọn: script tạo admin (gợi ý)

Bạn có thể tạo một script Node nhỏ để sinh hash và gọi AWS SDK `putItem`. Nếu muốn, tôi có thể thêm `scripts/create-admin.js` vào repo.

## Gỡ lỗi thường gặp

- 401 khi login-staff: kiểm tra `username` chính xác, `password` đã hash với BCrypt, `roleId` = `ADMIN|MANAGER|STAFF`.
- 403 khi tải resource static (logo, hình ảnh): đảm bảo file tồn trong `frontend/public` (ví dụ `LEAF.png` hoặc `logo.png`) hoặc backend cho phép các đường dẫn tĩnh.
- Lỗi build: xem log `mvn` để biết file bị thiếu; thường là do model DTO thay đổi.

## Thông tin liên hệ

Nếu cần hỗ trợ trực tiếp, tag tôi trong Slack/Teams hoặc để lại issue trên repo.

---

File này là tài liệu ngắn gọn để member trong team có thể chạy backend nhanh. Nếu bạn muốn mình commit script tạo admin luôn, báo mình nhé.
