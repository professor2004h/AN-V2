# Apranova LMS - Quick Reference Guide

## 🚀 System Status: OPERATIONAL (75% Test Success Rate)

### Backend Server
- **URL:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Status:** ✅ Running
- **Uptime:** 33+ minutes

### Database
- **Provider:** Supabase (PostgreSQL)
- **Status:** ✅ Connected
- **RLS:** ✅ Enabled on all tables
- **Tables:** 10+ tables with proper relationships

### Infrastructure
- **Redis:** ✅ Running (apranova-redis container)
- **Docker:** ✅ Installed and operational
- **Node.js:** ✅ Backend running on Node.js

---

## 👥 Test Credentials

### Admin
- Email: `admin@apranova.com`
- Password: `Admin123!`
- Role: Admin
- Can: Manage all users, batches, projects

### Super Admin
- Email: `superadmin@apranova.com`
- Password: `SuperAdmin123!`
- Role: Super Admin
- Can: View system stats, all admin functions

### Trainer
- Email: `trainer@apranova.com`
- Password: `Trainer123!`
- Role: Trainer
- Name: John Trainer
- Can: View assigned students, create tasks

### Students

#### Alice Johnson
- Email: `alice@apranova.com`
- Password: `Student123!`
- Track: Data Professional
- Projects: 3
- Tasks: 2 (high and medium priority)

#### Bob Smith
- Email: `bob@apranova.com`
- Password: `Student123!`
- Track: Full Stack Development
- Projects: 3
- Tasks: 1 (low priority)

---

## 📡 API Endpoints

### Authentication
```
POST /api/auth/signin
POST /api/auth/signup
POST /api/auth/signout
GET  /api/auth/me
```

### Admin Routes
```
GET    /api/admin/students
POST   /api/admin/students
GET    /api/admin/trainers
POST   /api/admin/trainers
GET    /api/admin/batches
POST   /api/admin/batches
GET    /api/admin/projects
GET    /api/admin/stats
```

### Student Routes
```
GET /api/students/me
GET /api/students/me/projects
GET /api/students/me/tasks
GET /api/students/me/current-project
```

### Trainer Routes
```
GET /api/trainers/me/students
GET /api/trainers/me/stats
```

### Task Routes
```
GET  /api/tasks
POST /api/tasks
GET  /api/tasks/:id
PUT  /api/tasks/:id
```

### Workspace Routes
```
POST   /api/workspaces/provision
GET    /api/workspaces/:studentId
POST   /api/workspaces/:studentId/start
POST   /api/workspaces/:studentId/stop
DELETE /api/workspaces/:studentId
```

---

## 🗄️ Database Schema

### Key Tables
- `profiles` - User profiles (linked to auth.users)
- `students` - Student records
- `trainers` - Trainer records
- `batches` - Training batches
- `projects` - Course projects
- `student_projects` - Student-project relationships
- `tasks` - Student tasks
- `submissions` - Project submissions
- `notifications` - User notifications
- `messages` - Messaging system

### Important Relationships
```
students.user_id → profiles.id (CASCADE)
students.batch_id → batches.id
students.trainer_id → trainers.id
student_projects.student_id → students.id (CASCADE)
tasks.student_id → students.id (CASCADE)
tasks.trainer_id → profiles.id
```

---

## 🧪 Running Tests

### Comprehensive System Test
```powershell
.\comprehensive-system-test.ps1
```

**Expected Results:**
- Total Tests: 32
- Passing: 24 (75%)
- Failing: 8 (25%)

**Test Report:** Automatically generated in `COMPREHENSIVE_TEST_REPORT_*.md`

### Complete Setup Script
```powershell
.\complete-setup.ps1
```

Creates test data including batches, students, and provisions workspaces.

---

## 🐛 Known Issues & Workarounds

### Issue 1: Student Creation via API (500 Error)
**Problem:** API returns 500 when trying to create existing students
**Workaround:** Students already exist (Alice & Bob), use them directly
**Fix:** Check for existing users before creation

