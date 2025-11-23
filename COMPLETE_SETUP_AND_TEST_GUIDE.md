# 🚀 APRANOVA LMS - COMPLETE SETUP & TEST GUIDE

## 📋 WHAT HAS BEEN COMPLETED

### ✅ Database Setup
- [x] Database schema fully migrated
- [x] Task priority enum created (low, medium, high)
- [x] Trainer specialization fixed (array → TEXT)
- [x] Student-trainer foreign key fixed
- [x] Project order_index column added
- [x] Performance indexes created
- [x] Trainers table bio column added

### ✅ Default User Accounts Created
- [x] Super Admin: superadmin@apranova.com
- [x] Admin: admin@apranova.com
- [x] Trainer: trainer@apranova.com

### ✅ Backend Enhancements
- [x] Batch creation now requires `track` field
- [x] Admin service updated for batch management
- [x] Trainer service with data isolation
- [x] Notification service for all user actions
- [x] Workspace service with Docker integration
- [x] Setup endpoint for creating default users

### ✅ Frontend Updates
- [x] All API calls updated to use correct endpoints
- [x] Task priority updated to use enums
- [x] Notification system enhanced
- [x] Dashboard components ready

### ✅ Docker & Workspace System
- [x] Docker Desktop verified (version 28.5.1)
- [x] Workspace provisioning system ready
- [x] Code-Server container configuration complete

---

## 🎯 CURRENT STATUS & NEXT STEPS

### ⚠️ IMPORTANT: Backend Needs Restart

The backend code has been updated but the server needs to be restarted to apply changes.

**How to Restart:**
1. Find the terminal running the backend (usually shows "npm run dev")
2. Press `Ctrl+C` to stop it
3. Run: `cd backend && npm run dev`
4. Wait for: "Apranova LMS Backend running on port 3001"

---

## 📝 STEP-BY-STEP SETUP PROCESS

### Step 1: Restart Backend ⚠️ REQUIRED

```powershell
# Stop current backend (Ctrl+C in the backend terminal)
# Then restart:
cd backend
npm run dev
```

Wait for confirmation message before proceeding.

### Step 2: Create Test Data

**Option A: Automated (Recommended)**
```powershell
.\setup-test-data.ps1
```

This will create:
- 2 batches (Data Professional & Full Stack)
- 2 students (Alice & Bob)
- 3 tasks (assigned to students)

**Option B: Manual via UI**

See `TEST_DATA_SUMMARY.md` for detailed manual creation steps.

### Step 3: Verify Setup

