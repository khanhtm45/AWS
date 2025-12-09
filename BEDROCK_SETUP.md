# AWS Bedrock Setup Guide

## Current Issue

Chatbot đang gặp lỗi: `UnknownOperationException` khi gọi AWS Bedrock API.

## Nguyên nhân

1. IAM user `leaf-shop` chưa có quyền truy cập Bedrock
2. Model Claude 3 chưa được request access trong Bedrock console

## Giải pháp

### Option 1: Enable Bedrock Permissions (Recommended)

**Bước 1: Cấp quyền IAM**

Admin cần chạy lệnh sau để cấp quyền Bedrock cho IAM user:

```bash
aws iam put-user-policy \
  --user-name leaf-shop \
  --policy-name BedrockAccessPolicy \
  --policy-document file://bedrock-policy.json
```

File `bedrock-policy.json` đã được tạo sẵn với nội dung:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel"
      ],
      "Resource": "*"
    }
  ]
}
```

**Bước 2: Request Model Access**

1. Mở Bedrock Console: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
2. Click "Manage model access"
3. Tìm và enable: **Anthropic Claude 3 Sonnet**
4. Click "Save changes"
5. Đợi vài phút để model được activate

**Bước 3: Redeploy Backend**

Sau khi có quyền, backend sẽ tự động hoạt động. Không cần redeploy.

---

### Option 2: Enable Mock Mode (Quick Test)

Nếu chưa có quyền Bedrock, có thể enable mock mode để test:

**Cách 1: Update Task Definition**

Thêm environment variable vào `backend-task-def-v2.7.json`:

```json
{
  "name": "BEDROCK_MOCK",
  "value": "true"
}
```

Sau đó redeploy:

```powershell
.\quick-deploy-backend.ps1
```

**Cách 2: Update application.properties**

Thêm vào `backend/src/main/resources/application.properties`:

```properties
bedrock.mock=true
```

Sau đó rebuild và redeploy backend.

---

## Test Chatbot

Sau khi setup xong, test chatbot tại:

- Frontend: https://d25xrbd7dv8stn.cloudfront.net
- Direct API:

```bash
curl -X POST https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào"}'
```

---

## Troubleshooting

### Lỗi: AccessDeniedException

- Kiểm tra IAM permissions đã được cấp chưa
- Kiểm tra model access đã được enable chưa

### Lỗi: ThrottlingException

- Bedrock có rate limit, đợi vài giây rồi thử lại

### Lỗi: ValidationException

- Kiểm tra model ID đúng chưa: `anthropic.claude-3-sonnet-20240229-v1:0`
- Kiểm tra region: `us-east-1`

---

## Current Configuration

- **Backend IP**: 47.129.186.71:8080
- **API Gateway**: https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod
- **Frontend**: https://d25xrbd7dv8stn.cloudfront.net
- **Bedrock Region**: us-east-1
- **Model**: anthropic.claude-3-sonnet-20240229-v1:0
