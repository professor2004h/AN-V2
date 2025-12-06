# ============================================
# LAMBDA MODULE VARIABLES
# Synced with AWS - December 2024
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

# OpenVSCode Server (current)
variable "openvscode_task_definition_arn" {
  description = "OpenVSCode Server task definition ARN"
  type        = string
}

variable "workspace_security_group_id" {
  description = "Workspace security group ID"
  type        = string
}

# Deprecated - for backwards compatibility
variable "codeserver_task_definition_arn" {
  description = "Code-Server task definition ARN (deprecated)"
  type        = string
  default     = ""
}

variable "codeserver_security_group_id" {
  description = "Code-Server security group ID (deprecated)"
  type        = string
  default     = ""
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

variable "domain" {
  description = "Domain for workspace URLs"
  type        = string
  default     = "ecombinators.com"
}

variable "workspace_password" {
  description = "Password for workspace authentication (OpenVSCode uses connection token)"
  type        = string
  default     = "apranova123"
  sensitive   = true
}

# Deprecated
variable "codeserver_password" {
  description = "Password for Code-Server authentication (deprecated)"
  type        = string
  default     = "apranova123"
  sensitive   = true
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
}
