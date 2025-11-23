# Terraform Infrastructure Setup

This directory contains Terraform configuration for deploying the Apranova LMS infrastructure on AWS.

## Problem Solved

Previously, Terraform was running without a remote state backend, causing "resource already exists" errors on every deployment. This has been fixed by:

1. **Adding S3 Backend**: Terraform state is now stored in S3 with DynamoDB locking
2. **Resource Import**: Existing AWS resources are imported into Terraform state
3. **Proper CI/CD**: GitHub Actions now properly manages infrastructure

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- PowerShell (Windows) or Bash (Linux/Mac)

## Initial Setup (One-Time)

### Step 1: Create Backend Infrastructure

Run this script to create the S3 bucket and DynamoDB table for Terraform state:

**Windows (PowerShell):**
```powershell
cd terraform
.\setup-backend.ps1
```

**Linux/Mac (Bash):**
```bash
cd terraform
chmod +x setup-backend.sh
./setup-backend.sh
```

This creates:
- S3 bucket: `apranova-lms-terraform-state`
- DynamoDB table: `apranova-lms-terraform-locks`

### Step 2: Initialize Terraform with Backend

```bash
terraform init -reconfigure
```

This will migrate your local state (if any) to the S3 backend.

### Step 3: Import Existing Resources

Since resources already exist in AWS, import them into Terraform state:

**Windows (PowerShell):**
```powershell
.\import-resources.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x import-resources.sh
./import-resources.sh
```

This imports:
- Application Load Balancer (ALB)
- Target Groups (Frontend & Backend)
- EFS File System
- IAM Roles and Policies
- ElastiCache Subnet Group

### Step 4: Verify State

```bash
terraform plan
```

You should see "No changes" or only minor updates, not resource creation.

## Regular Usage

After initial setup, you can use Terraform normally:

```bash
# View planned changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure (careful!)
terraform destroy
```

## GitHub Actions Integration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) now:

1. Builds and pushes Docker images to ECR
2. Initializes Terraform with S3 backend
3. Plans infrastructure changes
4. Applies changes automatically
5. Updates ECS services with new images

## Architecture

The infrastructure includes:

- **VPC**: Custom VPC with public/private subnets
- **ALB**: Application Load Balancer for routing
- **ECS**: Fargate tasks for frontend and backend
- **EFS**: Shared file system for persistent storage
- **ElastiCache**: Redis for caching and sessions
- **ECR**: Docker image repositories
- **IAM**: Roles and policies for ECS tasks
- **Route53**: DNS management (optional)

## Troubleshooting

### "Resource already exists" errors

If you see these errors, it means resources weren't imported. Run the import script:
```powershell
.\import-resources.ps1
```

### Backend initialization failed

Ensure the S3 bucket and DynamoDB table exist:
```bash
aws s3 ls s3://apranova-lms-terraform-state
aws dynamodb describe-table --table-name apranova-lms-terraform-locks
```

### State lock errors

If Terraform is stuck with a lock, you can force unlock:
```bash
terraform force-unlock <LOCK_ID>
```

## Security Notes

- Terraform state contains sensitive data (passwords, keys)
- S3 bucket has encryption enabled
- S3 bucket has versioning enabled for state recovery
- DynamoDB provides state locking to prevent concurrent modifications
- Never commit `terraform.tfstate` files to git

## Variables

Required variables (set via GitHub Secrets or environment):

- `TF_VAR_supabase_url`
- `TF_VAR_supabase_anon_key`
- `TF_VAR_supabase_service_role_key`
- `TF_VAR_db_password`
- `TF_VAR_stripe_secret_key`
- `TF_VAR_stripe_publishable_key`
- `TF_VAR_stripe_webhook_secret`
- `TF_VAR_jwt_secret`
- `TF_VAR_code_server_password`

## Files

- `main.tf` - Provider and backend configuration
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `vpc.tf` - VPC and networking
- `security.tf` - Security groups
- `alb.tf` - Application Load Balancer
- `ecs.tf` - ECS cluster and services
- `ecr.tf` - Container registries
- `efs.tf` - Elastic File System
- `redis.tf` - ElastiCache Redis
- `iam.tf` - IAM roles and policies
- `dns.tf` - Route53 DNS (optional)

## Support

For issues or questions, check:
1. Terraform plan output
2. GitHub Actions logs
3. AWS CloudWatch logs
4. This README
