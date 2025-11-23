variable "aws_region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application Name"
  default     = "apranova-lms"
}

variable "environment" {
  description = "Environment (prod, staging)"
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Public Subnets CIDRs"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "availability_zones" {
  description = "Availability Zones"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "container_port_frontend" {
  default = 3000
}

variable "container_port_backend" {
  default = 3001
}

variable "ec2_instance_type" {
  default = "t3.medium"
}

# Secrets (passed via TF_VAR_...)
variable "supabase_url" { sensitive = true }
variable "supabase_anon_key" { sensitive = true }
variable "supabase_service_role_key" { sensitive = true }
variable "db_password" { sensitive = true }
variable "stripe_secret_key" { sensitive = true }
variable "stripe_publishable_key" { sensitive = true }
variable "stripe_webhook_secret" { sensitive = true }
variable "jwt_secret" { sensitive = true }
variable "code_server_password" { sensitive = true }
