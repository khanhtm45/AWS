# Quick deploy backend script
param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "🚀 Quick Deploy Backend v$Version" -ForegroundColor Cyan

# Build
Write-Host "`n📦 Building Docker image..." -ForegroundColor Yellow
cd backend
docker build -t leaf-shop-backend:v$Version .
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Build failed" -ForegroundColor Red; exit 1 }

# Login ECR
Write-Host "`n🔐 Logging into ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com
if ($LASTEXITCODE -ne 0) { Write-Host "❌ ECR login failed" -ForegroundColor Red; exit 1 }

# Tag and Push
Write-Host "`n📤 Pushing to ECR..." -ForegroundColor Yellow
docker tag leaf-shop-backend:v$Version 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:v$Version
docker push 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:v$Version
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Push failed" -ForegroundColor Red; exit 1 }

# Update task definition
Write-Host "`n📝 Updating task definition..." -ForegroundColor Yellow
cd ..
$taskDefContent = Get-Content backend-task-def-v2.7.json -Raw
$taskDefContent = $taskDefContent -replace 'leaf-shop-backend:v[\d\.]+', "leaf-shop-backend:v$Version"
$taskDefContent | Set-Content backend-task-def-v2.7.json

# Register and deploy
Write-Host "`n🚢 Deploying to ECS..." -ForegroundColor Yellow
$revision = aws ecs register-task-definition --cli-input-json file://backend-task-def-v2.7.json --region ap-southeast-1 --query 'taskDefinition.revision' --output text
Write-Host "✅ Task definition registered: revision $revision" -ForegroundColor Green

aws ecs update-service --cluster leaf-shop-cluster --service leaf-shop-backend-service --task-definition "leaf-shop-backend:$revision" --force-new-deployment --region ap-southeast-1 --no-cli-pager
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Deployment failed" -ForegroundColor Red; exit 1 }

Write-Host "`n⏳ Waiting for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

# Get new IP
Write-Host "`n🔍 Getting new backend IP..." -ForegroundColor Yellow
$taskArn = aws ecs list-tasks --cluster leaf-shop-cluster --service-name leaf-shop-backend-service --region ap-southeast-1 --query 'taskArns[0]' --output text
$taskDetails = aws ecs describe-tasks --cluster leaf-shop-cluster --tasks $taskArn --region ap-southeast-1 --query 'tasks[0].attachments[0].details' --output json | ConvertFrom-Json
$eni = ($taskDetails | Where-Object { $_.name -eq 'networkInterfaceId' }).value
$publicIp = aws ec2 describe-network-interfaces --network-interface-ids $eni --region ap-southeast-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text

Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "📍 New Backend IP: $publicIp" -ForegroundColor Cyan
Write-Host "`n⚠️  Don't forget to update API Gateway:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://ap-southeast-1.console.aws.amazon.com/apigateway/main/apis/e00ymjj1i8/resources" -ForegroundColor White
Write-Host "   2. Update Endpoint URL to: http://${publicIp}:8080/{proxy}" -ForegroundColor White
Write-Host "   3. Deploy API to 'prod' stage" -ForegroundColor White
