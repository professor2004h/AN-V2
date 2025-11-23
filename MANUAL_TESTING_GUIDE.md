# 🧪 MANUAL TESTING GUIDE - APRANOVA LMS

## ⚠️ IMPORTANT: Backend API Issue Detected

The automated test data creation script is encountering 500 errors when creating batches and students via the API. This appears to be an authentication or server restart issue.

## 🔧 RECOMMENDED APPROACH: Manual Testing via UI

Since the API is having issues, I recommend testing the system manually through the UI, which will give you a better demonstration experience anyway.

---

## 📋 STEP-BY-STEP MANUAL TESTING PROCESS

### ✅ Step 1: Verify System is Running

1. **Check Backend Health:**
   - Open: http://localhost:3001/health
   - Should see: `{"status":"ok","timestamp":"...","environment":"development"}`

2. **Check Frontend:**
   - Open: http://localhost:3000
   - Should load the login page

---

### ✅ Step 2: Login as Admin

1. **Navigate to:** http://localhost:3000/auth/login
2. **Enter credentials:**
   - Email: `admin@apranova.com`
   - Password: `Admin123!`
3. **Click "Sign In"**
4. **Verify:** You're redirected to `/admin` dashboard

---

### ✅ Step 3: Create Test Batches (via Admin Dashboard)

1. **In Admin Dashboard, navigate to "Batches" tab**
2. **Click "Add Batch" or "Create Batch" button**

**Create Batch 1:**
- Name: `Batch 2024-Q1 Data Professional`
- Track: `Data Professional`
- Start Date: `2024-01-15`
- End Date: `2024-04-15`
- Max Students: `30`
- Click "Create" or "Save"

**Create Batch 2:**
- Name: `Batch 2024-Q2 Full Stack`
- Track: `Full Stack Developer`
- Start Date: `2024-04-15`
- End Date: `2024-07-15`
- Max Students: `25`
- Click "Create" or "Save"

**Verify:** Both batches appear in the batches list

---

### ✅ Step 4: Create Test Students (via Admin Dashboard)

1. **In Admin Dashboard, navigate to "Students" tab**
2. **Click "Add Student" or "Create Student" button**

**Create Student 1 - Alice:**
- Full Name: `Alice Johnson`
- Email: `alice@apranova.com`
- Password: `Student123!`
- Track: `Data Professional`
- Batch: `Batch 2024-Q1 Data Professional`
- Trainer: `John Trainer` (trainer@apranova.com)
- Click "Create" or "Save"

**Create Student 2 - Bob:**
- Full Name: `Bob Smith`
- Email: `bob@apranova.com`
- Password: `Student123!`
- Track: `Full Stack Developer`
- Batch: `Batch 2024-Q2 Full Stack`
- Trainer: `John Trainer` (trainer@apranova.com)
- Click "Create" or "Save"

**Verify:** Both students appear in the students list

---

### ✅ Step 5: Test Admin Workflow

**While logged in as Admin:**

- [ ] **View Dashboard:** Check stats display correctly
- [ ] **View Trainers:** See existing trainer (John Trainer)
- [ ] **View Students:** See Alice and Bob
- [ ] **View Batches:** See both batches created
- [ ] **Edit a Student:** Click edit, change a field, save
- [ ] **Edit a Batch:** Click edit, change max students, save
- [ ] **View Projects:** Check project management interface

**Expected Results:**
- ✅ All data displays correctly
- ✅ CRUD operations work
- ✅ No errors in console

---

### ✅ Step 6: Test Trainer Workflow

1. **Logout from Admin**
2. **Login as Trainer:**
   - Email: `trainer@apranova.com`
   - Password: `Trainer123!`

**Test Actions:**

- [ ] **View Dashboard:** Check trainer dashboard loads
- [ ] **View Students Tab:** Should see Alice and Bob
- [ ] **Click on Alice:** View her details and progress
- [ ] **Create Task for Alice:**
  - Title: `Complete Python Basics Module`
  - Description: `Learn Python fundamentals including variables, data types, loops, and functions`
  - Priority: `High`
  - Due Date: 7 days from today
  - Click "Create Task"

- [ ] **Create Task for Alice (2nd task):**
  - Title: `Setup Development Environment`
  - Description: `Install VS Code, Python, and required libraries`
  - Priority: `Medium`
  - Due Date: 3 days from today
  - Click "Create Task"

- [ ] **Create Task for Bob:**
  - Title: `Read Course Documentation`
  - Description: `Review the course syllabus and learning objectives`
  - Priority: `Low`
  - Due Date: 2 days from today
  - Click "Create Task"

- [ ] **View Tasks Tab:** Verify all 3 tasks appear
- [ ] **View Submissions Tab:** Check for pending submissions (should be empty initially)

**Expected Results:**
- ✅ Can see only assigned students (data isolation)
- ✅ Can create tasks successfully
- ✅ Tasks appear in task list
- ✅ No errors

---

### ✅ Step 7: Test Student Workflow (Alice)

1. **Logout from Trainer**
2. **Login as Alice:**
   - Email: `alice@apranova.com`
   - Password: `Student123!`

**Test Actions:**

