# Phân Tích Hệ Thống Leaf Shop

## 1. Kiến Trúc Tổng Quan

Hệ thống bao gồm 3 phần chính:

- **Backend**: Spring Boot (Java) với DynamoDB
- **Frontend**: React
- **AWS Services**: Lambda, Bedrock, SES, Translate, S3, ElastiCache (Redis)

---

## 2. Các Module Chính và Luồng Xử Lý

### A. Authentication & Authorization

**Files liên quan:**

- `backend/OTP_LOGIN_REDIS.md`
- `backend/OTP_IMPLEMENTATION_SUMMARY.md`

**Luồng OTP Login:**

```
1. User nhập email → POST /api/auth/send-otp
2. Backend kiểm tra email trong DynamoDB
3. Tạo OTP 6 số → Lưu vào Redis (TTL 5 phút)
4. Gửi email OTP qua AWS SES
5. User nhập OTP → POST /api/auth/verify-otp
6. Backend verify OTP từ Redis
7. Tạo JWT token → Trả về cho client
```

**Functions:**

- `sendOtp(email)`: Tạo và gửi OTP
- `verifyOtp(email, otp)`: Xác thực OTP và tạo JWT
- Redis TTL tự động xóa OTP sau 5 phút

**Security:**

- OTP hết hạn sau 5 phút
- JWT token cho session management
- Email verification bắt buộc

---

### B. Payment Integration

**Files liên quan:**

- `backend/PAYMENT_INTEGRATION.md`
- `backend/PAYMENT_STATUS_HANDLING.md`

**Luồng thanh toán:**

```
0. User PHẢI đăng nhập trước ⚠️
1. User checkout → POST /api/payments/initiate
```

{
"orderId": "ORD-123",
"amount": 100000,
"provider": "VNPAY" | "MOMO"
} 2. Backend tạo payment URL → Redirect user 3. User thanh toán trên VNPay/MoMo 4. Callback về backend:

- Success (code 00) → Status: PAID → Tạo Order ✅
- Cancel (code 24) → Status: CANCELLED → Không tạo Order ❌
- Failed (code 99) → Status: FAILED → Không tạo Order ❌

```

**Services:**
- `VNPayService.java`: Xử lý VNPay API
- `MoMoService.java`: Xử lý MoMo API
- `PaymentServiceImpl.java`: Điều phối payment providers

**Payment Status:**
- `PENDING`: Chờ thanh toán
- `PAID`: Thành công → Tạo order
- `CANCELLED`: User hủy
- `FAILED`: Lỗi thanh toán

**Endpoints:**
- `POST /api/payments/initiate`: Khởi tạo thanh toán
- `GET /api/payments/vnpay/callback`: VNPay callback
- `POST /api/payments/vnpay/ipn`: VNPay IPN webhook
- `GET /api/payments/momo/callback`: MoMo callback
- `POST /api/payments/momo/ipn`: MoMo IPN webhook

**Test Credentials:**

VNPay Sandbox:
- Số thẻ: 9704198526191432198
- Tên: NGUYEN VAN A
- Ngày: 07/15
- OTP: 123456

MoMo Test:
- SĐT: 0963181714
- Pass: 1234

---

### C. AI Chatbot với Product Suggestion

**Files liên quan:**
- `backend/CHATBOT_PRODUCT_SUGGESTION.md`
- `backend/AWS_CHATBOT_SETUP.md`
- `backend/CHATBOT_FRONTEND_INTEGRATION.md`
```

**Kiến trúc:**

```
Frontend (React) → API Gateway → Lambda (Bedrock) → Backend API
```

**Luồng xử lý:**

```
1. User gửi message từ ChatBox (React)
2. Frontend call Lambda function qua API Gateway
3. Lambda sử dụng AWS Bedrock (Claude 3) để:
   - Phân tích intent của user
   - Trích xuất keywords (tên sản phẩm, style, màu sắc)
4. Lambda call Backend API:
   GET /api/public/chatbot/suggest-products?query=...&limit=5
5. Backend tìm kiếm sản phẩm trong DynamoDB/OpenSearch
6. Trả kết quả về Lambda → Format response
7. Frontend hiển thị sản phẩm gợi ý với ảnh, giá, màu, size
```

