# RUNBACKEND — Ghi nhớ cách chạy backend (local)

File này tổng hợp các lệnh nhanh và lưu ý để bạn dễ khởi chạy backend và môi trường phụ trợ (OpenSearch / Docker) khi cần.

1. Chạy backend bằng Maven (local, nhanh để debug)

PowerShell (chỉ cho session hiện tại):

```powershell
# Nếu cần thiết thiết lập Java cho session
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path += ";$env:JAVA_HOME\bin"

# Chạy backend (profile prod như project đang dùng)
mvn -f .\backend\pom.xml -Dspring.profiles.active=prod spring-boot:run
```

2. Chạy bằng Docker Compose (OpenSearch + backend)

Từ thư mục `backend`:

```powershell
cd backend
docker compose up --build
```

Lưu ý:

- Compose đã cấu hình để chạy `opensearch` (9200) và `leaf-shop-backend` (8080).
- Nếu OpenSearch container bị kill (exit 137), tăng RAM cho Docker Desktop (WSL2) trong Settings → Resources (4GB+ recommended).
- Compose mặc định tắt SigV4 signing cho local OpenSearch (OPENSEARCH_SIGNING_ENABLED=false). Khi chuyển sang Amazon OpenSearch Service, set `OPENSEARCH_ENDPOINT` thành HTTPS endpoint và `OPENSEARCH_SIGNING_ENABLED=true`.

3. Biến môi trường quan trọng

- AWS creds (không dùng trong production — dùng IAM Role):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
- OpenSearch / Bedrock:
  - `OPENSEARCH_ENDPOINT` (ví dụ: `https://search-...es.amazonaws.com`)
  - `OPENSEARCH_SIGNING_ENABLED` (true|false) — false cho local HTTP
  - `BEDROCK_ENDPOINT`, `BEDROCK_MODEL_ID`

4. Chạy test nhanh

Từ `backend`:

```powershell
mvn -f .\backend\pom.xml test
```

5. Nếu backend cần DynamoDB local (project kiểm tra khi start):

- Start DynamoDB local container (nếu dùng):

```powershell
docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local
```

6. Tắt/Reset containers

```powershell
docker compose down
# hoặc xóa volumes (cẩn thận)
docker compose down -v
```

7. Troubleshooting ngắn gọn

- Lỗi `The JAVA_HOME environment variable is not defined correctly`: thiết lập `JAVA_HOME` như phần 1.
- Lỗi compile liên quan dependency: chạy `mvn -f .\backend\pom.xml -U clean package` để làm sạch và force tải dependency.
- Nếu OpenSearch yêu cầu signin SigV4: đảm bảo `aws-java-sdk-core` có trên classpath hoặc dùng IAM Role; kiểm tra `AwsClientConfig` trong mã nguồn.

8. Thêm ghi chú

- File cấu hình liên quan: `src/main/resources/application.properties`, `src/main/resources/application-prod.properties`.
- Docker compose file: `backend/docker-compose.yml`.

Nếu cần, tôi có thể thêm script PowerShell tự động hoá các lệnh trên (start/stop/test) — bạn muốn tôi tạo không?
