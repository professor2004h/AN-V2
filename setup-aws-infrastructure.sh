#!/bin/bash
# Quick Setup Script for New AWS Account
# Run this script to create all required infrastructure

set -e

REGION="us-east-1"
ACCOUNT_ID="183037996720"

echo "🚀 Starting Apranova LMS Infrastructure Setup"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo ""

# Step 1: Create VPC
echo "📦 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region $REGION \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=apranova-lms-vpc}]' \
  --query 'Vpc.VpcId' \
  --output text)

aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames --region $REGION
echo "✅ VPC Created: $VPC_ID"

# Step 2: Create Internet Gateway
echo "🌐 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
  --region $REGION \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=apranova-lms-igw}]' \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $REGION
echo "✅ Internet Gateway Created: $IGW_ID"

# Step 3: Create Subnets
echo "🔗 Creating Subnets..."
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${REGION}a \
  --region $REGION \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=apranova-lms-subnet-1}]' \
  --query 'Subnet.SubnetId' \
  --output text)

SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${REGION}b \
  --region $REGION \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=apranova-lms-subnet-2}]' \
  --query 'Subnet.SubnetId' \
  --output text)

echo "✅ Subnets Created: $SUBNET_1, $SUBNET_2"

# Step 4: Create Route Table
echo "🛣️  Creating Route Table..."
RT_ID=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --region $REGION \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=apranova-lms-rt}]' \
  --query 'RouteTable.RouteTableId' \
  --output text)

aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $REGION
aws ec2 associate-route-table --subnet-id $SUBNET_1 --route-table-id $RT_ID --region $REGION
aws ec2 associate-route-table --subnet-id $SUBNET_2 --route-table-id $RT_ID --region $REGION
echo "✅ Route Table Created: $RT_ID"

# Step 5: Create Security Groups
echo "🔒 Creating Security Groups..."
ALB_SG=$(aws ec2 create-security-group \
  --group-name apranova-lms-alb-sg \
  --description "Security group for Apranova LMS ALB" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --query 'GroupId' \
  --output text)

aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $REGION
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $REGION
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 3001 --cidr 0.0.0.0/0 --region $REGION
echo "✅ ALB Security Group Created: $ALB_SG"

ECS_SG=$(aws ec2 create-security-group \
  --group-name apranova-lms-ecs-tasks-sg \
  --description "Security group for Apranova LMS ECS tasks" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --query 'GroupId' \
  --output text)

aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 3001 --source-group $ALB_SG --region $REGION
aws ec2 authorize-security-group-ingress --group-id $ECS_SG --protocol tcp --port 3000 --source-group $ALB_SG --region $REGION
echo "✅ ECS Tasks Security Group Created: $ECS_SG"

# Step 6: Create Application Load Balancer
echo "⚖️  Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name apranova-lms-alb \
  --subnets $SUBNET_1 $SUBNET_2 \
  --security-groups $ALB_SG \
  --region $REGION \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --region $REGION \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "✅ ALB Created: $ALB_DNS"

# Step 7: Create Target Groups
echo "🎯 Creating Target Groups..."
FRONTEND_TG=$(aws elbv2 create-target-group \
  --name apranova-lms-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path / \
  --region $REGION \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

BACKEND_TG=$(aws elbv2 create-target-group \
  --name apranova-lms-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-path /health \
  --region $REGION \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "✅ Target Groups Created"

# Step 8: Create Listeners
echo "👂 Creating Listeners..."
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG \
  --region $REGION

aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 3001 \
  --default-actions Type=forward,TargetGroupArn=$BACKEND_TG \
  --region $REGION

echo "✅ Listeners Created"

# Step 9: Create ECR Repositories
echo "📦 Creating ECR Repositories..."
aws ecr create-repository --repository-name apranova-lms-frontend --region $REGION 2>/dev/null || echo "Frontend repo already exists"
aws ecr create-repository --repository-name apranova-lms-backend --region $REGION 2>/dev/null || echo "Backend repo already exists"
echo "✅ ECR Repositories Ready"

# Step 10: Create IAM Role
echo "🔑 Creating IAM Role..."
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://ecs-trust-policy.json 2>/dev/null || echo "Role already exists"

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 2>/dev/null || true

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly 2>/dev/null || true

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name CloudWatchLogsPolicy \
  --policy-document file://logs-policy.json 2>/dev/null || true

echo "✅ IAM Role Ready"

# Step 11: Create CloudWatch Log Groups
echo "📊 Creating CloudWatch Log Groups..."
aws logs create-log-group --log-group-name /ecs/apranova-lms-frontend --region $REGION 2>/dev/null || echo "Frontend log group already exists"
aws logs create-log-group --log-group-name /ecs/apranova-lms-backend --region $REGION 2>/dev/null || echo "Backend log group already exists"
echo "✅ Log Groups Ready"

# Step 12: Create ECS Cluster
echo "🐳 Creating ECS Cluster..."
aws ecs create-cluster --cluster-name apranova-lms-cluster --region $REGION 2>/dev/null || echo "Cluster already exists"
echo "✅ ECS Cluster Ready"

echo ""
echo "🎉 Infrastructure Setup Complete!"
echo ""
echo "📝 Important Information:"
echo "========================="
echo "VPC ID: $VPC_ID"
echo "Subnet 1: $SUBNET_1"
echo "Subnet 2: $SUBNET_2"
echo "ALB Security Group: $ALB_SG"
echo "ECS Security Group: $ECS_SG"
echo "ALB DNS: $ALB_DNS"
echo ""
echo "🌐 Application URLs (after deployment):"
echo "Frontend: http://$ALB_DNS"
echo "Backend: http://$ALB_DNS:3001"
echo ""
echo "⚠️  IMPORTANT: Update environment variables!"
echo "Update backend/.env.production with:"
echo "FRONTEND_URL=http://$ALB_DNS"
echo "BACKEND_URL=http://$ALB_DNS:3001"
echo ""
echo "Then run: git add . && git commit -m 'update env' && git push origin main"
