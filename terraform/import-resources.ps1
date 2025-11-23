# PowerShell script to import existing AWS resources into Terraform state
# Run this after setting up the backend and running terraform init

$ErrorActionPreference = "Continue"

Write-Host "Importing existing AWS resources into Terraform state..." -ForegroundColor Green

# Import ALB
Write-Host "Importing ALB..." -ForegroundColor Yellow
$ALB_ARN = (aws elbv2 describe-load-balancers --names apranova-lms-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text)
if ($ALB_ARN) {
    terraform import aws_lb.main $ALB_ARN
}

# Import Target Groups
Write-Host "Importing Frontend Target Group..." -ForegroundColor Yellow
$FRONTEND_TG_ARN = (aws elbv2 describe-target-groups --names apranova-lms-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)
if ($FRONTEND_TG_ARN) {
    terraform import aws_lb_target_group.frontend $FRONTEND_TG_ARN
}

Write-Host "Importing Backend Target Group..." -ForegroundColor Yellow
$BACKEND_TG_ARN = (aws elbv2 describe-target-groups --names apranova-lms-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)
if ($BACKEND_TG_ARN) {
    terraform import aws_lb_target_group.backend $BACKEND_TG_ARN
}

# Import EFS
Write-Host "Importing EFS..." -ForegroundColor Yellow
terraform import aws_efs_file_system.main fs-05182c567cb694a8f

# Import IAM Roles
Write-Host "Importing IAM Roles..." -ForegroundColor Yellow
terraform import aws_iam_role.ecs_execution_role apranova-lms-ecs-execution-role
terraform import aws_iam_role.ecs_task_role apranova-lms-ecs-task-role
terraform import aws_iam_role.ecs_instance_role apranova-lms-ecs-instance-role

# Import IAM Policy
Write-Host "Importing IAM Policy..." -ForegroundColor Yellow
$POLICY_ARN = (aws iam list-policies --scope Local --query "Policies[?PolicyName=='apranova-lms-ecs-task-policy'].Arn" --output text)
if ($POLICY_ARN) {
    terraform import aws_iam_policy.ecs_task_policy $POLICY_ARN
}

# Import ElastiCache Subnet Group
Write-Host "Importing ElastiCache Subnet Group..." -ForegroundColor Yellow
terraform import aws_elasticache_subnet_group.main apranova-lms-redis-subnet-group

Write-Host ""
Write-Host "Import complete! Run 'terraform plan' to verify the state." -ForegroundColor Green
