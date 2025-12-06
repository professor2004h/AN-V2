# 🔄 AWS INFRASTRUCTURE SYNC STATUS
## December 6, 2024 - Full Synchronization Complete

---

## ✅ AWS STATE (VERIFIED)

### ECS Cluster
| Resource | Status | Value |
|----------|--------|-------|
| Cluster Name | ✅ ACTIVE | `apranova-lms-production-cluster` |
| Capacity Providers | ✅ | FARGATE, FARGATE_SPOT |

### ECS Services
| Service | Status | Tasks | Task Definition |
|---------|--------|-------|-----------------|
| `apranova-lms-production-backend` | ✅ ACTIVE | 2 | `backend:5` |
| `apranova-lms-production-frontend` | ✅ ACTIVE | 1 | `frontend:latest` |

### ECS Task Definitions
| Task Definition | Container | Port | Image |
|-----------------|-----------|------|-------|
| `apranova-lms-production-openvscode:1` | `openvscode` | 3000 | `apranova-lms-openvscode:latest` |
| `apranova-lms-production-backend:5` | `backend` | 3001 | `apranova-lms-backend:latest` |
| `apranova-lms-production-frontend` | `frontend` | 3000 | `apranova-lms-frontend:latest` |

### ECR Repositories
| Repository | Status |
|------------|--------|
| `apranova-lms-openvscode` | ✅ Active (cloudflared installed) |
| `apranova-lms-backend` | ✅ Active |
| `apranova-lms-frontend` | ✅ Active |
| `apranova-lms-codeserver` | ⚠️ Deprecated |

### Lambda Functions
| Function | Runtime | Config |
|----------|---------|--------|
| `apranova-lms-production-workspace-provisioner` | python3.11 | TASK_DEFINITION=`openvscode:1` |
| `apranova-lms-production-workspace-terminator` | python3.11 | Active |
| `apranova-lms-production-workspace-cleanup` | python3.11 | Active |

### ALB Configuration
| Resource | Value |
|----------|-------|
| ALB Name | `apranova-lms-production-alb` |
| DNS | `apranova-lms-production-alb-195418361.us-east-1.elb.amazonaws.com` |
| HTTPS Listener | Port 443 |

### ALB Rules
| Priority | Host | Target |
|----------|------|--------|
| 1 | `api.ecombinators.com` | Backend TG |
| 2 | `ecombinators.com` | Frontend TG |
| default | * | Frontend TG |

---

## 📁 CODE FILES SYNCED

### Docker Images

#### OpenVSCode Server (`docker/openvscode-server/Dockerfile`)
- Base: `gitpod/openvscode-server:latest`
- Pre-installed: Node.js 20, Python3, cloudflared
- Port: 3000
- Features:
  - ✅ Cloudflare Tunnel for port exposure (NO PASSWORD!)
  - ✅ Auto-save enabled
  - ✅ EFS persistence ready
  - ✅ README with instructions

#### Backend (`backend/`)
- Port: 3001
- Env vars: Via ECS Task Definition (not .env file)
- AWS SDK: Uses ECS Task Role (no static credentials)
- Key fix: Removed placeholder AWS_ACCESS_KEY_ID

#### Frontend (`frontend/`)
- Port: 3000
- Env: `NEXT_PUBLIC_BACKEND_URL=https://api.ecombinators.com`
- Server Actions: `allowedOrigins` configured

### Lambda Code (`terraform/lambda_code/index.py`)
- Uses: `openvscode` container (port 3000)
- Capacity: FARGATE_SPOT with FARGATE fallback
- Creates: ECS Service, Target Group, ALB Rule
- Tracks: DynamoDB workspace table

### Terraform Files Updated
| File | Changes |
|------|---------|
| `modules/ecs/openvscode_task.tf` | NEW - OpenVSCode task definition |
| `modules/ecs/variables.tf` | Added `openvscode_ecr_url` |
| `modules/lambda/provisioner.tf` | Updated to use OpenVSCode |
| `modules/lambda/variables.tf` | Added OpenVSCode vars |

