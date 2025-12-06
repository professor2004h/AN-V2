# ============================================
# ECS MODULE VARIABLES
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

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "frontend_cpu" {
  description = "Frontend CPU units"
  type        = number
}

variable "frontend_memory" {
  description = "Frontend memory (MB)"
  type        = number
}

variable "backend_cpu" {
  description = "Backend CPU units"
  type        = number
}

variable "backend_memory" {
  description = "Backend memory (MB)"
  type        = number
}

variable "frontend_ecr_url" {
  description = "Frontend ECR repository URL"
  type        = string
}

variable "backend_ecr_url" {
  description = "Backend ECR repository URL"
  type        = string
}

variable "codeserver_ecr_url" {
  description = "Code-Server ECR repository URL (deprecated - use openvscode)"
  type        = string
  default     = ""
}

variable "openvscode_ecr_url" {
  description = "OpenVSCode Server ECR repository URL"
  type        = string
}

variable "efs_file_system_id" {
  description = "EFS file system ID"
  type        = string
}

variable "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  type        = string
}

variable "backend_target_group_arn" {
  description = "Backend target group ARN"
  type        = string
}

variable "supabase_url" {
  description = "Supabase URL"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}

