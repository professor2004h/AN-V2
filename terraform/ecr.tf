# Use existing ECR repositories
data "aws_ecr_repository" "frontend" {
  name = "${var.app_name}-frontend"
}

data "aws_ecr_repository" "backend" {
  name = "${var.app_name}-backend"
}
