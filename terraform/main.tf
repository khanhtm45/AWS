# Simple Terraform configuration sử dụng resources hiện có
# Deploy nhanh với minimum setup

# ECR Repository
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "${var.project_name}-backend"
  }
}

# DynamoDB Tables
resource "aws_dynamodb_table" "users" {
  name           = "${var.project_name}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "email"
  
  attribute {
    name = "email"
    type = "S"
  }
  
  tags = {
    Name = "${var.project_name}-users"
  }
}

resource "aws_dynamodb_table" "products" {
  name           = "${var.project_name}-products"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "productId"
  
  attribute {
    name = "productId"
    type = "S"
  }
  
  tags = {
    Name = "${var.project_name}-products"
  }
}

resource "aws_dynamodb_table" "orders" {
  name           = "${var.project_name}-orders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "orderId"
  
  attribute {
    name = "orderId"
    type = "S"
  }
  
  tags = {
    Name = "${var.project_name}-orders"
  }
}

resource "aws_dynamodb_table" "payments" {
  name           = "${var.project_name}-payments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "paymentId"
  
  attribute {
    name = "paymentId"
    type = "S"
  }
  
  tags = {
    Name = "${var.project_name}-payments"
  }
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}"
  
  tags = {
    Name = "${var.project_name}-frontend"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PublicReadGetObject"
        Effect = "Allow"
        Principal = "*"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-${var.project_name}-frontend"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.project_name}-frontend"
    
    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name = "${var.project_name}-frontend-cdn"
  }
}

# Secrets Manager - Commented out due to permission issues
# Will be created manually or with proper IAM permissions
# resource "aws_secretsmanager_secret" "jwt_secret" {
#   name        = "${var.project_name}/jwt-secret"
#   description = "JWT Secret Key"
#   
#   tags = {
#     Name = "${var.project_name}-jwt-secret"
#   }
# }

# resource "aws_secretsmanager_secret_version" "jwt_secret" {
#   secret_id     = aws_secretsmanager_secret.jwt_secret.id
#   secret_string = var.jwt_secret
# }

# Outputs
output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_bucket_name" {
  description = "Frontend S3 Bucket Name"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_website_endpoint" {
  description = "Frontend Website Endpoint"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "cloudfront_domain_name" {
  description = "CloudFront Domain Name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "dynamodb_tables" {
  description = "DynamoDB Table Names"
  value = {
    users    = aws_dynamodb_table.users.name
    products = aws_dynamodb_table.products.name
    orders   = aws_dynamodb_table.orders.name
    payments = aws_dynamodb_table.payments.name
  }
}
