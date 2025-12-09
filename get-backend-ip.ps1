# Get current backend IP from ECS task

$AWS_REGION = "ap-southeast-1"
$ECS_CLUSTER = "leaf-shop-cluster"
$ECS_SERVICE = "leaf-shop-backend-service"

Write-Host "Getting backend IP from ECS..." -ForegroundColor Cyan

try {
    # Get task ARN
    $taskArn = aws ecs list-tasks `
        --cluster $ECS_CLUSTER `
        --service-name $ECS_SERVICE `
        --region $AWS_REGION `
        --query 'taskArns[0]' `
        --output text

    if ([string]::IsNullOrEmpty($taskArn) -or $taskArn -eq "None") {
        Write-Host "No running tasks found" -ForegroundColor Red
        exit 1
    }

    # Get network interface ID
    $eniId = aws ecs describe-tasks `
        --cluster $ECS_CLUSTER `
        --tasks $taskArn `
        --region $AWS_REGION `
        --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' `
        --output text

    if ([string]::IsNullOrEmpty($eniId)) {
        Write-Host "Could not get network interface ID" -ForegroundColor Red
        exit 1
    }

    # Get public IP
    $publicIp = aws ec2 describe-network-interfaces `
        --network-interface-ids $eniId `
        --region $AWS_REGION `
        --query 'NetworkInterfaces[0].Association.PublicIp' `
        --output text

    if ([string]::IsNullOrEmpty($publicIp) -or $publicIp -eq "None") {
        Write-Host "Could not get public IP" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Backend IP: $publicIp" -ForegroundColor Green
    Write-Host "API URL: http://${publicIp}:8080" -ForegroundColor Green
    Write-Host "Swagger: http://${publicIp}:8080/swagger-ui.html" -ForegroundColor Green
    Write-Host ""
    
    # Test if backend is responding
    Write-Host "Testing backend..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://${publicIp}:8080/swagger-ui.html" -Method Head -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend is responding" -ForegroundColor Green
        }
    } catch {
        Write-Host "Backend is not responding yet (may still be starting)" -ForegroundColor Yellow
    }

    # Return IP for scripting
    return $publicIp

} catch {
    Write-Host "Error occurred" -ForegroundColor Red
    exit 1
}
