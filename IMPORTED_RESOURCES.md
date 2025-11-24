# Imported AWS Resources

All existing AWS resources have been imported into Terraform state (stored in S3).

## Resources Imported:

### Networking
- ✅ VPC: `vpc-0b10b99455c95c508`
- ✅ Subnets: `subnet-03a23a8e5af65f858`, `subnet-0cdaa198c53e6da2b`
- ✅ Internet Gateway: `igw-097c743dc5bda288f`
- ✅ Security Group (ALB): `sg-0f0e01c765e456a44`

### Compute
- ✅ ECS Cluster: `apranova-lms-cluster`
- ✅ Auto Scaling Group: `apranova-lms-backend-asg`

### Storage
- ✅ ECR Frontend: `apranova-lms-frontend`
- ✅ ECR Backend: `apranova-lms-backend`
- ✅ EFS File System: `fs-01eb5a5cafbe5b525`

### Load Balancing
- ✅ Target Group (Frontend): `apranova-lms-frontend-tg`
- ✅ Target Group (Backend): `apranova-lms-backend-tg`

### Cache
- ✅ ElastiCache Subnet Group: `apranova-lms-redis-subnet-group`

### IAM
- ✅ Role (Execution): `apranova-lms-ecs-execution-role`
- ✅ Role (Task): `apranova-lms-ecs-task-role`
- ✅ Role (Instance): `apranova-lms-ecs-instance-role`
- ✅ Policy: `apranova-lms-ecs-task-policy`
- ✅ Instance Profile: `apranova-lms-ecs-instance-profile`

## Terraform Backend
- **S3 Bucket**: `apranova-lms-tf-state-183037996720`
- **DynamoDB Table**: `apranova-lms-tf-lock`
- **Region**: `us-east-1`

## Next Deployment
The next GitHub Actions run will:
1. Initialize Terraform with S3 backend
2. Download existing state
3. Apply only necessary changes (no resource recreation)
4. Build and deploy Docker images
