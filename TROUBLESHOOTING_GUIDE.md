# Workspace Provisioning Troubleshooting Guide

## Overview
The workspace provisioning process involves the Backend service launching a new ECS Fargate task (`apranova-lms-code-server`) for each student. This requires coordination between ECS, IAM, EFS, and Networking.

## Common Issues & Solutions

### 1. "Cannot connect to Docker daemon"
- **Cause:** Backend is trying to use local Docker socket in Fargate environment.
- **Fix:** Ensure `workspaceService.ts` switches to `workspaceServiceFargate.ts` when `ECS_CLUSTER_NAME` is present. (Fixed in recent update).

### 2. "column students.workspace_task_arn does not exist"
- **Cause:** Database schema missing the column required for tracking Fargate tasks.
- **Fix:** Run `ALTER TABLE students ADD COLUMN IF NOT EXISTS workspace_task_arn TEXT;` and reload schema. (Fixed).

### 3. Task Launch Failures (Silent)
- **Cause:** ECS `RunTask` fails due to permissions, resources, or networking, but error isn't logged.
- **Fix:** Check `runTaskResponse.failures` in `workspaceServiceFargate.ts`. (Implemented in recent update).

### 4. Task Stops Immediately
- **Cause:** Container health check failure or application crash.
- **Debug:** Check stopped task details: `aws ecs describe-tasks ...` and look at `stoppedReason`.
- **Common Reasons:**
    - **EFS Mount Failures:** Check Security Groups. EFS SG must allow inbound NFS (2049) from Code Server SG.
    - **Image Pull Failures:** Check NAT Gateway configuration for private subnets.
    - **Health Check:** Ensure code-server responds on port 8080/healthz.

## Debugging Commands

### Check Backend Logs
```bash
aws logs tail /ecs/apranova-lms/backend --since 10m --region us-east-1
```

### List Stopped Tasks
```bash
aws ecs list-tasks --cluster apranova-lms-cluster --desired-status STOPPED --region us-east-1
```

### Describe Task Failure
```bash
aws ecs describe-tasks --cluster apranova-lms-cluster --tasks <TASK_ARN> --region us-east-1
```

### Verify Security Groups
```bash
aws ec2 describe-security-groups --group-ids <EFS_SG_ID> --region us-east-1
```
