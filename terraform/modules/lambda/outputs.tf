# ============================================
# LAMBDA MODULE OUTPUTS
# ============================================

output "provisioner_function_arn" {
  description = "Workspace provisioner Lambda ARN"
  value       = aws_lambda_function.provisioner.arn
}

output "provisioner_function_name" {
  description = "Workspace provisioner Lambda name"
  value       = aws_lambda_function.provisioner.function_name
}

output "terminator_function_arn" {
  description = "Workspace terminator Lambda ARN"
  value       = aws_lambda_function.terminator.arn
}

output "terminator_function_name" {
  description = "Workspace terminator Lambda name"
  value       = aws_lambda_function.terminator.function_name
}

output "workspaces_table_name" {
  description = "DynamoDB table name for workspaces"
  value       = aws_dynamodb_table.workspaces.name
}

output "workspaces_table_arn" {
  description = "DynamoDB table ARN for workspaces"
  value       = aws_dynamodb_table.workspaces.arn
}

output "lambda_security_group_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