**Backend Components:**

- `ChatbotController.java`: API endpoint
- `ChatbotService.java`: Logic tìm kiếm sản phẩm
- `ProductSuggestionRequest.java`: Request DTO
- `ProductSuggestionResponse.java`: Response DTO

**Lambda Environment Variables:**

```
AWS_REGION = us-east-1
BEDROCK_MODEL_ID = anthropic.claude-3-haiku-20240307-v1:0
BACKEND_API_URL = https://your-backend.render.com
```

**Test Cases:**

- "Tìm áo thun" → Hiển thị áo thun
- "Có đồ trẻ trung không?" → Sản phẩm style trẻ trung
- "Tìm đồ cá tính" → Sản phẩm unique, bold
- "Có áo màu đen không?" → Áo màu đen
- "Quần short trẻ trung" → Kết hợp tìm kiếm

**Chế độ Demo:**

- Chatbot có thể chạy demo mode không cần AWS
- Câu trả lời được lập trình sẵn
- Để kích hoạt AWS Bedrock: cấu hình Lambda + API Gateway

---

### D. Translation Service

**Files liên quan:**

- `backend/TRANSLATION_GUIDE.md`
- `backend/TRANSLATE_SETUP.md`

**Luồng dịch:**

```
1. Frontend detect ngôn ngữ user (vi/en/zh)
2. Component sử dụng hook: useTranslation(text)
3. Check cache → Nếu có return ngay
4. Call Backend: POST /api/translate
   {
     "text": "Xin chào",
     "sourceLanguage": "vi",
     "targetLanguage": "en"
   }
5. Backend call AWS Translate API
6. Cache kết quả trong memory
7. Return translated text
```

**React Hooks:**

- `useTranslation(text)`: Dịch một text
- `useTranslatedTexts([text1, text2])`: Dịch nhiều texts
- `LanguageContext`: Quản lý ngôn ngữ và cache

**Performance Optimization:**

- Auto cache trong LanguageContext
- Nhóm translations với `useTranslatedTexts()`
- Tránh translate trong render loop
- Cache lưu trong memory (Map)

**Environment Variables:**

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_TRANSLATE_REGION=ap-southeast-1
```

**Testing:**

```bash
# Test backend
curl -X GET http://localhost:8080/api/translate/health

# Test translation
curl -X POST http://localhost:8080/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Xin chào","sourceLanguage":"vi","targetLanguage":"en"}'
```

---

### E. Email Service (OTP, Notifications)

**Files liên quan:**

- `backend/SES_SETUP.md`

**Setup AWS SES:**

```
1. Tạo IAM policy với quyền ses:SendEmail, ses:SendRawEmail
2. Verify email/domain trong SES Console
3. Cấu hình DKIM, SPF cho domain
4. Request production access (thoát sandbox mode)
5. Setup SNS cho bounce/complaint notifications
```

**IAM Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
      "Resource": "*"
    }
  ]
}
```

**Functions:**

- `AwsSesEmailService.sendOtpEmail(email, otp)`: Gửi OTP
- Template HTML đẹp cho email
- Handle bounce/complaint qua SNS

**DNS Configuration:**

- SPF: `v=spf1 include:amazonses.com ~all`
- DKIM: CNAME records từ AWS
- Mail-from domain (optional)

**Production Checklist:**

- [ ] Verify domain hoặc from-address
- [ ] Request production access
- [ ] Setup DKIM + SPF
- [ ] Configure SNS notifications
- [ ] IAM Role/User với policy phù hợp

---

### F. File Upload (S3)

**Files liên quan:**

- `backend/AWS_DEPLOYMENT_GUIDE.md` (section 6.2)

**Setup S3:**

