# Script deploy Frontend lên AWS S3 + CloudFront
# Yêu cầu: Node.js đã cài đặt

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deploy Frontend to AWS S3 + CloudFront" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Get outputs from Terraform
Write-Host "Getting deployment info from Terraform..." -ForegroundColor Yellow
$FRONTEND_BUCKET = terraform -chdir=terraform output -raw frontend_bucket_name
$CF_DISTRIBUTION_ID = terraform -chdir=terraform output -raw cloudfront_distribution_id
$FRONTEND_URL = terraform -chdir=terraform output -raw frontend_url

Write-Host "Frontend Bucket: $FRONTEND_BUCKET" -ForegroundColor Cyan
Write-Host "CloudFront Distribution: $CF_DISTRIBUTION_ID" -ForegroundColor Cyan
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Create .env.production file
Write-Host "Creating .env.production..." -ForegroundColor Yellow
$envContent = @"
REACT_APP_API_URL=http://localhost:8080
REACT_APP_AWS_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod/chat
"@
$envContent | Out-File -FilePath frontend/.env.production -Encoding utf8
Write-Host "✓ .env.production created" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Go back to root
Set-Location ..

# Upload to S3
Write-Host "Uploading to S3..." -ForegroundColor Yellow
aws s3 sync frontend/build/ s3://$FRONTEND_BUCKET --delete
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ S3 upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Files uploaded to S3" -ForegroundColor Green
Write-Host ""

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $CF_DISTRIBUTION_ID --paths "/*"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ CloudFront invalidation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ CloudFront cache invalidated" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Frontend Deployed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: CloudFront may take 5-10 minutes to fully propagate changes." -ForegroundColor Yellow
Write-Host ""
