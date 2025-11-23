resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
}

# --- Backend Infrastructure (EC2) ---

data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

resource "aws_launch_template" "backend" {
  name_prefix   = "${var.app_name}-backend-"
  image_id      = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type = var.ec2_instance_type
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ecs_tasks.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
              
              # Install EFS utils and mount EFS
              yum install -y amazon-efs-utils
              mkdir -p /workspace-data
              mount -t efs -o tls ${aws_efs_file_system.main.id}:/ /workspace-data
              echo "${aws_efs_file_system.main.id}:/ /workspace-data efs _netdev,tls 0 0" >> /etc/fstab
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.app_name}-backend-instance"
    }
  }
}

resource "aws_autoscaling_group" "backend" {
  name                = "${var.app_name}-backend-asg"
  vpc_zone_identifier = aws_subnet.public[*].id
  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  min_size         = 1
  max_size         = 2
  desired_capacity = 1

  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }
}

resource "aws_ecs_capacity_provider" "backend" {
  name = "${var.app_name}-backend-cp"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.backend.arn
    managed_scaling {
      status = "ENABLED"
      target_capacity = 100
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT", aws_ecs_capacity_provider.backend.name]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE_SPOT"
  }
}

# --- Task Definitions ---

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.app_name}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${aws_ecr_repository.frontend.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        { name = "NEXT_PUBLIC_BACKEND_URL", value = "http://${aws_lb.main.dns_name}/api" },
        # Add other env vars here
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app_name}-frontend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  network_mode             = "bridge" # Bridge mode for EC2 to allow easy port mapping and socket binding
  requires_compatibilities = ["EC2"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3001
          hostPort      = 3001 # Map to host port for ALB
        }
      ]
      mountPoints = [
        {
          sourceVolume  = "docker_sock"
          containerPath = "/var/run/docker.sock"
        },
        {
          sourceVolume  = "workspace_data"
          containerPath = "/workspace-data" # Path where workspaces are stored
        }
      ]
      environment = [
        { name = "PORT", value = "3001" },
        { name = "WORKSPACE_BASE_PATH", value = "/workspace-data" },
        { name = "SUPABASE_URL", value = var.supabase_url },
        { name = "SUPABASE_ANON_KEY", value = var.supabase_anon_key },
        { name = "SUPABASE_SERVICE_ROLE_KEY", value = var.supabase_service_role_key },
        { name = "DB_PASSWORD", value = var.db_password },
        { name = "STRIPE_SECRET_KEY", value = var.stripe_secret_key },
        { name = "STRIPE_PUBLISHABLE_KEY", value = var.stripe_publishable_key },
        { name = "STRIPE_WEBHOOK_SECRET", value = var.stripe_webhook_secret },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "CODE_SERVER_PASSWORD", value = var.code_server_password },
        { name = "REDIS_HOST", value = aws_elasticache_cluster.main.cache_nodes[0].address },
        { name = "REDIS_PORT", value = tostring(aws_elasticache_cluster.main.cache_nodes[0].port) }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.app_name}-backend"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
    }
  ])

  volume {
    name = "docker_sock"
    host_path = "/var/run/docker.sock"
  }

  volume {
    name = "workspace_data"
    host_path = "/workspace-data"
  }
}
# --- Services ---

resource "aws_ecs_service" "frontend" {
  name            = "${var.app_name}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 3000
  }
}

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  
  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.backend.name
    weight            = 100
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3001
  }
}
