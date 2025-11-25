# Hướng dẫn AWS — OpenSearch, Bedrock và Translate (Phiên bản tiếng Việt)

Tài liệu này trình bày các ví dụ về IAM Policy, biến môi trường, và lệnh kiểm thử (local/Docker) để tích hợp Amazon OpenSearch, AWS Bedrock và AWS Translate với backend Java (Spring) trong repository này.

---

## 1) IAM Policy mẫu

- OpenSearch (Amazon OpenSearch Service)

Ví dụ policy tối thiểu cho phép các hành động HTTP lên domain OpenSearch cụ thể:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "es:ESHttpGet",
        "es:ESHttpPost",
        "es:ESHttpPut",
        "es:ESHttpDelete"
      ],
      "Resource": "arn:aws:es:${AWS_REGION}:${AWS_ACCOUNT_ID}:domain/${OPENSEARCH_DOMAIN_NAME}/*"
    }
  ]
}
```

Thay `${AWS_REGION}`, `${AWS_ACCOUNT_ID}`, `${OPENSEARCH_DOMAIN_NAME}` bằng giá trị thực tế của bạn.

- Translate (AWS Translate)

Policy tối thiểu cho phép gọi API dịch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["translate:TranslateText", "translate:TranslateDocument"],
      "Resource": "*"
    }
  ]
}
```

Lưu ý: AWS Translate thường được cấp quyền trên `"Resource": "*"`; nếu cần giới hạn, có thể dùng `Condition` theo region.

- Bedrock (AWS Bedrock)

Policy mẫu để gọi invoke model trên Bedrock:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel", "bedrock:DescribeModel"],
      "Resource": "arn:aws:bedrock:${AWS_REGION}:${AWS_ACCOUNT_ID}:model/*"
    }
  ]
}
```

Nếu ứng dụng cần truy xuất S3 hoặc ghi logs, hãy cấp thêm quyền S3/CloudWatch cho bucket/log group cụ thể.

---

## 2) Biến môi trường (backend sử dụng)

Thiết lập các biến môi trường này trong hệ thống hoặc truyền vào khi chạy Docker. Trong production nên dùng IAM Role.

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-2
OPENSEARCH_ENDPOINT=https://search-domain-abc123.ap-southeast-2.es.amazonaws.com
OPENSEARCH_DOMAIN_NAME=your-domain-name
BEDROCK_ENDPOINT=https://bedrock-runtime-.../models/{modelId}/invoke
BEDROCK_MODEL_ID=your-model-id
```

Ứng dụng đọc `OPENSEARCH_ENDPOINT` thành `opensearch.endpoint` trong `application.properties`.

---

## 3) Chạy OpenSearch local (phát triển)

Bạn có thể khởi chạy OpenSearch local bằng Docker (không cần sign request):

```powershell
docker run -d --name opensearch -p 9200:9200 -e "discovery.type=single-node" opensearchproject/opensearch:2.11.0
```

Index và tìm kiếm mẫu bằng curl:

```powershell
curl -X PUT "http://localhost:9200/test-index/_doc/1" -H "Content-Type: application/json" -d '{"title":"hello","content":"xin chao"}'
curl -X GET "http://localhost:9200/test-index/_search" -H "Content-Type: application/json" -d '{"query":{"match":{"content":"xin"}}}'
```

Nếu dùng Amazon OpenSearch Service (managed), thiết lập `OPENSEARCH_ENDPOINT` và client trong dự án sẽ tự sign request với service name `es`.

---

## 4) Kiểm thử AWS Translate bằng AWS CLI

```powershell
aws translate translate-text --text "hello" --source-language-code en --target-language-code vi --region ap-southeast-2
```

Hoặc gọi trực tiếp `TranslateService.translateText(...)` từ backend Java.

---

## 5) Kiểm thử Bedrock (AWS CLI hoặc Java)

Nếu AWS CLI trên máy của bạn hỗ trợ Bedrock:

```powershell
aws bedrock invoke-model --model-id <MODEL_ID> --input-text "Hello from CLI" --region ap-southeast-2
```

Hoặc gọi `BedrockService.invoke(invokeUrl, jsonPayload)` từ Java. `BedrockService` trong mã nguồn đã dùng SigV4 để sign request.

---

## 6) Chạy backend (local / Docker)

1. Chạy local bằng Maven (PowerShell):

```powershell
mvn -f .\backend\pom.xml -DskipTests spring-boot:run
```

2. Build và chạy Docker image (thư mục `backend` có Dockerfile):

```powershell
docker build -t leaf-shop-backend:local .\backend
docker run -e AWS_ACCESS_KEY_ID=... -e AWS_SECRET_ACCESS_KEY=... -e AWS_REGION=ap-southeast-2 -e OPENSEARCH_ENDPOINT=https://... -p 8080:8080 leaf-shop-backend:local
```

Trong môi trường production nên dùng IAM Role thay vì truyền keys qua env.

---

## 7) Ghi chú & tham khảo

- Dự án hiện kết hợp `AWS SDK v2` (Translate) và `aws-java-sdk-core` v1 để tận dụng `AWSRequestSigningApacheInterceptor` cho OpenSearch và Bedrock. Nếu muốn, có thể chuyển hoàn toàn sang SDK v2 và dùng signer tương ứng.
- Đảm bảo đồng bộ thời gian (NTP) trên server để tránh lỗi signature do lệch giờ.

Nếu bạn muốn, tôi có thể:

- Tạo `docker-compose.yml` mẫu để khởi OpenSearch + backend cho phát triển local
- Viết unit test mẫu cho `TranslateService` và `OpenSearchService`

---

Hãy thay các giá trị placeholder (ARN, tên domain, model id…) bằng giá trị thật trước khi áp dụng policy hoặc chạy trên AWS.
