# ALB Rules Sync Status

## Current AWS HTTPS Listener Rules (as of 2025-12-05 15:39)

| Priority | Host Header | Target Group | Notes |
|----------|-------------|--------------|-------|
| 1 | api.ecombinators.com | apranova-prod-be-tg | Backend API |
| 2 | ecombinators.com, www.ecombinators.com | apranova-prod-fe-tg | Frontend |
| 100+ | ws-{student-id}.ecombinators.com | ws-{student-id} | Dynamic - created by Lambda |
| default | * | apranova-prod-fe-tg | Fallback to frontend |

## Architecture

- HTTPS Listener: Created manually in AWS with ACM certificate
- Static Rules (1, 2): API and Frontend routing
- Dynamic Rules (100+): Created by Lambda provisioner for each student workspace
- Each student gets: ECS Service + Target Group + ALB Rule

## Lambda Provisioner Creates:
1. ECS Service: ws-{student_id[:8]}
2. Target Group: ws-{student_id[:8]}
3. ALB Rule: Host = ws-{student_id[:8]}.ecombinators.com -> Target Group

## Code Locations:
- Terraform base: terraform/modules/alb/listeners.tf
- Lambda provisioner: terraform/lambda_code/index.py
