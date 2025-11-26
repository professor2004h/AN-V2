# ✅ Pre-Deployment Checklist

## 📋 Before You Deploy

### 1. AWS Account Setup
- [ ] AWS account created and verified
- [ ] AWS CLI installed and configured
- [ ] Access keys created
- [ ] Sufficient permissions for:
  - VPC, Subnets, Security Groups
  - ECS, Fargate, ECR
  - EFS, S3, DynamoDB
  - Lambda, CloudWatch, EventBridge
  - IAM roles and policies
  - Application Load Balancer

### 2. GitHub Repository Setup
- [ ] Repository created
- [ ] GitHub Actions enabled
- [ ] Secrets configured:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `DB_PASSWORD`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `CODE_SERVER_PASSWORD`

### 3. Supabase Setup
- [ ] Supabase project created
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] API keys generated
- [ ] Connection tested

### 4. Local Development Environment
- [ ] Terraform installed (>= 1.0)
- [ ] AWS CLI installed
- [ ] Node.js installed (>= 18.x)
- [ ] Docker installed (for local testing)
- [ ] Git installed

### 5. Code Verification
- [ ] All Terraform files created:
  - [ ] `terraform/main.tf`
  - [ ] `terraform/ecs.tf`
  - [ ] `terraform/lambda.tf`
  - [ ] `terraform/terraform.tfvars`
- [ ] Lambda function created:
  - [ ] `terraform/lambda/resource-optimizer/index.js`
  - [ ] `terraform/lambda/resource-optimizer/package.json`
- [ ] Docker files created:
  - [ ] `docker/code-server/Dockerfile`
- [ ] Backend service updated:
  - [ ] `backend/src/services/workspaceServiceFargate.ts`
- [ ] GitHub Actions workflow updated:
  - [ ] `.github/workflows/deploy.yml`

### 6. Documentation
- [ ] `DEPLOYMENT_GUIDE.md` reviewed
- [ ] `AWS_DEPLOYMENT_SUMMARY.md` reviewed
- [ ] `terraform/README.md` reviewed
- [ ] `IDE_AUTO_SAVE_TEST_RESULTS.md` reviewed

---

## 🚀 Deployment Steps

### Step 1: Verify AWS Credentials
```bash
aws sts get-caller-identity
```
Expected output: Your AWS account ID and user ARN

### Step 2: Test Terraform Configuration
```bash
cd terraform
terraform init
terraform validate
```
Expected output: "Success! The configuration is valid."

### Step 3: Build Lambda Function
```bash
# Linux/Mac
./build-lambda.sh

# Windows
.\build-lambda.ps1
```
Expected output: "Lambda function built successfully!"

### Step 4: Review Terraform Plan
```bash
export TF_VAR_supabase_url="https://phlkhoorckdjriswcpwz.supabase.co"
export TF_VAR_supabase_anon_key="<your-key>"
export TF_VAR_supabase_service_role_key="<your-key>"

terraform plan
```
Review the plan carefully before proceeding.

### Step 5: Deploy Infrastructure
```bash
terraform apply
```
Type `yes` when prompted.

### Step 6: Verify Deployment
```bash
# Check ECS cluster
aws ecs describe-clusters --clusters apranova-lms-cluster

# Check services
aws ecs list-services --cluster apranova-lms-cluster

# Get ALB DNS
terraform output alb_dns_name
```

### Step 7: Build and Push Docker Images
```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push (or use GitHub Actions)
git add .
git commit -m "Deploy to AWS"
git push origin main
```

### Step 8: Monitor Deployment
- Go to GitHub Actions tab
- Watch the deployment progress
- Check for any errors

### Step 9: Test Application
```bash
# Get ALB DNS
ALB_DNS=$(terraform output -raw alb_dns_name)

# Test frontend
curl http://$ALB_DNS/

# Test backend
curl http://$ALB_DNS:3001/api/health
```

