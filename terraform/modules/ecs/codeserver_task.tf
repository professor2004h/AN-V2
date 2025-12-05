# ============================================
# CODE-SERVER WORKSPACE TASK DEFINITION
# Synced with AWS Task Definition v4
# ============================================

# Code-Server Task Definition
resource "aws_ecs_task_definition" "codeserver" {
  family                   = "${var.project_name}-${var.environment}-codeserver"
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
      name      = "codeserver"
      image     = "${var.codeserver_ecr_url}:latest"
      cpu       = 1024
      memory    = 2048
      essential = true

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      # Mount EFS at /efs-data - entrypoint creates student-specific directories
      mountPoints = [
        {
          sourceVolume  = "workspace-data"
          containerPath = "/efs-data"
          readOnly      = false
        }
      ]

      environment = [
        {
          name  = "PASSWORD"
          value = "apranova123"
        },
        {
          name  = "TZ"
          value = "UTC"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.codeserver.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "codeserver"
        }
      }

      # Health check - use / since code-server returns 302 redirect
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/ || exit 1"]
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
    Component = "codeserver-workspace"
    Purpose   = "student-ide"
  })
}

# Code-Server Task Definition (Idle - Low Resources for cost savings)
resource "aws_ecs_task_definition" "codeserver_idle" {
  family                   = "${var.project_name}-${var.environment}-codeserver-idle"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"   # 0.5 vCPU for idle
  memory                   = "1024"  # 1 GB RAM for idle
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

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
      name      = "codeserver"
      image     = "${var.codeserver_ecr_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      mountPoints = [
        {
          sourceVolume  = "workspace-data"
          containerPath = "/home/coder"
          readOnly      = false
        }
      ]

      environment = [
        {
          name  = "PASSWORD"
          value = "apranova_secure_ide"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.codeserver.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "codeserver-idle"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/healthz || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(var.tags, {
    Component = "codeserver-workspace-idle"
    Purpose   = "student-ide-cost-optimized"
  })
}

