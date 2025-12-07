# Hướng Dẫn Cấu Hình AWS Lambda và Bedrock cho Chatbot

## 📋 Yêu Cầu Trước Khi Bắt Đầu

- ✅ AWS Account đã kích hoạt
- ✅ AWS CLI đã cài đặt
- ✅ Backend API đã deploy và có URL public
- ✅ Quyền truy cập AWS Bedrock (cần request nếu chưa có)

## 🎯 Tổng Quan Kiến Trúc

```
User → Frontend ChatBox → API Gateway → Lambda → Bedrock (Claude AI)
                              ↓
                      Backend API (Product Suggestions)
```

---

## Bước 1: Request Quyền Truy Cập AWS Bedrock

### 1.1. Vào AWS Console

1. Đăng nhập AWS Console
2. Tìm service **"Bedrock"**
3. Chọn region: **us-east-1** (hoặc region hỗ trợ)

### 1.2. Request Model Access

1. Sidebar → **Model access**
2. Click **Manage model access**
3. Chọn models cần dùng:
   - ✅ **Claude 3 Haiku** (nhanh, rẻ - recommended)
   - ✅ **Claude 3.5 Sonnet** (thông minh hơn, đắt hơn)
4. Click **Request model access**
5. Đợi 5-10 phút để được duyệt

### 1.3. Kiểm Tra Access

```bash
aws bedrock list-foundation-models --region us-east-1
```

Tìm model có `modelId`: `anthropic.claude-3-haiku-20240307-v1:0`

---

## Bước 2: Tạo IAM Role cho Lambda

### 2.1. Vào IAM Console

1. AWS Console → **IAM**
2. Sidebar → **Roles**
3. Click **Create role**

### 2.2. Cấu Hình Role

- **Trusted entity type**: AWS service
- **Use case**: Lambda
- Click **Next**

### 2.3. Thêm Permissions

Attach các policies sau:

1. **AWSLambdaBasicExecutionRole** (built-in)

   - Cho phép Lambda write logs

2. **Tạo inline policy mới** cho Bedrock:
   - Click **Add permissions** → **Create inline policy**
   - Chọn **JSON** tab
   - Paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"
      ]
    }
  ]
}
```

- Policy name: `BedrockInvokePolicy`
- Click **Create policy**

### 2.4. Đặt Tên và Tạo Role

- **Role name**: `LeafShopChatbotLambdaRole`
- Click **Create role**

---

## Bước 3: Tạo Lambda Function

### 3.1. Vào Lambda Console

1. AWS Console → **Lambda**
2. Click **Create function**

### 3.2. Cấu Hình Function

- **Function name**: `LeafShopChatbot`
- **Runtime**: Python 3.12
- **Architecture**: x86_64
- **Permissions**: Use existing role → Chọn `LeafShopChatbotLambdaRole`
- Click **Create function**

### 3.3. Upload Code

#### Option 1: Upload ZIP (Recommended)

**Tạo deployment package:**

```powershell
# Trong thư mục frontend
cd frontend

# Tạo thư mục deploy
New-Item -ItemType Directory -Force -Path lambda-deploy
cd lambda-deploy

# Copy lambda function
Copy-Item ..\lambda_function.py .

# Install dependencies
pip install urllib3 -t .

# Zip all files
Compress-Archive -Path * -DestinationPath lambda-deploy.zip
```

**Upload lên Lambda:**

1. Trong Lambda Console → **Code** tab
2. Click **Upload from** → **.zip file**
3. Chọn file `lambda-deploy.zip`
4. Click **Save**

#### Option 2: Copy/Paste Code

1. Click vào file `lambda_function.py` trong Code editor
2. Copy toàn bộ code từ `frontend/lambda_function.py`
3. Paste vào editor
4. Click **Deploy**

### 3.4. Cấu Hình Environment Variables

1. Vào tab **Configuration** → **Environment variables**
2. Click **Edit**
3. Thêm các biến:

```
AWS_REGION = us-east-1
BEDROCK_MODEL_ID = anthropic.claude-3-haiku-20240307-v1:0
BACKEND_API_URL = https://your-backend.render.com
```

**⚠️ Quan trọng:**

- `BACKEND_API_URL`: URL public của backend (không có `/` cuối)
- Ví dụ: `https://leaf-shop-backend.onrender.com`

