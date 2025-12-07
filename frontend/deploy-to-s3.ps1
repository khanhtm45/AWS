# ===================================================================
# Script Deploy Frontend React lên AWS S3
# ===================================================================

param(
    [Parameter(Mandatory = $false)]
    [string]$BucketName = "leaf-shop-frontend-$(Get-Date -Format 'yyyyMMdd')",
    
    [Parameter(Mandatory = $false)]
    [string]$Region = "ap-southeast-1",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory = $false)]
    [switch]$ConfigureAWS
)

# Colors
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-Step {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor $InfoColor
    Write-Host $Message -ForegroundColor $InfoColor
    Write-Host "========================================`n" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $ErrorColor
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $InfoColor
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $WarningColor
}

# ===================================================================
# 1. Kiểm tra Prerequisites
# ===================================================================

Write-Step "BƯỚC 1: Kiểm tra Prerequisites"

# Kiểm tra AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    # Try to find AWS CLI in default location
    $awsPath = "C:\Program Files\Amazon\AWSCLIV2"
    if (Test-Path $awsPath) {
        Write-Info "Tìm thấy AWS CLI tại $awsPath"
        $env:Path += ";$awsPath"
    }
    else {
        Write-Error-Custom "AWS CLI chưa được cài đặt!"
        Write-Info "Cài đặt AWS CLI: winget install Amazon.AWSCLI"
        exit 1
    }
}

$awsVersion = aws --version 2>&1
Write-Success "AWS CLI đã cài đặt: $awsVersion"

# Kiểm tra Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "Node.js chưa được cài đặt!"
    Write-Info "Cài đặt Node.js: winget install OpenJS.NodeJS.LTS"
    exit 1
}

$nodeVersion = node --version
Write-Success "Node.js đã cài đặt: $nodeVersion"

# ===================================================================
# 2. Cấu hình AWS Credentials (nếu cần)
# ===================================================================

if ($ConfigureAWS) {
    Write-Step "BƯỚC 2: Cấu hình AWS Credentials"
    
    Write-Info "Bạn cần có AWS Access Key và Secret Key"
    Write-Info "Lấy từ: AWS Console > IAM > Users > Security Credentials"
    
    aws configure
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Cấu hình AWS thất bại!"
        exit 1
    }
}

# Kiểm tra credentials
Write-Step "BƯỚC 2: Kiểm tra AWS Credentials"

$identity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "AWS Credentials chưa được cấu hình!"
    Write-Info "Chạy lại script với tham số -ConfigureAWS để cấu hình"
    Write-Info "Hoặc chạy: aws configure"
    exit 1
}

$accountId = ($identity | ConvertFrom-Json).Account
Write-Success "AWS Account ID: $accountId"
Write-Success "Region: $Region"

# ===================================================================
# 3. Build Frontend
# ===================================================================

if (-not $SkipBuild) {
    Write-Step "BƯỚC 3: Build Frontend Application"
    
    if (-not (Test-Path "package.json")) {
        Write-Error-Custom "Không tìm thấy package.json. Đảm bảo bạn đang ở thư mục frontend"
        exit 1
    }
    
    # Install dependencies
    Write-Info "Cài đặt dependencies..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "npm install thất bại!"
        exit 1
    }
    
    # Build production
    Write-Info "Building production bundle..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "npm build thất bại!"
        exit 1
    }
    
    Write-Success "Build thành công!"
}
else {
    Write-Step "BƯỚC 3: Bỏ qua Build (sử dụng build có sẵn)"
}

# Kiểm tra thư mục build
if (-not (Test-Path "build")) {
    Write-Error-Custom "Thư mục build không tồn tại!"
    Write-Info "Chạy lại không có tham số -SkipBuild để build"
    exit 1
}

$buildFiles = Get-ChildItem "build" -Recurse | Measure-Object
Write-Info "Thư mục build chứa $($buildFiles.Count) files"

# ===================================================================
# 4. Tạo S3 Bucket
# ===================================================================

Write-Step "BƯỚC 4: Tạo S3 Bucket"

Write-Info "Bucket name: $BucketName"
Write-Info "Region: $Region"

# Kiểm tra bucket đã tồn tại chưa
$bucketExists = aws s3 ls "s3://$BucketName" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Warning-Custom "Bucket $BucketName đã tồn tại"
    $continue = Read-Host "Bạn có muốn sử dụng bucket này? (Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        Write-Info "Đã hủy"
        exit 0
    }
}
else {
    # Tạo bucket mới
    Write-Info "Đang tạo S3 bucket..."
    
    if ($Region -eq "us-east-1") {
        aws s3 mb "s3://$BucketName"
    }
    else {
        aws s3 mb "s3://$BucketName" --region $Region
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Tạo bucket thất bại!"
        Write-Info "Lý do có thể: Tên bucket đã được sử dụng bởi người khác (tên phải unique globally)"
        Write-Info "Thử lại với tên khác: .\deploy-to-s3.ps1 -BucketName 'ten-bucket-khac'"
        exit 1
    }
    
    Write-Success "Đã tạo bucket: $BucketName"
}

# ===================================================================
# 5. Cấu hình Static Website Hosting
# ===================================================================

