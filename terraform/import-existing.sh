# Terraform Import Script for Existing Resources
# Run this in GitHub Actions or locally to import existing AWS resources

# Import ALB
terraform import 'aws_lb.main' 'arn:aws:elasticloadbalancing:ap-southeast-2:ACCOUNT_ID:loadbalancer/app/apranova-lms-alb/LOAD_BALANCER_ID' || true

# Import Target Groups  
terraform import 'aws_lb_target_group.frontend' 'arn:aws:elasticloadbalancing:ap-southeast-2:ACCOUNT_ID:targetgroup/apranova-lms-frontend-tg/TARGET_GROUP_ID' || true
terraform import 'aws_lb_target_group.backend' 'arn:aws:elasticloadbalancing:ap-southeast-2:ACCOUNT_ID:targetgroup/apranova-lms-backend-tg/TARGET_GROUP_ID' || true

# Import EFS
terraform import 'aws_efs_file_system.main' 'fs-05182c567cb694a8f' || true

# Import IAM Roles
terraform import 'aws_iam_role.ecs_execution_role' 'apranova-lms-ecs-execution-role' || true
terraform import 'aws_iam_role.ecs_task_role' 'apranova-lms-ecs-task-role' || true
terraform import 'aws_iam_role.ecs_instance_role' 'apranova-lms-ecs-instance-role' || true

# Import IAM Policy (get ARN first)
terraform import 'aws_iam_policy.ecs_task_policy' 'arn:aws:iam::ACCOUNT_ID:policy/apranova-lms-ecs-task-policy' || true

# Import ElastiCache Subnet Group
terraform import 'aws_elasticache_subnet_group.main' 'apranova-lms-redis-subnet-group' || true
