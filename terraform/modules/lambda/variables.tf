# ============================================
# LAMBDA MODULE VARIABLES
# ============================================

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnets" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "codeserver_task_definition_arn" {
  description = "Code-Server task definition ARN"
  type        = string
}

variable "codeserver_security_group_id" {
  description = "Code-Server security group ID"
  type        = string
}

variable "workspace_inactivity_timeout" {
  description = "Minutes of inactivity before termination"
  type        = number
  default     = 15
}

variable "alb_arn" {
  description = "ALB ARN for workspace routing"
  type        = string
}

variable "alb_listener_arn" {
  description = "ALB HTTPS listener ARN for workspace routing"
  type        = string
}

variable "codeserver_password" {
  description = "Password for Code-Server authentication"
  type        = string
  default     = "apranova123"
  sensitive   = true
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}
