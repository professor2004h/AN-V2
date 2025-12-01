# ============================================
# CLOUDWATCH MODULE VARIABLES
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

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix"
  type        = string
}

variable "efs_file_system_id" {
  description = "EFS file system ID"
  type        = string
}

variable "provisioner_function_name" {
  description = "Provisioner Lambda function name"
  type        = string
}

variable "terminator_function_name" {
  description = "Terminator Lambda function name"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}

