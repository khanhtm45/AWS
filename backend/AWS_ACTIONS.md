# AWS Checklist & Hướng Dẫn Thực Thi

File này tóm tắt các bước cần làm để cấu hình AWS cho OpenSearch, Bedrock và Translate, kèm lệnh PowerShell / AWS CLI để thực hiện và kiểm tra.

Lưu ý: Thực hiện các lệnh AWS CLI yêu cầu bạn đã cài `aws` và đã cấu hình credentials hoặc đang sử dụng IAM role.

---

## 1) Tạo IAM policy và user/role

- Mục tiêu: tạo policy riêng cho OpenSearch / Translate / Bedrock, sau đó tạo IAM Role (production) hoặc IAM User (local dev).

Ví dụ tạo policy file `opensearch-policy.json` (copy nội dung mẫu từ `AWS_SETUP.md`) và tạo policy + user:

```powershell
# Tạo policy
aws iam create-policy --policy-name LeafShopOpenSearchPolicy --policy-document file://opensearch-policy.json

# Tạo user cho local development (nếu cần)
aws iam create-user --user-name leafshop-local-dev
# Tạo access key cho user (lưu cẩn thận)
aws iam create-access-key --user-name leafshop-local-dev

# Gán policy cho user
aws iam attach-user-policy --user-name leafshop-local-dev --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/LeafShopOpenSearchPolicy
```

Ghi chú:

- Với production, tạo IAM Role và attach policy vào role (ví dụ: cho ECS task role hoặc EC2 instance profile).
- Tạo thêm policy cho Translate (`translate:TranslateText`) và Bedrock (`bedrock:InvokeModel`) theo file `AWS_SETUP.md`.

---

## 2) Provision OpenSearch domain

- Tạo domain trong AWS Console (Amazon OpenSearch Service) hoặc bằng IaC.
- Kiểm tra domain có sẵn:

```powershell
aws opensearch list-domain-names --region ap-southeast-2
aws opensearch describe-domain --domain-name <YOUR_DOMAIN_NAME> --region ap-southeast-2
```

- Lấy HTTPS endpoint từ kết quả `describe-domain` và đặt vào biến môi trường `OPENSEARCH_ENDPOINT`.

---

## 3) Yêu cầu / kiểm tra Bedrock access

- Bedrock có thể cần opt-in hoặc yêu cầu quyền truy cập từ AWS. Kiểm tra Console → Bedrock.
- Nếu đã có, ghi lại `BEDROCK_MODEL_ID` và `BEDROCK_ENDPOINT`.

---

## 4) Kiểm tra AWS Translate

- Test quyền và API bằng CLI:

```powershell
aws translate translate-text --text "hello" --source-language-code en --target-language-code vi --region ap-southeast-2
```

Nếu trả về kết quả dịch nghĩa là credential có quyền `translate:TranslateText`.

---

## 5) Đặt biến môi trường & kiểm tra kết nối

- Tạm thiết lập cho session PowerShell:

```powershell
$env:AWS_ACCESS_KEY_ID="AKIAXXX..."
$env:AWS_SECRET_ACCESS_KEY="abc/ABC/123..."
$env:AWS_REGION="ap-southeast-2"
$env:OPENSEARCH_ENDPOINT="https://search-domain-abc123.ap-southeast-2.es.amazonaws.com"
$env:OPENSEARCH_SIGNING_ENABLED="true"
```

- Kiểm tra identity (nên trả về Account/Arn):

```powershell
aws sts get-caller-identity
```

- Kiểm tra OpenSearch (nếu domain public hoặc mạng cho phép):

```powershell
curl -v "https://search-domain-abc123.ap-southeast-2.es.amazonaws.com/_cluster/health"
```

Nếu bạn chạy local OpenSearch (Docker), dùng `OPENSEARCH_ENDPOINT=http://localhost:9200` và tắt signing (`OPENSEARCH_SIGNING_ENABLED=false`).

---

## 6) Chạy backend / test ứng dụng

- Chạy local bằng Docker Compose (đã thêm `backend/docker-compose.yml`):

```powershell
cd backend
docker compose up --build
```

- Hoặc chạy Maven trực tiếp (local dev):

```powershell
# Thiết lập JAVA_HOME nếu cần
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path += ";$env:JAVA_HOME\bin"

mvn -f .\backend\pom.xml -DskipTests spring-boot:run
```

- Chạy unit tests:

```powershell
mvn -f .\backend\pom.xml test
```

---

## 7) Tự động hóa (tuỳ chọn)

- Nếu muốn, bạn có thể tạo CloudFormation hoặc Terraform templates để tự động tạo:
  - IAM policies + roles
  - OpenSearch domain
  - Các resource S3/CloudWatch cần thiết

Ví dụ (ý tưởng): viết `cloudformation/open-search.yml` tạo domain + IAM role.

---

## 8) Kiểm tra thường gặp & Troubleshooting

- Nếu request tới OpenSearch bị từ chối vì signature: kiểm tra `AWS_REGION`, `OPENSEARCH_SIGNING_ENABLED=true`, và IAM policy.
- Nếu Bedrock không trả lời: kiểm tra rằng account đã được cấp quyền truy cập Bedrock và request được sign bằng SigV4.
- Đảm bảo hệ thống đồng bộ thời gian (NTP) để tránh lỗi SigV4.

---

Nếu bạn muốn, tôi có thể tiếp tục và:

- Sinh script PowerShell tự động tạo IAM user + policy dùng AWS CLI.
- Viết CloudFormation mẫu để tạo IAM policy + OpenSearch domain.
