# Force backend to use new Docker image by stopping current task

Write-Host "Getting current task ARN..."
$taskArn = aws ecs list-tasks --cluster leaf-shop-cluster --service-name leaf-shop-backend-service --region ap-southeast-1 --query "taskArns[0]" --output text

if ($taskArn -and $taskArn -ne "None") {
    Write-Host "Current task: $taskArn"
    Write-Host "Stopping task to force new deployment..."
    
    aws ecs stop-task --cluster leaf-shop-cluster --task $taskArn --region ap-southeast-1 --reason "Force pull new Docker image with CORS fix"
    
    Write-Host "Task stopped. ECS will automatically start a new task with the latest image."
    Write-Host "Wait 2-3 minutes for the new task to start and become healthy."
} else {
    Write-Host "No running task found"
}
