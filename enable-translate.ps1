# Script to enable AWS Translate after adding IAM permissions
# Run this AFTER you've added TranslateReadOnly policy to leaf-shop user in AWS Console

Write-Host "=== Enable AWS Translate for Leaf Shop ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Translate permissions
Write-Host "Step 1: Testing AWS Translate permissions..." -ForegroundColor Yellow
$testResult = aws translate list-languages --region us-east-1 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AWS Translate permissions not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add TranslateReadOnly policy to leaf-shop user:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/iam/" -ForegroundColor White
    Write-Host "2. Users -> leaf-shop" -ForegroundColor White
    Write-Host "3. Permissions tab -> Add permissions -> Attach policies directly" -ForegroundColor White
    Write-Host "4. Search and select: TranslateReadOnly" -ForegroundColor White
    Write-Host "5. Click Add permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "   AWS Translate permissions verified!" -ForegroundColor Green
Write-Host ""

# Step 2: Register new task definition with Translate enabled
Write-Host "Step 2: Registering task definition with Translate enabled..." -ForegroundColor Yellow
$taskDefArn = aws ecs register-task-definition --cli-input-json file://backend-task-def-v2.7.json --region ap-southeast-1 --query "taskDefinition.taskDefinitionArn" --output text

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to register task definition!" -ForegroundColor Red
    exit 1
}

Write-Host "   Task definition registered: $taskDefArn" -ForegroundColor Green
$revision = $taskDefArn.Split(":")[-1]
Write-Host ""

# Step 3: Update ECS service
Write-Host "Step 3: Updating ECS service..." -ForegroundColor Yellow
aws ecs update-service --cluster leaf-shop-cluster --service leaf-shop-backend-service --task-definition leaf-shop-backend:$revision --force-new-deployment --region ap-southeast-1 --query "service.serviceName" --output text

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to update service!" -ForegroundColor Red
    exit 1
}

Write-Host "   Service updated successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for deployment
Write-Host "Step 4: Waiting for deployment to complete (this may take 2-3 minutes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 120

$status = aws ecs describe-services --cluster leaf-shop-cluster --services leaf-shop-backend-service --region ap-southeast-1 --query "services[0].deployments[?status=='PRIMARY'].rolloutState" --output text

Write-Host "   Deployment status: $status" -ForegroundColor Green
Write-Host ""

Write-Host "=== AWS Translate Enabled Successfully ===" -ForegroundColor Green
Write-Host ""
Write-Host "Translation service is now active!" -ForegroundColor White
Write-Host "The application will automatically translate text between languages." -ForegroundColor White
Write-Host ""
Write-Host "To update frontend with new backend IP, run:" -ForegroundColor Yellow
Write-Host "   .\auto-deploy-with-new-ip.ps1" -ForegroundColor White
