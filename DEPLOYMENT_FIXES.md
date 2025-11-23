# 🔧 Deployment Fixes

## 1. Opened Port 3001 (ALB Security Group)
I identified that the **ALB Security Group** was blocking traffic on port 3001, causing `ERR_CONNECTION_TIMED_OUT`.

- **Action**: Added inbound rule to `sg-0b952809628d1bcdb` to allow TCP 3001 from `0.0.0.0/0`.

## 2. Opened Port 3001 (ECS Task Security Group)
Traffic was reaching the ALB but being blocked by the ECS Task Security Group.

- **Action**: Added inbound rule to `sg-04c367c01ceb37c1e` to allow TCP 3001 from the ALB Security Group (`sg-0b952809628d1bcdb`).

## 3. Created Missing Log Group
The backend service failed to start because the CloudWatch log group didn't exist.

- **Action**: Created log group `/ecs/apranova-lms-backend`.
- **Action**: Forced new deployment for backend service.

## 4. Fixed ECR Image URI (403 Forbidden)
The backend task was failing to pull the image because the Task Definition pointed to the wrong AWS Account ID (`975050060002` instead of `322388074242`).

- **Action**: Corrected `backend-task-def.json` to use `322388074242`.
- **Action**: Registered new task definition revision (v7).
- **Action**: Updated service to use the new revision.

## 🔄 Verification
1.  Refresh your application: [http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/](http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/)
2.  The `ERR_CONNECTION_TIMED_OUT` should be resolved.
3.  Sign Up / Sign In should now work (backend is restarting, give it 1-2 mins).

## 📝 Note on Supabase
If you see Supabase 400 errors (`grant_type=password`), it means:
- Incorrect email/password
- User not confirmed
- User does not exist

Try creating a new account via **Sign Up** to verify the flow.
