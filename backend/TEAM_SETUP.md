# Hướng Dẫn Cấu Hình & Chạy Cho Nhóm — backend (Java / Spring Boot)

Tài liệu này hướng dẫn toàn bộ bước để một thành viên trong nhóm có thể cấu hình, chạy và debug dịch vụ backend trên môi trường local hoặc Docker, cùng các lưu ý khi deploy lên AWS.

Mục lục

- Mục tiêu
- Yêu cầu trước (Prerequisites)
- Biến môi trường cần thiết
- Cấu hình AWS (ngắn gọn)
- Chạy local bằng Maven
- Chạy local với Docker Compose (OpenSearch + backend)
- Kiểm tra & test
- Tài nguyên cho production
- Troubleshooting phổ biến
- Checklist nhanh

**Mục tiêu**

- Đảm bảo dev mới có thể thiết lập môi trường trong 10-20 phút.
- Tập trung vào OpenSearch, Bedrock, Translate (AWS) đã tích hợp trong mã nguồn.

**Yêu cầu trước (Prerequisites)**

- Tài khoản AWS với quyền tạo IAM/OpenSearch (nếu cần làm provisioning).
- Java 17 (JDK) — dự án target Java 17.
- Maven 3.8+.
- Docker Desktop (WSL2 backend recommended) nếu muốn chạy OpenSearch local.
- (Tùy chọn) AWS CLI cài và cấu hình `aws configure`.

**Biến môi trường cần thiết**

Thiết lập các biến dưới đây cho local hoặc trong CI/CD. Thay thế giá trị ví dụ bằng của bạn.

- AWS:
  - `AWS_ACCESS_KEY_ID`=AKIA...
  - `AWS_SECRET_ACCESS_KEY`=...
  - `AWS_REGION`=ap-southeast-1
- OpenSearch / local vs AWS:
  - `OPENSEARCH_ENDPOINT`=http://localhost:9200 (local) hoặc https://search-xxx.region.es.amazonaws.com
  - `OPENSEARCH_SIGNING_ENABLED`=false (local) | true (Amazon OpenSearch Service)
- Bedrock (nếu sử dụng Bedrock private endpoint):
  - `BEDROCK_ENDPOINT`=https://bedrock-runtime.region.amazonaws.com
  - `BEDROCK_MODEL_ID`=model-id

**Cấu hình AWS (ngắn gọn)**

- IAM: tạo policy cho quyền `translate:TranslateText`, `es:ESHttp*` (với OpenSearch), và các quyền Bedrock nếu cần.
- Production: sử dụng IAM Role (ECS/EC2/Lambda) thay vì lưu access keys.
- Khi sử dụng Amazon OpenSearch Service với SigV4 signing, set `OPENSEARCH_SIGNING_ENABLED=true` và đảm bảo `aws-java-sdk-core`/signing lib có trên classpath hoặc dùng runtime role.

**Chạy local bằng Maven**

1. Mở PowerShell trong root repo `D:\AWS-FCJ\leaf-shop` hoặc vào `backend`.

```powershell
# Thiết lập Java cho session nếu cần
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path += ";$env:JAVA_HOME\bin"

# Chạy dịch vụ (profile prod):
mvn -f .\backend\pom.xml -Dspring.profiles.active=prod spring-boot:run
```

Lưu ý: trong lúc khởi động, nếu ứng dụng cần DynamoDB local và bạn chưa bật, sẽ có lỗi kết nối — không phải lỗi nghiêm trọng nếu môi trường production dùng DynamoDB AWS.

**Chạy local với Docker Compose**

File: `backend/docker-compose.yml` đã cấu hình sẵn 2 service: `opensearch` và `leaf-shop-backend`.

Từ thư mục `backend`:

```powershell
cd backend
docker compose up --build
```

Lưu ý và mẹo:

- Nếu `opensearch` container bị kill (exit 137): mở Docker Desktop → Settings → Resources → tăng RAM (4GB+).
- Nếu muốn chỉ chạy backend container (kết nối tới một OpenSearch hosted), set `OPENSEARCH_ENDPOINT` để trỏ tới domain AWS và `OPENSEARCH_SIGNING_ENABLED=true`.

**Kiểm tra & test**

- Chạy unit test nhanh:

```powershell
mvn -f .\backend\pom.xml test
```

- Kiểm tra endpoint local OpenSearch:

```powershell
curl http://localhost:9200
```

**Tài nguyên cho production (gợi ý)**

- Secrets: sử dụng AWS Secrets Manager hoặc Parameter Store cho `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` nếu không sử dụng role.
- OpenSearch: khuyến nghị sử dụng Amazon OpenSearch Service với access control/CBAC.
- Logging/Monitoring: CloudWatch, X-Ray (tùy nhu cầu).

**Troubleshooting phổ biến**

- OpenSearch exit 137: host OOM — tăng RAM cho Docker.
- Backend exit sau khi OpenSearch crash: đảm bảo OpenSearch reachable hoặc bật cấu hình fail-fast=false nếu muốn chạy chưa có OpenSearch.
- Lỗi SigV4/signing: bật `OPENSEARCH_SIGNING_ENABLED=true` và đảm bảo runtime có credential hoặc signing lib — xem `AwsClientConfig`.
- Lỗi Java/`JAVA_HOME`: thiết lập biến môi trường trước khi chạy.

**Checklist nhanh (copy để gửi cho thành viên mới)**

- [ ] Có access AWS (hoặc creds dev) và confirm `aws sts get-caller-identity` thành công
- [ ] Cài Java 17 + Maven
- [ ] Kiểm tra `mvn -f backend/pom.xml test` — pass
- [ ] Nếu chạy Docker: Docker Desktop bật; RAM >= 4GB
- [ ] Chạy `cd backend; docker compose up --build` — truy cập `http://localhost:8080`

**Links & file liên quan**

- `backend/RUNBACKEND.md` — lệnh nhanh (đã có)
- `backend/docker-compose.yml` — cấu hình local OpenSearch + backend
- `src/main/resources/application-prod.properties` — cấu hình prod placeholders
- `src/main/java/com/leafshop/aws/AwsClientConfig.java` — cách tạo clients và SigV4 signing handling

---

Nếu bạn muốn, tôi có thể:

- tạo các script PowerShell tự động (start/stop/test), hoặc
- thêm mục hướng dẫn CI (GitHub Actions) để chạy test và build image.
