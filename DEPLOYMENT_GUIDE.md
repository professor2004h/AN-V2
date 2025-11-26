# 🚀 AWS Fargate Deployment Guide - Apranova LMS

## 📋 Overview

This deployment uses **AWS Fargate** with **dynamic resource allocation** for cost-optimized code-server workspaces. The infrastructure is fully managed by Terraform and deployed via GitHub Actions.

---

## 🏗️ Architecture

### **Infrastructure Components**

1. **VPC & Networking**
   - Custom VPC with public and private subnets across 2 AZs
   - NAT Gateways for outbound internet access
   - Application Load Balancer for traffic distribution

2. **ECS Fargate**
   - Frontend Service (0.5 vCPU, 1 GB RAM)
   - Backend Service (1 vCPU, 2 GB RAM)
   - Code-Server Workspaces (Dynamic: 0.5-4 vCPU, 1-8 GB RAM)

3. **EFS (Elastic File System)**
   - Persistent storage for student workspaces
   - Automatic lifecycle management (transition to IA after 30 days)
   - Encrypted at rest and in transit

4. **Lambda Function**
   - Dynamic resource allocation for code-server
   - Runs every 2 minutes to optimize resources
   - Monitors CPU/Memory usage and adjusts task definitions

5. **CloudWatch**
   - Container Insights for monitoring
   - Alarms for high CPU/Memory usage
   - Log aggregation with 7-day retention

---

## 💰 Cost Optimization Strategy

### **Dynamic Resource Allocation**

Code-server workspaces automatically switch between 3 tiers:

| Tier | CPU | Memory | Use Case | Cost/Hour* |
|------|-----|--------|----------|------------|
| **Initial** | 2 vCPU | 4 GB | Fast IDE rendering | ~$0.12 |
| **Idle** | 0.5 vCPU | 1 GB | Cost-saving mode | ~$0.03 |
| **Performance** | 4 vCPU | 8 GB | Heavy workloads | ~$0.24 |

*Approximate Fargate Spot pricing

### **Transition Logic**

```
1. Launch → Initial Tier (2 vCPU, 4 GB)
   ↓ (5 minutes + low CPU/Memory)
2. Idle Tier (0.5 vCPU, 1 GB)
   ↓ (high CPU/Memory detected)
3. Performance Tier (4 vCPU, 8 GB)
   ↓ (load decreases)
4. Back to Idle Tier
```

### **Additional Cost Savings**

- **Scheduled Scaling**: Scale down to 0 during off-hours (11 PM - 6 AM UTC)
- **Fargate Spot**: Use spot instances where possible (up to 70% savings)
- **EFS Lifecycle**: Move infrequently accessed files to IA storage
- **Auto-cleanup**: Stop idle workspaces after 15 minutes of inactivity

---

## 🔧 Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with secrets configured
3. **Supabase Project** (already configured)
4. **Terraform** installed locally (optional, for manual deployment)

---

## 🔐 GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
SUPABASE_URL=https://phlkhoorckdjriswcpwz.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DB_PASSWORD=<your-db-password>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
RESEND_API_KEY=<your-resend-api-key>
JWT_SECRET=<your-jwt-secret>
CODE_SERVER_PASSWORD=apranova123
```

---

## 🚀 Deployment Steps

### **Option 1: Automatic Deployment (Recommended)**

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to AWS Fargate"
   git push origin main
   ```

2. **Monitor GitHub Actions**:
   - Go to your repository → Actions tab
   - Watch the deployment progress
   - Terraform will provision infrastructure
   - Docker images will be built and pushed
   - ECS services will be updated

3. **Get ALB DNS**:
   - Check the deployment summary in GitHub Actions
   - Or run: `terraform output alb_dns_name`

### **Option 2: Manual Deployment**

1. **Initialize Terraform**:
   ```bash
   cd terraform
   terraform init
   ```

2. **Create S3 backend** (first time only):
   ```bash
   # Comment out the backend block in main.tf temporarily
   terraform apply -target=aws_s3_bucket.terraform_state
   terraform apply -target=aws_dynamodb_table.terraform_locks
   # Uncomment the backend block
   terraform init -migrate-state
   ```

3. **Plan and Apply**:
   ```bash
   export TF_VAR_supabase_url="https://phlkhoorckdjriswcpwz.supabase.co"
   export TF_VAR_supabase_anon_key="<your-key>"
   export TF_VAR_supabase_service_role_key="<your-key>"
   
   terraform plan
   terraform apply
   ```

