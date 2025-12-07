# Hướng dẫn Deploy Leaf Shop lên AWS

Tài liệu này hướng dẫn chi tiết cách deploy toàn bộ ứng dụng Leaf Shop (Backend + Frontend) lên AWS.

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Yêu cầu trước khi bắt đầu](#2-yêu-cầu-trước-khi-bắt-đầu)
3. [Deploy Backend (Spring Boot)](#3-deploy-backend-spring-boot)
4. [Deploy Frontend (React)](#4-deploy-frontend-react)
5. [Cấu hình Database](#5-cấu-hình-database)
6. [Cấu hình các dịch vụ AWS](#6-cấu-hình-các-dịch-vụ-aws)
7. [Security và Networking](#7-security-và-networking)
8. [Monitoring và Logging](#8-monitoring-và-logging)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Tổng quan kiến trúc

### Kiến trúc đề xuất

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└──────────────┬─────────────────────┬────────────────────────┘
               │                     │
        ┌──────▼──────┐       ┌─────▼──────┐
        │ CloudFront  │       │   Route 53 │
        │   + WAF     │       │    (DNS)   │
        └──────┬──────┘       └─────┬──────┘
               │                    │
        ┌──────▼──────┐       ┌─────▼──────────┐
        │     S3      │       │  ALB (Public)  │
        │  (Frontend) │       └─────┬──────────┘
        └─────────────┘             │
                              ┌─────▼─────────┐
                              │  ECS/Fargate  │
                              │   (Backend)   │
                              └─────┬─────────┘
                     ┌────────┬─────┴────┬──────────┐
                     │        │          │          │
              ┌──────▼─┐ ┌───▼────┐ ┌──▼────┐ ┌──▼──────┐
              │ RDS    │ │ Redis  │ │  S3   │ │OpenSearch│
              │(MySQL) │ │(Cache) │ │(Files)│ │  (Index) │
              └────────┘ └────────┘ └───────┘ └──────────┘
```

### Các dịch vụ AWS sử dụng

- **Frontend**: S3 + CloudFront
- **Backend**: ECS Fargate hoặc Elastic Beanstalk
- **Database**: RDS (MySQL/PostgreSQL) hoặc DynamoDB
- **Cache**: ElastiCache (Redis)
- **File Storage**: S3
- **Email**: SES
- **AI/ML**: Bedrock (Chatbot)
- **Translation**: AWS Translate
- **Search**: OpenSearch Service
- **Monitoring**: CloudWatch
- **DNS**: Route 53
- **Security**: WAF, Security Groups

---

## 2. Yêu cầu trước khi bắt đầu

### 2.1. Cài đặt công cụ cần thiết

```powershell
# AWS CLI
winget install Amazon.AWSCLI

# Docker Desktop
winget install Docker.DockerDesktop

# Node.js (cho frontend)
winget install OpenJS.NodeJS.LTS

# Java 17 (cho backend)
winget install EclipseAdoptium.Temurin.17.JDK

# Maven
winget install Apache.Maven
```

### 2.2. Cấu hình AWS CLI

```powershell
# Cấu hình credentials
aws configure

# Nhập thông tin:
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: ap-southeast-1 (hoặc region bạn chọn)
# Default output format: json
```

### 2.3. Tạo IAM User cho deployment

Tạo IAM User với các policies:

- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonECS_FullAccess`
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`
- `AmazonRDSFullAccess`
- `ElastiCacheFullAccess`
- `AWSLambdaFullAccess` (nếu dùng Lambda)

---

## 3. Deploy Backend (Spring Boot)

### Phương án 1: Deploy với ECS Fargate (Khuyến nghị)

#### 3.1. Build và Push Docker Image

```powershell
# Di chuyển vào thư mục backend
cd backend

# Login vào ECR
$AWS_REGION = "ap-southeast-1"
$AWS_ACCOUNT_ID = "123456789012"  # Thay bằng AWS Account ID của bạn

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Tạo ECR repository (chỉ cần chạy 1 lần)
aws ecr create-repository --repository-name leaf-shop-backend --region $AWS_REGION

# Build Docker image
docker build -t leaf-shop-backend:latest .

# Tag image
docker tag leaf-shop-backend:latest "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/leaf-shop-backend:latest"

# Push image lên ECR
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/leaf-shop-backend:latest"
```

#### 3.2. Tạo ECS Cluster

```powershell
# Tạo ECS Cluster
aws ecs create-cluster --cluster-name leaf-shop-cluster --region $AWS_REGION

# Hoặc sử dụng AWS Console:
# ECS Console > Clusters > Create Cluster > Networking only (Fargate)
```

#### 3.3. Tạo Task Definition

Tạo file `backend-task-definition.json`:

```json
{
  "family": "leaf-shop-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "leaf-shop-backend",
      "image": "123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "prod"
        },
        {
          "name": "AWS_REGION",
          "value": "ap-southeast-1"
        }
      ],
      "secrets": [
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:leaf-shop/db-host"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:leaf-shop/db-password"
        },
        {
          "name": "REDIS_HOST",
          "valueFrom": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:leaf-shop/redis-host"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/leaf-shop-backend",
          "awslogs-region": "ap-southeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Đăng ký Task Definition:

```powershell
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json --region $AWS_REGION
```

#### 3.4. Tạo Application Load Balancer (ALB)

```powershell
# Tạo ALB (thông qua Console hoặc CLI)
# ALB sẽ route traffic từ internet vào ECS tasks

# Ghi nhớ ALB DNS name để cấu hình frontend sau
```

#### 3.5. Tạo ECS Service

```powershell
# Tạo service với ALB
aws ecs create-service \
  --cluster leaf-shop-cluster \
  --service-name leaf-shop-backend-service \
  --task-definition leaf-shop-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-southeast-1:123456789012:targetgroup/leaf-shop-backend-tg,containerName=leaf-shop-backend,containerPort=8080" \
  --region $AWS_REGION
```

### Phương án 2: Deploy với Elastic Beanstalk

#### 3.6. Chuẩn bị package

```powershell
# Build JAR file
cd backend
mvn clean package -DskipTests

# JAR file sẽ được tạo tại: target/leaf-shop-0.0.1-SNAPSHOT.jar
```

#### 3.7. Tạo Elastic Beanstalk Environment

```powershell
# Khởi tạo EB application
eb init -p "Corretto 17" leaf-shop-backend --region $AWS_REGION

# Tạo environment
eb create leaf-shop-prod \
  --instance-type t3.medium \
  --envvars SPRING_PROFILES_ACTIVE=prod,AWS_REGION=$AWS_REGION

# Deploy
eb deploy
```

### Phương án 3: Deploy với EC2 (Truyền thống)

#### 3.8. Launch EC2 Instance

```powershell
# Launch EC2 instance (t3.medium hoặc lớn hơn)
# Security Group: Allow port 8080, 22 (SSH)

# SSH vào instance và cài đặt
ssh -i your-key.pem ec2-user@your-instance-ip

# Trên EC2 instance:
sudo yum update -y
sudo yum install -y java-17-amazon-corretto
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# Copy JAR file hoặc clone repo
# Chạy application
java -jar leaf-shop-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## 4. Deploy Frontend (React)

### 4.1. Build Frontend

```powershell
cd frontend

# Cấu hình API endpoint
# Tạo file .env.production
@"
REACT_APP_API_URL=https://api.leafshop.com
REACT_APP_WS_URL=wss://api.leafshop.com/ws
"@ | Out-File -FilePath .env.production -Encoding utf8

# Install dependencies
npm install

# Build production
npm run build
```

### 4.2. Tạo S3 Bucket

```powershell
$BUCKET_NAME = "leaf-shop-frontend"
$AWS_REGION = "ap-southeast-1"

# Tạo S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Cấu hình static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload build files
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Cấu hình bucket policy (public read)
$BUCKET_POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
"@

$BUCKET_POLICY | Out-File -FilePath bucket-policy.json -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
```

### 4.3. Cấu hình CloudFront (CDN)

```powershell
# Tạo CloudFront distribution (qua Console hoặc CLI)

# Tạo file cloudfront-config.json
$CF_CONFIG = @"
{
  "CallerReference": "leaf-shop-$(Get-Date -Format 'yyyyMMddHHmmss')",
  "Comment": "Leaf Shop Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-leaf-shop-frontend",
        "DomainName": "$BUCKET_NAME.s3.$AWS_REGION.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-leaf-shop-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
"@

# Tạo distribution (khuyến nghị dùng Console cho dễ)
```

---

## 5. Cấu hình Database

### Phương án 1: Amazon RDS (Khuyến nghị cho production)

#### 5.1. Tạo RDS Instance

```powershell
# Tạo DB Subnet Group
aws rds create-db-subnet-group \
  --db-subnet-group-name leaf-shop-db-subnet \
  --db-subnet-group-description "Leaf Shop DB Subnet" \
  --subnet-ids subnet-xxx subnet-yyy \
  --region $AWS_REGION

# Tạo Security Group cho RDS
aws ec2 create-security-group \
  --group-name leaf-shop-rds-sg \
  --description "Security group for Leaf Shop RDS" \
  --vpc-id vpc-xxx \
  --region $AWS_REGION

# Allow inbound từ backend security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-xxx \
  --protocol tcp \
  --port 3306 \
  --source-group sg-backend-xxx \
  --region $AWS_REGION

# Tạo RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier leaf-shop-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-subnet-group-name leaf-shop-db-subnet \
  --vpc-security-group-ids sg-rds-xxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false \
  --region $AWS_REGION
```

#### 5.2. Cấu hình Database Schema

```powershell
# Kết nối vào RDS (từ EC2 instance hoặc local với VPN)
mysql -h leaf-shop-db.xxx.ap-southeast-1.rds.amazonaws.com -u admin -p

# Tạo database
CREATE DATABASE leafshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import schema (nếu có file SQL)
mysql -h leaf-shop-db.xxx.ap-southeast-1.rds.amazonaws.com -u admin -p leafshop < schema.sql
```

### Phương án 2: DynamoDB (NoSQL)

Nếu dùng DynamoDB, xem file `backend/AWS_SETUP.md` để cấu hình tables và IAM policies.

---

## 6. Cấu hình các dịch vụ AWS

### 6.1. ElastiCache (Redis)

```powershell
# Tạo Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id leaf-shop-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name leaf-shop-cache-subnet \
  --security-group-ids sg-redis-xxx \
  --region $AWS_REGION

# Ghi nhớ Primary Endpoint để cấu hình backend
```

### 6.2. S3 (File Storage)

```powershell
# Tạo bucket cho file uploads
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

### 6.3. SES (Email Service)

```powershell
# Verify email address
aws ses verify-email-identity --email-address no-reply@leafshop.com --region $AWS_REGION

# Verify domain (khuyến nghị cho production)
aws ses verify-domain-identity --domain leafshop.com --region $AWS_REGION

# Request production access (thoát sandbox mode)
# Làm qua AWS Console: SES > Account dashboard > Request production access
```

### 6.4. OpenSearch Service

```powershell
# Tạo OpenSearch domain (qua Console hoặc CLI)
# Domain name: leaf-shop-search
# Instance type: t3.small.search
# Number of nodes: 2
# Storage: 10GB EBS per node
# Access policy: Allow từ backend security group
```

### 6.5. AWS Bedrock (AI Chatbot)

Xem chi tiết trong `backend/AWS_LAMBDA_BEDROCK_SETUP.md` để cấu hình Lambda function và Bedrock model.

### 6.6. AWS Translate

```powershell
# Tạo IAM policy cho Translate
aws iam create-policy \
  --policy-name LeafShopTranslatePolicy \
  --policy-document file://backend/translate-policy.json

# Attach policy vào ECS Task Role hoặc EC2 Instance Role
aws iam attach-role-policy \
  --role-name ecsTaskRole \
  --policy-arn arn:aws:iam::123456789012:policy/LeafShopTranslatePolicy
```

---

## 7. Security và Networking

### 7.1. VPC Configuration

```
┌─────────────────────────────────────────────────┐
│                    VPC                          │
│                10.0.0.0/16                      │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Public Subnet A │  │  Public Subnet B │   │
│  │   10.0.1.0/24    │  │   10.0.2.0/24    │   │
│  │   (ALB, NAT GW)  │  │   (ALB, NAT GW)  │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Private Subnet A │  │ Private Subnet B │   │
│  │   10.0.11.0/24   │  │   10.0.12.0/24   │   │
│  │  (ECS, Lambda)   │  │  (ECS, Lambda)   │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │   Data Subnet A  │  │   Data Subnet B  │   │
│  │   10.0.21.0/24   │  │   10.0.22.0/24   │   │
│  │ (RDS, Redis, OS) │  │ (RDS, Redis, OS) │   │
│  └──────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 7.2. Security Groups

**ALB Security Group:**

- Inbound: 443 (HTTPS) from 0.0.0.0/0
- Inbound: 80 (HTTP) from 0.0.0.0/0
- Outbound: 8080 to ECS Security Group

**ECS Security Group:**

- Inbound: 8080 from ALB Security Group
- Outbound: 3306 to RDS Security Group
- Outbound: 6379 to Redis Security Group
- Outbound: 443 to 0.0.0.0/0 (AWS API calls)

**RDS Security Group:**

- Inbound: 3306 from ECS Security Group

**Redis Security Group:**

- Inbound: 6379 from ECS Security Group

### 7.3. IAM Roles

**ECS Task Execution Role** (cho pulling images, logs):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

**ECS Task Role** (cho application code):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::leaf-shop-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["translate:TranslateText"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:*:*:model/*"
    },
    {
      "Effect": "Allow",
      "Action": ["es:ESHttpGet", "es:ESHttpPost", "es:ESHttpPut"],
      "Resource": "arn:aws:es:ap-southeast-1:123456789012:domain/leaf-shop-search/*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:leaf-shop/*"
    }
  ]
}
```

### 7.4. AWS WAF (Web Application Firewall)

```powershell
# Tạo Web ACL cho CloudFront
# Rules:
# - Rate limiting (1000 requests/5min per IP)
# - Block SQL injection
# - Block XSS attacks
# - Geo-blocking (optional)
```

### 7.5. Secrets Manager

```powershell
# Lưu trữ sensitive data
aws secretsmanager create-secret \
  --name leaf-shop/db-password \
  --secret-string "YOUR_DB_PASSWORD" \
  --region $AWS_REGION

aws secretsmanager create-secret \
  --name leaf-shop/jwt-secret \
  --secret-string "YOUR_JWT_SECRET" \
  --region $AWS_REGION

aws secretsmanager create-secret \
  --name leaf-shop/stripe-secret-key \
  --secret-string "YOUR_STRIPE_SECRET_KEY" \
  --region $AWS_REGION
```

---

## 8. Monitoring và Logging

### 8.1. CloudWatch Logs

```powershell
# Tạo log groups
aws logs create-log-group --log-group-name /ecs/leaf-shop-backend --region $AWS_REGION
aws logs create-log-group --log-group-name /aws/lambda/leaf-shop-chatbot --region $AWS_REGION

# Set retention
aws logs put-retention-policy \
  --log-group-name /ecs/leaf-shop-backend \
  --retention-in-days 30 \
  --region $AWS_REGION
```

### 8.2. CloudWatch Alarms

```powershell
# CPU Utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name leaf-shop-backend-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=leaf-shop-backend-service Name=ClusterName,Value=leaf-shop-cluster \
  --region $AWS_REGION

# Memory utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name leaf-shop-backend-high-memory \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=leaf-shop-backend-service Name=ClusterName,Value=leaf-shop-cluster \
  --region $AWS_REGION

# ALB 5xx errors alarm
aws cloudwatch put-metric-alarm \
  --alarm-name leaf-shop-alb-5xx-errors \
  --alarm-description "Alert on high 5xx errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region $AWS_REGION
```

### 8.3. X-Ray Tracing (Optional)

```powershell
# Enable X-Ray trong ECS task definition
# Add X-Ray daemon container sidecar
```

### 8.4. CloudWatch Dashboard

Tạo dashboard qua Console để monitor:

- ECS CPU/Memory utilization
- ALB request count, latency, error rates
- RDS connections, CPU, storage
- Redis hit/miss rates
- Lambda invocations and errors
- S3 request metrics

---

## 9. CI/CD Pipeline

### 9.1. GitHub Actions Workflow

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-southeast-1
  ECR_REPOSITORY: leaf-shop-backend
  ECS_SERVICE: leaf-shop-backend-service
  ECS_CLUSTER: leaf-shop-cluster
  ECS_TASK_DEFINITION: backend-task-definition.json
  CONTAINER_NAME: leaf-shop-backend

jobs:
  deploy-backend:
    name: Deploy Backend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

  deploy-frontend:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to S3
        run: |
          aws s3 sync build/ s3://leaf-shop-frontend --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

### 9.2. AWS CodePipeline (Alternative)

Tạo pipeline với 3 stages:

1. **Source**: GitHub repository
2. **Build**: CodeBuild để build Docker image và push lên ECR
3. **Deploy**: CodeDeploy để deploy lên ECS

---

## 10. Troubleshooting

### 10.1. Backend không start được

```powershell
# Check ECS task logs
aws logs tail /ecs/leaf-shop-backend --follow --region $AWS_REGION

# Check task stopped reason
aws ecs describe-tasks \
  --cluster leaf-shop-cluster \
  --tasks <task-id> \
  --region $AWS_REGION
```

**Các vấn đề thường gặp:**

- Missing environment variables
- Cannot connect to RDS (security group issue)
- Out of memory (tăng task memory)
- Image pull errors (check ECR permissions)

### 10.2. Frontend không load được

```powershell
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket leaf-shop-frontend

# Check CloudFront distribution status
aws cloudfront get-distribution --id <distribution-id>

# Invalidate cache
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
```

### 10.3. Database connection issues

```powershell
# Test connection từ ECS task
aws ecs execute-command \
  --cluster leaf-shop-cluster \
  --task <task-id> \
  --container leaf-shop-backend \
  --interactive \
  --command "/bin/bash"

# Inside container:
apt-get update && apt-get install -y telnet
telnet <rds-endpoint> 3306
```

### 10.4. Redis connection issues

```powershell
# Check ElastiCache status
aws elasticache describe-cache-clusters \
  --cache-cluster-id leaf-shop-redis \
  --show-cache-node-info \
  --region $AWS_REGION

# Test from ECS task
telnet <redis-endpoint> 6379
```

### 10.5. High latency

- Enable CloudFront caching
- Add read replicas cho RDS
- Scale ECS tasks horizontally
- Optimize database queries
- Enable Redis caching

### 10.6. High costs

- Use AWS Cost Explorer
- Enable S3 Intelligent-Tiering
- Use Spot instances cho non-production
- Set up Budget alerts
- Review CloudWatch logs retention
- Delete unused resources

---

## Chi phí ước tính hàng tháng

**Minimum Setup (Development/Staging):**

- ECS Fargate (1 task, 1vCPU, 2GB): ~$30
- RDS db.t3.micro: ~$15
- ElastiCache cache.t3.micro: ~$12
- S3 + CloudFront: ~$5
- ALB: ~$20
- NAT Gateway: ~$35
- **Total: ~$120/month**

**Production Setup (Medium scale):**

- ECS Fargate (3 tasks, 1vCPU, 2GB): ~$90
- RDS db.t3.medium (Multi-AZ): ~$130
- ElastiCache cache.t3.small: ~$35
- S3 + CloudFront: ~$20
- ALB: ~$25
- NAT Gateway (2x): ~$70
- OpenSearch t3.small.search (2 nodes): ~$80
- SES: ~$0.10 per 1000 emails
- Bedrock: Pay per use
- **Total: ~$450-500/month**

---

## Domain và SSL Certificate

### Cấu hình Route 53

```powershell
# Tạo hosted zone
aws route53 create-hosted-zone \
  --name leafshop.com \
  --caller-reference $(Get-Date -Format 'yyyyMMddHHmmss')

# Thêm record cho frontend (CloudFront)
# Thêm record cho backend (ALB)
```

### Request SSL Certificate

```powershell
# Request certificate từ ACM
aws acm request-certificate \
  --domain-name leafshop.com \
  --subject-alternative-names "*.leafshop.com" \
  --validation-method DNS \
  --region us-east-1  # CloudFront requires us-east-1

# Validate certificate qua DNS
# Add CNAME records to Route 53
```

---

## Backup và Disaster Recovery

### Automated Backups

```powershell
# RDS automated backups (already configured in create-db-instance)
# Retention: 7 days

# Manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier leaf-shop-db \
  --db-snapshot-identifier leaf-shop-db-snapshot-$(Get-Date -Format 'yyyyMMdd') \
  --region $AWS_REGION

# S3 versioning
aws s3api put-bucket-versioning \
  --bucket leaf-shop-uploads \
  --versioning-configuration Status=Enabled

# Cross-region replication (optional)
```

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 1 hour
2. **RPO (Recovery Point Objective)**: 5 minutes

**Recovery steps:**

1. Restore RDS from latest snapshot
2. Deploy ECS tasks from latest ECR image
3. Update ALB target group
4. Update Route 53 DNS records
5. Restore S3 files from versioning

---

## Security Best Practices

✅ **Network Security**

- Private subnets cho backend, database
- Security groups với least privilege
- NAT Gateway cho outbound traffic
- VPC Flow Logs enabled

✅ **Data Security**

- Encrypt RDS at rest (KMS)
- Encrypt S3 buckets (AES-256)
- Encrypt EBS volumes
- Use Secrets Manager cho credentials

✅ **Application Security**

- WAF rules enabled
- Rate limiting
- CORS properly configured
- HTTPS only
- Regular security updates

✅ **Access Control**

- IAM roles với least privilege
- MFA cho root account
- No hardcoded credentials
- Regular access review

✅ **Monitoring & Audit**

- CloudTrail enabled
- CloudWatch alarms configured
- Regular log review
- AWS Config rules

---

## Checklist trước khi Go Live

- [ ] Domain đã được cấu hình với Route 53
- [ ] SSL certificates đã được issued và validated
- [ ] RDS có Multi-AZ và automated backups
- [ ] ECS tasks có health checks
- [ ] ALB có health checks cho targets
- [ ] CloudWatch alarms đã được cấu hình
- [ ] WAF rules đã được enabled
- [ ] SES đã thoát sandbox mode
- [ ] Secrets đã được move vào Secrets Manager
- [ ] Budget alerts đã được cấu hình
- [ ] Backup strategy đã được test
- [ ] Load testing đã được thực hiện
- [ ] Security scan đã được thực hiện
- [ ] Documentation đã được cập nhật

---

## Tài liệu tham khảo

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- Backend AWS Setup: `backend/AWS_SETUP.md`
- Backend Infrastructure: `backend/INFRA_SETUP.md`
- S3 Upload Guide: `backend/S3UploadGuide/`

---

**Lưu ý cuối:** Document này cung cấp overview toàn diện. Mỗi phần có thể cần custom tùy theo requirements cụ thể của bạn. Khuyến nghị bắt đầu với setup cơ bản rồi scale dần dần.

Nếu cần hỗ trợ thêm về bất kỳ phần nào, hãy tham khảo các file documentation khác trong repo hoặc AWS documentation.
