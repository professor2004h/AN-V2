# ============================================
# EFS MODULE OUTPUTS
# ============================================

output "file_system_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.main.id
}

output "file_system_arn" {
  description = "EFS file system ARN"
  value       = aws_efs_file_system.main.arn
}

output "dns_name" {
  description = "EFS DNS name"
  value       = aws_efs_file_system.main.dns_name
}

output "security_group_id" {
  description = "EFS security group ID"
  value       = aws_security_group.efs.id
}

output "workspaces_access_point_id" {
  description = "Workspaces access point ID"
  value       = aws_efs_access_point.workspaces.id
}

output "shared_access_point_id" {
  description = "Shared resources access point ID"
  value       = aws_efs_access_point.shared.id
}

output "mount_target_ids" {
  description = "EFS mount target IDs"
  value       = aws_efs_mount_target.main[*].id
}

