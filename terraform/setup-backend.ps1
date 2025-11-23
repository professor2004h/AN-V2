# PowerShell script to set up Terraform S3 backend
# Run this script once to initialize the backend

$ErrorActionPreference = "Continue"

$AWS_REGION = "ap-southeast-2"
$BUCKET_NAME = "apranova-lms-terraform-state"
$DYNAMODB_TABLE = "apranova-lms-terraform-locks"

Write-Host "Setting up Terraform backend infrastructure..." -ForegroundColor Green

# Create S3 bucket for state
Write-Host "Creating S3 bucket: $BUCKET_NAME" -ForegroundColor Yellow
try {
    aws s3api create-bucket `
        --bucket $BUCKET_NAME `
        --region $AWS_REGION `
        --create-bucket-configuration LocationConstraint=$AWS_REGION
}
catch {
    Write-Host "Bucket already exists or error occurred" -ForegroundColor Yellow
}

# Enable versioning
Write-Host "Enabling versioning on S3 bucket..." -ForegroundColor Yellow
aws s3api put-bucket-versioning `
    --bucket $BUCKET_NAME `
    --versioning-configuration Status=Enabled

# Enable encryption
Write-Host "Enabling encryption on S3 bucket..." -ForegroundColor Yellow
$encryptionConfig = @'
{
  "Rules": [{
    "ApplyServerSideEncryptionByDefault": {
      "SSEAlgorithm": "AES256"
    }
  }]
}
'@
aws s3api put-bucket-encryption `
    --bucket $BUCKET_NAME `
    --server-side-encryption-configuration $encryptionConfig

# Block public access
Write-Host "Blocking public access to S3 bucket..." -ForegroundColor Yellow
aws s3api put-public-access-block `
    --bucket $BUCKET_NAME `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB table for state locking
Write-Host "Creating DynamoDB table: $DYNAMODB_TABLE" -ForegroundColor Yellow
try {
    aws dynamodb create-table `
        --table-name $DYNAMODB_TABLE `
        --attribute-definitions AttributeName=LockID, AttributeType=S `
        --key-schema AttributeName=LockID, KeyType=HASH `
        --provisioned-throughput ReadCapacityUnits=5, WriteCapacityUnits=5 `
        --region $AWS_REGION
}
catch {
    Write-Host "DynamoDB table already exists or error occurred" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend infrastructure setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: terraform init -reconfigure" -ForegroundColor Cyan
