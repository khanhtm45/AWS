# Hướng dẫn cấp quyền Bedrock cho User/Group

## Bước 1: Tạo IAM Policy cho Bedrock

File policy đã được tạo sẵn: `bedrock-policy.json`

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

## Bước 2: Tạo Managed Policy (Admin chạy)

```bash
aws iam create-policy \
  --policy-name BedrockAccessPolicy \
  --policy-document file://bedrock-policy.json \
  --description "Allow access to AWS Bedrock for AI chatbot"
```

Lưu lại Policy ARN từ output (ví dụ: `arn:aws:iam::083011581293:policy/BedrockAccessPolicy`)

## Bước 3: Attach Policy vào User Group

### Option A: Attach vào User Group (Recommended)

```bash
# Liệt kê các groups
aws iam list-groups

# Attach policy vào group (thay YOUR_GROUP_NAME)
aws iam attach-group-policy \
  --group-name YOUR_GROUP_NAME \
  --policy-arn arn:aws:iam::083011581293:policy/BedrockAccessPolicy
```

### Option B: Attach trực tiếp vào User

```bash
aws iam attach-user-policy \
  --user-name leaf-shop \
  --policy-arn arn:aws:iam::083011581293:policy/BedrockAccessPolicy
```

## Bước 4: Request Model Access trong Bedrock Console

1. Đăng nhập AWS Console với account admin
2. Mở Bedrock Console: https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess
3. Click **"Manage model access"**
4. Tìm và enable các models:
   - ✅ **Anthropic Claude 3 Sonnet** (anthropic.claude-3-sonnet-20240229-v1:0)
   - ✅ Anthropic Claude 3 Haiku (optional)
   - ✅ Anthropic Claude 3.5 Sonnet (optional - newer version)
5. Click **"Save changes"**
6. Đợi vài phút để models được activate (status: Available)

## Bước 5: Verify Permissions

Test xem user đã có quyền chưa:

```bash
# Test list models
aws bedrock list-foundation-models --region us-east-1

# Test invoke model (nếu có quyền sẽ trả về response hoặc lỗi khác, không phải AccessDenied)
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --region us-east-1 \
  output.txt
```

## Bước 6: Disable Mock Mode và Redeploy

Sau khi có quyền, update task definition:

```json
{
  "name": "BEDROCK_MOCK",
  "value": "false"
}
```

Redeploy backend:

```powershell
# Register new task definition
aws ecs register-task-definition --cli-input-json file://backend-task-def-v2.7.json --region ap-southeast-1

# Update service (thay REVISION_NUMBER bằng số revision mới)
aws ecs update-service \
  --cluster leaf-shop-cluster \
  --service leaf-shop-backend-service \
  --task-definition leaf-shop-backend:REVISION_NUMBER \
  --force-new-deployment \
  --region ap-southeast-1
```

## Troubleshooting

### Lỗi: AccessDeniedException

```
User is not authorized to perform: bedrock:InvokeModel
```

**Giải pháp:** Kiểm tra lại policy đã được attach vào user/group chưa

### Lỗi: ValidationException - Model not found

```
The provided model identifier is invalid
```

**Giải pháp:**

- Kiểm tra model ID đúng chưa
- Kiểm tra region (phải là us-east-1)
- Request model access trong Bedrock console

### Lỗi: ResourceNotFoundException

```
Could not resolve the foundation model
```

**Giải pháp:** Model chưa được enable. Vào Bedrock console request access

### Lỗi: ThrottlingException

```
Rate exceeded
```

**Giải pháp:** Bedrock có rate limit, đợi vài giây rồi thử lại

## Current Status

- ✅ Backend deployed với AWS SDK v2.25.0
- ✅ ChatService đã tích hợp Bedrock Claude 3
- ⏳ Mock mode đang ENABLED (chờ quyền Bedrock)
- 📍 Backend IP: 47.129.163.31:8080
- 🌐 API Gateway: https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod

## Test Chatbot

Sau khi setup xong, test chatbot:

```bash
# Test qua API Gateway
curl -X POST https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào, shop có áo gì đẹp không?"}'

# Test trực tiếp backend
curl -X POST http://47.129.163.31:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào"}'
```

Response mong đợi (khi có Bedrock):

```json
{
  "type": "text",
  "text": "Xin chào! Tôi là trợ lý AI của Leaf Shop..."
}
```

## Notes

- Bedrock chỉ available ở một số regions: us-east-1, us-west-2, ap-southeast-1, eu-west-1
- Claude 3 models cần request access trước khi sử dụng
- Free tier: 10,000 input tokens/month, 10,000 output tokens/month
- Pricing: ~$0.003/1K input tokens, ~$0.015/1K output tokens
