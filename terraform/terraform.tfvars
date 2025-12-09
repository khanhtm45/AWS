# AWS Configuration
aws_region     = "ap-southeast-1"
aws_account_id = "083011581293"
environment    = "prod"
project_name   = "leaf-shop"
domain_name    = "leafshop.com"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# ECS Configuration
ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 2
ecs_min_capacity  = 1
ecs_max_capacity  = 4
image_tag         = "latest"

# Redis Configuration
redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 2

# Lambda Configuration
bedrock_model_id = "anthropic.claude-3-haiku-20240307-v1:0"

# Secrets - TEMPORARY VALUES (Cập nhật sau)
jwt_secret        = "temporary-jwt-secret-change-me-in-production-12345678"
vnpay_tmn_code    = "SANDBOX_TMN_CODE"
vnpay_hash_secret = "SANDBOX_HASH_SECRET"
momo_partner_code = "SANDBOX_PARTNER_CODE"
momo_access_key   = "SANDBOX_ACCESS_KEY"
momo_secret_key   = "SANDBOX_SECRET_KEY"

# SSL Certificate (để trống - sẽ dùng CloudFront default)
certificate_arn = ""

# Domain aliases (để trống - chưa có domain)
domain_aliases = []
