# Hướng Dẫn Deploy Leaf Shop lên AWS bằng Terraform

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Yêu cầu trước khi bắt đầu](#2-yêu-cầu-trước-khi-bắt-đầu)
3. [Cấu trúc Terraform](#3-cấu-trúc-terraform)
4. [Deploy Backend (ECS Fargate)](#4-deploy-backend-ecs-fargate)
5. [Deploy Frontend (S3 + CloudFront)](#5-deploy-frontend-s3--cloudfront)
6. [Deploy Infrastructure (VPC, RDS, Redis)](#6-deploy-infrastructure)
7. [Deploy Lambda (Chatbot)](#7-deploy-lambda-chatbot)
8. [Cấu hình biến môi trường](#8-cấu-hình-biến-môi-trường)
9. [Chạy Terraform](#9-chạy-terraform)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Tổng quan kiến trúc

### Kiến trúc AWS với Terraform

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet Gateway                        │
└──────────────┬─────────────────────┬────────────────────────┘
               │                     │
        ┌──────▼──────┐       ┌─────▼──────┐
        │ CloudFront  │       │   Route 53 │
        │   + WAF     │       │    (DNS)   │
        └──────┬──────┘       └─────┬──────┘
               │                    │
        ┌──────▼──────┐       ┌─────▼──────────┐
        │     S3      │       │  ALB (Public)  │
        │  (Frontend) │       └─────┬──────────┘
        └─────────────┘             │
                              ┌─────▼─────────┐
                              │  ECS/Fargate  │
                              │   (Backend)   │
                              └─────┬─────────┘
                     ┌────────┬─────┴────┬──────────┐
                     │        │          │          │
              ┌──────▼─┐ ┌───▼────┐ ┌──▼────┐ ┌──▼──────┐
              │DynamoDB│ │ Redis  │ │  S3   │ │  Lambda │
              │        │ │(Cache) │ │(Files)│ │(Chatbot)│
              └────────┘ └────────┘ └───────┘ └─────────┘
```

### Các module Terraform

- **vpc**: VPC, Subnets, Internet Gateway, NAT Gateway
- **security-groups**: Security Groups cho ALB, ECS, RDS, Redis
- **iam**: IAM Roles và Policies
- **ecr**: Elastic Container Registry cho Docker images
- **ecs**: ECS Cluster, Task Definition, Service
- **alb**: Application Load Balancer
- **dynamodb**: DynamoDB Tables
- **elasticache**: Redis cluster
- **s3**: S3 buckets cho frontend và uploads
- **cloudfront**: CloudFront distribution
- **lambda**: Lambda function cho chatbot
- **ses**: Simple Email Service
- **secrets**: AWS Secrets Manager

---

## 2. Yêu cầu trước khi bắt đầu

### 2.1. Cài đặt công cụ

```powershell
# Terraform
winget install Hashicorp.Terraform

# AWS CLI
winget install Amazon.AWSCLI

# Docker Desktop
winget install Docker.DockerDesktop
```

### 2.2. Cấu hình AWS Credentials

```powershell
# Cấu hình AWS CLI
aws configure

# Hoặc sử dụng environment variables
$env:AWS_ACCESS_KEY_ID = "YOUR_ACCESS_KEY"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET_KEY"
$env:AWS_DEFAULT_REGION = "ap-southeast-1"
```

### 2.3. Tạo S3 Bucket cho Terraform State (Khuyến nghị)

```powershell
# Tạo bucket để lưu terraform state
aws s3 mb s3://leaf-shop-terraform-state --region ap-southeast-1

# Enable versioning
aws s3api put-bucket-versioning `
  --bucket leaf-shop-terraform-state `
  --versioning-configuration Status=Enabled
```

---

## 3. Cấu trúc Terraform

### Cấu trúc thư mục đề xuất

```
terraform/
├── main.tf                    # Root module
├── variables.tf               # Biến chung
├── outputs.tf                 # Outputs chung
├── provider.tf                # AWS provider config
├── backend.tf                 # Terraform backend config
├── terraform.tfvars           # Giá trị biến (không commit)
├── terraform.tfvars.example   # Template cho tfvars
│
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── security-groups/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── iam/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── ecr/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── ecs/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── alb/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── dynamodb/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── elasticache/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── s3/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── cloudfront/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── lambda/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── secrets/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    │
    └── prod/
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars
```

---

## 4. Deploy Backend (ECS Fargate)

### 4.1. Tạo file backend.tf (Terraform Backend)

```hcl
# terraform/backend.tf
terraform {
  backend "s3" {
    bucket         = "leaf-shop-terraform-state"
    key            = "leaf-shop/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

### 4.2. Cập nhật provider.tf

```hcl
# terraform/provider.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "LeafShop"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

### 4.3. Tạo variables.tf chung

```hcl
# terraform/variables.tf
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "leaf-shop"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "leafshop.com"
}
```

### 4.4. Cải thiện module VPC

```hcl
# terraform/modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets (for ECS tasks)
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Data Subnets (for RDS, Redis)
resource "aws_subnet" "data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-data-subnet-${count.index + 1}"
    Type = "Data"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table for Data Subnets
resource "aws_route_table" "data" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-data-rt"
  }
}

# Route Table Associations for Data Subnets
resource "aws_route_table_association" "data" {
  count          = length(aws_subnet.data)
  subnet_id      = aws_subnet.data[count.index].id
  route_table_id = aws_route_table.data.id
}
```

```hcl
# terraform/modules/vpc/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}
```

```hcl
# terraform/modules/vpc/outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "data_subnet_ids" {
  description = "Data subnet IDs"
  value       = aws_subnet.data[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}
```

### 4.5. Tạo module Security Groups

```hcl
# terraform/modules/security-groups/main.tf

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-sg"
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ecs-sg"
  }
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-sg"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from ECS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-redis-sg"
  }
}

# Lambda Security Group
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-lambda-sg"
  }
}
```

```hcl
# terraform/modules/security-groups/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}
```

```hcl
# terraform/modules/security-groups/outputs.tf
output "alb_sg_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "ECS Security Group ID"
  value       = aws_security_group.ecs.id
}

output "redis_sg_id" {
  description = "Redis Security Group ID"
  value       = aws_security_group.redis.id
}

output "lambda_sg_id" {
  description = "Lambda Security Group ID"
  value       = aws_security_group.lambda.id
}
```

### 4.6. Tạo module IAM

```hcl
# terraform/modules/iam/main.tf

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }
}

