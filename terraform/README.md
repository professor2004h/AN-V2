# Apranova LMS - Terraform Infrastructure

## Overview

This Terraform configuration deploys a production-ready, cost-optimized infrastructure for the Apranova LMS on AWS using ECS Fargate with dynamic resource allocation for code-server workspaces.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Application   │
            │ Load Balancer  │
            └────────┬───────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│   Frontend    │         │   Backend     │
│  ECS Service  │         │  ECS Service  │
│ (0.5 vCPU,    │         │ (1 vCPU,      │
│  1 GB RAM)    │         │  2 GB RAM)    │
└───────────────┘         └───────┬───────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │  Code-Server  │
                          │  Workspaces   │
                          │  (Dynamic:    │
                          │  0.5-4 vCPU,  │
                          │  1-8 GB RAM)  │
                          └───────┬───────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │      EFS      │
                          │  (Persistent  │
                          │   Storage)    │
                          └───────────────┘
```

## Features

### 🚀 Dynamic Resource Allocation

Code-server workspaces automatically adjust resources based on usage:

- **Initial Launch**: 2 vCPU, 4 GB RAM (fast IDE rendering)
- **Idle Mode**: 0.5 vCPU, 1 GB RAM (cost savings)
- **Performance Mode**: 4 vCPU, 8 GB RAM (heavy workloads)

### 💰 Cost Optimization

- Fargate Spot instances for non-critical workloads
- Scheduled scaling (scale down during off-hours)
- EFS lifecycle management (move to IA after 30 days)
- Auto-cleanup of idle workspaces (15 minutes)
- Lambda-based resource optimizer (runs every 2 minutes)

### 🔒 Security

- Private subnets for all compute resources
- Encrypted EFS (at rest and in transit)
- Least privilege IAM roles
- Security groups with restrictive rules
- Secrets managed via GitHub Secrets

### 📊 Monitoring

- CloudWatch Container Insights
- Custom metrics for code-server usage
- Alarms for high CPU/Memory
- Centralized logging (7-day retention)

## File Structure

```
terraform/
├── main.tf              # VPC, networking, EFS, ECR, ALB
├── ecs.tf               # ECS cluster, task definitions, services
├── lambda.tf            # Lambda function, CloudWatch alarms
├── terraform.tfvars     # Variable values
├── build-lambda.sh      # Build script (Linux/Mac)
├── build-lambda.ps1     # Build script (Windows)
└── lambda/
    └── resource-optimizer/
        ├── index.js     # Lambda function code
        └── package.json # Dependencies
```

## Prerequisites

1. AWS Account with appropriate permissions
2. Terraform >= 1.0
3. AWS CLI configured
4. Node.js (for Lambda function)

## Quick Start

### 1. Configure AWS Credentials

```bash
aws configure set aws_access_key_id <your-access-key-id>
aws configure set aws_secret_access_key <your-secret-access-key>
aws configure set default.region us-east-1
```

### 2. Build Lambda Function

**Linux/Mac:**
```bash
cd terraform
chmod +x build-lambda.sh
./build-lambda.sh
```

**Windows:**
```powershell
cd terraform
.\build-lambda.ps1
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Create Backend (First Time Only)

```bash
# Temporarily comment out the backend block in main.tf
terraform apply -target=aws_s3_bucket.terraform_state
terraform apply -target=aws_dynamodb_table.terraform_locks

# Uncomment the backend block
terraform init -migrate-state
```

### 5. Plan and Apply

```bash
export TF_VAR_supabase_url="https://phlkhoorckdjriswcpwz.supabase.co"
export TF_VAR_supabase_anon_key="<your-key>"
export TF_VAR_supabase_service_role_key="<your-key>"

terraform plan
terraform apply
```

### 6. Get Outputs