```powershell
# Tạo bucket
$UPLOAD_BUCKET = "leaf-shop-uploads"
aws s3 mb s3://$UPLOAD_BUCKET --region $AWS_REGION

# CORS configuration
$CORS_CONFIG = @"
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://leafshop.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
"@

$CORS_CONFIG | Out-File -FilePath cors.json -Encoding utf8
aws s3api put-bucket-cors --bucket $UPLOAD_BUCKET --cors-configuration file://cors.json
```

**Use Cases:**

- Upload ảnh sản phẩm
- Upload avatar user
- Static assets

---

### G. Cache Layer (Redis/ElastiCache)

**Files liên quan:**

- `backend/OTP_LOGIN_REDIS.md`
- `backend/AWS_DEPLOYMENT_GUIDE.md` (section 6.1)

**Setup ElastiCache:**

```powershell
aws elasticache create-cache-cluster \
  --cache-cluster-id leaf-shop-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name leaf-shop-cache-subnet \
  --security-group-ids sg-redis-xxx \
  --region $AWS_REGION
```

**Use Cases:**

- OTP storage với TTL
- Session management
- API response caching
- Rate limiting

**Redis Keys:**

- `OTP:<email>`: Lưu OTP với TTL 5 phút
- Auto expire khi hết thời gian

---

## 3. AWS Services Configuration

### IAM Policies

**Files liên quan:**

- `backend/AWS_SETUP.md`
- `backend/AWS_ACTIONS.md`

**OpenSearch Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["es:*"],
      "Resource": "arn:aws:es:region:account-id:domain/leaf-shop/*"
    }
  ]
}
```

**Translate Policy:**

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

**Bedrock Policy:**

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

**Tạo IAM User/Role:**

```powershell
# Tạo policy
aws iam create-policy --policy-name LeafShopOpenSearchPolicy --policy-document file://opensearch-policy.json

# Tạo user cho local development
aws iam create-user --user-name leafshop-local-dev

# Tạo access key
aws iam create-access-key --user-name leafshop-local-dev

# Gán policy cho user
aws iam attach-user-policy --user-name leafshop-local-dev --policy-arn arn:aws:iam::account-id:policy/LeafShopOpenSearchPolicy
```

**Production:** Sử dụng IAM Role thay vì Access Key

---

## 4. Local Development Setup

**Files liên quan:**

- `backend/RUNBACKEND.md`
- `backend/DEV_RUN_GUIDE.md`
- `backend/CHATBOT_FRONTEND_INTEGRATION.md`

### Chạy Backend

**Option 1: Maven**

```powershell
# Set JAVA_HOME
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path += ";$env:JAVA_HOME\bin"

# Set environment variables
$env:OPENSEARCH_ENDPOINT = 'http://localhost:9200'
$env:OPENSEARCH_SIGNING_ENABLED = 'false'

# Run backend
mvn -f .\backend\pom.xml -Dspring.profiles.active=prod spring-boot:run
```

**Option 2: Docker Compose**

```powershell
cd backend
docker compose up --build
```

**Services:**

- Backend: http://localhost:8080
- OpenSearch: http://localhost:9200
- MailHog (email testing): http://localhost:8025

**Docker Compose includes:**

- OpenSearch container
- Backend container
- MailHog (optional)

**Troubleshooting:**

- OpenSearch exit 137: Tăng RAM cho Docker (4GB+)
- JAVA_HOME error: Set environment variable
- Dependency error: `mvn -U clean package`

---

### Chạy Frontend

```powershell
cd frontend
npm install
npm start
```

**Frontend runs on:** http://localhost:3000

**Environment Variables (.env):**

```env
REACT_APP_AWS_API_ENDPOINT=https://your-api.execute-api.us-east-1.amazonaws.com/prod/chat
REACT_APP_BACKEND_URL=http://localhost:8080
```

---

### Test Chatbot Integration

```powershell
# 1. Start backend
cd backend
docker compose up -d opensearch mailhog
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:OPENSEARCH_ENDPOINT = 'http://localhost:9200'
$env:OPENSEARCH_SIGNING_ENABLED = 'false'
mvn spring-boot:run

