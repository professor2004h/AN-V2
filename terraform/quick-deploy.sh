#!/bin/bash

# Apranova LMS - Quick Deployment Script
# This script helps you deploy the infrastructure to AWS

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        Apranova LMS - AWS Fargate Deployment              ║"
echo "║              Quick Start Script                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi
echo "✅ AWS CLI found"

# Check Terraform
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Please install it first."
    exit 1
fi
echo "✅ Terraform found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install it first."
    exit 1
fi
echo "✅ Node.js found"

echo ""
echo "📝 Please provide the following information:"
echo ""

# Get Supabase credentials
read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -sp "Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""

# Export variables
export TF_VAR_supabase_url="$SUPABASE_URL"
export TF_VAR_supabase_anon_key="$SUPABASE_ANON_KEY"
export TF_VAR_supabase_service_role_key="$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "🔨 Building Lambda function..."
cd terraform
chmod +x build-lambda.sh
./build-lambda.sh

echo ""
echo "🚀 Initializing Terraform..."
terraform init

echo ""
echo "📋 Creating Terraform plan..."
terraform plan -out=tfplan

echo ""
read -p "Do you want to apply this plan? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Applying Terraform configuration..."
terraform apply tfplan

echo ""
echo "✅ Infrastructure deployed successfully!"
echo ""

# Get outputs
ALB_DNS=$(terraform output -raw alb_dns_name)
EFS_ID=$(terraform output -raw efs_id)
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Deployment Summary                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Load Balancer DNS: $ALB_DNS"
echo "💾 EFS File System ID: $EFS_ID"
echo "🐳 ECS Cluster: $CLUSTER_NAME"
echo ""
echo "📝 Next Steps:"
echo "1. Build and push Docker images to ECR"
echo "2. Update ECS services to use new images"
echo "3. Test the application at http://$ALB_DNS"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Deployment complete!"
