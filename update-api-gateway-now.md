# Update API Gateway - Backend IP mới

## Backend IP mới với Claude 3.5 Sonnet AI

**IP: 18.143.67.96:8080**

## Cách 1: Update qua AWS Console (Recommended)

### Bước 1: Mở API Gateway Console

https://ap-southeast-1.console.aws.amazon.com/apigateway/main/apis/e00ymjj1i8/resources

### Bước 2: Update Integration

1. Click vào resource **/{proxy+}**
2. Click vào method **ANY**
3. Click **"Integration Request"**
4. Click **"Edit"**
5. Đổi **Endpoint URL** thành:
   ```
   http://18.143.67.96:8080/{proxy}
   ```
6. Click **"Save"**

### Bước 3: Deploy API

1. Click **"Actions"** dropdown
2. Select **"Deploy API"**
3. Deployment stage: **prod**
4. Click **"Deploy"**

### Bước 4: Test

```bash
curl https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào"}'
```

---

## Cách 2: Update qua CLI (Nếu có quyền)

```bash
# Get integration ID
aws apigatewayv2 get-integrations \
  --api-id e00ymjj1i8 \
  --region ap-southeast-1

# Update integration (thay INTEGRATION_ID)
aws apigatewayv2 update-integration \
  --api-id e00ymjj1i8 \
  --integration-id INTEGRATION_ID \
  --integration-uri http://18.143.67.96:8080/{proxy} \
  --region ap-southeast-1

# Deploy
aws apigatewayv2 create-deployment \
  --api-id e00ymjj1i8 \
  --stage-name prod \
  --region ap-southeast-1
```

---

## Current Status

✅ **Backend:** Running with Claude 3.5 Sonnet AI

- IP: 18.143.67.96:8080
- Model: anthropic.claude-3-5-sonnet-20240620-v1:0
- Status: ACTIVE

✅ **Frontend:** Deployed on CloudFront

- URL: https://d25xrbd7dv8stn.cloudfront.net
- Chatbot endpoint: /api/chat

⏳ **API Gateway:** Cần update endpoint

- Current: Trỏ đến IP cũ
- New: http://18.143.67.96:8080/{proxy}

---

## Test Chatbot sau khi update

### Test qua API Gateway

```bash
curl -X POST https://e00ymjj1i8.execute-api.ap-southeast-1.amazonaws.com/prod/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Shop có áo sơ mi nữ không?"}'
```

### Test trực tiếp backend

```bash
curl -X POST http://18.143.67.96:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào"}'
```

### Test trên Frontend

1. Mở: https://d25xrbd7dv8stn.cloudfront.net
2. Click icon chat ở góc dưới bên phải
3. Gửi tin nhắn: "Xin chào, shop có áo gì đẹp không?"
4. Chatbot sẽ trả lời bằng Claude 3.5 Sonnet AI! 🤖

---

## Notes

- Backend IP có thể thay đổi khi redeploy ECS
- Nên dùng Application Load Balancer để có fixed endpoint
- Hoặc dùng Route53 với health check
- Claude 3.5 Sonnet: ~$3/1M input tokens, ~$15/1M output tokens
