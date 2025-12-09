# Terraform Deployment cho Leaf Shop

Infrastructure as Code để deploy toàn bộ Leaf Shop lên AWS.

## 📋 Tổng quan

Terraform configuration này deploy một kiến trúc production-ready bao gồm:

- ✅ **Backend**: ECS Fargate với Auto Scaling
- ✅ **Frontend**: S3 + CloudFront CDN
- ✅ **Database**: DynamoDB với Point-in-Time Recovery
- ✅ **Cache**: ElastiCache Redis (Multi-AZ)
- ✅ **AI Chatbot**: Lambda + API Gateway + Bedrock
- ✅ **Networking**: VPC với Public/Private/Data subnets
- ✅ **Security**: Security Groups, IAM Roles, Secrets Manager
- ✅ **Monitoring**: CloudWatch Logs, Metrics, Alarms

## 🚀 Quick Start

**Thời gian**: ~30 phút | **Chi phí**: $226-316/tháng

```powershell
# 1. Cài đặt công cụ
winget install Hashicorp.Terraform Amazon.AWSCLI Docker.DockerDesktop

# 2. Cấu hình AWS
aws configure

# 3. Tạo Terraform state backend
aws s3 mb s3://leaf-shop-terraform-state --region ap-southeast-1
aws dynamodb create-table --table-name terraform-state-lock --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST

# 4. Cấu hình variables
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars với thông tin của bạn

# 5. Deploy!
terraform init
terraform apply
```

Xem chi tiết trong [QUICK_START.md](./QUICK_START.md)

## 📚 Tài liệu

- **[QUICK_START.md](./QUICK_START.md)** - Hướng dẫn deploy nhanh trong 30 phút
- **[TERRAFORM_DEPLOYMENT_GUIDE.md](./TERRAFORM_DEPLOYMENT_GUIDE.md)** - Hướng dẫn chi tiết đầy đủ
- **[../SYSTEM_ANALYSIS.md](../SYSTEM_ANALYSIS.md)** - Phân tích hệ thống
- **[../AWS_DEPLOYMENT_GUIDE.md](../AWS_DEPLOYMENT_GUIDE.md)** - Hướng dẫn deploy thủ công

## 🏗️ Kiến trúc

```
Internet
   │
   ├─── CloudFront ──► S3 (Frontend)
   │
   └─── Route 53 ──► ALB ──► ECS Fargate (Backend)
                              │
                              ├─── DynamoDB
                              ├─── Redis
                              ├─── S3 (Uploads)
                              └─── Lambda (Chatbot)
```

## 📁 Cấu trúc thư mục

```
terraform/
├── README.md                          # File này
├── QUICK_START.md                     # Hướng dẫn nhanh
├── TERRAFORM_DEPLOYMENT_GUIDE.md      # Hướng dẫn chi tiết
│
├── main.tf                            # Root module
├── variables.tf                       # Biến chung
├── outputs.tf                         # Outputs
├── provider.tf                        # AWS provider
├── backend.tf                         # Terraform backend
│
├── terraform.tfvars.example           # Template cho variables
├── terraform.tfvars                   # Variables (không commit)
│
├── modules/                           # Terraform modules
│   ├── vpc/                          # VPC, Subnets, NAT Gateway
│   ├── security-groups/              # Security Groups
│   ├── iam/                          # IAM Roles và Policies
│   ├── ecr/                          # Container Registry
│   ├── ecs/                          # ECS Cluster, Service
│   ├── alb/                          # Application Load Balancer
│   ├── dynamodb/                     # DynamoDB Tables
│   ├── elasticache/                  # Redis Cluster
│   ├── s3/                           # S3 Buckets
│   ├── cloudfront/                   # CloudFront Distribution
│   ├── lambda/                       # Lambda Functions
│   └── secrets/                      # Secrets Manager
│
├── backend-ecs/                       # Legacy module (deprecated)
└── frontend-s3/                       # Legacy module (deprecated)
```

## 🔧 Yêu cầu

- **Terraform**: >= 1.0
- **AWS CLI**: >= 2.0
- **Docker**: >= 20.0
- **AWS Account** với quyền Administrator
- **Node.js**: >= 18 (để build frontend)
- **Java**: 17 (để build backend)