# Policy for ECS Task Role
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.project_name}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::${var.project_name}-uploads/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "translate:TranslateText"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.project_name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${var.project_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Execution Role
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-lambda-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}
```

```hcl
# terraform/modules/iam/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}
```

```hcl
# terraform/modules/iam/outputs.tf
output "ecs_task_execution_role_arn" {
  description = "ECS Task Execution Role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS Task Role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "lambda_role_arn" {
  description = "Lambda Execution Role ARN"
  value       = aws_iam_role.lambda.arn
}
```

### 4.7. Tạo module ECR

```hcl
# terraform/modules/ecr/main.tf
resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-backend"
  }
}

resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
```

```hcl
# terraform/modules/ecr/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}
```

```hcl
# terraform/modules/ecr/outputs.tf
output "repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "repository_arn" {
  description = "ECR Repository ARN"
  value       = aws_ecr_repository.backend.arn
}
```

### 4.8. Tạo module ALB

```hcl
# terraform/modules/alb/main.tf

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2              = true

  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/actuator/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-backend-tg"
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener (nếu có SSL certificate)
resource "aws_lb_listener" "https" {
  count             = var.certificate_arn != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# HTTP Listener forward (nếu không có SSL)
resource "aws_lb_listener" "http_forward" {
  count             = var.certificate_arn == "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}
```

```hcl
# terraform/modules/alb/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs"
  type        = list(string)
}

variable "alb_sg_id" {
  description = "ALB Security Group ID"
  type        = string
}

variable "certificate_arn" {
  description = "SSL Certificate ARN (optional)"
  type        = string
  default     = ""
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}
```

```hcl
# terraform/modules/alb/outputs.tf
output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = aws_lb.main.dns_name
}

output "target_group_arn" {
  description = "Target Group ARN"
  value       = aws_lb_target_group.backend.arn
}
```

### 4.9. Cải thiện module ECS

```hcl
# terraform/modules/ecs/main.tf

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-backend-logs"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-backend"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SPRING_PROFILES_ACTIVE"
          value = var.environment
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "REDIS_HOST"
          value = var.redis_endpoint
        },
        {
          name  = "REDIS_PORT"
          value = "6379"
        }
      ]

      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = "${var.secrets_arn_prefix}/jwt-secret"
        },
        {
          name      = "VNPAY_TMN_CODE"
          valueFrom = "${var.secrets_arn_prefix}/vnpay-tmn-code"
        },
        {
          name      = "VNPAY_HASH_SECRET"
          valueFrom = "${var.secrets_arn_prefix}/vnpay-hash-secret"
        },
        {
          name      = "MOMO_PARTNER_CODE"
          valueFrom = "${var.secrets_arn_prefix}/momo-partner-code"
        },
        {
          name      = "MOMO_ACCESS_KEY"
          valueFrom = "${var.secrets_arn_prefix}/momo-access-key"
        },
        {
          name      = "MOMO_SECRET_KEY"
          valueFrom = "${var.secrets_arn_prefix}/momo-secret-key"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-backend-task"
  }
}

