# ============================================
# WORKSPACE PROVISIONER LAMBDA
# Creates OpenVSCode Server containers for students
# Synced with AWS - December 2024
# ============================================

# Lambda Code Archive
data "archive_file" "provisioner" {
  type        = "zip"
  source_file = "${path.root}/lambda_code/index.py"
  output_path = "${path.module}/lambda_functions/provisioner.zip"
}

resource "aws_lambda_function" "provisioner" {
  filename         = data.archive_file.provisioner.output_path
  function_name    = "${var.project_name}-${var.environment}-workspace-provisioner"
  role             = aws_iam_role.lambda.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.provisioner.output_base64sha256
  runtime          = "python3.11"
  timeout          = 180
  memory_size      = 256

  vpc_config {
    subnet_ids         = var.private_subnets
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      ECS_CLUSTER      = var.ecs_cluster_name
      # Using OpenVSCode task definition (not codeserver)
      TASK_DEFINITION  = var.openvscode_task_definition_arn
      SUBNETS          = join(",", var.private_subnets)
      SECURITY_GROUP   = var.workspace_security_group_id
      DYNAMODB_TABLE   = aws_dynamodb_table.workspaces.name
      DOMAIN           = var.domain
      VPC_ID           = var.vpc_id
      ALB_ARN          = var.alb_arn
      ALB_LISTENER_ARN = var.alb_listener_arn
      PASSWORD         = var.workspace_password
    }
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.provisioner]
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "provisioner" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-workspace-provisioner"
  retention_in_days = 14

  tags = var.tags
}

# Output
output "provisioner_function_arn" {
  description = "ARN of the workspace provisioner Lambda"
  value       = aws_lambda_function.provisioner.arn
}
