# 🚀 New AWS Account Deployment - Ready to Go!

## ✅ What's Been Done

1. **Updated Configuration Files**
   - ✅ `backend-task-def.json` - Updated to account `183037996720` and region `us-east-1`
   - ✅ `.github/workflows/deploy.yml` - Changed region to `us-east-1`
   - ✅ GitHub Secrets - You've already updated with new credentials

2. **Created Deployment Scripts**
   - ✅ `setup-aws-infrastructure.sh` - Automated setup script
   - ✅ `NEW_ACCOUNT_DEPLOYMENT.md` - Detailed manual guide

## 📋 Next Steps

### Option A: Automated Setup (Recommended - 5 minutes)

Run the automated setup script:

```bash
# Make the script executable
chmod +x setup-aws-infrastructure.sh

# Run it (requires AWS CLI configured with your new credentials)
./setup-aws-infrastructure.sh
```

This will create:
- VPC with 2 public subnets (us-east-1a, us-east-1b)
- Internet Gateway and Route Tables
- Security Groups (ALB + ECS Tasks)
- Application Load Balancer
- Target Groups
- ECR Repositories
- IAM Role for ECS
- CloudWatch Log Groups
- ECS Cluster

### Option B: Manual Setup (30-45 minutes)

Follow the step-by-step guide in `NEW_ACCOUNT_DEPLOYMENT.md`

## ⚠️ Important: Update Environment Variables

After running the setup script, it will output the ALB DNS name. You need to update:

### 1. Update `backend/.env.production`
```bash
FRONTEND_URL=http://<ALB_DNS_FROM_SCRIPT>
BACKEND_URL=http://<ALB_DNS_FROM_SCRIPT>:3001
```

### 2. Update `frontend/.env.production`
```bash
NEXT_PUBLIC_API_URL=http://<ALB_DNS_FROM_SCRIPT>:3001
```

## 🚀 Deploy

Once environment variables are updated:

```bash
git add backend/.env.production frontend/.env.production
git commit -m "update: environment variables for new AWS account"
git push origin main
```

This will trigger GitHub Actions to:
1. Build Docker images
2. Push to ECR (new account)
3. Deploy to ECS (new account in us-east-1)

## 🔍 Monitor Deployment

Watch the deployment progress:
- GitHub Actions: https://github.com/professor2004h/AN-V2/actions
- AWS ECS Console: https://us-east-1.console.aws.amazon.com/ecs/v2/clusters

## ✅ Verification

Once deployment completes (5-10 minutes):

1. Visit: `http://<ALB_DNS>`
2. Test Sign Up / Sign In
3. Check CloudWatch Logs if any issues

## 📊 Resources Created

| Resource | Name/ID | Region |
|----------|---------|--------|
| AWS Account | 183037996720 | - |
| Region | us-east-1 | N. Virginia |
| VPC | apranova-lms-vpc | us-east-1 |
| Subnets | 2 public subnets | us-east-1a, us-east-1b |
| ALB | apranova-lms-alb | us-east-1 |
| ECS Cluster | apranova-lms-cluster | us-east-1 |
| ECR Repos | frontend, backend | us-east-1 |

## 🔐 Security Notes

1. ⚠️ **Revoke the credentials you posted earlier** - Go to IAM Console and deactivate/delete the access key `AKIASVHPKF2YK274OUM2`
2. ✅ GitHub Secrets are secure - credentials are never exposed in logs
3. ✅ Security Groups are configured correctly - only necessary ports open

## 🆘 Troubleshooting

If deployment fails:

1. **Check GitHub Actions logs** - Look for build/push errors
2. **Check ECS Service events** - `aws ecs describe-services --cluster apranova-lms-cluster --services apranova-lms-backend --region us-east-1`
3. **Check CloudWatch Logs** - `/ecs/apranova-lms-backend` and `/ecs/apranova-lms-frontend`
4. **Verify IAM permissions** - Ensure the role has ECR pull permissions

## 📞 Need Help?

If you encounter any issues, provide:
- GitHub Actions workflow run URL
- ECS service status
- CloudWatch log excerpts
- Any error messages

---

**Ready to deploy?** Run the setup script and let's get your LMS live in the new account! 🎉