# ECS Service
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "${var.project_name}-backend"
    container_port   = 8080
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name = "${var.project_name}-backend-service"
  }

  depends_on = [var.alb_listener_arn]
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${var.project_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "${var.project_name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

```hcl
# terraform/modules/ecs/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "ecs_sg_id" {
  description = "ECS Security Group ID"
  type        = string
}

variable "execution_role_arn" {
  description = "ECS Task Execution Role ARN"
  type        = string
}

variable "task_role_arn" {
  description = "ECS Task Role ARN"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR Repository URL"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "task_cpu" {
  description = "Task CPU units"
  type        = string
  default     = "1024"
}

variable "task_memory" {
  description = "Task memory (MB)"
  type        = string
  default     = "2048"
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 4
}

variable "target_group_arn" {
  description = "ALB Target Group ARN"
  type        = string
}

variable "alb_listener_arn" {
  description = "ALB Listener ARN"
  type        = string
}

variable "redis_endpoint" {
  description = "Redis endpoint"
  type        = string
}

variable "secrets_arn_prefix" {
  description = "Secrets Manager ARN prefix"
  type        = string
}
```

```hcl
# terraform/modules/ecs/outputs.tf
output "cluster_id" {
  description = "ECS Cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS Cluster Name"
  value       = aws_ecs_cluster.main.name
}

output "service_id" {
  description = "ECS Service ID"
  value       = aws_ecs_service.backend.id
}

output "service_name" {
  description = "ECS Service Name"
  value       = aws_ecs_service.backend.name
}

output "task_definition_arn" {
  description = "Task Definition ARN"
  value       = aws_ecs_task_definition.backend.arn
}
```

---

## 5. Deploy Frontend (S3 + CloudFront)

### 5.1. Cải thiện module S3

```hcl
# terraform/modules/s3/main.tf

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}"

  tags = {
    Name = "${var.project_name}-frontend"
  }
}

# Block Public Access (CloudFront sẽ access qua OAI)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket for Uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-uploads-${var.environment}"

  tags = {
    Name = "${var.project_name}-uploads"
  }
}

# CORS Configuration for Uploads
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Versioning for Uploads
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle Policy for Uploads
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "delete-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Bucket Policy for Uploads (allow ECS tasks)
resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSTaskRole"
        Effect = "Allow"
        Principal = {
          AWS = var.ecs_task_role_arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      }
    ]
  })
}
```

```hcl
# terraform/modules/s3/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "ecs_task_role_arn" {
  description = "ECS Task Role ARN"
  type        = string
}
```

```hcl
# terraform/modules/s3/outputs.tf
output "frontend_bucket_id" {
  description = "Frontend S3 Bucket ID"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_bucket_arn" {
  description = "Frontend S3 Bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_domain_name" {
  description = "Frontend S3 Bucket Domain Name"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "uploads_bucket_id" {
  description = "Uploads S3 Bucket ID"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  description = "Uploads S3 Bucket ARN"
  value       = aws_s3_bucket.uploads.arn
}
```

### 5.2. Cải thiện module CloudFront

```hcl
# terraform/modules/cloudfront/main.tf

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "${var.project_name} Frontend OAI"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "frontend" {
  bucket = var.frontend_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${var.frontend_bucket_arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} Frontend Distribution"
  default_root_object = "index.html"
  price_class         = var.price_class

  origin {
    domain_name = var.frontend_bucket_domain_name
    origin_id   = "S3-${var.project_name}-frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
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

  # Custom error response for SPA routing
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
    cloudfront_default_certificate = var.certificate_arn == "" ? true : false
    acm_certificate_arn            = var.certificate_arn != "" ? var.certificate_arn : null
    ssl_support_method             = var.certificate_arn != "" ? "sni-only" : null
    minimum_protocol_version       = var.certificate_arn != "" ? "TLSv1.2_2021" : null
  }

  aliases = var.domain_aliases

  tags = {
    Name = "${var.project_name}-frontend-cdn"
  }
}
```

```hcl
# terraform/modules/cloudfront/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "frontend_bucket_id" {
  description = "Frontend S3 Bucket ID"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "Frontend S3 Bucket ARN"
  type        = string
}

variable "frontend_bucket_domain_name" {
  description = "Frontend S3 Bucket Domain Name"
  type        = string
}

variable "certificate_arn" {
  description = "ACM Certificate ARN (optional)"
  type        = string
  default     = ""
}

variable "domain_aliases" {
  description = "Domain aliases for CloudFront"
  type        = list(string)
  default     = []
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}
```

```hcl
# terraform/modules/cloudfront/outputs.tf
output "distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_arn" {
  description = "CloudFront Distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "distribution_domain_name" {
  description = "CloudFront Distribution Domain Name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}
```

---

## 6. Deploy Infrastructure

### 6.1. Module DynamoDB

```hcl
# terraform/modules/dynamodb/main.tf

# User Table
resource "aws_dynamodb_table" "users" {
  name           = "${var.project_name}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "email"

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-users"
  }
}

# Product Table
resource "aws_dynamodb_table" "products" {
  name           = "${var.project_name}-products"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "productId"

  attribute {
    name = "productId"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "style"
    type = "S"
  }

  global_secondary_index {
    name            = "category-index"
    hash_key        = "category"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "style-index"
    hash_key        = "style"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-products"
  }
}

# Order Table
resource "aws_dynamodb_table" "orders" {
  name           = "${var.project_name}-orders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "paymentStatus"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-createdAt-index"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "paymentStatus-index"
    hash_key        = "paymentStatus"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-orders"
  }
}

# Payment Table
resource "aws_dynamodb_table" "payments" {
  name           = "${var.project_name}-payments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "paymentId"

  attribute {
    name = "paymentId"
    type = "S"
  }

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "transactionId"
    type = "S"
  }

  global_secondary_index {
    name            = "orderId-index"
    hash_key        = "orderId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "transactionId-index"
    hash_key        = "transactionId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-payments"
  }
}

# Staff Table
resource "aws_dynamodb_table" "staff" {
  name           = "${var.project_name}-staff"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "username"

  attribute {
    name = "username"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-staff"
  }
}
```

```hcl
# terraform/modules/dynamodb/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}
```

```hcl
# terraform/modules/dynamodb/outputs.tf
output "users_table_name" {
  description = "Users Table Name"
  value       = aws_dynamodb_table.users.name
}

output "products_table_name" {
  description = "Products Table Name"
  value       = aws_dynamodb_table.products.name
}

output "orders_table_name" {
  description = "Orders Table Name"
  value       = aws_dynamodb_table.orders.name
}

output "payments_table_name" {
  description = "Payments Table Name"
  value       = aws_dynamodb_table.payments.name
}

output "staff_table_name" {
  description = "Staff Table Name"
  value       = aws_dynamodb_table.staff.name
}
```

### 6.2. Module ElastiCache (Redis)

```hcl
# terraform/modules/elasticache/main.tf

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project_name}-redis-subnet-group"
  subnet_ids = var.data_subnet_ids

  tags = {
    Name = "${var.project_name}-redis-subnet-group"
  }
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.project_name}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Name = "${var.project_name}-redis-params"
  }
}

# ElastiCache Replication Group
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.project_name}-redis"
  replication_group_description = "${var.project_name} Redis cluster"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [var.redis_sg_id]
  automatic_failover_enabled = var.num_cache_nodes > 1 ? true : false
  multi_az_enabled           = var.num_cache_nodes > 1 ? true : false
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false  # Set to true if needed
  snapshot_retention_limit   = 5
  snapshot_window            = "03:00-05:00"
  maintenance_window         = "mon:05:00-mon:07:00"

  tags = {
    Name = "${var.project_name}-redis"
  }
}
```

```hcl
# terraform/modules/elasticache/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "data_subnet_ids" {
  description = "Data subnet IDs"
  type        = list(string)
}

variable "redis_sg_id" {
  description = "Redis Security Group ID"
  type        = string
}

variable "node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}
```

```hcl
# terraform/modules/elasticache/outputs.tf
output "redis_endpoint" {
  description = "Redis Primary Endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_port" {
  description = "Redis Port"
  value       = aws_elasticache_replication_group.redis.port
}

output "redis_configuration_endpoint" {
  description = "Redis Configuration Endpoint"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}
```

---

## 7. Deploy Lambda (Chatbot)

### 7.1. Module Lambda

```hcl
# terraform/modules/lambda/main.tf

# Lambda Function
resource "aws_lambda_function" "chatbot" {
  filename         = var.lambda_zip_path
  function_name    = "${var.project_name}-chatbot"
  role             = var.lambda_role_arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      AWS_REGION         = var.aws_region
      BEDROCK_MODEL_ID   = var.bedrock_model_id
      BACKEND_API_URL    = var.backend_api_url
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_sg_id]
  }

  tags = {
    Name = "${var.project_name}-chatbot"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chatbot.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "chatbot" {
  name              = "/aws/lambda/${aws_lambda_function.chatbot.function_name}"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-chatbot-logs"
  }
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "chatbot" {
  name        = "${var.project_name}-chatbot-api"
  description = "API Gateway for Chatbot Lambda"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-chatbot-api"
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "chat" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  parent_id   = aws_api_gateway_rest_api.chatbot.root_resource_id
  path_part   = "chat"
}

# API Gateway Method
resource "aws_api_gateway_method" "chat_post" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot.id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "chat_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.chatbot.id
  resource_id             = aws_api_gateway_resource.chat.id
  http_method             = aws_api_gateway_method.chat_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.chatbot.invoke_arn
}

# API Gateway CORS
resource "aws_api_gateway_method" "chat_options" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot.id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  status_code = aws_api_gateway_method_response.chat_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "chatbot" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.chat.id,
      aws_api_gateway_method.chat_post.id,
      aws_api_gateway_integration.chat_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.chat_lambda,
    aws_api_gateway_integration.chat_options
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.chatbot.id
  rest_api_id   = aws_api_gateway_rest_api.chatbot.id
  stage_name    = "prod"

  tags = {
    Name = "${var.project_name}-chatbot-api-prod"
  }
}
```

```hcl
# terraform/modules/lambda/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "lambda_role_arn" {
  description = "Lambda Execution Role ARN"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment package"
  type        = string
}

variable "bedrock_model_id" {
  description = "Bedrock Model ID"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "backend_api_url" {
  description = "Backend API URL"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "lambda_sg_id" {
  description = "Lambda Security Group ID"
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "API Gateway Execution ARN"
  type        = string
  default     = ""
}
```

```hcl
# terraform/modules/lambda/outputs.tf
output "function_name" {
  description = "Lambda Function Name"
  value       = aws_lambda_function.chatbot.function_name
}

output "function_arn" {
  description = "Lambda Function ARN"
  value       = aws_lambda_function.chatbot.arn
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/chat"
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.chatbot.id
}
```

### 7.2. Module Secrets Manager

```hcl
# terraform/modules/secrets/main.tf

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.project_name}/jwt-secret"
  description = "JWT Secret Key"

  tags = {
    Name = "${var.project_name}-jwt-secret"
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# VNPay Credentials
resource "aws_secretsmanager_secret" "vnpay_tmn_code" {
  name        = "${var.project_name}/vnpay-tmn-code"
  description = "VNPay TMN Code"

  tags = {
    Name = "${var.project_name}-vnpay-tmn-code"
  }
}

resource "aws_secretsmanager_secret_version" "vnpay_tmn_code" {
  secret_id     = aws_secretsmanager_secret.vnpay_tmn_code.id
  secret_string = var.vnpay_tmn_code
}

resource "aws_secretsmanager_secret" "vnpay_hash_secret" {
  name        = "${var.project_name}/vnpay-hash-secret"
  description = "VNPay Hash Secret"

  tags = {
    Name = "${var.project_name}-vnpay-hash-secret"
  }
}

resource "aws_secretsmanager_secret_version" "vnpay_hash_secret" {
  secret_id     = aws_secretsmanager_secret.vnpay_hash_secret.id
  secret_string = var.vnpay_hash_secret
}

# MoMo Credentials
resource "aws_secretsmanager_secret" "momo_partner_code" {
  name        = "${var.project_name}/momo-partner-code"
  description = "MoMo Partner Code"

  tags = {
    Name = "${var.project_name}-momo-partner-code"
  }
}

resource "aws_secretsmanager_secret_version" "momo_partner_code" {
  secret_id     = aws_secretsmanager_secret.momo_partner_code.id
  secret_string = var.momo_partner_code
}

resource "aws_secretsmanager_secret" "momo_access_key" {
  name        = "${var.project_name}/momo-access-key"
  description = "MoMo Access Key"

  tags = {
    Name = "${var.project_name}-momo-access-key"
  }
}

resource "aws_secretsmanager_secret_version" "momo_access_key" {
  secret_id     = aws_secretsmanager_secret.momo_access_key.id
  secret_string = var.momo_access_key
}

resource "aws_secretsmanager_secret" "momo_secret_key" {
  name        = "${var.project_name}/momo-secret-key"
  description = "MoMo Secret Key"

  tags = {
    Name = "${var.project_name}-momo-secret-key"
  }
}

resource "aws_secretsmanager_secret_version" "momo_secret_key" {
  secret_id     = aws_secretsmanager_secret.momo_secret_key.id
  secret_string = var.momo_secret_key
}
```

```hcl
# terraform/modules/secrets/variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "jwt_secret" {
  description = "JWT Secret"
  type        = string
  sensitive   = true
}

variable "vnpay_tmn_code" {
  description = "VNPay TMN Code"
  type        = string
  sensitive   = true
}

variable "vnpay_hash_secret" {
  description = "VNPay Hash Secret"
  type        = string
  sensitive   = true
}

variable "momo_partner_code" {
  description = "MoMo Partner Code"
  type        = string
  sensitive   = true
}

variable "momo_access_key" {
  description = "MoMo Access Key"
  type        = string
  sensitive   = true
}

variable "momo_secret_key" {
  description = "MoMo Secret Key"
  type        = string
  sensitive   = true
}
```

```hcl
# terraform/modules/secrets/outputs.tf
output "secrets_arn_prefix" {
  description = "Secrets Manager ARN Prefix"
  value       = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
```

---

## 8. Cấu hình biến môi trường

### 8.1. Tạo terraform.tfvars

```hcl
# terraform/terraform.tfvars
aws_region     = "ap-southeast-1"
aws_account_id = "123456789012"  # Thay bằng AWS Account ID của bạn
environment    = "prod"
project_name   = "leaf-shop"
domain_name    = "leafshop.com"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# ECS Configuration
ecs_task_cpu    = "1024"
ecs_task_memory = "2048"
ecs_desired_count = 2
ecs_min_capacity  = 1
ecs_max_capacity  = 4
image_tag         = "latest"

# Redis Configuration
redis_node_type      = "cache.t3.micro"
redis_num_cache_nodes = 2

# Lambda Configuration
bedrock_model_id = "anthropic.claude-3-haiku-20240307-v1:0"

# Secrets (KHÔNG commit file này vào git!)
jwt_secret          = "your-jwt-secret-key-here"
vnpay_tmn_code      = "your-vnpay-tmn-code"
vnpay_hash_secret   = "your-vnpay-hash-secret"
momo_partner_code   = "your-momo-partner-code"
momo_access_key     = "your-momo-access-key"
momo_secret_key     = "your-momo-secret-key"

# SSL Certificate (optional)
certificate_arn = ""  # ARN của ACM certificate nếu có

# Domain aliases for CloudFront (optional)
domain_aliases = []  # ["www.leafshop.com", "leafshop.com"]
```

### 8.2. Tạo terraform.tfvars.example

```hcl
# terraform/terraform.tfvars.example
aws_region     = "ap-southeast-1"
aws_account_id = "YOUR_AWS_ACCOUNT_ID"
environment    = "prod"
project_name   = "leaf-shop"
domain_name    = "leafshop.com"

vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

ecs_task_cpu      = "1024"
ecs_task_memory   = "2048"
ecs_desired_count = 2
ecs_min_capacity  = 1
ecs_max_capacity  = 4
image_tag         = "latest"

redis_node_type       = "cache.t3.micro"
redis_num_cache_nodes = 2

bedrock_model_id = "anthropic.claude-3-haiku-20240307-v1:0"

jwt_secret        = "CHANGE_ME"
vnpay_tmn_code    = "CHANGE_ME"
vnpay_hash_secret = "CHANGE_ME"
momo_partner_code = "CHANGE_ME"
momo_access_key   = "CHANGE_ME"
momo_secret_key   = "CHANGE_ME"

certificate_arn = ""
domain_aliases  = []
```

### 8.3. Cập nhật .gitignore

```
# terraform/.gitignore
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
terraform.tfvars
*.tfvars
!terraform.tfvars.example
crash.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
```

---

## 9. Chạy Terraform

### 9.1. Tạo file main.tf tổng hợp

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "leaf-shop-terraform-state"
    key            = "leaf-shop/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name   = var.project_name
  aws_region     = var.aws_region
  aws_account_id = var.aws_account_id
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
}