## 💰 Chi phí ước tính

### Development/Staging (~$120/tháng)

- ECS Fargate (1 task): $30
- RDS db.t3.micro: $15
- Redis t3.micro: $12
- S3 + CloudFront: $5
- ALB: $20
- NAT Gateway: $35

### Production (~$300/tháng)

- ECS Fargate (2-4 tasks): $60-120
- DynamoDB (on-demand): $20-50
- Redis t3.micro (Multi-AZ): $24
- S3 + CloudFront: $20-30
- ALB: $25
- NAT Gateway (2x): $70
- Lambda + API Gateway: $5-10

## 🔐 Security

- ✅ Private subnets cho ECS tasks
- ✅ Encryption at rest (S3, DynamoDB, Redis)
- ✅ Secrets Manager cho credentials
- ✅ IAM Roles với least privilege
- ✅ Security Groups với specific rules
- ✅ VPC Flow Logs enabled
- ✅ CloudTrail logging

## 📊 Monitoring

- CloudWatch Logs cho tất cả services
- CloudWatch Metrics và Dashboards
- CloudWatch Alarms cho critical metrics
- ECS Container Insights
- X-Ray tracing (optional)

## 🔄 CI/CD

Tích hợp với GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- terraform plan
- terraform apply
- docker build & push
- ecs update-service
- s3 sync & cloudfront invalidate
```

## 🛠️ Các lệnh thường dùng

```powershell
# Initialize
terraform init

# Validate
terraform validate

# Plan
terraform plan

# Apply
terraform apply

# Destroy
terraform destroy

# Format code
terraform fmt -recursive

# Show outputs
terraform output

# Show state
terraform show

# Refresh state
terraform refresh
```

## 📝 Workflow

### 1. Lần đầu deploy

```powershell
terraform init
terraform plan
terraform apply
# Build & push Docker image
# Deploy frontend
```

### 2. Update backend code

```powershell
cd backend
docker build -t backend:v2 .
docker push $ECR_REPO:v2
aws ecs update-service --force-new-deployment
```

### 3. Update frontend

```powershell
cd frontend
npm run build
aws s3 sync build/ s3://$BUCKET
aws cloudfront create-invalidation --paths "/*"
```

### 4. Update infrastructure

```powershell
# Edit terraform files
terraform plan
terraform apply
```

## 🐛 Troubleshooting

### ECS tasks không start

```powershell
aws logs tail /ecs/leaf-shop-backend --follow
aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ID
```

### ALB 502 errors

```powershell
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

### CloudFront 403 errors

```powershell
aws s3api get-bucket-policy --bucket $BUCKET
aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
```

Xem thêm trong [TERRAFORM_DEPLOYMENT_GUIDE.md](./TERRAFORM_DEPLOYMENT_GUIDE.md#10-troubleshooting)

## 🔄 Updates và Maintenance

### Rotate secrets

```powershell
aws secretsmanager update-secret --secret-id leaf-shop/jwt-secret --secret-string "new-value"
aws ecs update-service --force-new-deployment
```

### Backup DynamoDB

```powershell
aws dynamodb create-backup --table-name leaf-shop-users --backup-name backup-$(date +%Y%m%d)
```

### Scale ECS

```powershell
# Update terraform.tfvars
ecs_desired_count = 4
terraform apply
```

## 🗑️ Cleanup

```powershell
# Empty S3 buckets
aws s3 rm s3://$FRONTEND_BUCKET --recursive
aws s3 rm s3://$UPLOADS_BUCKET --recursive

# Destroy infrastructure
terraform destroy

# Cleanup state backend
aws s3 rb s3://leaf-shop-terraform-state --force
aws dynamodb delete-table --table-name terraform-state-lock
```

## 📞 Support

- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem các file .md trong thư mục này
- **AWS Support**: https://console.aws.amazon.com/support/

## 📄 License

MIT License - Xem file LICENSE trong root directory

---

**Version**: 1.0
**Last Updated**: December 8, 2024
**Maintained by**: Leaf Shop DevOps Team
