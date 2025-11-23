#!/bin/bash

# Script to set up Terraform S3 backend and import existing resources
# Run this script once to initialize the backend

set -e

AWS_REGION="ap-southeast-2"
BUCKET_NAME="apranova-lms-terraform-state"
DYNAMODB_TABLE="apranova-lms-terraform-locks"

echo "Setting up Terraform backend infrastructure..."

# Create S3 bucket for state
echo "Creating S3 bucket: $BUCKET_NAME"
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION \
  || echo "Bucket already exists"

# Enable versioning
echo "Enabling versioning on S3 bucket..."
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable encryption
echo "Enabling encryption on S3 bucket..."
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
echo "Blocking public access to S3 bucket..."
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB table for state locking
echo "Creating DynamoDB table: $DYNAMODB_TABLE"
aws dynamodb create-table \
  --table-name $DYNAMODB_TABLE \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region $AWS_REGION \
  || echo "DynamoDB table already exists"

echo "Backend infrastructure setup complete!"
echo ""
echo "Now run: terraform init -reconfigure"
