# Workspace Testing Guide - Public IP Access

## Current Status
✅ **Deployment Complete**: All changes have been deployed successfully.

## What Was Fixed
The workspace was showing as "running" but wasn't accessible because it had a private IP (`10.0.10.62:8080`). 

### Changes Deployed:
1. **Public IP Enabled**: Code-server tasks now get public IPs
2. **Public Subnets**: Tasks launch in public subnets instead of private
3. **Security Group**: Allows internet access on port 8080
4. **IP Extraction**: Backend now extracts and uses public IP addresses

## Testing Steps

### Step 1: Clean Up Existing Workspace
If you have an existing workspace with the private IP:

**Option A: Via Database (Recommended)**
```sql
-- Connect to Supabase and run:
UPDATE students 
SET workspace_status = NULL, 
    workspace_url = NULL, 
    workspace_task_arn = NULL 
WHERE user_id = '<your-student-user-id>';
```

**Option B: Via Backend API**
- Navigate to `/student/workspace`
- Look for a "Delete Workspace" or "Stop Workspace" button
- Click it to clean up the old workspace

### Step 2: Provision New Workspace
1. Go to: `http://apranova-lms-alb-1990266756.us-east-1.elb.amazonaws.com/student/workspace`
2. Click **"Provision Workspace"**
3. Wait 3-4 minutes for provisioning
4. Status should change from "provisioning" → "running"

### Step 3: Verify Public IP
The workspace URL should now look like:
- ✅ `http://54.123.45.67:8080/` (example public IP)
- ❌ NOT `http://10.0.10.62:8080/` (private IP)

### Step 4: Access Workspace
1. Click "Open Workspace" or copy the URL
2. You should see the code-server login page
3. Enter password: `apranova123`
4. You should now have access to the IDE

## Troubleshooting

### Issue: Still Getting Private IP
**Solution**: The old task might still be running. Stop it manually:
```bash
# List running tasks
aws ecs list-tasks --cluster apranova-lms-cluster --region us-east-1

# Stop the old task
aws ecs stop-task --cluster apranova-lms-cluster --task <task-arn> --region us-east-1
```

### Issue: Public IP But Can't Connect
**Possible Causes**:
1. **Security Group Not Updated**: Wait 2-3 minutes for Terraform changes to apply
2. **Task Still Starting**: Code-server takes ~2 minutes to fully start
3. **Firewall**: Check if your local firewall blocks outbound connections to port 8080

**Check Task Status**:
```bash
aws ecs describe-tasks --cluster apranova-lms-cluster --tasks <task-arn> --region us-east-1
```

### Issue: 502 Bad Gateway
**Cause**: Code-server hasn't started yet
**Solution**: Wait 1-2 more minutes and refresh

## Verification Checklist
- [ ] Old workspace deleted/cleaned up
- [ ] New workspace provisioned
- [ ] Workspace status shows "running"
- [ ] Workspace URL has a public IP (not 10.x.x.x)
- [ ] URL is accessible in browser
- [ ] Can log in with password `apranova123`
- [ ] Can create/edit files in the IDE
- [ ] Files persist after refresh

## Security Notes
⚠️ **Important**: Workspaces are now publicly accessible on the internet.

**Current Security Measures**:
- Password protection (`apranova123`)
- Each student gets their own isolated workspace
- EFS storage is isolated per student

**Recommended Future Enhancements**:
- IP whitelist restrictions
- Session timeout
- Additional authentication layer
- VPN requirement for access

## Need Help?
If issues persist, check:
1. Backend logs: `aws logs tail /ecs/apranova-lms/backend --since 10m --region us-east-1`
2. Code-server logs: `aws logs tail /ecs/apranova-lms/code-server --since 10m --region us-east-1`
3. ECS task status: `aws ecs describe-tasks --cluster apranova-lms-cluster --tasks <task-arn> --region us-east-1`
