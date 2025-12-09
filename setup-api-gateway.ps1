# Setup API Gateway for Backend
# This provides HTTPS endpoint without needing certificates

Write-Host "=== Setup API Gateway for Leaf Shop Backend ===" -ForegroundColor Cyan
Write-Host ""

# Test permissions
Write-Host "Testing API Gateway permissions..." -ForegroundColor Yellow
$testResult = aws apigatewayv2 get-apis --region ap-southeast-1 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No API Gateway permissions!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add these policies to leaf-shop user in AWS Console:" -ForegroundColor Yellow
    Write-Host "1. AmazonAPIGatewayAdministrator (AWS managed policy)" -ForegroundColor White
    Write-Host "2. Or create custom policy with apigateway:* permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.aws.amazon.com/iam/" -ForegroundColor White
    Write-Host "2. Users -> leaf-shop -> Permissions" -ForegroundColor White
    Write-Host "3. Add permissions -> Attach policies directly" -ForegroundColor White
    Write-Host "4. Search: AmazonAPIGatewayAdministrator" -ForegroundColor White
    Write-Host "5. Click Add permissions" -ForegroundColor White
    exit 1
}

Write-Host "Permissions OK!" -ForegroundColor Green
Write-Host ""
Write-Host "Creating API Gateway..." -ForegroundColor Yellow
Write-Host "This will provide HTTPS endpoint for your backend" -ForegroundColor Gray