1. **Check Backend Health**
   ```powershell
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check Frontend**
   ```powershell
   curl http://localhost:3000
   ```
   Should return: Status 200

3. **Login as Admin**
   - URL: http://localhost:3000/auth/login
   - Email: admin@apranova.com
   - Password: Admin123!

---

## 🧪 COMPREHENSIVE TESTING CHECKLIST

### ✅ Test 1: Admin Workflow

**Login:**
- Email: admin@apranova.com
- Password: Admin123!

**Test Actions:**
- [ ] View dashboard with system stats
- [ ] Navigate to Trainers tab
- [ ] View existing trainer (John Trainer)
- [ ] Navigate to Students tab
- [ ] Create new student (if not using script)
- [ ] Navigate to Batches tab
- [ ] Create new batch (if not using script)
- [ ] Verify all CRUD operations work

**Expected Results:**
- ✅ Can create trainers with email, password, name, specialization
- ✅ Can create students with track assignment
- ✅ Can create batches with track specification
- ✅ All data displays correctly in tables
- ✅ Edit and delete operations work

---

### ✅ Test 2: Trainer Workflow

**Login:**
- Email: trainer@apranova.com
- Password: Trainer123!

**Test Actions:**
- [ ] View dashboard
- [ ] Navigate to Students tab
- [ ] Verify assigned students appear (Alice & Bob)
- [ ] Click on a student to view details
- [ ] Navigate to Tasks tab
- [ ] Create new task for a student
- [ ] Navigate to Submissions tab
- [ ] (After student submits) Review a submission
- [ ] Approve submission with feedback

**Expected Results:**
- ✅ Can see only assigned students (data isolation)
- ✅ Can create tasks with priority (low/medium/high)
- ✅ Can view pending submissions
- ✅ Can approve/reject with feedback
- ✅ Approving submission unlocks next project for student
- ✅ Notifications sent to student

---

### ✅ Test 3: Student Workflow (Alice)

**Login:**
- Email: alice@apranova.com
- Password: Student123!

**Test Actions:**
- [ ] View dashboard with stats
- [ ] Navigate to Projects tab
- [ ] Verify first project is unlocked, rest are locked
- [ ] Navigate to Tasks tab
- [ ] View assigned tasks (should see 2 tasks)
- [ ] Navigate to Notifications
- [ ] Check for task assignment notifications
- [ ] Navigate to Workspaces tab
- [ ] Click "Provision Workspace"
- [ ] Wait for workspace to be created
- [ ] Click workspace URL to access Code-Server

**Expected Results:**
- ✅ Dashboard shows correct stats
- ✅ Projects initialized correctly (first unlocked)
- ✅ Tasks visible with correct priorities
- ✅ Notifications received for task assignments
- ✅ Workspace provisioning starts
- ✅ Docker container created successfully
- ✅ Code-Server accessible via URL
- ✅ Development tools installed (Python, Node.js, Git)

---

### ✅ Test 4: Student Workflow (Bob)

**Login:**
- Email: bob@apranova.com
- Password: Student123!

**Test Actions:**
- [ ] View dashboard
- [ ] Verify different track (Full Stack Dev)
- [ ] View projects (different from Alice's)
- [ ] View assigned task (1 task)
- [ ] Provision workspace

**Expected Results:**
- ✅ Full Stack Dev track projects visible
- ✅ Complete data isolation from Alice
- ✅ Own workspace container created
- ✅ No access to Alice's data

---

### ✅ Test 5: Super Admin Workflow

**Login:**
- Email: superadmin@apranova.com
- Password: SuperAdmin123!

**Test Actions:**
- [ ] View dashboard
- [ ] Navigate to Admins section
- [ ] Create new admin account
- [ ] View system analytics
- [ ] Access all features

**Expected Results:**
- ✅ Can create new admin accounts
- ✅ Can view all system data
- ✅ Has access to financial analytics
- ✅ Full system control

---

### ✅ Test 6: Complete Project Lifecycle

**End-to-End Flow:**

1. **Admin creates student** (Alice)
   - [ ] Student account created
   - [ ] Projects auto-initialized
   - [ ] First project unlocked
   - [ ] Notification sent to student

2. **Trainer creates task** for Alice
   - [ ] Task created with priority
   - [ ] Notification sent to Alice
   - [ ] Alice sees task in dashboard

3. **Alice submits project**
   - [ ] Submission created
   - [ ] Project status → "submitted"
   - [ ] Notification sent to trainer

4. **Trainer reviews submission**
   - [ ] Trainer sees pending submission
   - [ ] Trainer approves with feedback
   - [ ] Submission status → "approved"
   - [ ] Notification sent to Alice

5. **Next project unlocks**
   - [ ] System finds next project by order_index
   - [ ] Project status → "in_progress"
   - [ ] Notification sent to Alice
   - [ ] Alice sees new unlocked project

**Expected Results:**
- ✅ Complete workflow works end-to-end
- ✅ All notifications sent correctly
- ✅ Project unlocking is automatic
- ✅ Data updates in real-time

---

### ✅ Test 7: Docker Workspace System

**Test with Alice:**

1. **Provision Workspace**
   - [ ] Click "Provision Workspace" button
   - [ ] Workspace status → "provisioning"
   - [ ] Docker container starts
   - [ ] Workspace status → "running"
   - [ ] Workspace URL generated

2. **Access Workspace**
   - [ ] Click workspace URL
   - [ ] Code-Server loads in browser
   - [ ] Can create files
   - [ ] Can run Python code
   - [ ] Can run Node.js code
   - [ ] Git is available

3. **Verify Isolation**
   - [ ] Login as Bob
   - [ ] Provision Bob's workspace
   - [ ] Verify separate container created
   - [ ] No access to Alice's workspace

**Expected Results:**
- ✅ Docker containers created successfully
- ✅ Code-Server accessible
- ✅ Tools installed (Python 3.11, Node.js 20, Git)
- ✅ Complete workspace isolation between students
- ✅ Workspaces persist across sessions

---

## 📊 TEST DATA REFERENCE

| Role | Email | Password | Track | Batch |
|------|-------|----------|-------|-------|
| Super Admin | superadmin@apranova.com | SuperAdmin123! | - | - |
| Admin | admin@apranova.com | Admin123! | - | - |
| Trainer | trainer@apranova.com | Trainer123! | - | - |
| Alice | alice@apranova.com | Student123! | Data Professional | Q1 2024 |
| Bob | bob@apranova.com | Student123! | Full Stack Dev | Q2 2024 |

---

## 🔧 TROUBLESHOOTING

### Issue: Backend returns 500 errors
**Solution:** Restart backend server
```powershell
cd backend
npm run dev
```

### Issue: Cannot create batches
**Cause:** Backend not restarted after code changes
**Solution:** Restart backend

### Issue: Docker workspace not starting
**Check:**
1. Docker Desktop is running: `docker --version`
2. Docker is accessible: `docker ps`
3. Backend can connect to Docker

### Issue: Students not seeing projects
**Cause:** Projects not initialized
**Solution:** Backend automatically initializes when student is created via admin dashboard

### Issue: Notifications not appearing
**Check:**
1. Notification service is running
2. Database has notifications table
3. Frontend is polling for notifications

---

## ✅ SUCCESS CRITERIA

Your system is fully functional when:

- ✅ All 5 user accounts can login
- ✅ Admin can create trainers, students, batches
- ✅ Trainer can create tasks and review submissions
- ✅ Students can view projects, tasks, and notifications
- ✅ Docker workspaces provision successfully
- ✅ Complete project lifecycle works end-to-end
- ✅ All CRUD operations function correctly
- ✅ Data isolation works (students can't see each other's data)
- ✅ Notifications sent for all user actions
- ✅ Project auto-unlocking works after approval

---

## 🎉 YOU'RE READY!

Once you complete the setup steps and run through the testing checklist, you'll have a fully functional, production-ready LMS with:

- **5 user accounts** across 4 roles
- **2 batches** with different tracks
- **2 students** with complete profiles
- **3 tasks** assigned and ready
- **Docker workspace system** fully operational
- **Complete notification system**
- **Full project lifecycle** from assignment to completion

**Start by restarting the backend, then run the test data script!** 🚀

