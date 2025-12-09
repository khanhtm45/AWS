variable "ecs_cluster_name" {
  default = "leafshop-backend-cluster-20251208-abc"
}
variable "ecs_task_family" {
  default = "leafshop-backend-task-20251208-abc"
}
variable "ecs_task_cpu" {
  default = "256"
}
variable "ecs_task_memory" {
  default = "512"
}
variable "ecs_execution_role_arn" {
  default = "arn:aws:iam::083011581293:role/backend"
}
variable "container_definitions" {
  default = <<DEFINITION
[
  {
    "name": "leafshop-backend",
    "image": "nginx:latest",
    "cpu": 256,
    "memory": 512,
    "essential": true,
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort": 80
      }
    ]
  }
]
DEFINITION
}
variable "ecs_service_name" {
  default = "leafshop-backend-service-20251208-abc"
}
variable "ecs_desired_count" {
  default = 1
}
variable "subnets" {
  type = list(string)
  default = [
    "subnet-0cda793e9f1ecf36c",
    "subnet-006ae04efa546a7ca",
    "subnet-06a03f5d701a507ba",
    "subnet-06ec4d7c6763f4817",
    "subnet-0b13dd7c67e14ab34"
  ]
}
variable "security_groups" {
  type    = list(string)
  default = ["sg-0d7c7b50f2a4c4664"]
}
