#!/bin/bash

# Build Lambda Function for Resource Optimizer
echo "Building Lambda function..."

cd "$(dirname "$0")/lambda/resource-optimizer"

# Install dependencies
echo "Installing dependencies..."
npm install

# Create deployment package
echo "Creating deployment package..."
zip -r ../resource-optimizer.zip . -x "*.git*" -x "node_modules/.cache/*"

echo "Lambda function built successfully!"
echo "Package location: $(pwd)/../resource-optimizer.zip"
