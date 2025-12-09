# Script to update API Gateway integration with new backend IP

Write-Host "🔄 Updating API Gateway integration with new backend IP..." -ForegroundColor Cyan

# Get current backend IP
$taskArn = aws ecs list-tasks --cluster leaf-shop-cluster --service-name leaf-shop-backend-service --region ap-southeast-1 --query 'taskArns[0]' --output text
$taskDetails = aws ecs describe-tasks --cluster leaf-shop-cluster --tasks $taskArn --region ap-southeast-1 --query 'tasks[0].attachments[0].details' --output json | ConvertFrom-Json
$eni = ($taskDetails | Where-Object { $_.name -eq 'networkInterfaceId' }).value
$publicIp = aws ec2 describe-network-interfaces --network-interface-ids $eni --region ap-southeast-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text

Write-Host "✅ Current Backend IP: $publicIp" -ForegroundColor Green

# API Gateway details
$apiId = "e00ymjj1i8"
$resourceId = "YOUR_RESOURCE_ID"  # Need to get this from AWS Console
$httpMethod = "ANY"

Write-Host "⚠️  Manual steps required:" -ForegroundColor Yellow
Write-Host "1. Go to API Gateway Console: https://ap-southeast-1.console.aws.amazon.com/apigateway/main/apis/$apiId/resources" -ForegroundColor White
Write-Host "2. Click on /{proxy+} resource" -ForegroundColor White
Write-Host "3. Click on ANY method" -ForegroundColor White
Write-Host "4. Click 'Integration Request'" -ForegroundColor White
Write-Host "5. Click 'Edit'" -ForegroundColor White
Write-Host "6. Update Endpoint URL to: http://${publicIp}:8080/{proxy}" -ForegroundColor White
Write-Host "7. Click 'Save'" -ForegroundColor White
Write-Host "8. Go to Actions → Deploy API → Select 'prod' stage → Deploy" -ForegroundColor White
Write-Host ""
Write-Host "📋 New Endpoint URL: http://${publicIp}:8080/{proxy}" -ForegroundColor Cyan
