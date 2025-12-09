# Leaf Shop - Complete Redeployment Script
# This script rebuilds and redeploys both frontend and backend

Write-Host "🚀 Leaf Shop - Complete Redeployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$AWS_REGION = "ap-southeast-1"
$ECR_REGION = "ap-southeast-1"
$AWS_ACCOUNT_ID = "083011581293"
$ECR_REPO = "$AWS_ACCOUNT_ID.dkr.ecr.$ECR_REGION.amazonaws.com/leaf-shop-backend"
$S3_BUCKET = "leaf-shop-frontend-prod"
$ECS_CLUSTER = "leaf-shop-cluster"
$ECS_SERVICE = "leaf-shop-backend-service"

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Ask user what to deploy
Write-Host ""
Write-Host "What would you like to deploy?" -ForegroundColor Cyan
Write-Host "1. Backend only"
Write-Host "2. Frontend only"
Write-Host "3. Both (Full deployment)"
Write-Host ""
$choice = Read-Host "Enter your choice (1-3)"

$deployBackend = $false
$deployFrontend = $false

switch ($choice) {
    "1" { $deployBackend = $true }
    "2" { $deployFrontend = $true }
    "3" { 
        $deployBackend = $true
        $deployFrontend = $true
    }
    default {
        Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Deploy Backend
if ($deployBackend) {
    Write-Host ""
    Write-Host "📦 Deploying Backend..." -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    
    # Build Docker image
    Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
    Set-Location backend
    docker build --no-cache -t leaf-shop-backend:latest .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    Write-Host "✅ Docker image built" -ForegroundColor Green
    
    # Tag image
    Write-Host "🏷️  Tagging image..." -ForegroundColor Yellow
    docker tag leaf-shop-backend:latest $ECR_REPO`:latest
    Write-Host "✅ Image tagged" -ForegroundColor Green
    
    # Login to ECR
    Write-Host "🔐 Logging in to ECR..." -ForegroundColor Yellow
    $TOKEN = aws ecr get-login-password --region $ECR_REGION
    docker login --username AWS --password $TOKEN $ECR_REPO
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ECR login failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Logged in to ECR" -ForegroundColor Green
    
    # Push image
    Write-Host "⬆️  Pushing image to ECR..." -ForegroundColor Yellow
    docker push $ECR_REPO`:latest
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker push failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Image pushed to ECR" -ForegroundColor Green
    
    # Update ECS service
    Write-Host "🔄 Updating ECS service..." -ForegroundColor Yellow
    aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ECS update failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ ECS service updated" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ Backend deployment complete!" -ForegroundColor Green
    Write-Host "   Wait 2-3 minutes for the new task to start" -ForegroundColor Yellow
}

# Deploy Frontend
if ($deployFrontend) {
    Write-Host ""
    Write-Host "🌐 Deploying Frontend..." -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    
    # Build frontend
    Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
    Set-Location frontend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    Write-Host "✅ Frontend built" -ForegroundColor Green
    
    # Upload to S3
    Write-Host "⬆️  Uploading to S3..." -ForegroundColor Yellow
    aws s3 sync frontend/build/ s3://$S3_BUCKET --delete --region $AWS_REGION
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ S3 upload failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Frontend uploaded to S3" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ Frontend deployment complete!" -ForegroundColor Green
    Write-Host "   CloudFront URL: https://d25xrbd7dv8stn.cloudfront.net" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if ($deployFrontend) {
    Write-Host "Frontend: https://d25xrbd7dv8stn.cloudfront.net" -ForegroundColor Cyan
}

if ($deployBackend) {
    Write-Host "Backend API: http://54.254.222.113:8080" -ForegroundColor Cyan
    Write-Host "Swagger UI: http://54.254.222.113:8080/swagger-ui.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 View logs:" -ForegroundColor Yellow
    Write-Host "   aws logs tail /ecs/leaf-shop-backend --follow --region $AWS_REGION" -ForegroundColor Gray
}

Write-Host ""
