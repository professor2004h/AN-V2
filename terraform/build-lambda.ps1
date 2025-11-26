# Build Lambda Function for Resource Optimizer
Write-Host "Building Lambda function..." -ForegroundColor Green

Set-Location "$PSScriptRoot\lambda\resource-optimizer"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path * -DestinationPath ..\resource-optimizer.zip -Force

Write-Host "Lambda function built successfully!" -ForegroundColor Green
Write-Host "Package location: $PSScriptRoot\lambda\resource-optimizer.zip" -ForegroundColor Cyan