### Step 10: Verify Code-Server Provisioning
1. Login to the application
2. Create a test student account
3. Provision a workspace
4. Verify it launches successfully
5. Check EFS for persisted files

---

## 🔍 Post-Deployment Verification

### CloudWatch Monitoring
- [ ] Container Insights enabled
- [ ] Log groups created:
  - [ ] `/ecs/apranova-lms/frontend`
  - [ ] `/ecs/apranova-lms/backend`
  - [ ] `/ecs/apranova-lms/code-server`
  - [ ] `/aws/lambda/apranova-lms-resource-optimizer`
- [ ] Alarms configured:
  - [ ] Code-server high CPU
  - [ ] Code-server high memory

### ECS Services
- [ ] Frontend service running
- [ ] Backend service running
- [ ] Auto-scaling policies active
- [ ] Scheduled scaling configured

### Lambda Function
- [ ] Resource optimizer deployed
- [ ] EventBridge rule active (runs every 2 minutes)
- [ ] Permissions configured correctly

### EFS
- [ ] File system created
- [ ] Mount targets in both AZs
- [ ] Access point configured
- [ ] Lifecycle policy active

### ALB
- [ ] Load balancer active
- [ ] Target groups healthy
- [ ] Listeners configured
- [ ] Health checks passing

### Cost Optimization
- [ ] Fargate Spot enabled (where applicable)
- [ ] Scheduled scaling active
- [ ] Lambda optimizing resources
- [ ] EFS lifecycle management enabled

---

## 📊 Monitoring Checklist

### Daily Checks
- [ ] Check CloudWatch costs
- [ ] Review ECS service health
- [ ] Monitor Lambda invocations
- [ ] Check for failed tasks

### Weekly Checks
- [ ] Review cost trends in Cost Explorer
- [ ] Analyze Lambda optimization logs
- [ ] Check EFS usage and growth
- [ ] Review auto-scaling metrics

### Monthly Checks
- [ ] Full cost analysis
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Capacity planning

---

## 🆘 Troubleshooting

### Issue: Terraform Apply Fails
**Solution:**
1. Check AWS credentials
2. Verify IAM permissions
3. Review error message in output
4. Check Terraform state

### Issue: ECS Task Fails to Start
**Solution:**
1. Check CloudWatch logs
2. Verify ECR image exists
3. Check EFS mount targets
4. Review security group rules

### Issue: Lambda Not Optimizing
**Solution:**
1. Check Lambda logs
2. Verify EventBridge rule
3. Check IAM permissions
4. Review CloudWatch metrics

### Issue: High Costs
**Solution:**
1. Check for idle tasks
2. Verify scheduled scaling
3. Review Lambda optimization
4. Check NAT Gateway usage

---

## ✅ Success Criteria

### Infrastructure
- [x] All Terraform resources created
- [x] No errors in Terraform apply
- [x] All outputs available

### Services
- [x] Frontend service running
- [x] Backend service running
- [x] Health checks passing

### Monitoring
- [x] CloudWatch dashboards available
- [x] Logs flowing correctly
- [x] Alarms configured

### Cost Optimization
- [x] Lambda function active
- [x] Scheduled scaling working
- [x] Costs within budget

### Functionality
- [x] Application accessible via ALB
- [x] Code-server workspaces launching
- [x] Files persisting in EFS
- [x] Auto-save working

---

## 🎉 Deployment Complete!

Once all items are checked, your deployment is complete and production-ready!

**Next Steps:**
1. Monitor costs daily for the first week
2. Review Lambda logs to ensure proper optimization
3. Test with real users
4. Gather feedback and iterate

**Support:**
- Documentation: `DEPLOYMENT_GUIDE.md`
- Summary: `AWS_DEPLOYMENT_SUMMARY.md`
- Terraform Docs: `terraform/README.md`

---

**Deployment Date:** _________________

**Deployed By:** _________________

**ALB DNS:** _________________

**EFS ID:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