Write-Step "BƯỚC 5: Cấu hình Static Website Hosting"

aws s3 website "s3://$BucketName" `
    --index-document index.html `
    --error-document index.html

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Cấu hình website hosting thất bại!"
    exit 1
}

Write-Success "Đã cấu hình static website hosting"

# ===================================================================
# 6. Cấu hình CORS
# ===================================================================

Write-Step "BƯỚC 6: Cấu hình CORS"

$corsConfig = @"
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
"@

$corsConfig | Out-File -FilePath "cors-config.json" -Encoding utf8

aws s3api put-bucket-cors --bucket $BucketName --cors-configuration file://cors-config.json

if ($LASTEXITCODE -ne 0) {
    Write-Warning-Custom "Cấu hình CORS thất bại (có thể bỏ qua)"
}
else {
    Write-Success "Đã cấu hình CORS"
}

Remove-Item "cors-config.json" -ErrorAction SilentlyContinue

# ===================================================================
# 7. Cấu hình Bucket Policy (Public Access)
# ===================================================================

Write-Step "BƯỚC 7: Cấu hình Bucket Policy"

# Tắt Block Public Access
Write-Info "Tắt Block Public Access..."
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if ($LASTEXITCODE -ne 0) {
    Write-Warning-Custom "Không thể tắt Block Public Access"
}

# Set bucket policy
$bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

$bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding utf8

aws s3api put-bucket-policy --bucket $BucketName --policy file://bucket-policy.json

if ($LASTEXITCODE -ne 0) {
    Write-Warning-Custom "Cấu hình bucket policy thất bại"
    Write-Info "Bạn có thể cần tắt 'Block all public access' trong S3 Console"
}
else {
    Write-Success "Đã cấu hình bucket policy"
}

Remove-Item "bucket-policy.json" -ErrorAction SilentlyContinue

# ===================================================================
# 8. Upload Files lên S3
# ===================================================================

Write-Step "BƯỚC 8: Upload Files lên S3"

Write-Info "Đang upload files từ thư mục build..."

aws s3 sync build/ "s3://$BucketName" --delete

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Upload files thất bại!"
    exit 1
}

Write-Success "Đã upload tất cả files lên S3"

# ===================================================================
# 9. Cấu hình Cache Control
# ===================================================================

Write-Step "BƯỚC 9: Cấu hình Cache Control"

# HTML files - no cache
Write-Info "Cấu hình cache cho HTML files..."
aws s3 cp "s3://$BucketName/" "s3://$BucketName/" `
    --exclude "*" `
    --include "*.html" `
    --recursive `
    --metadata-directive REPLACE `
    --cache-control "no-cache, no-store, must-revalidate" `
    --content-type "text/html"

# Static assets - cache 1 year
Write-Info "Cấu hình cache cho static assets..."
aws s3 cp "s3://$BucketName/static/" "s3://$BucketName/static/" `
    --recursive `
    --metadata-directive REPLACE `
    --cache-control "public, max-age=31536000, immutable"

Write-Success "Đã cấu hình cache control"

# ===================================================================
# 10. Hoàn thành & Hiển thị URLs
# ===================================================================

Write-Step "🎉 DEPLOYMENT THÀNH CÔNG! 🎉"

$websiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"
$s3Url = "https://$BucketName.s3.$Region.amazonaws.com"

Write-Host "`n" -NoNewline
Write-Host "📌 THÔNG TIN DEPLOYMENT" -ForegroundColor $SuccessColor
Write-Host "================================" -ForegroundColor $SuccessColor
Write-Host "Bucket Name:      " -NoNewline; Write-Host $BucketName -ForegroundColor Yellow
Write-Host "Region:           " -NoNewline; Write-Host $Region -ForegroundColor Yellow
Write-Host "Website URL:      " -NoNewline; Write-Host $websiteUrl -ForegroundColor Green
Write-Host "S3 URL:           " -NoNewline; Write-Host $s3Url -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor $SuccessColor

Write-Info "Mở website trong trình duyệt..."
Start-Process $websiteUrl

Write-Host "`n📋 BƯỚC TIẾP THEO:" -ForegroundColor $InfoColor
Write-Host "1. Tạo CloudFront distribution để có CDN và HTTPS" -ForegroundColor White
Write-Host "2. Cấu hình custom domain với Route 53" -ForegroundColor White
Write-Host "3. Setup CI/CD pipeline để tự động deploy" -ForegroundColor White
Write-Host "`nXem hướng dẫn chi tiết trong: FRONTEND_DEPLOYMENT_GUIDE.md`n" -ForegroundColor $InfoColor

# ===================================================================
# Lưu thông tin deployment
# ===================================================================

$deploymentInfo = @"
# Deployment Information
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Bucket Name: $BucketName
Region: $Region
Website URL: $websiteUrl
S3 URL: $s3Url

# Quick Commands
# Upload lại files: aws s3 sync build/ s3://$BucketName --delete
# Xóa bucket: aws s3 rb s3://$BucketName --force
# List files: aws s3 ls s3://$BucketName --recursive
"@

$deploymentInfo | Out-File -FilePath "deployment-info.txt" -Encoding utf8
Write-Success "Đã lưu thông tin deployment vào deployment-info.txt"