# Secrets Module
module "secrets" {
  source = "./modules/secrets"

  project_name      = var.project_name
  jwt_secret        = var.jwt_secret
  vnpay_tmn_code    = var.vnpay_tmn_code
  vnpay_hash_secret = var.vnpay_hash_secret
  momo_partner_code = var.momo_partner_code
  momo_access_key   = var.momo_access_key
  momo_secret_key   = var.momo_secret_key
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name = var.project_name
}

# ElastiCache Module
module "elasticache" {
  source = "./modules/elasticache"

  project_name      = var.project_name
  data_subnet_ids   = module.vpc.data_subnet_ids
  redis_sg_id       = module.security_groups.redis_sg_id
  node_type         = var.redis_node_type
  num_cache_nodes   = var.redis_num_cache_nodes
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  project_name      = var.project_name
  environment       = var.environment
  allowed_origins   = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
  ecs_task_role_arn = module.iam.ecs_task_role_arn
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name                 = var.project_name
  frontend_bucket_id           = module.s3.frontend_bucket_id
  frontend_bucket_arn          = module.s3.frontend_bucket_arn
  frontend_bucket_domain_name  = module.s3.frontend_bucket_domain_name
  certificate_arn              = var.certificate_arn
  domain_aliases               = var.domain_aliases
}

