# Script to update API Gateway VPC Link to point to new backend IP
# Since we don't have API Gateway permissions, we'll use AWS Console

Write-Host "🔄 Getting new backend IP..." -ForegroundColor Cyan

# Get current backend IP
$taskArn = aws ecs list-tasks --cluster leaf-shop-cluster --service-name leaf-shop-backend-service --region ap-southeast-1 --query 'taskArns[0]' --output text
$taskDetails = aws ecs describe-tasks --cluster leaf-shop-cluster --tasks $taskArn --region ap-southeast-1 --query 'tasks[0].attachments[0].details' --output json | ConvertFrom-Json
$eni = ($taskDetails | Where-Object { $_.name -eq 'networkInterfaceId' }).value
$publicIp = aws ec2 describe-network-interfaces --network-interface-ids $eni --region ap-southeast-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text

Write-Host ""
Write-Host "✅ New Backend IP: $publicIp" -ForegroundColor Green
Write-Host ""

# API Gateway details
$apiId = "e00ymjj1i8"
$region = "ap-southeast-1"

Write-Host "📋 API Gateway Update Instructions:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "1️⃣  Open API Gateway Console:" -ForegroundColor Cyan
Write-Host "   https://ap-southeast-1.console.aws.amazon.com/apigateway/main/apis/$apiId/resources" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Update Integration:" -ForegroundColor Cyan
Write-Host "   • Click on /{proxy+} resource" -ForegroundColor White
Write-Host "   • Click on ANY method" -ForegroundColor White
Write-Host "   • Click 'Integration Request'" -ForegroundColor White
Write-Host "   • Click 'Edit' button" -ForegroundColor White
Write-Host "   • Update Endpoint URL to:" -ForegroundColor White
Write-Host "     http://${publicIp}:8080/{proxy}" -ForegroundColor Green
Write-Host "   • Click 'Save'" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Deploy API:" -ForegroundColor Cyan
Write-Host "   • Click 'Actions' dropdown" -ForegroundColor White
Write-Host "   • Select 'Deploy API'" -ForegroundColor White
Write-Host "   • Choose stage: prod" -ForegroundColor White
Write-Host "   • Click 'Deploy'" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Quick Copy:" -ForegroundColor Yellow
Write-Host "New Endpoint: http://${publicIp}:8080/{proxy}" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 API Gateway URL: https://${apiId}.execute-api.${region}.amazonaws.com/prod" -ForegroundColor Cyan
Write-Host ""

# Test backend directly
Write-Host "🧪 Testing backend directly..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://${publicIp}:8080/api/products" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Tip: After updating API Gateway, test with:" -ForegroundColor Yellow
Write-Host "   curl https://${apiId}.execute-api.${region}.amazonaws.com/prod/api/products" -ForegroundColor White
Write-Host ""
