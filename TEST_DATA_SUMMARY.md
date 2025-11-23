# 🎯 APRANOVA LMS - COMPLETE TEST DATA SUMMARY

## ✅ SYSTEM STATUS

- ✅ Database: Fully migrated and ready
- ✅ Docker Desktop: Running (version 28.5.1)
- ✅ Backend: Needs restart to apply latest changes
- ✅ Frontend: Running on port 3000
- ✅ Default Users: Created (Super Admin, Admin, Trainer)

---

## 👥 DEFAULT USER ACCOUNTS (ALREADY CREATED)

### 1. Super Admin
- **Email:** `superadmin@apranova.com`
- **Password:** `SuperAdmin123!`
- **Dashboard:** `/superadmin`
- **Capabilities:**
  - Create and manage admins
  - View all system data
  - Access financial analytics
  - Full system control

### 2. Admin
- **Email:** `admin@apranova.com`
- **Password:** `Admin123!`
- **Dashboard:** `/admin`
- **Capabilities:**
  - Create and manage trainers
  - Create and manage students
  - Create and manage batches
  - Manage projects
  - View all system data

### 3. Trainer
- **Email:** `trainer@apranova.com`
- **Password:** `Trainer123!`
- **Dashboard:** `/trainer`
- **Capabilities:**
  - View assigned students
  - Create tasks for students
  - Review student submissions
  - Provide feedback and grades
  - Manage student progress

---

## 📋 TEST DATA TO BE CREATED

### Test Students (To be created via Admin Dashboard)

#### Student 1: Alice Johnson
- **Email:** `alice@apranova.com`
- **Password:** `Student123!`
- **Full Name:** Alice Johnson
- **Track:** Data Professional
- **Batch:** Batch 2024-Q1 Data Professional
- **Trainer:** John Trainer (trainer@apranova.com)
- **Dashboard:** `/student`

#### Student 2: Bob Smith
- **Email:** `bob@apranova.com`
- **Password:** `Student123!`
- **Full Name:** Bob Smith
- **Track:** Full Stack Developer
- **Batch:** Batch 2024-Q2 Full Stack
- **Trainer:** John Trainer (trainer@apranova.com)
- **Dashboard:** `/student`

### Test Batches (To be created via Admin Dashboard)

#### Batch 1
- **Name:** Batch 2024-Q1 Data Professional
- **Track:** Data Professional
- **Start Date:** 2024-01-15
- **End Date:** 2024-04-15
- **Max Students:** 30

#### Batch 2
- **Name:** Batch 2024-Q2 Full Stack
- **Track:** Full Stack Developer
- **Start Date:** 2024-04-15
- **End Date:** 2024-07-15
- **Max Students:** 25

### Test Tasks (To be created via Trainer Dashboard)

#### Task 1 (for Alice)
- **Title:** Complete Python Basics Module
- **Description:** Learn Python fundamentals including variables, data types, loops, and functions
- **Priority:** High
- **Due Date:** 7 days from creation

#### Task 2 (for Alice)
- **Title:** Setup Development Environment
- **Description:** Install VS Code, Python, and required libraries
- **Priority:** Medium
- **Due Date:** 3 days from creation

#### Task 3 (for Bob)
- **Title:** Read Course Documentation
- **Description:** Review the course syllabus and learning objectives
- **Priority:** Low
- **Due Date:** 2 days from creation

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Restart Backend Server

The backend code has been updated with batch track support. You need to restart it:

1. Stop the current backend process (if running)
2. Navigate to backend folder: `cd backend`
3. Start backend: `npm run dev`
4. Wait for: "Apranova LMS Backend running on port 3001"

### Step 2: Create Test Data

**Option A: Use PowerShell Script (Automated)**
```powershell
.\setup-test-data.ps1
```

**Option B: Manual Creation via UI**

1. **Login as Admin** (`http://localhost:3000/auth/login`)
   - Email: `admin@apranova.com`
   - Password: `Admin123!`

2. **Create Batches**
   - Go to Admin Dashboard → Batches
   - Click "Add Batch"
   - Create both batches listed above

3. **Create Students**
   - Go to Admin Dashboard → Students
   - Click "Add Student"
   - Create Alice and Bob with details above
   - Assign to respective batches and trainer

4. **Login as Trainer** (`http://localhost:3000/auth/login`)
   - Email: `trainer@apranova.com`
   - Password: `Trainer123!`