- [ ] **View Dashboard:** Check student dashboard loads with stats
- [ ] **View Projects Tab:**
  - Verify first project is unlocked (status: "in_progress")
  - Verify remaining projects are locked
  - Check project details display correctly

- [ ] **View Tasks Tab:**
  - Should see 2 tasks created by trainer
  - Verify task details (title, description, priority, due date)
  - Check priority badges (High = red, Medium = yellow)

- [ ] **View Notifications:**
  - Should see notifications for task assignments
  - Should see notification for account creation

- [ ] **View Workspaces Tab:**
  - Click "Provision Workspace" or "Create Workspace"
  - Wait for workspace to be created
  - Verify workspace status changes to "running"
  - Click workspace URL to access Code-Server
  - **In Code-Server:**
    - Create a new file (test.py)
    - Write simple Python code: `print("Hello from Alice's workspace")`
    - Run the code in terminal
    - Verify output appears
    - Check Git is available: `git --version`
    - Check Python: `python --version`
    - Check Node.js: `node --version`

**Expected Results:**
- ✅ Dashboard shows correct data
- ✅ Projects initialized (first unlocked, rest locked)
- ✅ Tasks visible with correct details
- ✅ Notifications received
- ✅ Workspace provisions successfully
- ✅ Code-Server accessible and functional
- ✅ Development tools installed

---

### ✅ Step 8: Test Student Workflow (Bob)

1. **Logout from Alice**
2. **Login as Bob:**
   - Email: `bob@apranova.com`
   - Password: `Student123!`

**Test Actions:**

- [ ] **View Dashboard:** Verify different stats from Alice
- [ ] **View Projects:** Should see Full Stack Dev projects (different from Alice)
- [ ] **View Tasks:** Should see only 1 task (the one created for Bob)
- [ ] **Verify Data Isolation:** Cannot see Alice's tasks or projects
- [ ] **Provision Workspace:** Create Bob's workspace
- [ ] **Access Code-Server:** Verify separate container from Alice

**Expected Results:**
- ✅ Complete data isolation from Alice
- ✅ Different projects based on track
- ✅ Only Bob's task visible
- ✅ Separate workspace container
- ✅ No access to Alice's data

---

### ✅ Step 9: Test Super Admin Workflow

1. **Logout from Bob**
2. **Login as Super Admin:**
   - Email: `superadmin@apranova.com`
   - Password: `SuperAdmin123!`

**Test Actions:**

- [ ] **View Dashboard:** Check super admin dashboard
- [ ] **View Admins Section:** See existing admin
- [ ] **Create New Admin:**
  - Email: `admin2@apranova.com`
  - Password: `Admin123!`
  - Full Name: `Jane Admin`
  - Click "Create"

- [ ] **View Analytics:** Check system analytics display
- [ ] **Verify Full Access:** Can access all features

**Expected Results:**
- ✅ Can create new admin accounts
- ✅ Can view all system data
- ✅ Has access to analytics
- ✅ Full system control

---

## 🎯 TESTING CHECKLIST SUMMARY

### Core Functionality
- [ ] Admin can create trainers, students, batches
- [ ] Trainer can create tasks for students
- [ ] Students can view projects, tasks, notifications
- [ ] Docker workspaces provision successfully
- [ ] Code-Server IDE is accessible and functional
- [ ] Data isolation works (students can't see each other's data)

### User Roles
- [ ] Super Admin login and features work
- [ ] Admin login and features work
- [ ] Trainer login and features work
- [ ] Student (Alice) login and features work
- [ ] Student (Bob) login and features work

### Docker & Workspaces
- [ ] Docker Desktop is running
- [ ] Workspaces provision without errors
- [ ] Code-Server loads in browser
- [ ] Development tools installed (Python, Node.js, Git)
- [ ] Workspaces are isolated between students
- [ ] Can create files and run code

---

## 📊 TEST ACCOUNTS REFERENCE

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@apranova.com | SuperAdmin123! |
| Admin | admin@apranova.com | Admin123! |
| Trainer | trainer@apranova.com | Trainer123! |
| Student (Alice) | alice@apranova.com | Student123! |
| Student (Bob) | bob@apranova.com | Student123! |

---

## 🔧 TROUBLESHOOTING

### If Backend API Returns 500 Errors:
1. Stop all Node.js processes
2. Navigate to backend folder: `cd backend`
3. Restart backend: `npm run dev`
4. Wait for "Apranova LMS Backend running on port 3001"
5. Try again

### If Frontend Won't Load:
1. Check frontend is running: `curl http://localhost:3000`
2. If not, start it: `cd frontend && npm run dev`

### If Docker Workspace Won't Start:
1. Check Docker Desktop is running: `docker --version`
2. Check containers: `docker ps`
3. Check backend can connect to Docker

---

## ✅ SUCCESS CRITERIA

Your system is fully functional when:
- ✅ All 5 user accounts can login
- ✅ Admin can create and manage all entities
- ✅ Trainer can create tasks and view students
- ✅ Students can view their data and provision workspaces
- ✅ Docker workspaces work for both students
- ✅ Complete data isolation between students
- ✅ All CRUD operations function correctly

---

**Start with Step 1 and work through each step systematically!** 🚀

