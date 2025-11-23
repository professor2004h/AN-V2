# Quick setup script for Terraform backend and resource import
# This script automates the entire setup process

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Apranova LMS Terraform Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup backend
Write-Host "[1/4] Setting up Terraform backend..." -ForegroundColor Green
& "$PSScriptRoot\setup-backend.ps1"
Write-Host ""

# Step 2: Initialize Terraform
Write-Host "[2/4] Initializing Terraform..." -ForegroundColor Green
Set-Location $PSScriptRoot
terraform init -reconfigure
Write-Host ""

# Step 3: Import existing resources
Write-Host "[3/4] Importing existing AWS resources..." -ForegroundColor Green
& "$PSScriptRoot\import-resources.ps1"
Write-Host ""

# Step 4: Verify setup
Write-Host "[4/4] Verifying setup..." -ForegroundColor Green
terraform plan -detailed-exitcode
$planExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($planExitCode -eq 0) {
    Write-Host "✓ Setup complete! No changes needed." -ForegroundColor Green
}
elseif ($planExitCode -eq 2) {
    Write-Host "✓ Setup complete! Some changes detected." -ForegroundColor Yellow
    Write-Host "  Review the plan above and run 'terraform apply' when ready." -ForegroundColor Yellow
}
else {
    Write-Host "✗ Setup completed with warnings." -ForegroundColor Yellow
    Write-Host "  Review the output above." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
