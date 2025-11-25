# Hướng Dẫn Tích Hợp ChatBot AI với AWS Bedrock

## 📋 Tổng Quan

Chatbot AI này sử dụng AWS Bedrock để cung cấp khả năng trò chuyện thông minh, tư vấn sản phẩm cho khách hàng.

## 🏗️ Kiến Trúc Hệ Thống

```
Frontend (React) → API Gateway → Lambda Function → AWS Bedrock (Claude/Titan)
```

## 🔧 Bước 1: Chuẩn Bị AWS Account

### 1.1. Kích hoạt AWS Bedrock
1. Đăng nhập vào AWS Console
2. Tìm kiếm "Bedrock" và chọn service
3. Vào phần "Model access" → Request access cho các models:
   - Anthropic Claude 3 (Haiku hoặc Sonnet)
   - Amazon Titan Text (tùy chọn)
4. Đợi AWS approve (thường 5-10 phút)

### 1.2. Kiểm tra Region
- Bedrock chỉ available ở một số regions
- Recommended: **us-east-1** hoặc **us-west-2**

## 🚀 Bước 2: Tạo Lambda Function

### 2.1. Tạo Lambda Function mới
1. Vào AWS Lambda Console
2. Click "Create function"
3. Chọn "Author from scratch"
4. Function name: `chatbot-bedrock-handler`
5. Runtime: **Python 3.11** hoặc **Node.js 18.x**
6. Architecture: x86_64

### 2.2. Code Lambda Function (Python)

```python
import json
import boto3
import os

bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name='us-east-1'  # Đổi theo region của bạn
)

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        context_info = body.get('context', '')
        
        # Tạo prompt cho shop quần áo
        prompt = f"""Bạn là trợ lý AI của một shop quần áo thời trang. 
        
Context về shop: {context_info}

Nhiệm vụ của bạn:
- Tư vấn sản phẩm (áo thun, áo sơ mi, quần short, quần kaki)
- Hướng dẫn chọn size phù hợp
- Tư vấn phối đồ và màu sắc
- Giải đáp về giá cả, giao hàng, đổi trả
- Giọng điệu thân thiện, nhiệt tình

Khách hàng hỏi: {user_message}

Trả lời ngắn gọn, dễ hiểu (tối đa 150 từ):"""

        # Call Bedrock - Claude 3 Haiku
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "temperature": 0.7,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        ai_message = response_body['content'][0]['text']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'response': ai_message,
                'success': True
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'response': 'Xin lỗi, tôi đang gặp sự cố kỹ thuật.',
                'success': False,
                'error': str(e)
            }, ensure_ascii=False)
        }
```

### 2.3. Cấu hình Lambda
1. **Timeout**: Tăng lên 30 giây (Configuration → General)
2. **Memory**: 256 MB là đủ
3. **Environment Variables**:
   ```
   BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
   ```

### 2.4. Thêm IAM Permissions
1. Vào Configuration → Permissions
2. Click vào Role name
3. Add inline policy:

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
            "Resource": "arn:aws:bedrock:*::foundation-model/*"
        }
    ]
}
```

## 🌐 Bước 3: Tạo API Gateway

### 3.1. Tạo REST API
1. Vào API Gateway Console
2. Click "Create API" → "REST API" → "Build"
3. API name: `chatbot-api`
4. Endpoint Type: Regional

### 3.2. Tạo Resource và Method
1. Actions → Create Resource
   - Resource Name: `chat`
   - Resource Path: `/chat`
2. Select `/chat` → Actions → Create Method → `POST`
3. Integration type: Lambda Function
4. Lambda Function: `chatbot-bedrock-handler`
5. Save

### 3.3. Enable CORS
1. Select `/chat` → Actions → Enable CORS
2. Check tất cả methods
3. Enable CORS và confirm

### 3.4. Deploy API
1. Actions → Deploy API
2. Stage name: `prod`
3. Deploy
4. Copy **Invoke URL** (ví dụ: `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

## ⚙️ Bước 4: Cấu Hình Frontend

### 4.1. Tạo file `.env` trong thư mục frontend
```env
REACT_APP_AWS_API_ENDPOINT=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/chat
```

### 4.2. Restart development server
```bash
npm start
```

## 📝 Bước 5: Test Chatbot

### 5.1. Test trực tiếp trên website
1. Mở website (localhost:3000)
2. Click vào icon chat ở góc dưới phải
3. Gửi tin nhắn test:
   - "Cho tôi xem áo thun"
   - "Size M phù hợp với người nào?"
   - "Giá sản phẩm bao nhiêu?"

### 5.2. Test bằng Postman
```
POST https://YOUR-API-ENDPOINT/chat
Content-Type: application/json

{
  "message": "Tôi muốn mua áo thun",
  "context": "Shop quần áo thời trang"
}
```

## 💰 Chi Phí Ước Tính

### AWS Bedrock Pricing (us-east-1)
- **Claude 3 Haiku**: 
  - Input: $0.00025 / 1K tokens
  - Output: $0.00125 / 1K tokens
- **Ước tính**: ~$0.001 per conversation (rất rẻ!)

### Lambda
- Free tier: 1M requests/month
- $0.20 per 1M requests sau đó

### API Gateway
- Free tier: 1M API calls/month
- $3.50 per million sau đó

**Total cho 10,000 conversations/month**: ~$1-2 USD

## 🔒 Bảo Mật

### Rate Limiting
Thêm vào API Gateway:
1. Usage Plans → Create
2. Throttling: 10 requests/second
3. Quota: 1000 requests/day per IP

### API Key (Optional)
```python
# Lambda check API key
api_key = event.get('headers', {}).get('x-api-key')
if api_key != os.environ.get('API_KEY'):
    return {'statusCode': 403, 'body': 'Unauthorized'}
```

## 🎯 Tối Ưu Hóa

### 1. Caching responses phổ biến
```python
# Thêm Redis/DynamoDB cache cho câu hỏi thường gặp
```

### 2. Streaming responses
```python
# Dùng InvokeModelWithResponseStream để response nhanh hơn
```

### 3. Fine-tune prompt
```python
# Thêm examples vào prompt để AI trả lời đúng context hơn
```

## 🐛 Troubleshooting

### Lỗi: "Model access denied"
→ Chưa request access cho model trong Bedrock console

### Lỗi: "CORS error"
→ Enable CORS trong API Gateway và redeploy

### Lỗi: "Task timed out"
→ Tăng Lambda timeout lên 30s

### Bot trả lời không đúng context
→ Cải thiện prompt, thêm examples cụ thể

## 📚 Tài Liệu Tham Khảo

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3 Model Card](https://docs.anthropic.com/claude/docs)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)

## 🎉 Hoàn Thành!

Bây giờ bạn đã có một chatbot AI powered by AWS Bedrock hoàn chỉnh! 🚀