# ALB Module
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  alb_sg_id          = module.security_groups.alb_sg_id
  certificate_arn    = var.certificate_arn
}

# ECS Module
module "ecs" {
  source = "./modules/ecs"

  project_name         = var.project_name
  environment          = var.environment
  aws_region           = var.aws_region
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  ecs_sg_id            = module.security_groups.ecs_sg_id
  execution_role_arn   = module.iam.ecs_task_execution_role_arn
  task_role_arn        = module.iam.ecs_task_role_arn
  ecr_repository_url   = module.ecr.repository_url
  image_tag            = var.image_tag
  task_cpu             = var.ecs_task_cpu
  task_memory          = var.ecs_task_memory
  desired_count        = var.ecs_desired_count
  min_capacity         = var.ecs_min_capacity
  max_capacity         = var.ecs_max_capacity
  target_group_arn     = module.alb.target_group_arn
  alb_listener_arn     = module.alb.alb_arn
  redis_endpoint       = module.elasticache.redis_endpoint
  secrets_arn_prefix   = module.secrets.secrets_arn_prefix
}

# Lambda Module (Chatbot)
module "lambda" {
  source = "./modules/lambda"

  project_name       = var.project_name
  aws_region         = var.aws_region
  lambda_role_arn    = module.iam.lambda_role_arn
  lambda_zip_path    = "${path.module}/../frontend/lambda_function.zip"
  bedrock_model_id   = var.bedrock_model_id
  backend_api_url    = "https://${module.alb.alb_dns_name}"
  private_subnet_ids = module.vpc.private_subnet_ids
  lambda_sg_id       = module.security_groups.lambda_sg_id
  api_gateway_execution_arn = ""
}
```

### 9.2. Tạo outputs.tf

```hcl
# terraform/outputs.tf

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

# ECR Outputs
output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = module.ecr.repository_url
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = module.alb.alb_dns_name
}

output "backend_url" {
  description = "Backend URL"
  value       = var.certificate_arn != "" ? "https://${module.alb.alb_dns_name}" : "http://${module.alb.alb_dns_name}"
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS Cluster Name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS Service Name"
  value       = module.ecs.service_name
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront Domain Name"
  value       = module.cloudfront.distribution_domain_name
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${module.cloudfront.distribution_domain_name}"
}

# S3 Outputs
output "frontend_bucket_name" {
  description = "Frontend S3 Bucket Name"
  value       = module.s3.frontend_bucket_id
}

output "uploads_bucket_name" {
  description = "Uploads S3 Bucket Name"
  value       = module.s3.uploads_bucket_id
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis Endpoint"
  value       = module.elasticache.redis_endpoint
}

# DynamoDB Outputs
output "dynamodb_tables" {
  description = "DynamoDB Table Names"
  value = {
    users    = module.dynamodb.users_table_name
    products = module.dynamodb.products_table_name
    orders   = module.dynamodb.orders_table_name
    payments = module.dynamodb.payments_table_name
    staff    = module.dynamodb.staff_table_name
  }
}

# Lambda Outputs
output "chatbot_api_url" {
  description = "Chatbot API URL"
  value       = module.lambda.api_gateway_url
}

# Deployment Instructions
output "deployment_instructions" {
  description = "Next steps for deployment"
  value = <<-EOT

    ========================================
    Terraform Deployment Completed!
    ========================================

    Next Steps:

    1. Build and Push Docker Image:
       cd ../backend
       docker build -t ${module.ecr.repository_url}:latest .
       aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${module.ecr.repository_url}
       docker push ${module.ecr.repository_url}:latest

    2. Update ECS Service (if needed):
       aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.ecs.service_name} --force-new-deployment --region ${var.aws_region}

    3. Build and Deploy Frontend:
       cd ../frontend
       npm run build
       aws s3 sync build/ s3://${module.s3.frontend_bucket_id} --delete
       aws cloudfront create-invalidation --distribution-id ${module.cloudfront.distribution_id} --paths "/*"

    4. Package and Deploy Lambda:
       cd ../frontend
       zip lambda_function.zip lambda_function.py
       aws lambda update-function-code --function-name ${module.lambda.function_name} --zip-file fileb://lambda_function.zip --region ${var.aws_region}

    5. Access Your Application:
       - Backend API: ${var.certificate_arn != "" ? "https://${module.alb.alb_dns_name}" : "http://${module.alb.alb_dns_name}"}
       - Frontend: https://${module.cloudfront.distribution_domain_name}
       - Chatbot API: ${module.lambda.api_gateway_url}

    6. Configure Frontend Environment:
       Update frontend/.env.production:
       REACT_APP_API_URL=${var.certificate_arn != "" ? "https://${module.alb.alb_dns_name}" : "http://${module.alb.alb_dns_name}"}
       REACT_APP_AWS_API_ENDPOINT=${module.lambda.api_gateway_url}

    ========================================
  EOT
}
```

### 9.3. Các bước deploy

#### Bước 1: Chuẩn bị

```powershell
# Clone repository
git clone https://github.com/your-repo/leaf-shop.git
cd leaf-shop/terraform

