resource "aws_efs_file_system" "main" {
  creation_token = "${var.app_name}-efs"
  encrypted      = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name = "${var.app_name}-efs"
  }
}

resource "aws_efs_mount_target" "main" {
  count           = length(var.public_subnets)
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = aws_subnet.public[count.index].id
  security_groups = [aws_security_group.efs.id]
}

resource "aws_efs_access_point" "workspace_data" {
  file_system_id = aws_efs_file_system.main.id
  posix_user {
    gid = 1000
    uid = 1000
  }
  root_directory {
    path = "/workspace-data"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }
}
