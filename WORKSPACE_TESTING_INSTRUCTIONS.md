# Workspace Testing Instructions

## ✅ Preparation Complete

### What Was Done:
1. ✅ **Backend deployed** with custom domain support (`DOMAIN=ecombinators.com`)
2. ✅ **Old workspace stopped** (task ARN: `31cc88db9bff44efaba9cb04e601d937`)
3. ✅ **Database cleared** for user `pros@gmail.com`
4. ✅ **Ready for fresh provisioning** with new domain

---

## 🧪 Testing Steps

### Step 1: Login
1. Go to: `http://ecombinators.com/auth/signin`
2. Login with:
   - **Email**: `pros@gmail.com`
   - **Password**: `Papple.18?`

### Step 2: Navigate to Workspace
1. After login, go to: `http://ecombinators.com/student/workspace`
2. You should see **"Provision Workspace"** button (since we cleared the data)

### Step 3: Provision Workspace
1. Click **"Provision Workspace"**
2. Wait 3-4 minutes for provisioning to complete
3. Watch the progress bar

### Step 4: Verify Workspace URL
**Expected Result**:
```
http://ecombinators.com/api/proxy/workspace/9cc7cf16-8ed1-47bd-9ac5-5ac085a44b84
```

**NOT** (old ALB URL):
```
http://apranova-lms-alb-1990266756.us-east-1.elb.amazonaws.com/api/proxy/workspace/...
```

### Step 5: Test IDE Access
1. Click the **"Open"** button next to the workspace URL
2. The IDE should open in a new tab
3. Verify you can access VS Code in the browser

---

## 🔍 What to Check

### ✅ Success Criteria:
- [ ] Login works without CORS errors
- [ ] Workspace page loads correctly
- [ ] Provisioning completes successfully
- [ ] Workspace URL shows `ecombinators.com` (not ALB URL)
- [ ] IDE opens and loads correctly
- [ ] No console errors

### ❌ If Issues Occur:

**Issue**: Workspace URL still shows ALB domain
**Solution**: The backend deployment might not have completed. Check:
```powershell
aws ecs describe-services --cluster apranova-lms-cluster --services apranova-lms-backend --region us-east-1 --query "services[0].{running:runningCount, desired:desiredCount}"
```
Should show `running: 1, desired: 1`

**Issue**: CORS errors during login/signup
**Solution**: Clear browser cache or use incognito mode

**Issue**: Provisioning fails
**Solution**: Check backend logs:
```powershell
aws logs tail /ecs/apranova-lms/backend --follow --region us-east-1
```

---

## 📊 Current Configuration

| Component | Value |
|-----------|-------|
| **Domain** | `ecombinators.com` |
| **Backend DOMAIN env** | `ecombinators.com` |
| **Student ID** | `9cc7cf16-8ed1-47bd-9ac5-5ac085a44b84` |
| **Workspace Status** | `NULL` (cleared, ready for provisioning) |
| **Backend Deployment** | ✅ Complete |

---

## 🎯 Expected Outcome

After provisioning, the database should contain:
```sql
workspace_url: 'http://ecombinators.com/api/proxy/workspace/9cc7cf16-8ed1-47bd-9ac5-5ac085a44b84'
workspace_status: 'running'
workspace_task_arn: 'arn:aws:ecs:...' (new task)
```

---

**Ready to test!** Please proceed with the testing steps above.