4. Click **Save**

### 3.5. Cấu Hình Timeout và Memory

1. Tab **Configuration** → **General configuration**
2. Click **Edit**
3. Set:
   - **Memory**: 256 MB (đủ)
   - **Timeout**: 30 seconds
4. Click **Save**

---

## Bước 4: Tạo API Gateway

### 4.1. Vào API Gateway Console

1. AWS Console → **API Gateway**
2. Click **Create API**
3. Chọn **REST API** (không phải REST API Private)
4. Click **Build**

### 4.2. Cấu Hình API

- **API name**: `LeafShopChatbotAPI`
- **Description**: Chatbot API for Leaf Shop
- **Endpoint Type**: Regional
- Click **Create API**

### 4.3. Tạo Resource và Method

#### Tạo Resource:

1. Click **Actions** → **Create Resource**
2. **Resource Name**: `chat`
3. **Resource Path**: `/chat`
4. ✅ Check **Enable API Gateway CORS**
5. Click **Create Resource**

#### Tạo POST Method:

1. Chọn resource `/chat`
2. Click **Actions** → **Create Method**
3. Chọn **POST** → Click ✓
4. Cấu hình:
   - **Integration type**: Lambda Function
   - **Use Lambda Proxy integration**: ✅ Check
   - **Lambda Region**: us-east-1
   - **Lambda Function**: LeafShopChatbot
5. Click **Save**
6. Click **OK** để grant permissions

#### Tạo OPTIONS Method (CORS):

1. Chọn resource `/chat`
2. Click **Actions** → **Create Method**
3. Chọn **OPTIONS** → Click ✓
4. Cấu hình:
   - **Integration type**: Mock
5. Click **Save**

### 4.4. Cấu Hình CORS

1. Chọn **POST** method → **Method Response**
2. Expand **200** → **Response Headers**
3. Add headers:

   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Methods`

4. Click **Actions** → **Enable CORS**
5. Giữ defaults → Click **Enable CORS and replace existing CORS headers**

### 4.5. Deploy API

1. Click **Actions** → **Deploy API**
2. **Deployment stage**: [New Stage]
3. **Stage name**: `prod`
4. Click **Deploy**

### 4.6. Lấy API URL

- Copy **Invoke URL**: `https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`
- API endpoint đầy đủ: `https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/chat`

---

## Bước 5: Cấu Hình Frontend

### 5.1. Set Environment Variable

Tạo/edit file `.env` trong thư mục `frontend`:

```env
REACT_APP_AWS_API_ENDPOINT=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/chat
```

### 5.2. Rebuild Frontend

```powershell
cd frontend
npm run build
```

### 5.3. Deploy Frontend

- **Netlify**: Deploy thư mục `build/`
- **Vercel**: Deploy project
- **S3 + CloudFront**: Upload `build/` lên S3

---

## Bước 6: Test Toàn Bộ Hệ Thống

### 6.1. Test Lambda Trực Tiếp

Trong Lambda Console → **Test** tab:

**Test event:**

```json
{
  "httpMethod": "POST",
  "body": "{\"message\": \"Tìm áo thun trẻ trung\"}"
}
```

Click **Test** → Kiểm tra response

### 6.2. Test API Gateway

```bash
curl -X POST https://your-api-gateway-url/prod/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tìm áo thun trẻ trung"}'
```

### 6.3. Test Frontend

1. Mở website
2. Click chat icon
3. Nhập: "Tìm áo trẻ trung"
4. Kiểm tra:
   - ✅ Bot response với gợi ý sản phẩm
   - ✅ Hiển thị product cards
   - ✅ Có ảnh, giá, màu, size

---

## 🔧 Troubleshooting

### Lỗi 1: "AccessDeniedException" khi invoke Bedrock

**Nguyên nhân**: Lambda role chưa có quyền

**Giải pháp**:

1. Vào IAM → Role `LeafShopChatbotLambdaRole`
2. Kiểm tra inline policy `BedrockInvokePolicy`
3. Verify ARN model đúng region

### Lỗi 2: "Unable to import module 'lambda_function'"

**Nguyên nhân**: Thiếu dependencies hoặc code structure sai

**Giải pháp**:

1. Verify file name là `lambda_function.py`
2. Handler phải là `lambda_function.lambda_handler`
3. Re-upload ZIP với dependencies

### Lỗi 3: CORS error trong browser

**Nguyên nhân**: API Gateway CORS chưa cấu hình đúng

**Giải pháp**:

1. Enable CORS cho resource `/chat`
2. Verify OPTIONS method returns:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
}
```

