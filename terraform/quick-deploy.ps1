# Apranova LMS - Quick Deployment Script (PowerShell)
# This script helps you deploy the infrastructure to AWS

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        Apranova LMS - AWS Fargate Deployment              ║" -ForegroundColor Cyan
Write-Host "║              Quick Start Script                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ AWS CLI found" -ForegroundColor Green

# Check Terraform
if (!(Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Terraform not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Terraform found" -ForegroundColor Green

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found" -ForegroundColor Green

Write-Host ""
Write-Host "📝 Please provide the following information:" -ForegroundColor Yellow
Write-Host ""

# Get Supabase credentials
$SUPABASE_URL = Read-Host "Supabase URL"
$SUPABASE_ANON_KEY = Read-Host "Supabase Anon Key"
$SUPABASE_SERVICE_ROLE_KEY = Read-Host "Supabase Service Role Key" -AsSecureString
$SUPABASE_SERVICE_ROLE_KEY_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SUPABASE_SERVICE_ROLE_KEY)
)

# Export variables
$env:TF_VAR_supabase_url = $SUPABASE_URL
$env:TF_VAR_supabase_anon_key = $SUPABASE_ANON_KEY
$env:TF_VAR_supabase_service_role_key = $SUPABASE_SERVICE_ROLE_KEY_PLAIN

Write-Host ""
Write-Host "🔨 Building Lambda function..." -ForegroundColor Yellow
Set-Location terraform
.\build-lambda.ps1

Write-Host ""
Write-Host "🚀 Initializing Terraform..." -ForegroundColor Yellow
terraform init

Write-Host ""
Write-Host "📋 Creating Terraform plan..." -ForegroundColor Yellow
terraform plan -out=tfplan

Write-Host ""
$CONFIRM = Read-Host "Do you want to apply this plan? (yes/no)"

if ($CONFIRM -ne "yes") {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Applying Terraform configuration..." -ForegroundColor Yellow
terraform apply tfplan

Write-Host ""
Write-Host "✅ Infrastructure deployed successfully!" -ForegroundColor Green
Write-Host ""

# Get outputs
$ALB_DNS = terraform output -raw alb_dns_name
$EFS_ID = terraform output -raw efs_id
$CLUSTER_NAME = terraform output -raw ecs_cluster_name

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  Deployment Summary                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Load Balancer DNS: $ALB_DNS" -ForegroundColor White
Write-Host "💾 EFS File System ID: $EFS_ID" -ForegroundColor White
Write-Host "🐳 ECS Cluster: $CLUSTER_NAME" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Build and push Docker images to ECR" -ForegroundColor White
Write-Host "2. Update ECS services to use new images" -ForegroundColor White
Write-Host "3. Test the application at http://$ALB_DNS" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
