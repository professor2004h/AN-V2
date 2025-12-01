# ============================================
# EFS MODULE - PERSISTENT STORAGE FOR WORKSPACES
# Critical for student data persistence
# ============================================

# EFS File System
resource "aws_efs_file_system" "main" {
  creation_token = "${var.project_name}-${var.environment}-efs"
  encrypted      = true
  
  performance_mode = "generalPurpose"
  throughput_mode  = "elastic"  # Auto-scales with demand

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"  # Move to Infrequent Access after 30 days
  }

  lifecycle_policy {
    transition_to_primary_storage_class = "AFTER_1_ACCESS"  # Move back on access
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-efs"
    Purpose = "student-workspace-storage"
  })
}

# EFS Security Group
resource "aws_security_group" "efs" {
  name        = "${var.project_name}-${var.environment}-efs-sg"
  description = "Security group for EFS mount targets"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 2049
    to_port         = 2049
    protocol        = "tcp"
    security_groups = [var.ecs_security_group_id]
    description     = "NFS from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-efs-sg"
  })
}

# EFS Mount Targets (one per subnet for high availability)
resource "aws_efs_mount_target" "main" {
  count           = length(var.private_subnets)
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = var.private_subnets[count.index]
  security_groups = [aws_security_group.efs.id]
}

# EFS Access Policy (Allow IAM authentication)
resource "aws_efs_file_system_policy" "main" {
  file_system_id = aws_efs_file_system.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowECSAccess"
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess"
        ]
        Resource = aws_efs_file_system.main.arn
        Condition = {
          Bool = {
            "elasticfilesystem:AccessedViaMountTarget" = "true"
          }
        }
      }
    ]
  })
}

# Root Access Point for workspaces directory
resource "aws_efs_access_point" "workspaces" {
  file_system_id = aws_efs_file_system.main.id

  posix_user {
    gid = 1000
    uid = 1000
  }

  root_directory {
    path = "/workspaces"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-workspaces-ap"
    Purpose = "student-workspaces-root"
  })
}

# Shared resources Access Point
resource "aws_efs_access_point" "shared" {
  file_system_id = aws_efs_file_system.main.id

  posix_user {
    gid = 1000
    uid = 1000
  }

  root_directory {
    path = "/shared"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-shared-ap"
    Purpose = "shared-resources"
  })
}

# AWS Backup Plan for EFS
resource "aws_backup_plan" "efs" {
  name = "${var.project_name}-${var.environment}-efs-backup"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)"  # Daily at 5 AM UTC

    lifecycle {
      delete_after = 30  # Keep backups for 30 days
    }
  }

  tags = var.tags
}

resource "aws_backup_vault" "main" {
  name = "${var.project_name}-${var.environment}-backup-vault"
  tags = var.tags
}

resource "aws_backup_selection" "efs" {
  name         = "${var.project_name}-${var.environment}-efs-selection"
  plan_id      = aws_backup_plan.efs.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [
    aws_efs_file_system.main.arn
  ]
}

