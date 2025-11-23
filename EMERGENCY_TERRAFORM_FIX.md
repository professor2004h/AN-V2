# Emergency Fix: Import All Resources Correctly

## Problem
Terraform is trying to destroy and recreate subnets that are in use, causing the deployment to hang.

## Solution
We need to import ALL existing resources correctly so Terraform doesn't try to recreate them.

## Steps

### 1. Cancel Current Deployment
Go to GitHub Actions and cancel the running workflow immediately.

### 2. The Real Issue
The problem is that Terraform's configuration doesn't exactly match what's deployed in AWS. This causes Terraform to want to recreate resources instead of managing them as-is.

### 3. Options

#### Option A: Use `terraform import` locally (Recommended)
Run the terraform import commands locally first before pushing:

```bash
cd terraform

# Set environment variables
$env:TF_VAR_supabase_url = "your-value"
$env:TF_VAR_supabase_anon_key = "your-value"
# ... set all other variables

# Initialize
terraform init

# Import VPC
terraform import 'aws_vpc.main' 'vpc-03c570ff139fcf5ba'

# Import subnets
terraform import 'aws_subnet.public[0]' 'subnet-03d5e14dc2ce442e2'
terraform import 'aws_subnet.public[1]' 'subnet-07e124fa3ebff65e6'

# ... import all other resources

# Then check what Terraform wants to do
terraform plan

# If it shows no changes or only updates (not recreates), it's safe
```

#### Option B: Remove Terraform Management (Quick Fix)
If you don't need Terraform to manage the infrastructure right now:

1. Remove the Terraform Apply step from `.github/workflows/deploy.yml`
2. Keep only the Docker build and push steps
3. Manually update ECS services via AWS Console or CLI

#### Option C: Use Prevent Destroy (Protection)
Add lifecycle blocks to prevent accidental destruction:

```hcl
resource "aws_subnet" "public" {
  # ... existing config
  
  lifecycle {
    prevent_destroy = true
    ignore_changes = [tags]
  }
}
```

## Immediate Action Required

**CANCEL THE GITHUB ACTIONS WORKFLOW NOW**

The deployment will not succeed and is wasting resources trying to delete a subnet that can't be deleted.

## Why This Is Happening

1. **Configuration Drift**: The Terraform configuration doesn't exactly match AWS reality
2. **Import Issues**: Not all resources were imported correctly
3. **Dependency Chain**: Subnets have dependencies (ALB, ENIs, ECS tasks) preventing deletion

## Next Steps

1. **Cancel the current run**
2. **Choose an option** (A, B, or C above)
3. **Test locally first** before pushing to GitHub
4. Alternatively, **disable Terraform in the workflow** and manage updates manually for now