### Issue 2: Task Creation via API (400 Error)
**Problem:** Test script fails because student creation failed
**Workaround:** Tasks already created (3 tasks exist)
**Fix:** Update test script to handle existing students

### Issue 3: Workspace Provisioning
**Problem:** Workspaces stuck in "provisioning" status
**Workaround:** Reset workspace status before re-provisioning
**Fix:** Improve status management in workspace service

**Reset Workspace Status:**
```sql
UPDATE students 
SET workspace_status = NULL, workspace_url = NULL 
WHERE id = 'student-id-here';
```

---

## 🔧 Useful Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
```

### Docker
```bash
docker ps                              # List running containers
docker ps -a                           # List all containers
docker logs apranova-redis             # View Redis logs
docker exec -it apranova-redis redis-cli  # Access Redis CLI
```

### Database
```bash
# Access via Supabase Dashboard
# Or use SQL queries via mcp0_execute_sql
```

---

## 📊 System Statistics

### Current Data
- **Total Users:** 10
- **Students:** 8 (including Alice & Bob)
- **Trainers:** 1 (John Trainer)
- **Batches:** 27
- **Projects:** 6 (3 per track)
- **Tasks:** 3 (2 for Alice, 1 for Bob)
- **Student Projects:** 6

### Tracks
1. **Data Professional** - Python, Data Science, Analytics
2. **Full Stack Development** - Web Development, APIs, Databases

---

## 🎯 Quick Tasks

### Create a New Student
```typescript
import { adminService } from './src/services/adminService';

await adminService.createStudent({
  email: 'student@example.com',
  password: 'Password123!',
  fullName: 'Student Name',
  track: 'data_professional', // or 'full_stack_dev'
  batchId: 'batch-uuid',
  trainerId: 'trainer-uuid'
});
```

### Create a Task
```typescript
import { supabaseAdmin } from './src/lib/supabase';

await supabaseAdmin.from('tasks').insert({
  title: 'Task Title',
  description: 'Task Description',
  student_id: 'student-uuid',
  trainer_id: 'trainer-user-uuid', // Note: user_id, not trainer record id
  due_date: new Date().toISOString(),
  priority: 'high', // or 'medium', 'low'
  status: 'pending'
});
```

### View Student Tasks
```typescript
import { studentService } from './src/services/studentService';

const tasks = await studentService.getStudentTasks('student-id');
```

---

## 📝 Testing Checklist

- [x] Backend server health check
- [x] Admin authentication
- [x] Trainer authentication
- [x] Student authentication (Alice & Bob)
- [x] Batch creation and viewing
- [x] Student profile viewing
- [x] Task viewing (with data isolation)
- [x] Project viewing
- [x] System statistics
- [x] Redis container running
- [ ] Student creation via API (known issue)
- [ ] Task creation via API (known issue)
- [ ] Workspace provisioning (needs refinement)

---

## 🆘 Troubleshooting

### Backend Won't Start
1. Check if port 3001 is available
2. Verify `.env` file exists with correct values
3. Run `npm install` in backend directory

### Database Connection Issues
1. Check Supabase credentials in `.env`
2. Verify network connectivity
3. Check Supabase project status

### Docker Issues
1. Ensure Docker Desktop is running
2. Check Docker version: `docker --version`
3. Verify Docker daemon is accessible

### Rate Limiting (429 Errors)
1. Wait 15 minutes between test runs
2. Or restart backend server to reset rate limiter
3. Consider adjusting rate limits in `src/index.ts`

---

## 📞 Support

### Documentation
- System Status: `FINAL_SYSTEM_STATUS_REPORT.md`
- Test Results: `COMPREHENSIVE_TEST_REPORT_*.md`
- Database Schema: Check Supabase dashboard

### Logs
- Backend logs: Console output from `npm run dev`
- Docker logs: `docker logs <container-name>`
- Database logs: Supabase dashboard

---

**Last Updated:** 2025-11-23 10:40:00
**System Version:** v1.0.0-beta
**Status:** ✅ Operational (75% test success)
