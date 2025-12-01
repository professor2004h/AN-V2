# 🔧 Frontend API Connection Fix

**Issue:** Frontend unable to connect to backend API  
**Error:** `ERR_CONNECTION_REFUSED` when accessing `api.ecombinators.com`

---

## Root Cause

The frontend `.env.production` file was configured with the old ALB DNS name instead of the custom domain:

**Before:**
```
NEXT_PUBLIC_API_URL=http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com:3001
```

**After:**
```
NEXT_PUBLIC_API_URL=https://api.ecombinators.com
```

---

## Fix Applied

### 1. Updated Frontend Environment Variables

**File:** `frontend/.env.production`

```bash
NEXT_PUBLIC_API_URL=https://api.ecombinators.com
NEXT_PUBLIC_SUPABASE_URL=https://phlkhoorckdjriswcpwz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGtob29yY2tkanJpc3djcHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODY4NjgsImV4cCI6MjA3OTM2Mjg2OH0.t21pP6GBro-33s29jGSqg0KsdMTE8HP1gzE-j3VlHOs
```

### 2. Rebuilding Frontend Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  038839713355.dkr.ecr.us-east-1.amazonaws.com

# Build with correct environment variables
docker build -t apranova-lms-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.ecombinators.com \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://phlkhoorckdjriswcpwz.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobGtob29yY2tkanJpc3djcHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3ODY4NjgsImV4cCI6MjA3OTM2Mjg2OH0.t21pP6GBro-33s29jGSqg0KsdMTE8HP1gzE-j3VlHOs \
  ./frontend

# Tag for ECR
docker tag apranova-lms-frontend:latest \
  038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-frontend:latest

# Push to ECR
docker push 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-frontend:latest

# Force ECS to deploy new version
aws ecs update-service \
  --cluster apranova-lms-production-cluster \
  --service apranova-lms-production-frontend \
  --force-new-deployment
```

---

## DNS Configuration Verified

Your Hostinger DNS is correctly configured:

| Record Type | Name | Target | Status |
|-------------|------|--------|--------|
| ALIAS | @ | apranova-lms-production-alb-195418361.us-east-1.elb.amazonaws.com | ✅ |
| CNAME | app | apranova-lms-production-alb-195418361.us-east-1.elb.amazonaws.com | ✅ |
| CNAME | api | apranova-lms-production-alb-195418361.us-east-1.elb.amazonaws.com | ✅ |
| CNAME | workspace | apranova-lms-production-alb-195418361.us-east-1.elb.amazonaws.com | ✅ |
| CNAME | * | apranova-lms-production-alb-195418361.us-east-1.elb.amazonaws.com | ✅ |

---

## ALB Listener Rules Verified

The ALB is correctly configured to route traffic:

| Priority | Host Header | Target |
|----------|-------------|--------|
| 50 | workspace.ecombinators.com, ws-*.ecombinators.com | Code-Server Target Group |
| 100 | api.ecombinators.com | **Backend Target Group** ✅ |
| 200 | app.ecombinators.com | Frontend Target Group |
| default | * | Frontend Target Group |

---

## Backend Health Status

Backend service is **HEALTHY** ✅

```
Target Group: apranova-prod-be-tg
Targets:
  - 10.0.10.45:3001 (us-east-1a) - HEALTHY
  - 10.0.12.177:3001 (us-east-1c) - HEALTHY
```

---

## Expected Timeline

1. **Docker Build:** ~5-10 minutes (in progress)
2. **Push to ECR:** ~2-3 minutes
3. **ECS Deployment:** ~2-3 minutes
4. **Total:** ~10-15 minutes

---

## Testing After Deployment

### Test 1: Direct API Call
```bash
curl https://api.ecombinators.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T23:30:00.000Z"
}
```

### Test 2: Frontend Access
1. Open: `https://app.ecombinators.com/auth/signup`
2. Should load without `ERR_CONNECTION_REFUSED`
3. Should be able to sign up successfully

### Test 3: Check Browser Console
- No more `ERR_CONNECTION_REFUSED` errors
- API calls should go to `https://api.ecombinators.com`

---

## URLs After Fix

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://app.ecombinators.com | Will work after deployment |
| **Backend API** | https://api.ecombinators.com | Already working |
| **Workspaces** | https://workspace.ecombinators.com | Ready |
| **Wildcard Workspaces** | https://ws-*.ecombinators.com | Ready |

---

## Next Steps

1. ✅ Wait for Docker build to complete
2. ⏳ Push image to ECR
3. ⏳ Deploy to ECS
4. ⏳ Test signup/signin functionality
5. ⏳ Verify workspace provisioning

---

**Status:** Build in progress (Step 1 of 3)  
**ETA:** 10-15 minutes
