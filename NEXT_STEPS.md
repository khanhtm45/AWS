# 🎯 Next Steps - Hoàn tất Deployment

## ✅ Đã hoàn thành

1. ✅ Terraform infrastructure deployed
2. ✅ Frontend deployed và đang chạy: https://d25xrbd7dv8stn.cloudfront.net
3. ✅ DynamoDB tables đã tạo
4. ✅ ECR repository sẵn sàng
5. ✅ Scripts deployment đã tạo

---

## 🚀 Bước tiếp theo (Theo thứ tự)

### Bước 1: Deploy Backend Docker Image

**Yêu cầu**: Docker Desktop phải đang chạy

```powershell
# Kiểm tra Docker
docker version

# Nếu Docker chưa chạy, start Docker Desktop rồi chạy:
.\deploy-backend.ps1
```

Script này sẽ:

- Build Docker image từ code backend
- Tag image cho ECR
- Login vào ECR
- Push image lên ECR

**Thời gian**: ~5-10 phút

---

### Bước 2: Tạo ECS Service (Chọn 1 trong 2 cách)

#### Cách 1: Sử dụng Terraform (Khuyến nghị)

Tôi đã tạo sẵn module ECS trong `terraform/backend-ecs/`. Bạn cần:

1. Cập nhật `terraform/backend-ecs/variables.tf` với thông tin đúng
2. Chạy:

```powershell
cd terraform/backend-ecs
terraform init
terraform plan
terraform apply
```

#### Cách 2: Tạo thủ công qua AWS Console

1. Vào **ECS Console** → **Clusters** → Create Cluster
2. Chọn **Networking only** (Fargate)
3. Tạo **Task Definition**:
   - Image: `083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest`
   - CPU: 1024 (1 vCPU)
   - Memory: 2048 (2 GB)
   - Port: 8080
   - Environment variables (xem bên dưới)
4. Tạo **Service** từ Task Definition
5. Tạo **Application Load Balancer** (nếu chưa có)

**Environment Variables cần thiết**:

```
SPRING_PROFILES_ACTIVE=prod
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE_USER=leaf-shop-users
DYNAMODB_TABLE_PRODUCT=leaf-shop-products
DYNAMODB_TABLE_ORDER=leaf-shop-orders
DYNAMODB_TABLE_PAYMENT=leaf-shop-payments
```

**Thời gian**: ~15-20 phút

---

### Bước 3: Cập nhật Frontend với Backend URL

Sau khi backend đã chạy, lấy ALB DNS name:

```powershell
# Nếu dùng Terraform
terraform -chdir=terraform/backend-ecs output alb_dns_name

# Hoặc lấy từ AWS Console
```

Cập nhật `frontend/.env.production`:

```
REACT_APP_API_URL=http://your-alb-dns-name.amazonaws.com
REACT_APP_AWS_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod/chat
```

Rebuild và redeploy frontend:

```powershell
.\deploy-frontend.ps1
```

**Thời gian**: ~5 phút

---

### Bước 4: Test Application

1. **Test Frontend**: https://d25xrbd7dv8stn.cloudfront.net
2. **Test Backend API**: http://your-alb-dns-name.amazonaws.com/actuator/health
3. **Test DynamoDB**: Thử tạo user, product qua API

---

### Bước 5: Setup Optional Services (Nếu cần)

#### A. Redis/ElastiCache (Cho OTP caching)

```powershell
# Tạo Redis cluster
aws elasticache create-cache-cluster `
  --cache-cluster-id leaf-shop-redis `
  --cache-node-type cache.t3.micro `
  --engine redis `
  --num-cache-nodes 1 `
  --region ap-southeast-1
```

Sau đó update ECS Task Definition với:

```
REDIS_HOST=your-redis-endpoint
REDIS_PORT=6379
```

#### B. Lambda + API Gateway (Cho AI Chatbot)

1. Package Lambda function:

```powershell
Compress-Archive -Path frontend/lambda_function.py -DestinationPath lambda.zip -Force
```

2. Tạo Lambda function qua Console hoặc CLI
3. Tạo API Gateway
4. Update frontend với API Gateway URL

#### C. SES (Cho Email)

1. Verify email address trong SES Console
2. Request production access (nếu cần gửi nhiều email)
3. Update ECS Task Definition với SES credentials

---

## 📋 Checklist Hoàn chỉnh

### Infrastructure

- [x] Terraform state backend (S3 + DynamoDB)
- [x] ECR repository
- [x] DynamoDB tables
- [x] S3 + CloudFront cho frontend
- [ ] ECS Cluster + Service
- [ ] Application Load Balancer
- [ ] Redis/ElastiCache
- [ ] Lambda + API Gateway
- [ ] SES email service

### Application

- [x] Frontend built
- [x] Frontend deployed
- [ ] Backend Docker image built
- [ ] Backend Docker image pushed to ECR
- [ ] Backend running on ECS
- [ ] Backend accessible via ALB
- [ ] Frontend connected to backend

### Configuration

- [x] Terraform variables configured
- [x] Frontend .env.production created
- [ ] Backend environment variables set
- [ ] Secrets configured (VNPay, MoMo, JWT)
- [ ] Redis endpoint configured
- [ ] SES configured

---

## 🔧 Troubleshooting

### Docker build fails

```powershell
# Check Docker is running
docker version

# Check backend/Dockerfile exists
Test-Path backend/Dockerfile

# Try building manually
docker build -t test backend
```

### ECR push fails

```powershell
# Re-login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend
```

### ECS task fails to start

```powershell
# Check logs
aws logs tail /ecs/leaf-shop-backend --follow

# Check task definition
aws ecs describe-task-definition --task-definition leaf-shop-backend
```

### Frontend không connect được backend

1. Check CORS settings trên backend
2. Verify ALB security group allows traffic
3. Check frontend .env.production có đúng URL không

---

## 💰 Chi phí ước tính

### Hiện tại (Frontend only)

- S3 + CloudFront: ~$5-10/tháng
- DynamoDB: ~$5/tháng
- **Total**: ~$10-15/tháng

### Sau khi deploy full (Backend + Services)

- ECS Fargate (2 tasks): ~$60/tháng
- ALB: ~$25/tháng
- Redis: ~$12/tháng
- Lambda + API Gateway: ~$5/tháng
- **Total**: ~$120-150/tháng

---

## 📞 Cần giúp đỡ?

1. **Terraform issues**: Xem `terraform/TERRAFORM_DEPLOYMENT_GUIDE.md`
2. **Backend issues**: Xem `SYSTEM_ANALYSIS.md`
3. **AWS issues**: Check CloudWatch Logs
4. **General**: Xem `DEPLOYMENT_SUMMARY.md`

---

## 🎉 Khi nào hoàn thành?

Bạn sẽ biết deployment hoàn thành khi:

1. ✅ Frontend accessible: https://d25xrbd7dv8stn.cloudfront.net
2. ✅ Backend API accessible: http://your-alb-dns.amazonaws.com/actuator/health
3. ✅ Frontend có thể call backend API
4. ✅ Có thể tạo user, product, order qua UI
5. ✅ Payment flow hoạt động (VNPay/MoMo)
6. ✅ OTP login hoạt động (nếu có Redis)
7. ✅ Chatbot hoạt động (nếu có Lambda)

---

**Good luck! 🚀**

Nếu cần hỗ trợ thêm, hãy cho tôi biết bước nào bạn đang gặp khó khăn!