# Copy và cấu hình terraform.tfvars
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars với thông tin của bạn
```

#### Bước 2: Tạo S3 bucket cho Terraform state

```powershell
# Tạo bucket
aws s3 mb s3://leaf-shop-terraform-state --region ap-southeast-1

# Enable versioning
aws s3api put-bucket-versioning `
  --bucket leaf-shop-terraform-state `
  --versioning-configuration Status=Enabled

# Tạo DynamoDB table cho state locking
aws dynamodb create-table `
  --table-name terraform-state-lock `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region ap-southeast-1
```

#### Bước 3: Package Lambda function

```powershell
cd ../frontend
# Tạo zip file cho Lambda
Compress-Archive -Path lambda_function.py -DestinationPath lambda_function.zip -Force
cd ../terraform
```

#### Bước 4: Initialize Terraform

```powershell
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive
```

#### Bước 5: Plan và Apply

```powershell
# Review changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Hoặc apply trực tiếp (sẽ hỏi xác nhận)
terraform apply
```

#### Bước 6: Build và Push Docker Image

```powershell
# Get ECR repository URL from Terraform output
$ECR_REPO = terraform output -raw ecr_repository_url
$AWS_REGION = "ap-southeast-1"

# Build Docker image
cd ../backend
docker build -t leaf-shop-backend:latest .

# Tag image
docker tag leaf-shop-backend:latest "${ECR_REPO}:latest"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Push image
docker push "${ECR_REPO}:latest"
```

#### Bước 7: Force ECS Service Update

```powershell
# Get cluster and service names
cd ../terraform
$CLUSTER_NAME = terraform output -raw ecs_cluster_name
$SERVICE_NAME = terraform output -raw ecs_service_name

# Force new deployment
aws ecs update-service `
  --cluster $CLUSTER_NAME `
  --service $SERVICE_NAME `
  --force-new-deployment `
  --region $AWS_REGION
```

#### Bước 8: Build và Deploy Frontend

```powershell
# Get S3 bucket and CloudFront distribution ID
$FRONTEND_BUCKET = terraform output -raw frontend_bucket_name
$CF_DISTRIBUTION_ID = terraform output -raw cloudfront_distribution_id
$BACKEND_URL = terraform output -raw backend_url
$CHATBOT_API_URL = terraform output -raw chatbot_api_url

# Build frontend
cd ../frontend

# Create .env.production
@"
REACT_APP_API_URL=$BACKEND_URL
REACT_APP_AWS_API_ENDPOINT=$CHATBOT_API_URL
"@ | Out-File -FilePath .env.production -Encoding utf8

# Install dependencies and build
npm install
npm run build

# Deploy to S3
aws s3 sync build/ s3://$FRONTEND_BUCKET --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation `
  --distribution-id $CF_DISTRIBUTION_ID `
  --paths "/*"
```

#### Bước 9: Verify Deployment

```powershell
# Check ECS service status
aws ecs describe-services `
  --cluster $CLUSTER_NAME `
  --services $SERVICE_NAME `
  --region $AWS_REGION

# Check ECS tasks
aws ecs list-tasks `
  --cluster $CLUSTER_NAME `
  --service-name $SERVICE_NAME `
  --region $AWS_REGION

# Get ALB DNS name
$ALB_DNS = terraform output -raw alb_dns_name
Write-Host "Backend URL: http://$ALB_DNS"

# Get CloudFront domain
$CF_DOMAIN = terraform output -raw cloudfront_domain_name
Write-Host "Frontend URL: https://$CF_DOMAIN"

# Test backend health
curl "http://$ALB_DNS/actuator/health"

# Test frontend
Start-Process "https://$CF_DOMAIN"
```

---

## 10. Troubleshooting

### 10.1. Terraform Errors

**Error: "Error acquiring the state lock"**

```powershell
# Force unlock (chỉ khi chắc chắn không có terraform đang chạy)
terraform force-unlock <LOCK_ID>
```

**Error: "No valid credential sources found"**

```powershell
# Cấu hình lại AWS credentials
aws configure

# Hoặc set environment variables
$env:AWS_ACCESS_KEY_ID = "YOUR_KEY"
$env:AWS_SECRET_ACCESS_KEY = "YOUR_SECRET"
```

**Error: "InvalidParameterException: The new ARN and resource type does not match the existing ARN and resource type"**

```powershell
# Xóa secret cũ và tạo lại
aws secretsmanager delete-secret --secret-id leaf-shop/jwt-secret --force-delete-without-recovery
terraform apply
```

### 10.2. ECS Task Errors

**Task fails to start**

```powershell
# Check task logs
$TASK_ARN = aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME --query 'taskArns[0]' --output text
aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks $TASK_ARN

# Check CloudWatch logs
aws logs tail /ecs/leaf-shop-backend --follow
```

**Cannot pull image from ECR**

```powershell
# Verify image exists
aws ecr describe-images --repository-name leaf-shop-backend

# Check task execution role permissions
aws iam get-role-policy --role-name leaf-shop-ecs-task-execution-role --policy-name AmazonECSTaskExecutionRolePolicy
```

**Task health check failing**

```powershell
# Check if application is listening on port 8080
# Verify health check endpoint exists: /actuator/health
# Check security group allows traffic from ALB
```

### 10.3. ALB Issues

**502 Bad Gateway**

```powershell
# Check target health
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>

# Verify ECS tasks are running
aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_NAME

# Check security group rules
aws ec2 describe-security-groups --group-ids <ECS_SG_ID>
```

**504 Gateway Timeout**

```powershell
# Increase ALB timeout (default 60s)
# Check application response time
# Verify database/Redis connectivity
```

### 10.4. CloudFront Issues

**403 Forbidden**

```powershell
# Verify S3 bucket policy allows CloudFront OAI
aws s3api get-bucket-policy --bucket $FRONTEND_BUCKET

# Check CloudFront origin settings
aws cloudfront get-distribution --id $CF_DISTRIBUTION_ID
```

**Old content still showing**