# 2. Start frontend
cd frontend
npm start

# 3. Test chatbot
# Mở http://localhost:3000
# Click icon chat ở góc dưới phải
# Test: "Tìm áo thun", "Có đồ trẻ trung không?"
```

---

## 5. Security Best Practices

**Files liên quan:**

- `backend/PAYMENT_INTEGRATION.md`

### General Security

⚠️ **QUAN TRỌNG:**

- **KHÔNG** commit credentials vào git
- Sử dụng environment variables cho production
- Validate tất cả callbacks từ provider
- Verify signature của mọi webhook
- Log tất cả transactions để audit
- Implement rate limiting
- Use HTTPS only in production

### Payment Security

- Validate payment callbacks
- Verify signature từ VNPay/MoMo
- Check transaction status trước khi tạo order
- Log tất cả payment events
- Implement timeout handling
- Add transaction reconciliation

### AWS Security

- Sử dụng IAM Role trong production
- Principle of least privilege
- Enable CloudTrail logging
- Rotate access keys định kỳ
- Enable MFA cho IAM users
- Use VPC endpoints cho private services

### Application Security

- JWT token expiration
- OTP TTL (5 phút)
- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens
- Rate limiting cho APIs

---

## 6. Troubleshooting Common Issues

### Payment Issues

**Files liên quan:** `backend/PAYMENT_INTEGRATION.md`

**Lỗi "paymentUrl is null":**

- Kiểm tra logs backend
- Đảm bảo credentials được config đúng
- Kiểm tra kết nối internet (call API provider)

**Lỗi signature không hợp lệ:**

- Kiểm tra lại `hashSecret` / `secretKey`
- Đảm bảo không có khoảng trắng thừa
- Đảm bảo encoding UTF-8

**Callback không nhận được:**

- Đảm bảo server public và có domain/IP
- Cấu hình `notifyUrl` đúng
- Kiểm tra firewall/security group

**Frontend không redirect:**

- Kiểm tra console browser
- Đảm bảo `paymentUrl` được trả về
- Kiểm tra CORS configuration

---

### AWS Services Issues

**Files liên quan:** `backend/AWS_ACTIONS.md`

**OpenSearch signature error:**

- Kiểm tra `AWS_REGION` đúng
- Kiểm tra `OPENSEARCH_SIGNING_ENABLED=true`
- Verify IAM policy có quyền
- Đảm bảo đồng bộ thời gian (NTP)

**Bedrock không trả lời:**

- Kiểm tra account đã được cấp quyền Bedrock
- Verify model access đã được approve
- Kiểm tra request được sign bằng SigV4
- Check region có support Bedrock

**Translation không hoạt động:**

- Kiểm tra AWS credentials đã setup đúng
- Kiểm tra IAM policy có quyền translate
- Kiểm tra backend logs xem có error
- Kiểm tra console browser có error network

**SES email không gửi được:**

- Verify email/domain trong SES Console
- Check sandbox mode (chỉ gửi được cho verified emails)
- Request production access
- Kiểm tra IAM policy
- Check bounce/complaint rate

---

### Backend Issues

**Files liên quan:** `backend/RUNBACKEND.md`, `backend/DEV_RUN_GUIDE.md`

**JAVA_HOME not defined:**

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path += ";$env:JAVA_HOME\bin"
```

**Dependency error:**

```powershell
mvn -f .\backend\pom.xml -U clean package
```

**OpenSearch container exit 137:**

- Tăng RAM cho Docker Desktop (WSL2)
- Settings → Resources → Memory: 4GB+

**401 khi login-staff:**

- Kiểm tra `username` chính xác
- Kiểm tra `password` đã hash với BCrypt
- Kiểm tra `roleId` = `ADMIN|MANAGER|STAFF`

**403 khi tải resource static:**

- Đảm bảo file tồn trong `frontend/public`
- Backend cho phép các đường dẫn tĩnh

---

