# Kiro IDE Deployment Plan

Since you have the AWS MCP (or AWS CLI) connected in Kiro, follow these steps to deploy the missing services.

## Configuration Variables
- **Region**: `ap-southeast-2`
- **Cluster**: `apranova-lms-cluster`
- **VPC ID**: `vpc-03c570ff139fcf5ba`
- **Subnet ID**: `subnet-07e124fa3ebff65e6` (This is the ONLY valid public subnet found)
- **Execution Role**: `arn:aws:iam::322388074242:role/ecsTaskExecutionRole`
- **Backend Image**: `975050060002.dkr.ecr.ap-southeast-2.amazonaws.com/apranova-lms-backend:latest`

---

## Step 1: Register Backend Task Definition

The backend task definition is missing. Run this command to create it.
*Note: We use 0.25 vCPU and 0.5GB RAM as requested.*

```bash
aws ecs register-task-definition \
  --family apranova-lms-backend \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 256 \
  --memory 512 \
  --execution-role-arn arn:aws:iam::322388074242:role/ecsTaskExecutionRole \
  --container-definitions '[{
      "name": "backend",
      "image": "975050060002.dkr.ecr.ap-southeast-2.amazonaws.com/apranova-lms-backend:latest",
      "portMappings": [{"containerPort": 3001, "protocol": "tcp"}],
      "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
              "awslogs-group": "/ecs/apranova-lms-backend",
              "awslogs-region": "ap-southeast-2",
              "awslogs-stream-prefix": "ecs"
          }
      }
  }]' \
  --region ap-southeast-2
```

---

## Step 2: Identify Security Group

We need a security group that allows traffic. Run this to list them and pick the one named `apranova-lms-alb-sg` or `default` (if it allows access).

```bash
aws ec2 describe-security-groups \
  --filters Name=vpc-id,Values=vpc-03c570ff139fcf5ba \
  --query "SecurityGroups[*].{ID:GroupId,Name:GroupName}" \
  --region ap-southeast-2
```

**Action:** Replace `YOUR_SECURITY_GROUP_ID` in the commands below with the ID you found (e.g., `sg-xxxxxxxx`).

---

## Step 3: Create ECS Services

Now create the services using the valid subnet and your security group.

### 3.1 Create Frontend Service

```bash
aws ecs create-service \
  --cluster apranova-lms-cluster \
  --service-name apranova-lms-frontend \
  --task-definition apranova-lms-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-07e124fa3ebff65e6],securityGroups=[YOUR_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
  --region ap-southeast-2
```

### 3.2 Create Backend Service

```bash
aws ecs create-service \
  --cluster apranova-lms-cluster \
  --service-name apranova-lms-backend \
  --task-definition apranova-lms-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-07e124fa3ebff65e6],securityGroups=[YOUR_SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
  --region ap-southeast-2
```

---

## Step 4: Verification

After running these commands, check the status:

```bash
aws ecs describe-services \
  --cluster apranova-lms-cluster \
  --services apranova-lms-frontend apranova-lms-backend \
  --region ap-southeast-2
```

Once `status` is `ACTIVE` and `runningCount` is `1`, your app is live!