```bash
terraform output alb_dns_name
terraform output efs_id
terraform output ecs_cluster_name
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `environment` | Environment name | `production` |
| `project_name` | Project name | `apranova-lms` |
| `supabase_url` | Supabase URL | - |
| `supabase_anon_key` | Supabase Anon Key | - |
| `supabase_service_role_key` | Supabase Service Role Key | - |
| `code_server_initial_cpu` | Initial CPU (vCPU units) | `2048` |
| `code_server_initial_memory` | Initial memory (MB) | `4096` |
| `code_server_idle_cpu` | Idle CPU (vCPU units) | `512` |
| `code_server_idle_memory` | Idle memory (MB) | `1024` |
| `code_server_max_cpu` | Max CPU (vCPU units) | `4096` |
| `code_server_max_memory` | Max memory (MB) | `8192` |

## Outputs

| Output | Description |
|--------|-------------|
| `alb_dns_name` | DNS name of the load balancer |
| `efs_id` | ID of the EFS file system |
| `ecs_cluster_name` | Name of the ECS cluster |
| `ecr_frontend_url` | URL of the frontend ECR repository |
| `ecr_backend_url` | URL of the backend ECR repository |
| `ecr_code_server_url` | URL of the code-server ECR repository |

## Resource Allocation Strategy

### Lambda Function Logic

The Lambda function (`resource-optimizer`) runs every 2 minutes and:

1. **Monitors** all running code-server tasks
2. **Analyzes** CPU and memory usage over the last 5 minutes
3. **Decides** which tier to use based on:
   - Running time
   - CPU utilization
   - Memory utilization
4. **Replaces** tasks with the appropriate tier if needed

### Transition Rules

```javascript
// Initial → Idle
if (runningMinutes >= 5 && cpu < 30% && memory < 40%) {
  switchToIdleTier();
}

// Initial/Idle → Performance
if (cpu >= 80% || memory >= 85%) {
  switchToPerformanceTier();
}

// Performance → Idle
if (runningMinutes >= 10 && cpu < 20% && memory < 30%) {
  switchToIdleTier();
}
```

## Cost Estimation

### Monthly Costs (Approximate)

| Resource | Configuration | Cost |
|----------|--------------|------|
| Frontend | 1 task, 24/7 | $15 |
| Backend | 1 task, 24/7 | $30 |
| Code-Server | 10 students, 8h/day | $72 |
| ALB | 1 ALB | $16 |
| EFS | 50 GB | $15 |
| NAT Gateway | 2 gateways | $64 |
| CloudWatch | Logs + Metrics | $10 |
| Lambda | Resource optimizer | $1 |
| Data Transfer | Moderate | $20 |
| **Total** | | **~$243** |

### Cost Optimization

With optimizations enabled:
- Fargate Spot: -70% on code-server
- Scheduled scaling: -50% during off-hours
- Aggressive cleanup: -30% on idle resources

**Optimized Monthly Cost: ~$120-150**

## Monitoring

### CloudWatch Dashboards

Access CloudWatch to view:
- ECS service metrics
- ALB request metrics
- EFS throughput
- Lambda invocations

### Alarms

Pre-configured alarms:
- Code-server high CPU (>80%)
- Code-server high memory (>85%)

### Logs

Log groups:
- `/ecs/apranova-lms/frontend`
- `/ecs/apranova-lms/backend`
- `/ecs/apranova-lms/code-server`
- `/aws/lambda/apranova-lms-resource-optimizer`

## Scaling

### Auto-Scaling Policies

**Frontend:**
- Min: 1 task
- Max: 4 tasks
- Target: 70% CPU

**Backend:**
- Min: 1 task
- Max: 4 tasks
- Target: 70% CPU

**Code-Server:**
- On-demand (managed by Lambda)
- Dynamic resource allocation

### Scheduled Scaling

**Scale Down** (11 PM UTC):
- Frontend: 0-1 tasks
- Backend: 0-1 tasks

**Scale Up** (6 AM UTC):
- Frontend: 1-4 tasks
- Backend: 1-4 tasks

## Troubleshooting

### Common Issues

**1. Task fails to start**
```bash
# Check logs
aws logs tail /ecs/apranova-lms/code-server --follow

# Check task status
aws ecs describe-tasks --cluster apranova-lms-cluster --tasks <task-id>
```

**2. EFS mount fails**
```bash
# Verify mount targets
aws efs describe-mount-targets --file-system-id <efs-id>

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

**3. Lambda not optimizing**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/apranova-lms-resource-optimizer --follow

# Verify EventBridge rule
aws events list-rules --name-prefix apranova-lms
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all infrastructure including EFS data!

## Support

For issues:
1. Check CloudWatch logs
2. Review Terraform plan output
3. Consult AWS documentation
4. Contact support team

## License

Proprietary - Apranova LMS

---

**Status**: Production Ready ✅
