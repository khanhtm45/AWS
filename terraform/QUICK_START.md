# Quick Start Guide - Deploy Leaf Shop với Terraform

Hướng dẫn nhanh để deploy Leaf Shop lên AWS trong 30 phút.

## Bước 1: Chuẩn bị (5 phút)

### 1.1. Cài đặt công cụ

```powershell
# Terraform
winget install Hashicorp.Terraform

# AWS CLI
winget install Amazon.AWSCLI

# Docker Desktop
winget install Docker.DockerDesktop
```

### 1.2. Cấu hình AWS

```powershell
# Cấu hình AWS credentials
aws configure
# Nhập: Access Key, Secret Key, Region (ap-southeast-1), Output format (json)

# Verify
aws sts get-caller-identity
```

## Bước 2: Chuẩn bị Terraform State (3 phút)

```powershell
# Tạo S3 bucket cho Terraform state
aws s3 mb s3://leaf-shop-terraform-state --region ap-southeast-1

# Enable versioning
aws s3api put-bucket-versioning `
  --bucket leaf-shop-terraform-state `
  --versioning-configuration Status=Enabled

# Tạo DynamoDB table cho state locking
aws dynamodb create-table `
  --table-name terraform-state-lock `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region ap-southeast-1
```

## Bước 3: Cấu hình Terraform (5 phút)

```powershell
cd terraform

# Copy và edit terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars

# Cập nhật các giá trị:
# - aws_account_id: Lấy từ aws sts get-caller-identity
# - jwt_secret: Tạo random string mạnh
# - vnpay_*, momo_*: Credentials từ providers (hoặc để sandbox values)
```

## Bước 4: Package Lambda Function (2 phút)

```powershell
cd ../frontend

# Tạo zip file cho Lambda
Compress-Archive -Path lambda_function.py -DestinationPath lambda_function.zip -Force

cd ../terraform
```

## Bước 5: Deploy Infrastructure (10 phút)

```powershell
# Initialize Terraform
terraform init

# Validate
terraform validate

# Plan (xem trước changes)
terraform plan

# Apply (deploy!)
terraform apply
# Nhập 'yes' để confirm
```

⏳ **Chờ 8-10 phút để Terraform tạo tất cả resources...**

## Bước 6: Build và Deploy Backend (5 phút)

```powershell
# Get ECR repository URL
$ECR_REPO = terraform output -raw ecr_repository_url
$AWS_REGION = "ap-southeast-1"

# Build Docker image
cd ../backend
docker build -t leaf-shop-backend:latest .

# Tag và push
docker tag leaf-shop-backend:latest "${ECR_REPO}:latest"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Push image
docker push "${ECR_REPO}:latest"

# Force ECS deployment
cd ../terraform
$CLUSTER_NAME = terraform output -raw ecs_cluster_name
$SERVICE_NAME = terraform output -raw ecs_service_name

aws ecs update-service `
  --cluster $CLUSTER_NAME `
  --service $SERVICE_NAME `
  --force-new-deployment `
  --region $AWS_REGION
```

⏳ **Chờ 3-5 phút để ECS tasks start...**

## Bước 7: Build và Deploy Frontend (5 phút)

```powershell
# Get outputs
$FRONTEND_BUCKET = terraform output -raw frontend_bucket_name
$CF_DISTRIBUTION_ID = terraform output -raw cloudfront_distribution_id
$BACKEND_URL = terraform output -raw backend_url
$CHATBOT_API_URL = terraform output -raw chatbot_api_url

# Build frontend
cd ../frontend

# Create .env.production
@"
REACT_APP_API_URL=$BACKEND_URL
REACT_APP_AWS_API_ENDPOINT=$CHATBOT_API_URL
"@ | Out-File -FilePath .env.production -Encoding utf8

# Build
npm install
npm run build

# Deploy to S3
aws s3 sync build/ s3://$FRONTEND_BUCKET --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation `
  --distribution-id $CF_DISTRIBUTION_ID `
  --paths "/*"
```

## Bước 8: Verify Deployment (2 phút)

```powershell
cd ../terraform

# Get URLs
$BACKEND_URL = terraform output -raw backend_url
$FRONTEND_URL = terraform output -raw frontend_url
$CHATBOT_URL = terraform output -raw chatbot_api_url

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: $BACKEND_URL" -ForegroundColor Cyan
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "Chatbot API: $CHATBOT_URL" -ForegroundColor Cyan
Write-Host ""

# Test backend health
Write-Host "Testing backend health..." -ForegroundColor Yellow
curl "$BACKEND_URL/actuator/health"

# Open frontend
Write-Host ""
Write-Host "Opening frontend..." -ForegroundColor Yellow
Start-Process $FRONTEND_URL
```

## Xong! 🎉

Ứng dụng của bạn đã được deploy lên AWS!

### URLs quan trọng:

- **Frontend**: Từ CloudFront distribution
- **Backend API**: Từ ALB DNS name
- **Chatbot API**: Từ API Gateway

### Bước tiếp theo:

1. **Cấu hình Domain** (optional):

   - Tạo ACM certificate
   - Cập nhật `certificate_arn` và `domain_aliases` trong terraform.tfvars
   - Chạy `terraform apply` lại
   - Cấu hình Route 53 DNS records

2. **Setup Monitoring**:

   - Tạo CloudWatch Dashboard
   - Cấu hình CloudWatch Alarms
   - Setup SNS notifications

3. **Enable CI/CD**:

   - Setup GitHub Actions
   - Automated deployments on push

4. **Security Hardening**:
   - Enable WAF rules
   - Setup GuardDuty
   - Enable CloudTrail
   - Regular security audits

### Troubleshooting:

Nếu gặp lỗi, xem:

- `TERRAFORM_DEPLOYMENT_GUIDE.md` - Hướng dẫn chi tiết
- CloudWatch Logs: `/ecs/leaf-shop-backend`
- ECS Console: Check task status
- ALB Target Groups: Check target health

### Xóa tất cả (cleanup):

```powershell
# Empty S3 buckets
aws s3 rm s3://$FRONTEND_BUCKET --recursive
aws s3 rm s3://leaf-shop-uploads-prod --recursive

# Destroy infrastructure
terraform destroy
# Nhập 'yes' để confirm
```

---

**Thời gian tổng**: ~30 phút
**Chi phí ước tính**: $226-316/tháng (production setup)
