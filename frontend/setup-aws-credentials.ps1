# ===================================================================
# Script Cấu hình AWS Credentials
# ===================================================================

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
# Kiểm tra AWS CLI
# ===================================================================

Write-Step "Bước 1: Kiểm tra AWS CLI"

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    $awsPath = "C:\Program Files\Amazon\AWSCLIV2"
    if (Test-Path $awsPath) {
        Write-Info "Tìm thấy AWS CLI tại $awsPath"
        $env:Path += ";$awsPath"
    }
    else {
        Write-Error-Custom "AWS CLI chưa được cài đặt!"
        Write-Info "Cài đặt AWS CLI bằng lệnh:"
        Write-Host "  winget install Amazon.AWSCLI" -ForegroundColor Yellow
        Write-Info "Hoặc download từ: https://aws.amazon.com/cli/"
        exit 1
    }
}

$awsVersion = aws --version 2>&1
Write-Success "AWS CLI đã cài đặt: $awsVersion"

# ===================================================================
# Hướng dẫn lấy AWS Credentials
# ===================================================================

Write-Step "Bước 2: Lấy AWS Access Keys"

Write-Host @"

📝 HƯỚNG DẪN LẤY AWS ACCESS KEYS:

1. Đăng nhập AWS Console: https://console.aws.amazon.com
2. Tìm kiếm và mở "IAM" (Identity and Access Management)
3. Vào menu "Users" ở sidebar bên trái
4. Chọn user của bạn (hoặc tạo user mới)
5. Vào tab "Security credentials"
6. Scroll xuống phần "Access keys"
7. Click "Create access key"
8. Chọn "Command Line Interface (CLI)"
9. Tick vào checkbox xác nhận
10. Click "Next" và "Create access key"
11. Copy "Access key" và "Secret access key"

⚠️  LƯU Ý BẢO MẬT:
   - Secret key chỉ hiển thị 1 lần duy nhất
   - Lưu vào nơi an toàn (password manager)
   - KHÔNG commit vào Git
   - KHÔNG share với người khác

"@ -ForegroundColor $InfoColor

$continue = Read-Host "`nBạn đã có Access Key và Secret Key? (Y/N)"

if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Info "Vui lòng lấy AWS Access Keys trước rồi chạy lại script này"
    exit 0
}

# ===================================================================
# Cấu hình Credentials
# ===================================================================

Write-Step "Bước 3: Cấu hình AWS Credentials"

Write-Host "`nNhập thông tin AWS Credentials:" -ForegroundColor $InfoColor

# Method 1: Interactive AWS Configure
Write-Info "PHƯƠNG PHÁP 1: Tự động (Khuyến nghị)"
Write-Host "  Sử dụng lệnh 'aws configure' để cấu hình tương tác" -ForegroundColor White

$method = Read-Host "`nChọn phương pháp (1/2)"

if ($method -eq "1") {
    Write-Info "Chạy aws configure..."
    Write-Info "Nhập thông tin khi được hỏi:`n"
    
    aws configure
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Cấu hình thất bại!"
        exit 1
    }
}
else {
    # Method 2: Manual Configuration
    Write-Info "PHƯƠNG PHÁP 2: Thủ công"
    
    $accessKey = Read-Host "AWS Access Key ID"
    $secretKey = Read-Host "AWS Secret Access Key" -AsSecureString
    $secretKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))
    $region = Read-Host "Default region (vd: ap-southeast-1, us-east-1)"
    
    if ([string]::IsNullOrWhiteSpace($region)) {
        $region = "ap-southeast-1"
    }
    
    # Tạo thư mục .aws nếu chưa có
    $awsDir = "$env:USERPROFILE\.aws"
    if (-not (Test-Path $awsDir)) {
        New-Item -ItemType Directory -Path $awsDir | Out-Null
    }
    
    # Tạo file credentials
    $credentialsPath = "$awsDir\credentials"
    $credentialsContent = @"
[default]
aws_access_key_id = $accessKey
aws_secret_access_key = $secretKeyPlain
"@
    
    $credentialsContent | Out-File -FilePath $credentialsPath -Encoding utf8 -Force
    
    # Tạo file config
    $configPath = "$awsDir\config"
    $configContent = @"
[default]
region = $region
output = json
"@
    
    $configContent | Out-File -FilePath $configPath -Encoding utf8 -Force
    
    Write-Success "Đã tạo credentials file tại $credentialsPath"
    Write-Success "Đã tạo config file tại $configPath"
}

# ===================================================================
# Kiểm tra Credentials
# ===================================================================

Write-Step "Bước 4: Kiểm tra Credentials"

Write-Info "Đang xác thực với AWS..."

$identity = aws sts get-caller-identity 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Xác thực thất bại!"
    Write-Host $identity -ForegroundColor Red
    Write-Info "Vui lòng kiểm tra lại Access Key và Secret Key"
    exit 1
}

$identityJson = $identity | ConvertFrom-Json
$accountId = $identityJson.Account
$userId = $identityJson.UserId
$arn = $identityJson.Arn

Write-Success "Xác thực thành công!"
Write-Host "`n📌 THÔNG TIN AWS ACCOUNT:" -ForegroundColor $SuccessColor
Write-Host "================================" -ForegroundColor $SuccessColor
Write-Host "Account ID:  " -NoNewline; Write-Host $accountId -ForegroundColor Yellow
Write-Host "User ID:     " -NoNewline; Write-Host $userId -ForegroundColor Yellow
Write-Host "ARN:         " -NoNewline; Write-Host $arn -ForegroundColor Yellow
Write-Host "================================`n" -ForegroundColor $SuccessColor

# ===================================================================
# Kiểm tra Permissions
# ===================================================================

Write-Step "Bước 5: Kiểm tra Permissions"

Write-Info "Đang kiểm tra quyền truy cập S3..."

$s3Test = aws s3 ls 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Warning-Custom "Không có quyền list S3 buckets"
    Write-Info "User cần có ít nhất quyền: AmazonS3FullAccess hoặc tương đương"
    Write-Info "Thêm policy trong IAM Console: IAM > Users > Add permissions"
}
else {
    Write-Success "Có quyền truy cập S3"
    
    $bucketCount = ($s3Test | Measure-Object).Count
    if ($bucketCount -gt 0) {
        Write-Info "Tìm thấy $bucketCount S3 buckets"
    }
}

# ===================================================================
# Hoàn thành
# ===================================================================

Write-Step "🎉 HOÀN TẤT CẤU HÌNH! 🎉"

Write-Host @"

✅ AWS Credentials đã được cấu hình thành công!

📋 BƯỚC TIẾP THEO:

1. Deploy frontend lên S3:
   cd frontend
   .\deploy-to-s3.ps1

2. Hoặc deploy với bucket name tùy chỉnh:
   .\deploy-to-s3.ps1 -BucketName "leaf-shop-frontend-prod"

3. Skip build nếu đã build rồi:
   .\deploy-to-s3.ps1 -SkipBuild

4. Xem hướng dẫn chi tiết:
   Đọc file FRONTEND_DEPLOYMENT_GUIDE.md

"@ -ForegroundColor $InfoColor

Write-Info "Credentials được lưu tại: $env:USERPROFILE\.aws\"
Write-Warning-Custom "Hãy giữ bí mật thông tin này!"