---

## 🔐 Security Configuration

### IAM Roles
| Role | Permissions |
|------|-------------|
| `apranova-lms-production-ecs-task-role` | Lambda:InvokeFunction, EFS, Logs |
| `apranova-lms-production-ecs-execution-role` | ECR Pull, Secrets, Logs |

### Security Groups
| SG | Inbound Ports |
|----|---------------|
| `sg-067b49b7f62ab7d6f` | 3000 (OpenVSCode), 3001 (Backend), 8080 |

---

## 📖 Student Workflow (Cloudflared)

### Step 1: Provision Workspace
1. Go to `https://ecombinators.com/student/workspace`
2. Click "Provision Workspace"
3. Wait for status → "running"
4. Click "Open"

### Step 2: Start Your App (Terminal 1)
```bash
npm create vite@latest my-app -- --template react
cd my-app && npm install && npm run dev
```

### Step 3: Expose to Internet (Terminal 2)
```bash
cloudflared tunnel --url http://localhost:5173
# OR use helper:
expose 5173
```

### Step 4: Open Public URL
Copy URL like `https://random-words.trycloudflare.com` and open in browser.
**NO PASSWORD REQUIRED!** ✅

---

## 🚀 Deployment Commands

### Deploy Backend
```bash
cd backend
docker build -t 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-backend:latest .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 038839713355.dkr.ecr.us-east-1.amazonaws.com
docker push 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-backend:latest
aws ecs update-service --cluster apranova-lms-production-cluster --service apranova-lms-production-backend --force-new-deployment
```

### Deploy Frontend
```bash
cd frontend
docker build -t 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-frontend:latest .
docker push 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-frontend:latest
aws ecs update-service --cluster apranova-lms-production-cluster --service apranova-lms-production-frontend --force-new-deployment
```

### Deploy OpenVSCode
```bash
cd docker/openvscode-server
docker build -t 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-openvscode:latest .
docker push 038839713355.dkr.ecr.us-east-1.amazonaws.com/apranova-lms-openvscode:latest
# New workspaces will use the updated image automatically
```

### Update Lambda
```bash
cd terraform/lambda_code
zip provisioner.zip index.py
aws lambda update-function-code --function-name apranova-lms-production-workspace-provisioner --zip-file fileb://provisioner.zip
```

---

## ✅ VERIFICATION CHECKLIST

- [x] Backend health: `curl https://api.ecombinators.com/health`
- [x] Frontend loads: `https://ecombinators.com`
- [x] Lambda uses OpenVSCode task definition
- [x] ALB rules: api + frontend only (no orphan ws-*)
- [x] DynamoDB cleared
- [x] Supabase workspace_status cleared
- [x] Terraform code synced with AWS state
- [x] Docker images have cloudflared
- [x] No placeholder AWS credentials in .env files

---

## 📊 Architecture Diagram

```
                    ┌─────────────────────────────────────────────────┐
                    │                  Route 53                       │
                    │         ecombinators.com → ALB                  │
                    └─────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────────────────────────────────┐
                    │              Application Load Balancer          │
                    │   api.ecombinators.com → Backend (3001)         │
                    │   ecombinators.com → Frontend (3000)            │
                    │   ws-*.ecombinators.com → Workspace (3000)      │
                    └─────────────────────────────────────────────────┘
                           │                │                │
              ┌────────────┴──┐    ┌───────┴───────┐   ┌────┴─────────┐
              │   Backend     │    │   Frontend    │   │  Workspace   │
              │   ECS Task    │    │   ECS Task    │   │  ECS Task    │
              │   Port 3001   │    │   Port 3000   │   │  Port 3000   │
              └───────────────┘    └───────────────┘   └──────────────┘
                     │                                        │
              ┌──────┴───────┐                         ┌──────┴──────┐
              │   Supabase   │                         │     EFS     │
              │   (Postgres) │                         │ (Workspace) │
              └──────────────┘                         └─────────────┘
```

---

*Last synced: December 6, 2024 @ 20:30 IST*
