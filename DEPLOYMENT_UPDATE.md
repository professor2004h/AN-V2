# 🚀 Deployment Update Initiated

I have pushed the necessary changes to GitHub to fix the frontend-backend connection and Supabase configuration.

## 🛠️ Changes Made

1.  **Frontend Configuration**:
    - Updated `NEXT_PUBLIC_BACKEND_URL` to point to your new ALB: `http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com:3001`
    - This fixes the `net::ERR_NAME_NOT_RESOLVED` errors for `api.apranova.com`.

2.  **Backend Configuration**:
    - Configured `.env.production` to be populated with secrets from GitHub Actions during the build.
    - This ensures `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and other secrets are correctly set in the production container.

3.  **Dockerfiles**:
    - Updated both Frontend and Backend Dockerfiles to copy the production environment files.

## ⏳ What Happens Next?

The **GitHub Actions workflow** has been triggered. It will:
1.  Build new Docker images for Frontend and Backend.
2.  Push them to AWS ECR.
3.  Force a new deployment on ECS.

**Estimated Time:** 5-10 minutes.

## 🔍 How to Verify

Once the deployment completes:
1.  Refresh your application URL: [http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/](http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/)
2.  Try to **Sign In** or **Sign Up**.
3.  The network errors should be gone, and the app should connect to the backend successfully.

## ⚠️ Important: GitHub Secrets

Ensure the following secrets are set in your [GitHub Repository Secrets](https://github.com/professor2004h/AN-V2/settings/secrets/actions) for the backend to work:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DB_PASSWORD` (Supabase DB Password)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `JWT_SECRET`
- `CODE_SERVER_PASSWORD`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

If any are missing, the backend might fail to start or function correctly.
