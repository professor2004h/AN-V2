# ============================================
# LAMBDA FOR DYNAMIC RESOURCE ALLOCATION
# ============================================

# Lambda Execution Role
resource "aws_iam_role" "lambda_resource_optimizer" {
  name = "${var.project_name}-lambda-resource-optimizer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-lambda-resource-optimizer-role"
  }
}

resource "aws_iam_role_policy" "lambda_resource_optimizer" {
  name = "${var.project_name}-lambda-resource-optimizer-policy"
  role = aws_iam_role.lambda_resource_optimizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:RunTask",
          "ecs:StopTask",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_resource_optimizer" {
  name              = "/aws/lambda/${var.project_name}-resource-optimizer"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-lambda-resource-optimizer-logs"
  }
}

# Lambda Function for Dynamic Resource Allocation
resource "aws_lambda_function" "resource_optimizer" {
  filename      = "lambda/resource-optimizer.zip"
  function_name = "${var.project_name}-resource-optimizer"
  role          = aws_iam_role.lambda_resource_optimizer.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 300
  memory_size   = 256

  environment {
    variables = {
      ECS_CLUSTER_NAME                = aws_ecs_cluster.main.name
      CODE_SERVER_TASK_FAMILY         = aws_ecs_task_definition.code_server.family
      CODE_SERVER_IDLE_TASK_FAMILY    = aws_ecs_task_definition.code_server_idle.family
      CODE_SERVER_PERF_TASK_FAMILY    = aws_ecs_task_definition.code_server_performance.family
      INITIAL_CPU                     = var.code_server_initial_cpu
      INITIAL_MEMORY                  = var.code_server_initial_memory
      IDLE_CPU                        = var.code_server_idle_cpu
      IDLE_MEMORY                     = var.code_server_idle_memory
      MAX_CPU                         = var.code_server_max_cpu
      MAX_MEMORY                      = var.code_server_max_memory
      IDLE_TRANSITION_MINUTES         = "5"
      CPU_THRESHOLD_FOR_UPGRADE       = "80"
      MEMORY_THRESHOLD_FOR_UPGRADE    = "85"
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_resource_optimizer
  ]

  tags = {
    Name = "${var.project_name}-resource-optimizer"
  }
}

# EventBridge Rule to trigger Lambda every 2 minutes
resource "aws_cloudwatch_event_rule" "resource_optimizer" {
  name                = "${var.project_name}-resource-optimizer-schedule"
  description         = "Trigger resource optimizer every 2 minutes"
  schedule_expression = "rate(2 minutes)"

  tags = {
    Name = "${var.project_name}-resource-optimizer-schedule"
  }
}

resource "aws_cloudwatch_event_target" "resource_optimizer" {
  rule      = aws_cloudwatch_event_rule.resource_optimizer.name
  target_id = "ResourceOptimizer"
  arn       = aws_lambda_function.resource_optimizer.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resource_optimizer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.resource_optimizer.arn
}

# ============================================
# CLOUDWATCH ALARMS FOR CODE-SERVER MONITORING
# ============================================

resource "aws_cloudwatch_metric_alarm" "code_server_high_cpu" {
  alarm_name          = "${var.project_name}-code-server-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors code-server CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = "${var.project_name}-code-server"
  }

  alarm_actions = [aws_lambda_function.resource_optimizer.arn]

  tags = {
    Name = "${var.project_name}-code-server-high-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "code_server_high_memory" {
  alarm_name          = "${var.project_name}-code-server-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors code-server memory utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = "${var.project_name}-code-server"
  }

  alarm_actions = [aws_lambda_function.resource_optimizer.arn]

  tags = {
    Name = "${var.project_name}-code-server-high-memory-alarm"
  }
}

# ============================================
# S3 BUCKET FOR TERRAFORM STATE
# ============================================

resource "aws_s3_bucket" "terraform_state" {
  bucket = "apranova-lms-terraform-state"

  tags = {
    Name = "${var.project_name}-terraform-state"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================
# DYNAMODB TABLE FOR TERRAFORM LOCKS
# ============================================

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "apranova-lms-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "${var.project_name}-terraform-locks"
  }
}

# ============================================
# COST OPTIMIZATION - SCHEDULED SCALING
# ============================================

# Scale down during off-hours (11 PM - 6 AM UTC)
resource "aws_appautoscaling_scheduled_action" "scale_down_frontend" {
  name               = "${var.project_name}-frontend-scale-down"
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  schedule           = "cron(0 23 * * ? *)"  # 11 PM UTC

  scalable_target_action {
    min_capacity = 0
    max_capacity = 1
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_up_frontend" {
  name               = "${var.project_name}-frontend-scale-up"
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  schedule           = "cron(0 6 * * ? *)"  # 6 AM UTC

  scalable_target_action {
    min_capacity = 1
    max_capacity = 4
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_down_backend" {
  name               = "${var.project_name}-backend-scale-down"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  schedule           = "cron(0 23 * * ? *)"  # 11 PM UTC

  scalable_target_action {
    min_capacity = 0
    max_capacity = 1
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_up_backend" {
  name               = "${var.project_name}-backend-scale-up"
  service_namespace  = aws_appautoscaling_target.backend.service_namespace
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  schedule           = "cron(0 6 * * ? *)"  # 6 AM UTC

  scalable_target_action {
    min_capacity = 1
    max_capacity = 4
  }
}