5. **Create Tasks**
   - Go to Trainer Dashboard → Tasks
   - Click "Create Task"
   - Create all 3 tasks listed above

---

## 🧪 TESTING WORKFLOWS

### Test 1: Student Workflow

1. **Login as Alice**
   - URL: `http://localhost:3000/auth/login`
   - Email: `alice@apranova.com`
   - Password: `Student123!`

2. **Verify Student Can:**
   - ✅ View dashboard with stats
   - ✅ See assigned projects (first unlocked, rest locked)
   - ✅ View assigned tasks (2 tasks)
   - ✅ See notifications
   - ✅ Provision workspace (Docker container)
   - ✅ Access Code-Server workspace
   - ✅ Submit project work

### Test 2: Trainer Workflow

1. **Login as Trainer**
   - Email: `trainer@apranova.com`
   - Password: `Trainer123!`

2. **Verify Trainer Can:**
   - ✅ View all assigned students (Alice & Bob)
   - ✅ Create new tasks for students
   - ✅ View pending submissions
   - ✅ Review submissions (approve/reject with feedback)
   - ✅ See that approving unlocks next project for student
   - ✅ View student progress

### Test 3: Admin Workflow

1. **Login as Admin**
   - Email: `admin@apranova.com`
   - Password: `Admin123!`

2. **Verify Admin Can:**
   - ✅ Create new trainers
   - ✅ Create new students
   - ✅ Create batches
   - ✅ View all system data
   - ✅ Edit/delete trainers, students, batches
   - ✅ Manage projects

### Test 4: Super Admin Workflow

1. **Login as Super Admin**
   - Email: `superadmin@apranova.com`
   - Password: `SuperAdmin123!`

2. **Verify Super Admin Can:**
   - ✅ Create new admins
   - ✅ View financial analytics
   - ✅ Access all system features
   - ✅ View all users and data

### Test 5: Docker Workspace Provisioning

1. **Login as Alice**
2. **Go to Workspaces**
3. **Click "Provision Workspace"**
4. **Verify:**
   - ✅ Docker container is created
   - ✅ Workspace status shows "running"
   - ✅ Workspace URL is provided
   - ✅ Can access Code-Server in browser
   - ✅ Tools are installed (Python, Node.js, Git)

### Test 6: Complete Project Lifecycle

1. **Admin creates student** → Student receives notification
2. **Student views projects** → First project unlocked
3. **Trainer creates task** → Student receives notification
4. **Student submits project** → Trainer receives notification
5. **Trainer reviews submission** → Student receives notification
6. **If approved** → Next project unlocked → Student receives notification

---

## 📊 QUICK REFERENCE

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Super Admin | superadmin@apranova.com | SuperAdmin123! | /superadmin |
| Admin | admin@apranova.com | Admin123! | /admin |
| Trainer | trainer@apranova.com | Trainer123! | /trainer |
| Student (Alice) | alice@apranova.com | Student123! | /student |
| Student (Bob) | bob@apranova.com | Student123! | /student |

---

## 🔧 TROUBLESHOOTING

### Backend Errors (500)
- **Solution:** Restart backend server to apply code changes
- Command: `cd backend && npm run dev`

### Cannot Create Batches
- **Issue:** Missing `track` field
- **Solution:** Backend has been updated to require track field

### Docker Workspace Not Starting
- **Check:** Docker Desktop is running
- **Check:** Backend can connect to Docker
- **Command:** `docker ps` to verify Docker is accessible

### Students Not Seeing Projects
- **Issue:** Projects not initialized
- **Solution:** Backend automatically initializes projects when student is created

---

## ✅ NEXT STEPS

1. ✅ Restart backend server
2. ✅ Run `.\setup-test-data.ps1` to create all test data
3. ✅ Login and test each user role
4. ✅ Test complete workflows end-to-end
5. ✅ Verify Docker workspace provisioning
6. ✅ Test submission and review process

---

## 🎉 SYSTEM IS READY!

All components are in place. Once you restart the backend and create the test data, you'll have a fully functional LMS with:
- ✅ 5 user accounts (1 super admin, 1 admin, 1 trainer, 2 students)
- ✅ 2 batches with different tracks
- ✅ 3 tasks assigned to students
- ✅ Complete project lifecycle
- ✅ Docker workspace provisioning
- ✅ Notification system
- ✅ Full CRUD operations

**Ready to demonstrate and test all features!** 🚀

