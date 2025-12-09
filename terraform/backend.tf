# Terraform Backend Configuration
# Lưu trữ state file trên S3 với DynamoDB locking

terraform {
  backend "s3" {
    bucket         = "leaf-shop-terraform-state"
    key            = "leaf-shop/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    
    # Uncomment nếu muốn sử dụng versioning
    # versioning = true
  }
}

# Chú ý:
# 1. Tạo S3 bucket trước khi chạy terraform init:
#    aws s3 mb s3://leaf-shop-terraform-state --region ap-southeast-1
#
# 2. Enable versioning:
#    aws s3api put-bucket-versioning --bucket leaf-shop-terraform-state --versioning-configuration Status=Enabled
#
# 3. Tạo DynamoDB table cho state locking:
#    aws dynamodb create-table \
#      --table-name terraform-state-lock \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST \
#      --region ap-southeast-1
