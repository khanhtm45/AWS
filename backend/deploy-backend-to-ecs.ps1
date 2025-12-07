# Script: deploy-backend-to-ecs.ps1
# Deploy backend to AWS ECS/Fargate
# Yêu cầu: AWS CLI đã cấu hình, Docker đã cài đặt

param(
    [string]$AWS_REGION = "ap-southeast-1",
    [string]$ECR_REPO_NAME = "leaf-shop-backend",
    [string]$ECS_CLUSTER = "leaf-shop-cluster",
    [string]$ECS_SERVICE = "leaf-shop-backend-service",
    [string]$IMAGE_TAG = "latest"
)

# 1. Build Docker image
Write-Host "Building Docker image..."
docker build -t ${ECR_REPO_NAME}:$IMAGE_TAG .

# 2. Authenticate Docker to ECR
Write-Host "Authenticating Docker to ECR..."
$ecr_login = aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# 3. Create ECR repo if not exists
Write-Host "Creating ECR repository if not exists..."
aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $AWS_REGION 2>$null
if ($LASTEXITCODE -ne 0) {
    aws ecr create-repository --repository-name $ECR_REPO_NAME --region $AWS_REGION
}

# 4. Tag and push image to ECR
$account_id = aws sts get-caller-identity --query Account --output text
$ecr_uri = "$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
docker tag ${ECR_REPO_NAME}:$IMAGE_TAG ${ecr_uri}:$IMAGE_TAG
Write-Host "Pushing image to ECR..."
docker push ${ecr_uri}:$IMAGE_TAG

# 5. Update ECS service to use new image
Write-Host "Updating ECS service..."
$task_def_arn = aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION --query "services[0].taskDefinition" --output text
$task_def_json = aws ecs describe-task-definition --task-definition $task_def_arn --region $AWS_REGION --query "taskDefinition" | ConvertFrom-Json

# Update image in container definitions
foreach ($container in $task_def_json.containerDefinitions) {
    $container.image = "${ecr_uri}:$IMAGE_TAG"
}

# Register new task definition revision
$new_task_def = $task_def_json | ConvertTo-Json -Depth 10
$new_task_def_file = "new-task-def.json"
$new_task_def | Out-File -Encoding utf8 $new_task_def_file
$register_out = aws ecs register-task-definition --cli-input-json file://$new_task_def_file --region $AWS_REGION
$new_task_def_arn = ($register_out | ConvertFrom-Json).taskDefinition.taskDefinitionArn

# Update ECS service to use new task definition
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --task-definition $new_task_def_arn --region $AWS_REGION

Write-Host "Deployment completed!"