## 7. Production Deployment Checklist

### Payment System

**Files liên quan:** `backend/PAYMENT_INTEGRATION.md`

- [ ] Thay đổi từ sandbox sang production URLs
- [ ] Cập nhật production credentials
- [ ] Đảm bảo HTTPS cho tất cả endpoints
- [ ] Cấu hình domain cho returnUrl và notifyUrl
- [ ] Enable logging và monitoring
- [ ] Test với số tiền thật (nhỏ)
- [ ] Implement retry mechanism cho IPN
- [ ] Implement payment timeout handling
- [ ] Add transaction reconciliation

---

### Email Service (SES)

**Files liên quan:** `backend/SES_SETUP.md`

- [ ] Verify domain hoặc from-address
- [ ] Request production access và được approved
- [ ] Setup DKIM + SPF cho domain
- [ ] Configure SNS notifications cho bounce/complaint
- [ ] IAM Role/User với policy phù hợp
- [ ] Test email deliverability
- [ ] Monitor bounce/complaint rates

---

### AWS Infrastructure

**Files liên quan:** `backend/AWS_DEPLOYMENT_GUIDE.md`

**ElastiCache (Redis):**

- [ ] Tạo cache cluster
- [ ] Configure security groups
- [ ] Setup subnet groups
- [ ] Ghi nhớ Primary Endpoint

**S3:**

- [ ] Tạo bucket cho uploads
- [ ] Configure CORS
- [ ] Setup bucket policy
- [ ] Enable versioning (optional)
- [ ] Configure lifecycle rules

**Lambda:**

- [ ] Deploy Lambda function
- [ ] Configure environment variables
- [ ] Setup API Gateway
- [ ] Configure IAM role
- [ ] Test integration

**DynamoDB:**

- [ ] Tạo tables
- [ ] Configure indexes
- [ ] Setup IAM policies
- [ ] Enable point-in-time recovery
- [ ] Configure auto-scaling

---

### Security

- [ ] Rotate all credentials
- [ ] Enable CloudTrail logging
- [ ] Setup CloudWatch alarms
- [ ] Configure WAF rules
- [ ] Enable VPC endpoints
- [ ] Review IAM policies
- [ ] Enable MFA cho critical accounts
- [ ] Setup backup strategy

---

### Monitoring & Logging

- [ ] CloudWatch Logs cho backend
- [ ] CloudWatch Metrics
- [ ] Setup alarms cho errors
- [ ] Monitor payment transactions
- [ ] Track API usage
- [ ] Monitor Lambda performance
- [ ] Setup SNS notifications

---

## 8. API Endpoints Summary

### Public Endpoints (No Auth Required)

**Chatbot:**

- `GET /api/public/chatbot/suggest-products?query=...&limit=5`
- `POST /api/public/chatbot/suggest-products`

**Translation:**

- `GET /api/translate/health`
- `POST /api/translate`

---

### Authentication Endpoints

**OTP Login:**

- `POST /api/auth/send-otp` - Gửi OTP qua email
- `POST /api/auth/verify-otp` - Xác thực OTP và tạo JWT

**Staff Login:**

- `POST /api/auth/login-staff` - Login cho admin/manager/staff

---

### Payment Endpoints

**Initiate Payment:**

- `POST /api/payments/initiate`

**VNPay:**

- `GET /api/payments/vnpay/callback` - User redirect callback
- `POST /api/payments/vnpay/ipn` - Server-to-server notification

**MoMo:**

- `GET /api/payments/momo/callback` - User redirect callback
- `POST /api/payments/momo/ipn` - Server-to-server notification

---

### Protected Endpoints (Require JWT)

**Orders:**

- `GET /api/orders` - Lấy danh sách orders
- `GET /api/orders/{id}` - Chi tiết order
- `POST /api/orders` - Tạo order mới

**Products:**

- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/{id}` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Admin)
- `PUT /api/products/{id}` - Update sản phẩm (Admin)
- `DELETE /api/products/{id}` - Xóa sản phẩm (Admin)

**User Profile:**

- `GET /api/users/profile` - Thông tin user
- `PUT /api/users/profile` - Update profile

---

## 9. Database Schema (DynamoDB)

### UserTable

**Partition Key:** `email` (String)

**Attributes:**

- `email`: String (PK)
- `userId`: String
- `fullName`: String
- `phoneNumber`: String
- `address`: String
- `roleId`: String (USER | ADMIN | MANAGER | STAFF)
- `createdAt`: String (ISO timestamp)
- `updatedAt`: String (ISO timestamp)

---

### ProductTable

**Partition Key:** `productId` (String)

**Attributes:**

- `productId`: String (PK)
- `name`: String
- `description`: String
- `price`: Number
- `category`: String
- `colors`: List<String>
- `sizes`: List<String>
- `style`: String (trẻ trung, thanh lịch, cá tính, thể thao)
- `imageUrl`: String
- `stock`: Number
- `createdAt`: String
- `updatedAt`: String

**GSI (Global Secondary Index):**

- `category-index`: category (PK)
- `style-index`: style (PK)

---

### OrderTable

**Partition Key:** `orderId` (String)

**Attributes:**

- `orderId`: String (PK)
- `userId`: String
- `email`: String
- `items`: List<OrderItem>
  - `productId`: String
  - `productName`: String
  - `quantity`: Number
  - `price`: Number
  - `color`: String
  - `size`: String
- `totalAmount`: Number
- `paymentStatus`: String (PENDING | PAID | CANCELLED | FAILED)
- `paymentMethod`: String (VNPAY | MOMO | COD)
- `shippingAddress`: String
- `createdAt`: String
- `updatedAt`: String

**GSI:**

- `userId-index`: userId (PK), createdAt (SK)
- `paymentStatus-index`: paymentStatus (PK)

**Business Rule:**

- Order chỉ được tạo khi `paymentStatus = PAID`
- PENDING/CANCELLED/FAILED không tạo order

---

### PaymentTable

**Partition Key:** `paymentId` (String)

**Attributes:**

- `paymentId`: String (PK)
- `orderId`: String
- `userId`: String
- `amount`: Number
- `currency`: String (VND)
- `provider`: String (VNPAY | MOMO)
- `status`: String (PENDING | PAID | CANCELLED | FAILED)
- `transactionId`: String (từ provider)
- `paymentUrl`: String
- `returnUrl`: String
- `notifyUrl`: String
- `createdAt`: String
- `updatedAt`: String

**GSI:**

- `orderId-index`: orderId (PK)
- `transactionId-index`: transactionId (PK)

---

### StaffTable

**Partition Key:** `username` (String)

**Attributes:**

- `username`: String (PK)
- `password`: String (BCrypt hashed)
- `fullName`: String
- `email`: String
- `roleId`: String (ADMIN | MANAGER | STAFF)
- `createdAt`: String
- `updatedAt`: String

---

## 10. Environment Variables

### Backend (Spring Boot)

**AWS Credentials:**

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
```

**DynamoDB:**

```env
DYNAMODB_TABLE_USER=UserTable
DYNAMODB_TABLE_PRODUCT=ProductTable
DYNAMODB_TABLE_ORDER=OrderTable
DYNAMODB_TABLE_PAYMENT=PaymentTable
DYNAMODB_TABLE_STAFF=StaffTable
```

**OpenSearch:**

```env
OPENSEARCH_ENDPOINT=https://your-opensearch-domain.region.es.amazonaws.com
OPENSEARCH_SIGNING_ENABLED=true
```

**Redis:**

```env
REDIS_HOST=leaf-shop-redis.cache.amazonaws.com
REDIS_PORT=6379
```

**Email (SES):**

```env
SES_FROM_EMAIL=noreply@leafshop.com
SES_REGION=ap-southeast-1
```

**Payment (VNPay):**

```env
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/payment-return
```

**Payment (MoMo):**

