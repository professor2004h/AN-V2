# ============================================
# CLOUDWATCH ALARMS
# ============================================

# ALB 5xx Error Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx errors exceeded threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

# ECS CPU High Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS CPU utilization is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

# ECS Memory High Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ECS Memory utilization is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

# Lambda Provisioner Errors
resource "aws_cloudwatch_metric_alarm" "provisioner_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-provisioner-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Workspace provisioner Lambda errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.provisioner_function_name
  }

  tags = var.tags
}

# High Workspace Count Alarm
resource "aws_cloudwatch_metric_alarm" "high_workspace_count" {
  alarm_name          = "${var.project_name}-${var.environment}-high-workspace-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ActiveWorkspaces"
  namespace           = "Apranova/Workspaces"
  period              = 300
  statistic           = "Average"
  threshold           = 800
  alarm_description   = "High number of active workspaces"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = var.tags
}

# EFS Burst Credits Alarm
resource "aws_cloudwatch_metric_alarm" "efs_burst_credits" {
  alarm_name          = "${var.project_name}-${var.environment}-efs-burst-credits-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "BurstCreditBalance"
  namespace           = "AWS/EFS"
  period              = 300
  statistic           = "Average"
  threshold           = 100000000000  # 100 GB credits
  alarm_description   = "EFS burst credits running low"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FileSystemId = var.efs_file_system_id
  }

  tags = var.tags
}

