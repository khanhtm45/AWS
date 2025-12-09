# Auto-deploy script: Get backend IP and redeploy frontend
# This script automatically gets the latest backend IP and updates frontend

Write-Host "=== Auto Deploy Frontend with Latest Backend IP ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get backend task IP
Write-Host "Step 1: Getting backend IP..." -ForegroundColor Yellow
$taskArn = aws ecs list-tasks --cluster leaf-shop-cluster --service-name leaf-shop-backend-service --desired-status RUNNING --region ap-southeast-1 --query "taskArns[0]" --output text

if (-not $taskArn -or $taskArn -eq "None") {
    Write-Host "ERROR: No running backend task found!" -ForegroundColor Red
    exit 1
}

Write-Host "   Task ARN: $taskArn" -ForegroundColor Gray

$eniId = aws ecs describe-tasks --cluster leaf-shop-cluster --tasks $taskArn --region ap-southeast-1 --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" --output text

if (-not $eniId) {
    Write-Host "ERROR: Could not get network interface ID!" -ForegroundColor Red
    exit 1
}

Write-Host "   ENI ID: $eniId" -ForegroundColor Gray

$backendIp = aws ec2 describe-network-interfaces --network-interface-ids $eniId --region ap-southeast-1 --query "NetworkInterfaces[0].Association.PublicIp" --output text

if (-not $backendIp) {
    Write-Host "ERROR: Could not get backend IP!" -ForegroundColor Red
    exit 1
}

Write-Host "   Backend IP: $backendIp" -ForegroundColor Green
Write-Host ""

# Step 2: Update frontend .env.production
Write-Host "Step 2: Updating frontend .env.production..." -ForegroundColor Yellow
$envFile = "frontend/.env.production"
$newApiBase = "REACT_APP_API_BASE=http://${backendIp}:8080"

# Read current content
$content = Get-Content $envFile -Raw

# Replace API_BASE line
$content = $content -replace "REACT_APP_API_BASE=.*", $newApiBase

# Write back
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "   Updated: $newApiBase" -ForegroundColor Green
Write-Host ""

# Step 3: Build frontend
Write-Host "Step 3: Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
$buildResult = $LASTEXITCODE
Pop-Location

if ($buildResult -ne 0) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to S3
Write-Host "Step 4: Deploying to S3..." -ForegroundColor Yellow
Push-Location frontend
aws s3 sync build/ s3://leaf-shop-frontend-prod --delete
$deployResult = $LASTEXITCODE
Pop-Location

if ($deployResult -ne 0) {
    Write-Host "ERROR: S3 deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "   Deployed to S3 successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Invalidate CloudFront cache
Write-Host "Step 5: Invalidating CloudFront cache..." -ForegroundColor Yellow
$invalidation = aws cloudfront create-invalidation --distribution-id E3NSKGVI2PZDSM --paths "/*" --query "Invalidation.Id" --output text

if (-not $invalidation) {
    Write-Host "WARNING: CloudFront invalidation failed!" -ForegroundColor Yellow
} else {
    Write-Host "   Invalidation ID: $invalidation" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "   Backend IP: $backendIp" -ForegroundColor White
Write-Host "   Frontend URL: https://d25xrbd7dv8stn.cloudfront.net" -ForegroundColor White
Write-Host "   CloudFront Invalidation: $invalidation" -ForegroundColor White
Write-Host ""
Write-Host "NOTE: CloudFront cache invalidation may take 5-10 minutes" -ForegroundColor Yellow
Write-Host "      Use Ctrl+Shift+R or incognito mode to test immediately" -ForegroundColor Yellow