```env
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_ENDPOINT=https://test-payment.momo.vn
MOMO_RETURN_URL=http://localhost:3000/payment-return
```

**JWT:**

```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000
```

---

### Frontend (React)

**API Endpoints:**

```env
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_AWS_API_ENDPOINT=https://your-api.execute-api.us-east-1.amazonaws.com/prod/chat
```

---

### Lambda Function

**Environment Variables:**

```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
BACKEND_API_URL=https://your-backend.render.com
```

---

## 11. Testing Strategy

### Unit Testing

**Backend:**

- Service layer tests
- Controller tests với MockMvc
- Repository tests với DynamoDB Local
- Mock AWS services

**Frontend:**

- Component tests với Jest
- React Testing Library
- Mock API calls

---

### Integration Testing

**Payment Flow:**

1. Test VNPay sandbox với test card
2. Test MoMo sandbox với test account
3. Verify callback handling
4. Verify IPN webhook
5. Check order creation logic

**Chatbot:**

1. Test Lambda function locally
2. Test API Gateway integration
3. Test Bedrock model responses
4. Test backend product search
5. Test frontend display

**OTP Login:**

1. Test OTP generation
2. Test Redis TTL
3. Test email sending (MailHog)
4. Test OTP verification
5. Test JWT token creation

---

### Load Testing

**Tools:**

- Apache JMeter
- Artillery
- k6

**Scenarios:**

- Concurrent users checkout
- Payment callback handling
- Chatbot requests
- Translation API calls

---

## 12. CI/CD Pipeline (Suggested)

### GitHub Actions Workflow

**Backend:**

```yaml
- Build with Maven
- Run unit tests
- Build Docker image
- Push to ECR
- Deploy to ECS/EC2
```

**Frontend:**

```yaml
- Install dependencies
- Run tests
- Build production bundle
- Deploy to S3 + CloudFront
```

**Lambda:**

```yaml
- Package function
- Run tests
- Deploy to Lambda
- Update API Gateway
```

---

## 13. Performance Optimization

### Backend

- Connection pooling cho DynamoDB
- Redis caching cho frequent queries
- Async processing cho emails
- Batch operations cho bulk updates
- OpenSearch cho full-text search

### Frontend

- Code splitting
- Lazy loading components
- Image optimization
- CDN cho static assets
- Service Worker caching

### AWS

- CloudFront CDN
- ElastiCache Redis
- DynamoDB auto-scaling
- Lambda provisioned concurrency
- API Gateway caching

---

## 14. Cost Optimization

### AWS Services Cost Breakdown

**DynamoDB:**

- On-demand pricing cho unpredictable traffic
- Provisioned capacity cho stable workload
- Use DAX cho caching (nếu cần)

**Lambda:**

- Optimize memory allocation
- Reduce cold starts với provisioned concurrency
- Monitor invocation count

**S3:**

- Lifecycle policies cho old files
- Intelligent-Tiering storage class
- CloudFront để giảm data transfer

**ElastiCache:**

- Right-size instance type
- Use reserved instances cho production

**SES:**

- Free tier: 62,000 emails/month (từ EC2)
- $0.10 per 1,000 emails sau đó

---

## 15. Monitoring & Alerting

### CloudWatch Metrics

**Backend:**

- API response time
- Error rate
- Request count
- Database query latency

**Lambda:**

- Invocation count
- Duration
- Error count
- Throttles

**Payment:**

- Transaction success rate
- Failed payments
- Callback latency

### CloudWatch Alarms

- High error rate (> 5%)
- Slow response time (> 2s)
- Failed payment rate (> 10%)
- Lambda throttling
- DynamoDB throttling

### CloudWatch Logs

- Application logs
- Access logs
- Error logs
- Audit logs

---

## 16. Disaster Recovery

### Backup Strategy

**DynamoDB:**

- Point-in-time recovery (PITR)
- On-demand backups
- Cross-region replication (optional)

**S3:**

- Versioning enabled
- Cross-region replication
- Lifecycle policies

**Redis:**

- Automatic snapshots
- Multi-AZ deployment

