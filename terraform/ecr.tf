# Create ECR repositories
resource "aws_ecr_repository" "frontend" {
  name                 = "${var.app_name}-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name        = "${var.app_name}-frontend"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name        = "${var.app_name}-backend"
    Environment = var.environment
  }
}

# Outputs for reference
output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}
