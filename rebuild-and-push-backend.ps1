# Rebuild backend Docker image and push to ECR

Write-Host "Building backend Docker image..."
docker build -t leaf-shop-backend:latest backend/

Write-Host "Tagging image for ECR..."
docker tag leaf-shop-backend:latest 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest

Write-Host "Logging in to ECR..."
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com

Write-Host "Pushing image to ECR..."
docker push 083011581293.dkr.ecr.ap-southeast-1.amazonaws.com/leaf-shop-backend:latest

Write-Host "Done! Now stop the ECS task to force pull new image."
