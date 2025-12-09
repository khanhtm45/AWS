# AWS Configuration
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-southeast-1"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
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

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "leafshop.com"
}

# VPC Configuration
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

# ECS Configuration
variable "ecs_task_cpu" {
  description = "Task CPU units"
  type        = string
  default     = "1024"
}

variable "ecs_task_memory" {
  description = "Task memory (MB)"
  type        = string
  default     = "2048"
}

variable "ecs_desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 1
}

variable "ecs_max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 4
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

# Redis Configuration
variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

# Lambda Configuration
variable "bedrock_model_id" {
  description = "Bedrock Model ID"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

# Secrets
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

# SSL Certificate
variable "certificate_arn" {
  description = "ACM Certificate ARN (optional)"
  type        = string
  default     = ""
}

# Domain aliases
variable "domain_aliases" {
  description = "Domain aliases for CloudFront"
  type        = list(string)
  default     = []
}
