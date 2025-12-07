# Hướng dẫn Chi tiết Deploy Frontend React lên AWS

Tài liệu này hướng dẫn chi tiết từng bước để deploy ứng dụng React frontend của Leaf Shop lên AWS sử dụng S3, CloudFront và Route 53.

## Mục lục

1. [Tổng quan kiến trúc Frontend](#1-tổng-quan-kiến-trúc-frontend)
2. [Chuẩn bị trước khi deploy](#2-chuẩn-bị-trước-khi-deploy)
3. [Phương án 1: S3 + CloudFront (Khuyến nghị)](#3-phương-án-1-s3--cloudfront-khuyến-nghị)
4. [Phương án 2: Amplify Hosting](#4-phương-án-2-amplify-hosting)
5. [Phương án 3: EC2 với Nginx](#5-phương-án-3-ec2-với-nginx)
6. [Cấu hình HTTPS với SSL/TLS](#6-cấu-hình-https-với-ssltls)
7. [Cấu hình Custom Domain](#7-cấu-hình-custom-domain)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Monitoring và Analytics](#9-monitoring-và-analytics)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Tổng quan kiến trúc Frontend

### Kiến trúc đề xuất cho Production

```
┌─────────────────────────────────────────────────────────┐
│                        Users                             │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │   Route 53  │  ← Custom Domain (leafshop.com)
        │    (DNS)    │
        └──────┬──────┘
               │
        ┌──────▼──────────┐
        │   CloudFront    │  ← CDN (Content Delivery Network)
        │   + AWS WAF     │  ← Security & DDoS Protection
        └──────┬──────────┘
               │
        ┌──────▼──────────┐
        │   S3 Bucket     │  ← Static Website Hosting
        │ (React Build)   │  ← index.html, CSS, JS, Images
        └─────────────────┘
```

### Lợi ích của kiến trúc này

✅ **Performance**: CloudFront CDN cung cấp nội dung từ edge locations gần người dùng nhất  
✅ **Scalability**: Tự động scale với lượng traffic bất kỳ  
✅ **Cost-Effective**: Chỉ trả tiền cho storage và bandwidth thực tế sử dụng  
✅ **Security**: SSL/TLS certificates, AWS WAF, DDoS protection  
✅ **High Availability**: 99.99% uptime SLA

---

## 2. Chuẩn bị trước khi deploy

### 2.1. Yêu cầu hệ thống

- AWS Account đã được kích hoạt
- AWS CLI đã được cài đặt và cấu hình
- Node.js >= 14.x
- Git (optional, cho CI/CD)

### 2.2. Cài đặt AWS CLI (nếu chưa có)

```powershell
# Windows - sử dụng winget
winget install Amazon.AWSCLI

# Hoặc download MSI installer từ:
# https://awscli.amazonaws.com/AWSCLIV2.msi
```

### 2.3. Cấu hình AWS Credentials

```powershell
# Cấu hình credentials
aws configure

# Nhập thông tin khi được hỏi:
AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name: ap-southeast-1
Default output format: json
```

### 2.4. Kiểm tra cấu hình

```powershell
# Kiểm tra AWS CLI hoạt động
aws sts get-caller-identity

# Output sẽ hiển thị Account ID, User ARN
```

### 2.5. Cấu hình IAM Permissions

Đảm bảo IAM user hoặc role có các permissions sau:

- `AmazonS3FullAccess` (hoặc custom policy cho S3)
- `CloudFrontFullAccess`
- `AWSCertificateManagerFullAccess` (cho HTTPS)
- `Route53FullAccess` (cho custom domain)

### 2.6. Chuẩn bị Environment Variables

Tạo file `.env.production` trong thư mục `frontend/`:

```powershell
cd frontend

# Tạo file .env.production
@"
# API Backend URL
REACT_APP_API_URL=https://api.leafshop.com
REACT_APP_WS_URL=wss://api.leafshop.com/ws

# AWS Configuration
REACT_APP_AWS_REGION=ap-southeast-1
REACT_APP_S3_BUCKET=leaf-shop-uploads

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_CHATBOT=true

# Environment
REACT_APP_ENV=production
"@ | Out-File -FilePath .env.production -Encoding utf8
```

⚠️ **Lưu ý**: Chỉ đặt các biến môi trường public trong `.env.production`. KHÔNG bao giờ đặt API keys, secrets vào đây vì chúng sẽ được embed vào frontend bundle.

---

## 3. Phương án 1: S3 + CloudFront (Khuyến nghị)

Đây là phương án tốt nhất cho production với chi phí thấp và hiệu suất cao.

### 3.1. Build Frontend Application

```powershell
# Di chuyển vào thư mục frontend
cd D:\AWS-FCJ\leaf-shop\frontend

# Cài đặt dependencies (nếu chưa có)
npm install

# Build production
npm run build

# Output sẽ được tạo trong thư mục build/
```

Kiểm tra thư mục build:

```powershell
# Xem các file đã được build
ls build

# Nên thấy:
# - index.html
# - static/ (chứa CSS, JS, media files)
# - manifest.json
# - robots.txt
```

### 3.2. Tạo S3 Bucket cho Frontend

```powershell
# Set biến môi trường
$BUCKET_NAME = "leaf-shop-frontend-prod"
$AWS_REGION = "ap-southeast-1"

# Tạo S3 bucket
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Output:
# make_bucket: leaf-shop-frontend-prod
```

⚠️ **Lưu ý**: Tên bucket phải unique globally trong toàn bộ AWS. Nếu tên đã tồn tại, hãy đổi tên khác.

### 3.3. Cấu hình S3 Bucket cho Static Website Hosting

```powershell
# Enable static website hosting
aws s3 website s3://$BUCKET_NAME `
    --index-document index.html `
    --error-document index.html
```

**Giải thích**:

- `--index-document index.html`: File mặc định khi truy cập bucket
- `--error-document index.html`: Redirect tất cả 404 errors về index.html (quan trọng cho React Router)

### 3.4. Cấu hình CORS cho S3 Bucket

Tạo file `cors-config.json`:

```powershell
@"
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
"@ | Out-File -FilePath cors-config.json -Encoding utf8

# Áp dụng CORS configuration
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://cors-config.json

# Xóa file tạm
Remove-Item cors-config.json
```

### 3.5. Upload Build Files lên S3

```powershell
# Upload tất cả files từ thư mục build lên S3
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Options:
# --delete: Xóa các files trên S3 không còn tồn tại local
# --acl public-read: (Optional) Nếu muốn public trực tiếp
```

Bạn sẽ thấy output:

```
upload: build\index.html to s3://leaf-shop-frontend-prod/index.html
upload: build\manifest.json to s3://leaf-shop-frontend-prod/manifest.json
upload: build\static\js\main.abc123.js to s3://leaf-shop-frontend-prod/static/js/main.abc123.js
...
```

### 3.6. Cấu hình Cache Control cho Static Assets

```powershell
# Set cache control cho HTML files (không cache)
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ `
    --exclude "*" `
    --include "*.html" `
    --recursive `
    --metadata-directive REPLACE `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "text/html"

# Set cache control cho JS/CSS files (cache 1 năm vì có hash trong tên)
aws s3 cp s3://$BUCKET_NAME/static/ s3://$BUCKET_NAME/static/ `
    --recursive `
    --metadata-directive REPLACE `
    --cache-control "public, max-age=31536000, immutable"
```

### 3.7. Cấu hình Bucket Policy (Cho CloudFront)

Tạo file `bucket-policy.json`:

```powershell
@"
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
"@ | Out-File -FilePath bucket-policy.json -Encoding utf8

# Áp dụng bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json

# Xóa file tạm
Remove-Item bucket-policy.json
```

⚠️ **Lưu ý bảo mật**: Bucket policy này cho phép public read. Trong production, nên sử dụng CloudFront Origin Access Identity (OAI) để bảo mật hơn (hướng dẫn ở bước tiếp theo).

### 3.8. Test S3 Website Endpoint

```powershell
# Lấy website endpoint
$S3_WEBSITE_URL = "http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
Write-Host "S3 Website URL: $S3_WEBSITE_URL"

# Mở trình duyệt để test
Start-Process $S3_WEBSITE_URL
```

Website của bạn giờ đã live trên S3! Tuy nhiên, đây chỉ là HTTP và không có CDN. Tiếp tục để cấu hình CloudFront.

---

### 3.9. Tạo CloudFront Distribution

CloudFront sẽ cung cấp CDN, HTTPS, và caching cho website.

#### 3.9.1. Tạo Origin Access Identity (OAI)

```powershell
# Tạo OAI để CloudFront có thể access S3 private bucket
aws cloudfront create-cloud-front-origin-access-identity `
    --cloud-front-origin-access-identity-config `
    CallerReference="leaf-shop-$(Get-Date -Format 'yyyyMMddHHmmss')",Comment="OAI for Leaf Shop Frontend"

# Lưu lại OAI ID từ output
# Ví dụ: E127EXAMPLE51Z
```

#### 3.9.2. Update Bucket Policy cho OAI

```powershell
$OAI_ID = "E127EXAMPLE51Z"  # Thay bằng OAI ID từ bước trên

@"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
"@ | Out-File -FilePath bucket-policy-oai.json -Encoding utf8

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy-oai.json

Remove-Item bucket-policy-oai.json
```

#### 3.9.3. Tạo CloudFront Distribution qua AWS Console

Vì CloudFront distribution config rất dài, khuyến nghị tạo qua Console:

1. **Mở AWS Console** → Tìm **CloudFront** → Click **Create Distribution**

2. **Origin Settings**:

   - **Origin Domain**: Chọn S3 bucket `leaf-shop-frontend-prod.s3.ap-southeast-1.amazonaws.com`
   - **Origin Path**: Để trống
   - **Name**: `leaf-shop-frontend-origin`
   - **Origin Access**: Chọn **Origin access control settings (recommended)**
   - **Origin Access Control**: Tạo mới hoặc chọn OAI đã tạo

3. **Default Cache Behavior**:

   - **Viewer Protocol Policy**: `Redirect HTTP to HTTPS`
   - **Allowed HTTP Methods**: `GET, HEAD, OPTIONS`
   - **Cache Policy**: `CachingOptimized`
   - **Origin Request Policy**: `CORS-CustomOrigin`
   - **Response Headers Policy**: `SimpleCORS`
   - **Compress Objects Automatically**: `Yes`

4. **Function Associations** (Optional):

   - Nếu muốn thêm security headers, có thể tạo CloudFront Function

5. **Settings**:

   - **Price Class**: `Use All Edge Locations` (best performance)
   - **Alternate Domain Names (CNAMEs)**: `www.leafshop.com`, `leafshop.com` (nếu có custom domain)
   - **Custom SSL Certificate**: Chọn certificate từ ACM (hướng dẫn ở phần sau)
   - **Default Root Object**: `index.html`
   - **Standard Logging**: `On` (khuyến nghị)

6. **Custom Error Responses** (Quan trọng cho React Router):

   - Click **Add custom error response**
   - **HTTP Error Code**: `404`
   - **Customize Error Response**: `Yes`
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: `200`
   - Lặp lại cho error code `403`

7. Click **Create Distribution**

#### 3.9.4. Tạo CloudFront Distribution qua AWS CLI (Advanced)

Nếu muốn tự động hóa, tạo file `cloudfront-config.json`:

```powershell
@"
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
          "OriginAccessIdentity": "origin-access-identity/cloudfront/$OAI_ID"
        },
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-leaf-shop-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All",
  "HttpVersion": "http2"
}
"@ | Out-File -FilePath cloudfront-config.json -Encoding utf8

# Tạo distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# Xóa file tạm
Remove-Item cloudfront-config.json
```

#### 3.9.5. Lấy CloudFront Distribution URL

```powershell
# List distributions
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Leaf Shop Frontend Distribution'].[Id,DomainName,Status]" --output table

# Hoặc lấy distribution ID mới nhất
$CF_ID = (aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Leaf Shop Frontend Distribution'].Id | [0]" --output text)

Write-Host "CloudFront Distribution ID: $CF_ID"
Write-Host "CloudFront URL: https://$(aws cloudfront get-distribution --id $CF_ID --query 'Distribution.DomainName' --output text)"
```

⏱️ **Lưu ý**: CloudFront distribution mất 15-20 phút để deploy hoàn toàn. Kiểm tra status:

```powershell
aws cloudfront get-distribution --id $CF_ID --query 'Distribution.Status' --output text
# Chờ cho đến khi status là "Deployed"
```

### 3.10. Test CloudFront Distribution

```powershell
# Lấy CloudFront URL
$CF_URL = "https://$(aws cloudfront get-distribution --id $CF_ID --query 'Distribution.DomainName' --output text)"

Write-Host "Testing CloudFront URL: $CF_URL"
Start-Process $CF_URL
```

Website của bạn giờ đã có:

- ✅ HTTPS (với CloudFront default certificate)
- ✅ CDN caching globally
- ✅ DDoS protection
- ✅ Compression
- ✅ High availability

---

## 4. Phương án 2: Amplify Hosting

AWS Amplify là cách nhanh nhất để deploy, đặc biệt phù hợp cho CI/CD.

### 4.1. Deploy với Amplify Console (Manual)

```powershell
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify trong project
cd D:\AWS-FCJ\leaf-shop\frontend
amplify init

# Trả lời các câu hỏi:
# ? Enter a name for the project: leafshop
# ? Enter a name for the environment: prod
# ? Choose your default editor: Visual Studio Code
# ? Choose the type of app: javascript
# ? What javascript framework: react
# ? Source Directory Path: src
# ? Distribution Directory Path: build
# ? Build Command: npm run build
# ? Start Command: npm start
```

### 4.2. Add Hosting

```powershell
# Add hosting với CloudFront and S3
amplify add hosting

# Select: Hosting with Amplify Console
# Select: Manual deployment

# Deploy
amplify publish
```

### 4.3. Deploy với Git (CI/CD)

1. **Push code lên Git repository** (GitHub, GitLab, Bitbucket)

2. **Mở Amplify Console**:

   - AWS Console → Amplify → Host web app
   - Connect repository
   - Chọn branch: `main`
   - Build settings sẽ tự động detect

3. **Build Settings** (tự động tạo `amplify.yml`):

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

4. **Deploy**:
   - Mỗi lần push code, Amplify tự động build và deploy
   - URL: `https://main.d1234567890.amplifyapp.com`

### 4.4. Custom Domain trên Amplify

1. Amplify Console → Domain management
2. Add domain → Nhập domain của bạn
3. Verify DNS → Update DNS records
4. SSL certificate tự động được cấp

---

## 5. Phương án 3: EC2 với Nginx

Phương án này phức tạp hơn nhưng cho phép control hoàn toàn.

### 5.1. Launch EC2 Instance

```powershell
# Launch EC2 Ubuntu instance
# Instance type: t3.micro (free tier) hoặc t3.small
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

# SSH vào instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 5.2. Cài đặt Nginx

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 5.3. Deploy Frontend files

```bash
# Tạo directory cho website
sudo mkdir -p /var/www/leafshop

# Set permissions
sudo chown -R $USER:$USER /var/www/leafshop
```

Từ máy local, upload build files:

```powershell
# Windows - sử dụng SCP
scp -i your-key.pem -r build/* ubuntu@your-ec2-ip:/var/www/leafshop/
```

### 5.4. Cấu hình Nginx

Trên EC2:

```bash
# Tạo Nginx config
sudo nano /etc/nginx/sites-available/leafshop

# Paste config:
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/leafshop;
    index index.html;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}

# Enable site
sudo ln -s /etc/nginx/sites-available/leafshop /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.5. Cài đặt SSL với Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 6. Cấu hình HTTPS với SSL/TLS

### 6.1. Request SSL Certificate từ AWS Certificate Manager (ACM)

⚠️ **Quan trọng**: Certificate cho CloudFront PHẢI được tạo ở region **us-east-1**

```powershell
# Request certificate
aws acm request-certificate `
    --domain-name leafshop.com `
    --subject-alternative-names www.leafshop.com `
    --validation-method DNS `
    --region us-east-1

# Lấy certificate ARN
$CERT_ARN = (aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[?DomainName=='leafshop.com'].CertificateArn | [0]" --output text)

Write-Host "Certificate ARN: $CERT_ARN"
```

### 6.2. Validate Certificate

```powershell
# Lấy validation records
aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --query "Certificate.DomainValidationOptions[0].ResourceRecord"

# Output sẽ cho bạn CNAME record để add vào DNS:
# Name: _abc123.leafshop.com
# Value: _xyz456.acm-validations.aws
```

Thêm CNAME record vào DNS provider của bạn (Route 53, GoDaddy, Namecheap, etc.)

Chờ validation (thường 5-30 phút):

```powershell
aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --query "Certificate.Status" --output text
# Chờ cho đến khi status là "ISSUED"
```

### 6.3. Attach Certificate vào CloudFront

```powershell
# Update CloudFront distribution để sử dụng custom certificate
# Làm qua Console hoặc CLI

# Qua Console:
# CloudFront → Distributions → Select distribution → Edit
# → Custom SSL Certificate → Select certificate
# → Alternate Domain Names (CNAMEs) → Add: leafshop.com, www.leafshop.com
```

---

## 7. Cấu hình Custom Domain

### 7.1. Sử dụng Route 53 (Khuyến nghị)

#### 7.1.1. Tạo Hosted Zone

```powershell
# Tạo hosted zone
aws route53 create-hosted-zone `
    --name leafshop.com `
    --caller-reference "$(Get-Date -Format 'yyyyMMddHHmmss')"

# Lấy hosted zone ID
$HOSTED_ZONE_ID = (aws route53 list-hosted-zones --query "HostedZones[?Name=='leafshop.com.'].Id | [0]" --output text)
$HOSTED_ZONE_ID = $HOSTED_ZONE_ID.Split('/')[-1]  # Remove /hostedzone/ prefix

Write-Host "Hosted Zone ID: $HOSTED_ZONE_ID"
```

#### 7.1.2. Update Nameservers ở Domain Registrar

```powershell
# Lấy nameservers
aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query "DelegationSet.NameServers"

# Output:
# [
#     "ns-123.awsdns-12.com",
#     "ns-456.awsdns-45.net",
#     "ns-789.awsdns-78.org",
#     "ns-012.awsdns-01.co.uk"
# ]
```

Vào domain registrar (GoDaddy, Namecheap, etc.) và update nameservers thành nameservers của Route 53.

⏱️ DNS propagation có thể mất 24-48 giờ.

#### 7.1.3. Tạo Record Sets

Tạo file `route53-records.json`:

```powershell
# Lấy CloudFront Domain Name
$CF_DOMAIN = (aws cloudfront get-distribution --id $CF_ID --query 'Distribution.DomainName' --output text)

@"
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "leafshop.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.leafshop.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
"@ | Out-File -FilePath route53-records.json -Encoding utf8

# Create records
aws route53 change-resource-record-sets `
    --hosted-zone-id $HOSTED_ZONE_ID `
    --change-batch file://route53-records.json

Remove-Item route53-records.json
```

**Lưu ý**: `Z2FDTNDATAQYW2` là Hosted Zone ID cố định cho CloudFront distributions.

#### 7.1.4. Test DNS

```powershell
# Test DNS resolution
nslookup leafshop.com
nslookup www.leafshop.com

# Test HTTPS
curl -I https://leafshop.com
curl -I https://www.leafshop.com
```

### 7.2. Sử dụng External DNS Provider

Nếu không dùng Route 53, thêm CNAME records tại DNS provider:

```
Type: CNAME
Name: www
Value: d1234567890.cloudfront.net
TTL: 300

Type: CNAME
Name: @
Value: d1234567890.cloudfront.net
TTL: 300
```

---

## 8. CI/CD Pipeline

### 8.1. GitHub Actions

Tạo file `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to AWS

on:
  push:
    branches:
      - main
    paths:
      - "frontend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
          REACT_APP_AWS_REGION: ${{ secrets.AWS_REGION }}

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-1

      - name: Deploy to S3
        working-directory: ./frontend
        run: |
          aws s3 sync build/ s3://leaf-shop-frontend-prod --delete

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Deployment notification
        if: success()
        run: echo "✅ Frontend deployed successfully!"
```

### 8.2. GitLab CI/CD

Tạo file `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

build:frontend:
  stage: build
  image: node:18
  cache:
    paths:
      - frontend/node_modules/
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/build/
    expire_in: 1 hour
  only:
    changes:
      - frontend/**

deploy:frontend:
  stage: deploy
  image: amazon/aws-cli
  dependencies:
    - build:frontend
  script:
    - aws s3 sync frontend/build/ s3://leaf-shop-frontend-prod --delete
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
  only:
    - main
```

### 8.3. Setup Secrets

Trong GitHub/GitLab, thêm secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `REACT_APP_API_URL`

---

## 9. Monitoring và Analytics

### 9.1. CloudWatch Logs

```powershell
# Enable CloudFront logging
# Tạo S3 bucket cho logs
aws s3 mb s3://leaf-shop-cloudfront-logs --region ap-southeast-1

# Update CloudFront distribution để enable logging
# (Làm qua Console: CloudFront → Distribution → Edit → Logging: On)
```

### 9.2. CloudWatch Metrics

```powershell
# Xem CloudFront metrics
aws cloudwatch get-metric-statistics `
    --namespace AWS/CloudFront `
    --metric-name Requests `
    --dimensions Name=DistributionId,Value=$CF_ID `
    --start-time (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
    --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
    --period 3600 `
    --statistics Sum
```

### 9.3. Setup CloudWatch Dashboard

Tạo dashboard để monitor:

- Requests per minute
- Error rate (4xx, 5xx)
- Bytes downloaded
- Cache hit rate

### 9.4. Google Analytics

Thêm vào `public/index.html`:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "G-XXXXXXXXXX");
</script>
```

---

## 10. Troubleshooting

### 10.1. CloudFront caching old content

```powershell
# Invalidate CloudFront cache
aws cloudfront create-invalidation `
    --distribution-id $CF_ID `
    --paths "/*"

# Hoặc chỉ invalidate specific files
aws cloudfront create-invalidation `
    --distribution-id $CF_ID `
    --paths "/index.html" "/static/js/*"
```

### 10.2. React Router 404 errors

Đảm bảo đã cấu hình Custom Error Response trong CloudFront:

- Error Code: 404, 403
- Response Page: /index.html
- Response Code: 200

### 10.3. CORS errors khi call API

Kiểm tra:

1. Backend có enable CORS cho domain frontend
2. CloudFront có forward appropriate headers
3. API URL trong `.env.production` đúng

### 10.4. Slow loading times

```powershell
# Check CloudFront cache statistics
aws cloudfront get-distribution-config --id $CF_ID --query "DistributionConfig.DefaultCacheBehavior"

# Optimize:
# - Enable Gzip compression
# - Set appropriate TTL values
# - Use CloudFront cache policies
# - Minify JS/CSS bundles
```

### 10.5. Certificate validation stuck

```powershell
# Check certificate status
aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1

# Common issues:
# - CNAME record not added to DNS
# - Wrong DNS zone
# - DNS propagation not complete (wait 24-48 hours)
```

### 10.6. High AWS costs

Monitoring costs:

- S3 storage: Minimal (usually < $1/month)
- S3 requests: Pay per request
- CloudFront data transfer: ~$0.085/GB
- CloudFront requests: ~$0.01 per 10,000 requests

Optimization tips:

- Use cache effectively
- Compress assets
- Use appropriate CloudFront price class
- Set lifecycle policies for S3 logs

---

## Chi phí ước tính

### Tính toán cho website có 10,000 visitors/tháng:

| Dịch vụ                  | Chi phí/tháng  | Ghi chú          |
| ------------------------ | -------------- | ---------------- |
| S3 Storage               | $0.50          | 5GB static files |
| S3 Requests              | $0.10          | 50,000 requests  |
| CloudFront Data Transfer | $8.50          | 100GB transfer   |
| CloudFront Requests      | $0.10          | 100,000 requests |
| Route 53 Hosted Zone     | $0.50          | 1 hosted zone    |
| Route 53 Queries         | $0.40          | 1M queries       |
| **Tổng**                 | **~$10/tháng** |                  |

Free tier (12 tháng đầu):

- S3: 5GB storage, 20,000 GET requests
- CloudFront: 1TB data transfer, 10M requests
- Route 53: Không có free tier

---

## Checklist triển khai

### Trước khi deploy:

- [ ] Build frontend thành công locally
- [ ] Test API endpoints
- [ ] Configure environment variables
- [ ] Review security settings
- [ ] Backup current version

### Deploy lần đầu:

- [ ] Tạo S3 bucket
- [ ] Configure static website hosting
- [ ] Upload build files
- [ ] Tạo CloudFront distribution
- [ ] Configure custom error responses
- [ ] Request SSL certificate
- [ ] Validate certificate
- [ ] Configure custom domain
- [ ] Update DNS records
- [ ] Test HTTPS access

### Sau khi deploy:

- [ ] Test tất cả routes
- [ ] Test API integration
- [ ] Check browser console for errors
- [ ] Test trên mobile devices
- [ ] Monitor CloudWatch metrics
- [ ] Setup billing alerts
- [ ] Document deployment process
- [ ] Train team on update process

---

## Tài liệu tham khảo

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS Certificate Manager User Guide](https://docs.aws.amazon.com/acm/)
- [AWS Route 53 Developer Guide](https://docs.aws.amazon.com/route53/)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)

---

## Liên hệ & Support

Nếu gặp vấn đề trong quá trình deploy, vui lòng:

1. Kiểm tra phần Troubleshooting
2. Review AWS CloudWatch logs
3. Kiểm tra AWS Service Health Dashboard
4. Liên hệ AWS Support (nếu có support plan)

**Happy Deploying! 🚀**