4. **Build and Push Docker Images**:
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and push frontend
   cd frontend
   docker build -t <ecr-url>/apranova-lms-frontend:latest .
   docker push <ecr-url>/apranova-lms-frontend:latest
   
   # Build and push backend
   cd ../backend
   docker build -t <ecr-url>/apranova-lms-backend:latest .
   docker push <ecr-url>/apranova-lms-backend:latest
   
   # Build and push code-server
   cd ../docker/code-server
   docker build -t <ecr-url>/apranova-lms-code-server:latest .
   docker push <ecr-url>/apranova-lms-code-server:latest
   ```

5. **Deploy Lambda Function**:
   ```bash
   cd terraform/lambda/resource-optimizer
   npm install
   zip -r ../resource-optimizer.zip .
   
   aws lambda update-function-code \
     --function-name apranova-lms-resource-optimizer \
     --zip-file fileb://../resource-optimizer.zip \
     --region us-east-1
   ```

---

## 📊 Monitoring & Troubleshooting

### **CloudWatch Dashboards**

Access CloudWatch to monitor:
- ECS Service CPU/Memory utilization
- ALB request count and latency
- EFS throughput and IOPS
- Lambda function invocations

### **Logs**

View logs in CloudWatch Log Groups:
- `/ecs/apranova-lms/frontend`
- `/ecs/apranova-lms/backend`
- `/ecs/apranova-lms/code-server`
- `/aws/lambda/apranova-lms-resource-optimizer`

### **Common Issues**

1. **Task fails to start**:
   - Check CloudWatch logs for errors
   - Verify EFS mount targets are available
   - Ensure security groups allow traffic

2. **High costs**:
   - Check if scheduled scaling is working
   - Verify Lambda is optimizing resources
   - Review CloudWatch metrics for idle tasks

3. **Workspace files not persisting**:
   - Verify EFS is mounted correctly
   - Check EFS access point permissions
   - Ensure task role has EFS permissions

---

## 🔄 Updates & Rollbacks

### **Update Application**

```bash
# Push changes to main branch
git push origin main

# Or manually update ECS service
aws ecs update-service \
  --cluster apranova-lms-cluster \
  --service apranova-lms-backend \
  --force-new-deployment
```

### **Rollback**

```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster apranova-lms-cluster \
  --service apranova-lms-backend \
  --task-definition apranova-lms-backend:PREVIOUS_REVISION
```

---

## 📈 Scaling Configuration

### **Auto-Scaling Policies**

- **Frontend**: 1-4 tasks, scale at 70% CPU
- **Backend**: 1-4 tasks, scale at 70% CPU
- **Code-Server**: On-demand, managed by Lambda

### **Adjust Scaling**

Edit `terraform/ecs.tf`:
```hcl
resource "aws_appautoscaling_target" "frontend" {
  max_capacity = 10  # Increase max tasks
  min_capacity = 2   # Increase min tasks
  ...
}
```

---

## 🧪 Testing

### **Health Checks**

```bash
# Frontend
curl http://<alb-dns>/

# Backend
curl http://<alb-dns>:3001/api/health

# Code-Server (from within VPC)
curl http://<private-ip>:8080/healthz
```

### **Load Testing**

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test frontend
ab -n 1000 -c 10 http://<alb-dns>/

# Test backend API
ab -n 1000 -c 10 http://<alb-dns>:3001/api/health
```

---

## 💵 Cost Estimation

### **Monthly Cost Breakdown** (Approximate)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **ECS Fargate** | Frontend (1 task, 24/7) | $15 |
| **ECS Fargate** | Backend (1 task, 24/7) | $30 |
| **ECS Fargate** | Code-Server (avg 10 students, 8h/day) | $72 |
| **ALB** | 1 ALB | $16 |
| **EFS** | 50 GB storage | $15 |
| **NAT Gateway** | 2 NAT Gateways | $64 |
| **CloudWatch** | Logs + Metrics | $10 |
| **Lambda** | Resource optimizer | $1 |
| **Data Transfer** | Moderate usage | $20 |
| **Total** | | **~$243/month** |

### **Cost Optimization Tips**

1. Use Fargate Spot for non-critical workloads (70% savings)
2. Enable scheduled scaling during off-hours
3. Reduce NAT Gateways to 1 (saves $32/month)
4. Use VPC endpoints for AWS services (reduces data transfer)
5. Implement aggressive auto-cleanup for idle workspaces

---

## 🔒 Security Best Practices

1. **Secrets Management**: All secrets stored in GitHub Secrets
2. **Encryption**: EFS encrypted at rest and in transit
3. **Network Isolation**: Code-server in private subnets
4. **IAM Roles**: Least privilege access for all services
5. **Security Groups**: Restrictive inbound/outbound rules

---

## 📞 Support

For issues or questions:
1. Check CloudWatch logs
2. Review GitHub Actions workflow
3. Consult AWS documentation
4. Contact support team

---

## 🎉 Success Criteria

✅ Infrastructure provisioned successfully  
✅ All ECS services running  
✅ ALB health checks passing  
✅ Code-server workspaces launching  
✅ Files persisting in EFS  
✅ Lambda optimizing resources  
✅ Costs within budget  

---

**Deployment Status**: Ready for Production 🚀
