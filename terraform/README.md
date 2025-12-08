# Terraform Deployment

This folder contains Terraform configuration for deploying:

- Backend to AWS ECS
- Frontend to AWS S3 + CloudFront

## Usage

1. Configure your AWS credentials.
2. Update variables in each module.
3. Run:
   ```
   terraform init
   terraform plan
   terraform apply
   ```