```powershell
# Create invalidation
aws cloudfront create-invalidation --distribution-id $CF_DISTRIBUTION_ID --paths "/*"

# Check invalidation status
aws cloudfront list-invalidations --distribution-id $CF_DISTRIBUTION_ID
```

### 10.5. Lambda Issues

**Function timeout**

```powershell
# Increase timeout in terraform/modules/lambda/main.tf
# timeout = 60  # seconds

# Check CloudWatch logs
aws logs tail /aws/lambda/leaf-shop-chatbot --follow
```

**Cannot access Bedrock**

```powershell
# Verify Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Check IAM role permissions
aws iam get-role-policy --role-name leaf-shop-lambda-role --policy-name leaf-shop-lambda-policy
```

**VPC connectivity issues**

```powershell
# Verify Lambda has internet access via NAT Gateway
# Check security group allows outbound traffic
# Verify subnet route table has route to NAT Gateway
```

### 10.6. Redis Connection Issues

**Cannot connect to Redis**

```powershell
# Get Redis endpoint
$REDIS_ENDPOINT = terraform output -raw redis_endpoint

# Test from ECS task
aws ecs execute-command `
  --cluster $CLUSTER_NAME `
  --task <TASK_ID> `
  --container leaf-shop-backend `
  --interactive `
  --command "/bin/bash"

# Inside container:
apt-get update && apt-get install -y telnet
telnet $REDIS_ENDPOINT 6379
```

**Redis memory issues**

```powershell
# Check Redis metrics in CloudWatch
# Consider upgrading node type or adding more nodes
# Review maxmemory-policy setting
```

### 10.7. DynamoDB Issues

**ProvisionedThroughputExceededException**

```powershell
# Switch to on-demand billing mode (already configured)
# Or increase provisioned capacity

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics `
  --namespace AWS/DynamoDB `
  --metric-name ConsumedReadCapacityUnits `
  --dimensions Name=TableName,Value=leaf-shop-users `
  --start-time 2024-01-01T00:00:00Z `
  --end-time 2024-01-02T00:00:00Z `
  --period 3600 `
  --statistics Sum
```

### 10.8. Cost Optimization

**Reduce NAT Gateway costs**

```powershell
# Option 1: Use single NAT Gateway (not recommended for production)
# Modify terraform/modules/vpc/main.tf to create only 1 NAT Gateway

# Option 2: Use VPC Endpoints for AWS services
# Add VPC endpoints for S3, DynamoDB, etc.
```

**Reduce ECS costs**

```powershell
# Use Fargate Spot for non-production
# Reduce task count during off-peak hours
# Right-size task CPU and memory
```

**Reduce CloudFront costs**

```powershell
# Use PriceClass_100 (North America and Europe only)
# Already configured in terraform/modules/cloudfront/variables.tf
```

---

## 11. Cập nhật và Bảo trì

### 11.1. Update Docker Image

```powershell
# Build new image
cd backend
docker build -t leaf-shop-backend:v2.0 .

# Tag and push
$ECR_REPO = terraform output -raw ecr_repository_url
docker tag leaf-shop-backend:v2.0 "${ECR_REPO}:v2.0"
docker tag leaf-shop-backend:v2.0 "${ECR_REPO}:latest"
docker push "${ECR_REPO}:v2.0"
docker push "${ECR_REPO}:latest"

# Update ECS service
cd ../terraform
aws ecs update-service `
  --cluster $(terraform output -raw ecs_cluster_name) `
  --service $(terraform output -raw ecs_service_name) `
  --force-new-deployment
```

### 11.2. Update Frontend

```powershell
cd frontend
npm run build

$FRONTEND_BUCKET = terraform output -raw frontend_bucket_name
$CF_DISTRIBUTION_ID = terraform output -raw cloudfront_distribution_id

aws s3 sync build/ s3://$FRONTEND_BUCKET --delete
aws cloudfront create-invalidation --distribution-id $CF_DISTRIBUTION_ID --paths "/*"
```

### 11.3. Update Lambda Function

```powershell
cd frontend
# Update lambda_function.py
zip lambda_function.zip lambda_function.py

aws lambda update-function-code `
  --function-name leaf-shop-chatbot `
  --zip-file fileb://lambda_function.zip
```

### 11.4. Update Terraform Configuration

```powershell
cd terraform

# Pull latest changes
git pull

# Review changes
terraform plan

# Apply updates
terraform apply

# If infrastructure changes require recreation
terraform apply -replace=module.ecs.aws_ecs_service.backend
```

### 11.5. Rotate Secrets

```powershell
# Update secret in Secrets Manager
aws secretsmanager update-secret `
  --secret-id leaf-shop/jwt-secret `
  --secret-string "new-secret-value"

# Force ECS service to restart and pick up new secret
aws ecs update-service `
  --cluster $CLUSTER_NAME `
  --service $SERVICE_NAME `
  --force-new-deployment
```

### 11.6. Backup và Restore

**Backup DynamoDB**

```powershell
# Create on-demand backup
aws dynamodb create-backup `
  --table-name leaf-shop-users `
  --backup-name leaf-shop-users-backup-$(Get-Date -Format 'yyyyMMdd')

# List backups
aws dynamodb list-backups --table-name leaf-shop-users
```

**Restore DynamoDB**

```powershell
# Restore from backup
aws dynamodb restore-table-from-backup `
  --target-table-name leaf-shop-users-restored `
  --backup-arn <BACKUP_ARN>
```

**Backup S3**

```powershell
# S3 versioning is already enabled
# Download all files
aws s3 sync s3://$FRONTEND_BUCKET ./backup/frontend
aws s3 sync s3://leaf-shop-uploads-prod ./backup/uploads
```

---

## 12. Monitoring và Alerting

### 12.1. CloudWatch Dashboards

```powershell
# Create dashboard (via Console hoặc CLI)
# Monitor:
# - ECS CPU/Memory utilization
# - ALB request count, latency, error rates
# - DynamoDB read/write capacity
# - Redis CPU, memory, connections
# - Lambda invocations, duration, errors
```

### 12.2. CloudWatch Alarms

```powershell
# High CPU alarm
aws cloudwatch put-metric-alarm `
  --alarm-name leaf-shop-ecs-high-cpu `
  --alarm-description "Alert when ECS CPU > 80%" `
  --metric-name CPUUtilization `
  --namespace AWS/ECS `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --dimensions Name=ServiceName,Value=$SERVICE_NAME Name=ClusterName,Value=$CLUSTER_NAME

