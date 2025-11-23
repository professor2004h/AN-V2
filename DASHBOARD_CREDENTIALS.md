# 🔐 APRANOVA LMS - DASHBOARD ACCESS CREDENTIALS

## Production Application URL
**http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/**

---

## 👥 USER ACCOUNTS & PASSWORDS

### 1. 🔴 Super Admin Dashboard
- **Email:** `superadmin@apranova.com`
- **Password:** `SuperAdmin123!`
- **Dashboard URL:** `/superadmin`
- **Access Level:** Full system control
- **Capabilities:**
  - Create and manage admins
  - View all system data
  - Access financial analytics
  - Full system control

---

### 2. 🟠 Admin Dashboard
- **Email:** `admin@apranova.com`
- **Password:** `Admin123!`
- **Dashboard URL:** `/admin`
- **Access Level:** Administrative
- **Capabilities:**
  - Create and manage trainers
  - Create and manage students
  - Create and manage batches
  - Manage projects
  - View all system data

---

### 3. 🟡 Trainer Dashboard
- **Email:** `trainer@apranova.com`
- **Password:** `Trainer123!`
- **Dashboard URL:** `/trainer`
- **Access Level:** Trainer
- **Capabilities:**
  - View assigned students
  - Create tasks for students
  - Review student submissions
  - Provide feedback and grades
  - Manage student progress

---

### 4. 🟢 Student Accounts (Test Users)

#### Student 1: Alice Johnson
- **Email:** `alice@apranova.com`
- **Password:** `Student123!`
- **Dashboard URL:** `/student`
- **Track:** Data Professional
- **Capabilities:**
  - View assigned projects
  - Complete tasks
  - Submit project work
  - Access Code-Server workspace
  - View progress and grades

#### Student 2: Bob Smith
- **Email:** `bob@apranova.com`
- **Password:** `Student123!`
- **Dashboard URL:** `/student`
- **Track:** Full Stack Developer
- **Capabilities:**
  - View assigned projects
  - Complete tasks
  - Submit project work
  - Access Code-Server workspace
  - View progress and grades

---

## 🔧 Code-Server Workspace Password

When students provision their Docker workspace, they'll need this password to access Code-Server:

- **Code-Server Password:** `apranova123`

---

## 📊 QUICK REFERENCE TABLE

| Role | Email | Password | Dashboard Path |
|------|-------|----------|----------------|
| **Super Admin** | superadmin@apranova.com | `SuperAdmin123!` | `/superadmin` |
| **Admin** | admin@apranova.com | `Admin123!` | `/admin` |
| **Trainer** | trainer@apranova.com | `Trainer123!` | `/trainer` |
| **Student (Alice)** | alice@apranova.com | `Student123!` | `/student` |
| **Student (Bob)** | bob@apranova.com | `Student123!` | `/student` |
| **Code-Server** | N/A | `apranova123` | Workspace |

---

## 🔗 LOGIN URLS

### Main Login Page
```
http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/auth/signin
```

### Sign Up Page
```
http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/auth/signup
```

### Direct Dashboard Access (after login)
- Super Admin: `http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/superadmin`
- Admin: `http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/admin`
- Trainer: `http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/trainer`
- Student: `http://apranova-lms-alb-v2-1395433124.ap-southeast-2.elb.amazonaws.com/student`

---

## ⚠️ IMPORTANT NOTES

1. **First Time Setup**: These accounts should already exist in your production database. If they don't, you'll need to create them via the signup flow or database seeding.

2. **Password Security**: These are test/demo passwords. For production use, you should:
   - Change all default passwords
   - Enforce strong password policies
   - Enable 2FA for admin accounts

3. **Backend Status**: The backend service is still starting (2 tasks pending). Wait 1-2 minutes for full functionality.

4. **Database Connection**: Ensure your backend is connected to the correct Supabase database with the test data.

---

## 🎯 TESTING WORKFLOW

### Step 1: Test Super Admin Access
1. Go to login page
2. Login with `superadmin@apranova.com` / `SuperAdmin123!`
3. Verify access to Super Admin dashboard
4. Check ability to create admins

### Step 2: Test Admin Access
1. Logout and login with `admin@apranova.com` / `Admin123!`
2. Verify access to Admin dashboard
3. Check ability to create trainers and students

### Step 3: Test Trainer Access
1. Logout and login with `trainer@apranova.com` / `Trainer123!`
2. Verify access to Trainer dashboard
3. Check ability to view students and create tasks

### Step 4: Test Student Access
1. Logout and login with `alice@apranova.com` / `Student123!`
2. Verify access to Student dashboard
3. Check ability to view projects and tasks
4. Test workspace provisioning

---

## 🔒 SECURITY REMINDER

**DO NOT share these credentials publicly!** These are for testing and demonstration purposes only.

For production deployment:
- Rotate all passwords
- Use environment-specific credentials
- Enable audit logging
- Implement rate limiting
- Enable 2FA for privileged accounts
