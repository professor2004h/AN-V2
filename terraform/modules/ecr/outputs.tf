# ============================================
# ECR MODULE OUTPUTS
# ============================================

output "frontend_repository_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

output "backend_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "codeserver_repository_url" {
  description = "Code-Server ECR repository URL"
  value       = aws_ecr_repository.codeserver.repository_url
}

output "frontend_repository_arn" {
  description = "Frontend ECR repository ARN"
  value       = aws_ecr_repository.frontend.arn
}

output "backend_repository_arn" {
  description = "Backend ECR repository ARN"
  value       = aws_ecr_repository.backend.arn
}

output "codeserver_repository_arn" {
  description = "Code-Server ECR repository ARN"
  value       = aws_ecr_repository.codeserver.arn
}

