# ============================================
# WORKSPACE PROVISIONER LAMBDA
# Creates new Code-Server containers for students
# ============================================

# Use external file for Lambda code (easier to maintain)
data "archive_file" "provisioner" {
  type        = "zip"
  source_file = "${path.root}/lambda_code/provisioner.py"
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
      TASK_DEFINITION  = var.codeserver_task_definition_arn
      SUBNETS          = join(",", var.private_subnets)
      SECURITY_GROUP   = var.codeserver_security_group_id
      DYNAMODB_TABLE   = aws_dynamodb_table.workspaces.name
      DOMAIN           = "ecombinators.com"
      VPC_ID           = var.vpc_id
      ALB_ARN          = var.alb_arn
      ALB_LISTENER_ARN = var.alb_listener_arn
      PASSWORD         = var.codeserver_password
    }
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.provisioner]
}

