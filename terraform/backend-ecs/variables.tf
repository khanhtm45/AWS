variable "ecs_cluster_name" {}
variable "ecs_task_family" {}
variable "ecs_task_cpu" {}
variable "ecs_task_memory" {}
variable "ecs_execution_role_arn" {}
variable "container_definitions" {}
variable "ecs_service_name" {}
variable "ecs_desired_count" {}
variable "subnets" { type = list(string) }
variable "security_groups" { type = list(string) }
