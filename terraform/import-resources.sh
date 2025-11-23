#!/bin/bash

# Script to import existing AWS resources into Terraform state
# Run this after setting up the backend and running terraform init

set -e

echo "Importing existing AWS resources into Terraform state..."

# Import ALB
echo "Importing ALB..."
terraform import aws_lb.main arn:aws:elasticloadbalancing:ap-southeast-2:$(aws sts get-caller-identity --query Account --output text):loadbalancer/app/apranova-lms-alb/$(aws elbv2 describe-load-balancers --names apranova-lms-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text | cut -d'/' -f4) || echo "ALB import failed or already imported"

# Import Target Groups
echo "Importing Frontend Target Group..."
terraform import aws_lb_target_group.frontend arn:aws:elasticloadbalancing:ap-southeast-2:$(aws sts get-caller-identity --query Account --output text):targetgroup/apranova-lms-frontend-tg/$(aws elbv2 describe-target-groups --names apranova-lms-frontend-tg --query 'TargetGroups[0].TargetGroupArn' --output text | cut -d'/' -f2) || echo "Frontend TG import failed or already imported"

echo "Importing Backend Target Group..."
terraform import aws_lb_target_group.backend arn:aws:elasticloadbalancing:ap-southeast-2:$(aws sts get-caller-identity --query Account --output text):targetgroup/apranova-lms-backend-tg/$(aws elbv2 describe-target-groups --names apranova-lms-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text | cut -d'/' -f2) || echo "Backend TG import failed or already imported"

# Import EFS
echo "Importing EFS..."
terraform import aws_efs_file_system.main fs-05182c567cb694a8f || echo "EFS import failed or already imported"

# Import IAM Roles
echo "Importing IAM Roles..."
terraform import aws_iam_role.ecs_execution_role apranova-lms-ecs-execution-role || echo "ECS execution role import failed or already imported"
terraform import aws_iam_role.ecs_task_role apranova-lms-ecs-task-role || echo "ECS task role import failed or already imported"
terraform import aws_iam_role.ecs_instance_role apranova-lms-ecs-instance-role || echo "ECS instance role import failed or already imported"

# Import IAM Policy
echo "Importing IAM Policy..."
POLICY_ARN=$(aws iam list-policies --scope Local --query "Policies[?PolicyName=='apranova-lms-ecs-task-policy'].Arn" --output text)
if [ ! -z "$POLICY_ARN" ]; then
  terraform import aws_iam_policy.ecs_task_policy $POLICY_ARN || echo "IAM policy import failed or already imported"
fi

# Import ElastiCache Subnet Group
echo "Importing ElastiCache Subnet Group..."
terraform import aws_elasticache_subnet_group.main apranova-lms-redis-subnet-group || echo "ElastiCache subnet group import failed or already imported"

echo ""
echo "Import complete! Run 'terraform plan' to verify the state."
