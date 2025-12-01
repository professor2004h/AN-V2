# ============================================
# TERRAFORM VARIABLES
# ============================================

# AWS Configuration
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "038839713355"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "apranova-lms"
}

# Domain Configuration
variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "ecombinators.com"
}

variable "hosted_zone_id" {
  description = "Route 53 Hosted Zone ID"
  type        = string
  default     = "Z03867122HIKZKMD8WS8V"
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
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# ECS Configuration
variable "frontend_cpu" {
  description = "Frontend task CPU units"
  type        = number
  default     = 512
}

variable "frontend_memory" {
  description = "Frontend task memory (MB)"
  type        = number
  default     = 1024
}

variable "backend_cpu" {
  description = "Backend task CPU units"
  type        = number
  default     = 1024
}

variable "backend_memory" {
  description = "Backend task memory (MB)"
  type        = number
  default     = 2048
}

# Code-Server Workspace Configuration
variable "codeserver_startup_cpu" {
  description = "Code-Server startup CPU units (fast rendering)"
  type        = number
  default     = 2048
}

variable "codeserver_startup_memory" {
  description = "Code-Server startup memory (MB)"
  type        = number
  default     = 4096
}

variable "codeserver_idle_cpu" {
  description = "Code-Server idle CPU units (cost optimization)"
  type        = number
  default     = 512
}

variable "codeserver_idle_memory" {
  description = "Code-Server idle memory (MB)"
  type        = number
  default     = 1024
}

variable "workspace_inactivity_timeout" {
  description = "Minutes of inactivity before workspace termination"
  type        = number
  default     = 15
}

# Supabase Configuration
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  default     = "https://phlkhoorckdjriswcpwz.supabase.co"
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
  default     = ""
}

# Tags
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Apranova-LMS"
    Environment = "production"
    ManagedBy   = "terraform"
    Owner       = "devops@apranova.com"
    CostCenter  = "engineering"
  }
}