### Recovery Procedures

1. Database restore từ backup
2. Application rollback
3. DNS failover
4. Load balancer health checks

---

## 17. Documentation References

### Setup Guides

- `AWS_SETUP.md` - AWS services configuration
- `AWS_ACTIONS.md` - Step-by-step AWS CLI commands
- `AWS_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `AWS_LAMBDA_BEDROCK_SETUP.md` - Lambda + Bedrock setup
- `AWS_CHATBOT_SETUP.md` - Chatbot integration

### Feature Guides

- `OTP_LOGIN_REDIS.md` - OTP authentication system
- `PAYMENT_INTEGRATION.md` - VNPay + MoMo integration
- `PAYMENT_STATUS_HANDLING.md` - Payment flow logic
- `CHATBOT_PRODUCT_SUGGESTION.md` - AI product suggestions
- `TRANSLATION_GUIDE.md` - Multi-language support

### Development Guides

- `RUNBACKEND.md` - Local backend setup
- `DEV_RUN_GUIDE.md` - Development workflow
- `TEAM_SETUP.md` - Team onboarding
- `CHATBOT_FRONTEND_INTEGRATION.md` - Frontend testing

### Email & Communication

- `SES_SETUP.md` - AWS SES configuration
- `STRIPE_SETUP.md` - Stripe integration (alternative)

---

## 18. Future Enhancements

### Planned Features

1. **Advanced Search:**

   - Elasticsearch/OpenSearch full-text search
   - Faceted search
   - Search suggestions

2. **Recommendation Engine:**

   - Collaborative filtering
   - Content-based recommendations
   - AWS Personalize integration

3. **Analytics:**

   - User behavior tracking
   - Sales analytics dashboard
   - Inventory management

4. **Mobile App:**

   - React Native
   - Push notifications
   - Mobile payment integration

5. **Social Features:**

   - Product reviews
   - Ratings
   - Social sharing

6. **Advanced AI:**
   - Visual search (upload ảnh tìm sản phẩm)
   - Size recommendation AI
   - Virtual try-on

---

## 19. Support & Resources

### AWS Documentation

- AWS Bedrock: https://docs.aws.amazon.com/bedrock/
- AWS Translate: https://docs.aws.amazon.com/translate/
- AWS SES: https://docs.aws.amazon.com/ses/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/
- Lambda: https://docs.aws.amazon.com/lambda/

### Payment Providers

- VNPay Sandbox: https://sandbox.vnpayment.vn/
- VNPay API Docs: https://sandbox.vnpayment.vn/apis/
- MoMo Developer: https://developers.momo.vn/

### Contact

- Email support: support@leafshop.com
- Slack/Teams: Tag team members
- GitHub Issues: Create issue trong repo

---

## 20. Conclusion

Hệ thống Leaf Shop là một e-commerce platform hiện đại với:

✅ **Authentication:** OTP-based login với Redis caching
✅ **Payment:** VNPay + MoMo integration với proper status handling
✅ **AI Chatbot:** AWS Bedrock cho product suggestions
✅ **Translation:** Multi-language support với AWS Translate
✅ **Email:** AWS SES cho OTP và notifications
✅ **Storage:** S3 cho file uploads
✅ **Cache:** Redis/ElastiCache cho performance
✅ **Search:** OpenSearch cho advanced search

**Tech Stack:**

- Backend: Spring Boot (Java 17)
- Frontend: React
- Database: DynamoDB
- Cache: Redis/ElastiCache
- AI: AWS Bedrock (Claude 3)
- Email: AWS SES
- Storage: S3
- Search: OpenSearch

**Deployment:**

- Backend: Docker + ECS/EC2
- Frontend: S3 + CloudFront
- Lambda: Serverless chatbot
- Infrastructure: AWS

Hệ thống được thiết kế để scale, secure, và maintainable với comprehensive documentation và best practices.

---

**Last Updated:** December 8, 2025
**Version:** 1.0
**Author:** Leaf Shop Development Team