### Lỗi 4: Lambda timeout

**Nguyên nhân**: Backend API slow hoặc Bedrock slow

**Giải pháp**:

1. Tăng timeout lên 30 seconds
2. Optimize backend API
3. Check network connectivity

### Lỗi 5: Không gọi được Backend API

**Nguyên nhân**: `BACKEND_API_URL` sai hoặc CORS

**Giải pháp**:

1. Verify `BACKEND_API_URL` trong Lambda env vars
2. Test backend endpoint:

```bash
curl https://your-backend.com/api/public/chatbot/suggest-products \
  -H "Content-Type: application/json" \
  -d '{"query": "áo thun", "limit": 5}'
```

3. Ensure backend allows CORS from Lambda

---

## 💰 Chi Phí Ước Tính

### AWS Bedrock (Claude 3 Haiku)

- **Input**: $0.25 / 1M tokens
- **Output**: $1.25 / 1M tokens
- **Ước tính**: ~$0.001 per conversation (10 messages)

### AWS Lambda

- **Free tier**: 1M requests/month + 400,000 GB-seconds
- **After free tier**: $0.20 / 1M requests
- **Ước tính**: FREE cho 1M requests đầu

### API Gateway

- **Free tier**: 1M requests/month (12 tháng đầu)
- **After free tier**: $3.50 / 1M requests
- **Ước tính**: ~$0 - $10/month

**Tổng cho 10,000 conversations/month: ~$10-20**

---

## 🚀 Tối Ưu Hóa

### 1. Sử dụng Lambda Provisioned Concurrency

- Giảm cold start
- Tăng chi phí nhưng response nhanh hơn

### 2. Cache Products trong Lambda

- Store popular products in memory
- Reduce backend API calls

### 3. Use CloudWatch Logs Insights

- Monitor performance
- Track errors
- Optimize based on metrics

### 4. Add Rate Limiting

- Prevent abuse
- Use API Gateway Usage Plans

---

## 📊 Monitoring và Logs

### CloudWatch Logs

1. AWS Console → **CloudWatch** → **Logs** → **Log groups**
2. Tìm `/aws/lambda/LeafShopChatbot`
3. Xem logs real-time

### Metrics quan trọng:

- **Invocations**: Số lần gọi Lambda
- **Duration**: Thời gian xử lý
- **Errors**: Số lỗi
- **Throttles**: Số lần bị throttle

### Set up Alarms:

1. CloudWatch → **Alarms** → **Create alarm**
2. Chọn metric: Lambda Errors
3. Condition: > 10 errors in 5 minutes
4. Action: Send SNS notification

---

## 📝 Checklist Hoàn Thành

- [ ] Request Bedrock model access (Claude 3 Haiku)
- [ ] Tạo IAM role với Bedrock permissions
- [ ] Tạo Lambda function
- [ ] Upload code và dependencies
- [ ] Set environment variables (AWS_REGION, BEDROCK_MODEL_ID, BACKEND_API_URL)
- [ ] Tạo API Gateway REST API
- [ ] Cấu hình CORS
- [ ] Deploy API Gateway
- [ ] Update frontend `.env` với API Gateway URL
- [ ] Test Lambda function
- [ ] Test API Gateway endpoint
- [ ] Test frontend chatbot
- [ ] Monitor CloudWatch logs

---

## 🎓 Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Lambda Python Documentation](https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/)

---

**Ngày tạo:** December 7, 2025  
**Version:** 1.0  
**Author:** Leaf Shop Development Team
