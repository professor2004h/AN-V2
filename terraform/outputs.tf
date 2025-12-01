# ============================================
# TERRAFORM OUTPUTS
# ============================================

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB Zone ID"
  value       = module.alb.alb_zone_id
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS Cluster ARN"
  value       = module.ecs.cluster_arn
}

# ECR Outputs
output "frontend_ecr_url" {
  description = "Frontend ECR repository URL"
  value       = module.ecr.frontend_repository_url
}

output "backend_ecr_url" {
  description = "Backend ECR repository URL"
  value       = module.ecr.backend_repository_url
}

output "codeserver_ecr_url" {
  description = "Code-Server ECR repository URL"
  value       = module.ecr.codeserver_repository_url
}

# EFS Outputs
output "efs_file_system_id" {
  description = "EFS File System ID"
  value       = module.efs.file_system_id
}

output "efs_dns_name" {
  description = "EFS DNS name"
  value       = module.efs.dns_name
}

# Domain Outputs
output "app_domain" {
  description = "Application domain"
  value       = "app.${var.domain_name}"
}

output "api_domain" {
  description = "API domain"
  value       = "api.${var.domain_name}"
}

output "workspace_domain" {
  description = "Workspace domain pattern"
  value       = "ws-*.${var.domain_name}"
}

# Lambda Outputs
output "workspace_provisioner_arn" {
  description = "Workspace provisioner Lambda ARN"
  value       = module.lambda.provisioner_function_arn
}

output "workspace_terminator_arn" {
  description = "Workspace terminator Lambda ARN"
  value       = module.lambda.terminator_function_arn
}

