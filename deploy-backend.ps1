# Script deploy Backend lên AWS ECS
# Yêu cầu: Docker Desktop đang chạy

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deploy Backend to AWS ECS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Get ECR repository URL from Terraform output
Write-Host "Getting ECR repository URL..." -ForegroundColor Yellow
$ECR_REPO = terraform -chdir=terraform output -raw ecr_repository_url
$AWS_REGION = "ap-southeast-1"
$AWS_ACCOUNT_ID = "083011581293"

Write-Host "ECR Repository: $ECR_REPO" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t leaf-shop-backend:latest backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green
Write-Host ""

# Tag image for ECR
Write-Host "Tagging image for ECR..." -ForegroundColor Yellow
docker tag leaf-shop-backend:latest "${ECR_REPO}:latest"
Write-Host "✓ Image tagged" -ForegroundColor Green
Write-Host ""

# Login to ECR
Write-Host "Logging in to ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ECR login failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Logged in to ECR" -ForegroundColor Green
Write-Host ""

# Push image to ECR
Write-Host "Pushing image to ECR..." -ForegroundColor Yellow
docker push "${ECR_REPO}:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image pushed to ECR" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Backend Docker Image Deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Image: ${ECR_REPO}:latest" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy ECS service (if not exists)" -ForegroundColor White
Write-Host "2. Or update existing ECS service to use new image" -ForegroundColor White
Write-Host ""
