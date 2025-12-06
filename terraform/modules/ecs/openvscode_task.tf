# ============================================
# OPENVSCODE SERVER WORKSPACE TASK DEFINITION
# Synced with AWS - December 2024
# Replaces code-server with openvscode-server
# ============================================

# OpenVSCode Server Task Definition
resource "aws_ecs_task_definition" "openvscode" {
  family                   = "${var.project_name}-${var.environment}-openvscode"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"  # 1 vCPU
  memory                   = "2048"  # 2 GB RAM
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  # EFS Volume for persistent storage
  volume {
    name = "workspace-data"

    efs_volume_configuration {
      file_system_id          = var.efs_file_system_id
      root_directory          = "/"
      transit_encryption      = "ENABLED"
      authorization_config {
        iam = "ENABLED"
      }
    }
  }

  container_definitions = jsonencode([
    {
      name      = "openvscode"
      image     = "${var.openvscode_ecr_url}:latest"
      cpu       = 1024
      memory    = 2048
      essential = true

      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ]

      # Mount EFS for persistence
      mountPoints = [
        {
          sourceVolume  = "workspace-data"
          containerPath = "/home/workspace"
          readOnly      = false
        }
      ]

      environment = [
        {
          name  = "HOME"
          value = "/home/workspace"
        },
        {
          name  = "TZ"
          value = "UTC"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.openvscode.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "openvscode"
        }
      }

      # Health check
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 120
      }

      linuxParameters = {
        initProcessEnabled = true
      }

      ulimits = [
        {
          name      = "nofile"
          softLimit = 65536
          hardLimit = 65536
        }
      ]
    }
  ])

  tags = merge(var.tags, {
    Component = "openvscode-workspace"
    Purpose   = "student-ide"
  })
}

# CloudWatch Log Group for OpenVSCode
resource "aws_cloudwatch_log_group" "openvscode" {
  name              = "/ecs/${var.project_name}-${var.environment}/openvscode"
  retention_in_days = 7

  tags = merge(var.tags, {
    Component = "openvscode-logs"
  })
}

# Output for Lambda reference
output "openvscode_task_definition_arn" {
  description = "ARN of the OpenVSCode task definition"
  value       = aws_ecs_task_definition.openvscode.arn
}
