# Apranova LMS - New AWS Account Deployment Guide
# Account: 183037996720
# Region: us-east-1 (N. Virginia)

## Prerequisites
- AWS CLI configured with the new account credentials
- GitHub Secrets updated with new AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

## Step 1: Create VPC and Networking

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region us-east-1 \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames \
  --region us-east-1

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
  --region us-east-1 \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

echo "Internet Gateway ID: $IGW_ID"

# Attach IGW to VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID \
  --region us-east-1

# Create Subnet 1 (us-east-1a)
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --region us-east-1 \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Subnet 1 ID: $SUBNET_1"

# Create Subnet 2 (us-east-1b)
SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --region us-east-1 \
  --query 'Subnet.SubnetId' \
  --output text)

echo "Subnet 2 ID: $SUBNET_2"

# Create Route Table
RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query 'RouteTable.RouteTableId' \
  --output text)

echo "Route Table ID: $RT_ID"

# Add route to IGW
aws ec2 create-route \
  --route-table-id $RT_ID \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID \
  --region us-east-1

# Associate subnets with route table
aws ec2 associate-route-table \
  --subnet-id $SUBNET_1 \
  --route-table-id $RT_ID \
  --region us-east-1

aws ec2 associate-route-table \
  --subnet-id $SUBNET_2 \
  --route-table-id $RT_ID \
  --region us-east-1
```

## Step 2: Create Security Groups

```bash
# Create ALB Security Group
ALB_SG=$(aws ec2 create-security-group \
  --group-name apranova-lms-alb-sg \
  --description "Security group for Apranova LMS ALB" \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

echo "ALB Security Group ID: $ALB_SG"

# Allow HTTP (80)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow HTTPS (443)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow Backend Port (3001)
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Create ECS Tasks Security Group
ECS_SG=$(aws ec2 create-security-group \
  --group-name apranova-lms-ecs-tasks-sg \
  --description "Security group for Apranova LMS ECS tasks" \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query 'GroupId' \
  --output text)

echo "ECS Tasks Security Group ID: $ECS_SG"

# Allow traffic from ALB on port 3001
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 3001 \
  --source-group $ALB_SG \
  --region us-east-1

# Allow traffic from ALB on port 3000 (frontend)
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 3000 \
  --source-group $ALB_SG \
  --region us-east-1
```

## Step 3: Create Application Load Balancer

```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name apranova-lms-alb \
  --subnets $SUBNET_1 $SUBNET_2 \
  --security-groups $ALB_SG \
  --region us-east-1 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

echo "ALB ARN: $ALB_ARN"

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --region us-east-1 \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "ALB DNS: $ALB_DNS"
echo "Frontend URL: http://$ALB_DNS"
echo "Backend URL: http://$ALB_DNS:3001"

# Create Target Group for Frontend
FRONTEND_TG=$(aws elbv2 create-target-group \
  --name apranova-lms-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --region us-east-1 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "Frontend Target Group ARN: $FRONTEND_TG"

# Create Target Group for Backend
BACKEND_TG=$(aws elbv2 create-target-group \
  --name apranova-lms-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --region us-east-1 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "Backend Target Group ARN: $BACKEND_TG"

# Create Listener for Frontend (port 80)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG \
  --region us-east-1

# Create Listener for Backend (port 3001)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 3001 \
  --default-actions Type=forward,TargetGroupArn=$BACKEND_TG \
  --region us-east-1
```

## Step 4: Create ECR Repositories

```bash
# Create Frontend Repository
aws ecr create-repository \
  --repository-name apranova-lms-frontend \
  --region us-east-1

# Create Backend Repository
aws ecr create-repository \
  --repository-name apranova-lms-backend \
  --region us-east-1
```

## Step 5: Create IAM Role for ECS Tasks

```bash
# Create IAM role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Attach ECR read-only policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

# Attach custom CloudWatch Logs policy
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name CloudWatchLogsPolicy \
  --policy-document file://logs-policy.json
```

## Step 6: Create CloudWatch Log Groups

```bash
aws logs create-log-group \
  --log-group-name /ecs/apranova-lms-frontend \
  --region us-east-1

aws logs create-log-group \
  --log-group-name /ecs/apranova-lms-backend \
  --region us-east-1
```

## Step 7: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name apranova-lms-cluster \
  --region us-east-1
```

## Step 8: Update Environment Variables

Update `backend/.env.production` and `frontend/.env.production` with the ALB DNS name:

```bash
# Replace with your actual ALB DNS
FRONTEND_URL=http://$ALB_DNS
BACKEND_URL=http://$ALB_DNS:3001
```

## Step 9: Trigger GitHub Actions Deployment

After completing the above steps, commit and push to trigger the deployment:

```bash
git add .
git commit -m "Deploy to new AWS account (us-east-1)"
git push origin main
```

## Summary of Created Resources

Save these IDs for reference:

- **VPC ID**: (from Step 1)
- **Subnet 1 ID**: (from Step 1)
- **Subnet 2 ID**: (from Step 1)
- **ALB Security Group ID**: (from Step 2)
- **ECS Tasks Security Group ID**: (from Step 2)
- **ALB DNS Name**: (from Step 3)
- **Frontend Target Group ARN**: (from Step 3)
- **Backend Target Group ARN**: (from Step 3)

## Verification

Once GitHub Actions completes:

1. Visit: `http://<ALB_DNS>`
2. Test Sign Up / Sign In
3. Check CloudWatch Logs for any errors