# High error rate alarm
aws cloudwatch put-metric-alarm `
  --alarm-name leaf-shop-alb-high-5xx `
  --alarm-description "Alert on high 5xx errors" `
  --metric-name HTTPCode_Target_5XX_Count `
  --namespace AWS/ApplicationELB `
  --statistic Sum `
  --period 300 `
  --threshold 10 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 1
```

### 12.3. Log Aggregation

```powershell
# Query CloudWatch Logs Insights
aws logs start-query `
  --log-group-name /ecs/leaf-shop-backend `
  --start-time $(Get-Date).AddHours(-1).ToUniversalTime().ToString('o') `
  --end-time $(Get-Date).ToUniversalTime().ToString('o') `
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20'
```

---

## 13. Xóa Infrastructure

### 13.1. Xóa từng phần (khuyến nghị)

```powershell
cd terraform

# Xóa ECS service trước
terraform destroy -target=module.ecs

# Xóa ALB
terraform destroy -target=module.alb

# Xóa Lambda
terraform destroy -target=module.lambda

# Xóa CloudFront (mất 15-20 phút)
terraform destroy -target=module.cloudfront

# Xóa S3 buckets (phải empty trước)
aws s3 rm s3://$FRONTEND_BUCKET --recursive
aws s3 rm s3://leaf-shop-uploads-prod --recursive
terraform destroy -target=module.s3

# Xóa ElastiCache
terraform destroy -target=module.elasticache

# Xóa DynamoDB
terraform destroy -target=module.dynamodb

# Xóa VPC và các resources còn lại
terraform destroy
```

### 13.2. Xóa toàn bộ (cẩn thận!)

```powershell
# Empty S3 buckets trước
aws s3 rm s3://$FRONTEND_BUCKET --recursive
aws s3 rm s3://leaf-shop-uploads-prod --recursive

# Destroy all
terraform destroy

# Confirm với 'yes'
```

### 13.3. Cleanup thủ công

```powershell
# Xóa ECR images
aws ecr batch-delete-image `
  --repository-name leaf-shop-backend `
  --image-ids imageTag=latest

# Xóa CloudWatch log groups
aws logs delete-log-group --log-group-name /ecs/leaf-shop-backend
aws logs delete-log-group --log-group-name /aws/lambda/leaf-shop-chatbot

# Xóa Secrets Manager secrets
aws secretsmanager delete-secret --secret-id leaf-shop/jwt-secret --force-delete-without-recovery

# Xóa Terraform state bucket (cuối cùng)
aws s3 rm s3://leaf-shop-terraform-state --recursive
aws s3 rb s3://leaf-shop-terraform-state

# Xóa DynamoDB state lock table
aws dynamodb delete-table --table-name terraform-state-lock
```

---

## 14. Best Practices

### 14.1. Security

✅ **Sử dụng Secrets Manager** cho sensitive data
✅ **Enable encryption** cho tất cả services (S3, DynamoDB, EBS, Redis)
✅ **Principle of least privilege** cho IAM roles
✅ **Private subnets** cho ECS tasks và databases
✅ **Security groups** với rules cụ thể
✅ **Enable CloudTrail** để audit
✅ **Enable GuardDuty** để detect threats
✅ **Regular security updates** cho Docker images

### 14.2. High Availability

✅ **Multi-AZ deployment** cho ECS, Redis, RDS
✅ **Auto Scaling** cho ECS tasks
✅ **Health checks** cho ALB và ECS
✅ **Circuit breaker** cho ECS deployments
✅ **CloudFront** cho global distribution
✅ **DynamoDB** với on-demand billing

### 14.3. Cost Optimization

✅ **Right-size** ECS tasks (CPU/Memory)
✅ **Use Fargate Spot** cho non-production
✅ **S3 Lifecycle policies** cho old files
✅ **CloudFront caching** để giảm origin requests
✅ **DynamoDB on-demand** thay vì provisioned
✅ **Reserved instances** cho stable workloads
✅ **Monitor costs** với AWS Cost Explorer

### 14.4. Operational Excellence

✅ **Infrastructure as Code** với Terraform
✅ **Version control** cho tất cả code
✅ **Automated deployments** với CI/CD
✅ **Comprehensive monitoring** với CloudWatch
✅ **Centralized logging** với CloudWatch Logs
✅ **Regular backups** cho DynamoDB và S3
✅ **Disaster recovery plan** đã test
✅ **Documentation** đầy đủ và cập nhật

---

## 15. Tài liệu tham khảo

### AWS Documentation

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

### Terraform Resources

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Terraform AWS Modules](https://github.com/terraform-aws-modules)

### Project Documentation

- `../SYSTEM_ANALYSIS.md` - Phân tích hệ thống chi tiết
- `../AWS_DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy thủ công
- `../backend/API_DOCUMENTATION.md` - API documentation
- `../backend/DATABASE_SCHEMA.md` - Database schema

---

## 16. Kết luận

Hướng dẫn này cung cấp một giải pháp Infrastructure as Code hoàn chỉnh để deploy Leaf Shop lên AWS sử dụng Terraform. Kiến trúc được thiết kế để:

✅ **Scalable**: Auto-scaling cho ECS, DynamoDB on-demand
✅ **Highly Available**: Multi-AZ deployment, CloudFront CDN
✅ **Secure**: Private subnets, encryption, Secrets Manager
✅ **Cost-Effective**: Right-sized resources, lifecycle policies
✅ **Maintainable**: Modular Terraform code, comprehensive documentation
✅ **Production-Ready**: Monitoring, logging, backups, disaster recovery

### Chi phí ước tính (Production)

- **ECS Fargate** (2 tasks, 1vCPU, 2GB): ~$60/tháng
- **ALB**: ~$25/tháng
- **NAT Gateway** (2x): ~$70/tháng
- **ElastiCache Redis** (2 nodes, t3.micro): ~$24/tháng
- **DynamoDB** (on-demand): ~$10-50/tháng (tùy usage)
- **S3 + CloudFront**: ~$10-30/tháng
- **Lambda**: ~$5/tháng (first 1M requests free)
- **Secrets Manager**: ~$2/tháng
- **Data Transfer**: ~$20-50/tháng

**Tổng ước tính: $226-316/tháng**

### Liên hệ và Hỗ trợ

Nếu gặp vấn đề hoặc cần hỗ trợ:

1. Kiểm tra phần Troubleshooting
2. Xem CloudWatch Logs
3. Tạo issue trên GitHub repository
4. Liên hệ team DevOps

---

**Last Updated**: December 8, 2024
**Version**: 1.0
**Author**: Leaf Shop DevOps Team
