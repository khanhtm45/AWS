# Leaf Shop - Status Check Script
# Quick script to check the status of all deployed services

Write-Host "Leaf Shop - Status Check" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$AWS_REGION = "ap-southeast-1"
$ECS_CLUSTER = "leaf-shop-cluster"
$ECS_SERVICE = "leaf-shop-backend-service"

# Check Frontend
Write-Host "Frontend Status" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://d25xrbd7dv8stn.cloudfront.net" -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Frontend is UP" -ForegroundColor Green
        Write-Host "     URL: https://d25xrbd7dv8stn.cloudfront.net" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Frontend is DOWN" -ForegroundColor Red
}
Write-Host ""

# Check Backend
Write-Host "Backend Status" -ForegroundColor Yellow
Write-Host "--------------" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://54.254.222.113:8080/swagger-ui.html" -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Backend is UP" -ForegroundColor Green
        Write-Host "     API: http://54.254.222.113:8080" -ForegroundColor Gray
        Write-Host "     Swagger: http://54.254.222.113:8080/swagger-ui.html" -ForegroundColor Gray
    }
} catch {
    Write-Host "[FAIL] Backend is DOWN" -ForegroundColor Red
}
Write-Host ""

# Check ECS Service
Write-Host "ECS Service Status" -ForegroundColor Yellow
Write-Host "------------------" -ForegroundColor Yellow
try {
    $serviceJson = aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query "services[0]"
    $service = $serviceJson | ConvertFrom-Json
    
    Write-Host "Service: $($service.serviceName)" -ForegroundColor Gray
    Write-Host "Status: $($service.status)" -ForegroundColor Gray
    Write-Host "Desired: $($service.desiredCount) | Running: $($service.runningCount)" -ForegroundColor Gray
    
    if ($service.runningCount -eq $service.desiredCount) {
        Write-Host "[OK] All tasks are running" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Task count mismatch" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[FAIL] Could not fetch ECS service status" -ForegroundColor Red
}
Write-Host ""

# Check DynamoDB Tables
Write-Host "DynamoDB Tables" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow
$tables = @("leaf-shop-users", "leaf-shop-products", "leaf-shop-orders", "leaf-shop-payments")
foreach ($table in $tables) {
    try {
        $status = aws dynamodb describe-table --table-name $table --region $AWS_REGION --query "Table.TableStatus" --output text 2>&1
        if ($status -eq "ACTIVE") {
            Write-Host "[OK] $table" -ForegroundColor Green
        } else {
            Write-Host "[WARN] $table - Status: $status" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[FAIL] $table - Not found" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Quick Commands" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View backend logs:" -ForegroundColor Yellow
Write-Host "  aws logs tail /ecs/leaf-shop-backend --follow --region $AWS_REGION" -ForegroundColor Gray
Write-Host ""
Write-Host "Redeploy:" -ForegroundColor Yellow
Write-Host "  .\redeploy-all.ps1" -ForegroundColor Gray
Write-Host ""
