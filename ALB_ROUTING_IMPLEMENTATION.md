# ALB Path-Based Routing Implementation Plan

## Architecture

```
Student Browser
    ↓
ALB: apranova-lms-alb-1990266756.us-east-1.elb.amazonaws.com
    ↓
Listener Rule: /workspace/{studentId}/* → Code Server Target Group
    ↓
Code Server Task (Private IP: 10.0.x.x:8080)
```

## Implementation Steps

### 1. Create Code Server Target Group
```bash
aws elbv2 create-target-group \
  --name apranova-code-server-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id <VPC_ID> \
  --target-type ip \
  --health-check-path /healthz \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

### 2. Add ALB Listener Rule
```bash
aws elbv2 create-rule \
  --listener-arn <LISTENER_ARN> \
  --priority 10 \
  --conditions Field=path-pattern,Values='/workspace/*' \
  --actions Type=forward,TargetGroupArn=<TG_ARN>
```

### 3. Update Backend Code

#### workspaceServiceFargate.ts
- After task starts, register it with target group
- Store ALB URL in database: `http://ALB/workspace/{studentId}`
- Deregister on workspace stop/delete

#### Changes needed:
```typescript
// After task is running
await this.registerWithALB(taskArn, privateIp, studentId);

// Store ALB URL
const workspaceUrl = `http://${ALB_DNS}/workspace/${studentId}`;
```

### 4. Update Frontend
- Display ALB-based URL
- Add iframe or open in new tab

## Benefits

1. ✅ No public IPs needed
2. ✅ Centralized access control
3. ✅ Works immediately
4. ✅ Can add SSL/domain later
5. ✅ Better security (WAF, rate limiting possible)

## Timeline

- Infrastructure setup: 5 mins
- Backend changes: 10 mins
- Testing: 5 mins
- **Total: ~20 mins**
