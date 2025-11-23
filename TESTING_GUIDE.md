# 🧪 Apranova LMS - Testing Guide

## Prerequisites

1. **Supabase Project** - Make sure you have a Supabase project set up
2. **Environment Variables** - Configure `.env` files for both backend and frontend
3. **Docker** - Install Docker for Code-Server workspace functionality
4. **Stripe Account** - Set up Stripe for payment processing (optional for initial testing)

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

Backend should start on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev
```

Frontend should start on `http://localhost:3000`

---

## 👥 Test User Accounts

### Create Test Accounts

You'll need to create test accounts for each role. Here's the recommended approach:

#### 1. Create Super Admin (via Supabase SQL Editor)

```sql
-- First, sign up a user via the UI, then run this to make them superadmin
UPDATE users 
SET role = 'superadmin' 
WHERE email = 'superadmin@apranova.com';
```

#### 2. Create Admin (via Super Admin Dashboard)

- Login as superadmin
- Go to Admin Management (if implemented) or use SQL:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@apranova.com';
```

#### 3. Create Trainer (via Admin Dashboard)

- Login as admin
- Go to Trainers → Add Trainer
- Fill in: Full Name, Email, Password, Specialization
- Click Create

#### 4. Create Student (via Admin Dashboard)

- Login as admin
- Go to Students → Add Student
- Fill in: Full Name, Email, Password, Track, Batch, Trainer
- Click Create

---

## 🧪 Testing Scenarios

### Scenario 1: Student Journey

1. **Sign Up**
   - Go to `/auth/signup`
   - Enter: Full Name, Email, Password
   - Select Track: Data Professional or Full-Stack Developer
   - Click Sign Up
   - Should redirect to `/student`

2. **View Dashboard**
   - Check stats cards (Total Projects, Completed, In Progress, Tasks)
   - View current project card
   - View recent tasks
   - View recent notifications

3. **Browse Projects**
   - Go to Projects page
   - See all 3 projects for your track
   - Check locked projects (should have overlay)
   - Check in_progress projects (should be clickable)

4. **Submit Project**
   - Click on an in_progress project
   - Go to "Submit Project" tab
   - Enter GitHub URL, Live Demo URL, Commit SHA
   - Click Submit
   - Check "Submission History" tab for your submission

5. **Manage Tasks**
   - Go to Tasks page
   - Filter by status (All, Pending, In Progress, Completed)
   - Click "Start Task" on a pending task
   - Click "Mark Complete" on an in_progress task

6. **Launch Workspace**
   - Go to Workspace page
   - Click "Provision Workspace" (first time)
   - Wait for provisioning (Docker container creation)
   - Click "Start Workspace"
   - Click "Open Workspace" to access Code-Server
   - Test Stop and Delete functionality

7. **Message Trainer**
   - Go to Messages page
   - Type a message
   - Click Send
   - Check message appears in chat

8. **Update Profile**
   - Go to Settings page
   - Update Full Name, GitHub Username
   - Click Save Changes
   - Change password

### Scenario 2: Trainer Journey

1. **Login**
   - Go to `/auth/signin`
   - Enter trainer credentials
   - Should redirect to `/trainer`

2. **View Students**
   - Check student statistics
   - View students table
   - Search for a student
   - Click "View Details" on a student

3. **Review Student Progress**
   - On student detail page, view tabs:
     - Overview: Student info, progress
     - Projects: Project status cards
     - Tasks: Assigned tasks

4. **Review Submissions**
   - Go to Submissions page
   - See pending submissions
   - Click GitHub link to view code
   - Click Live Demo to test project
   - Click "Review" button
   - Enter feedback and grade
   - Click "Approve" or "Reject"
   - Check that student receives notification

5. **Create Tasks**
   - Go to Tasks page
   - Click "Create Task"
   - Fill in: Title, Description, Select Student, Priority, Due Date
   - Click Create
   - Check task appears in table

6. **Message Students**
   - Go to Messages page
   - Select a student from dropdown
   - Type message and send
   - Check conversation history

7. **View Analytics**
   - Go to Analytics page
   - Check student progress overview
   - View statistics

### Scenario 3: Admin Journey

1. **Login**
   - Go to `/auth/signin`
   - Enter admin credentials
   - Should redirect to `/admin`

2. **System Overview**
   - Check system statistics
   - View recent enrollments
   - View pending submissions
   - Check system health indicators

3. **Manage Trainers**
   - Go to Trainers page
   - Click "Add Trainer"
   - Fill in: Full Name, Email, Password, Specialization
   - Click Create
   - Search for trainer
   - Click Delete on a trainer

4. **Manage Students**
   - Go to Students page
   - Click "Add Student"
   - Fill in: Full Name, Email, Password, Track, Batch, Trainer
   - Click Create
   - Search for student
   - View student details

5. **Manage Batches**
   - Go to Batches page
   - Click "Add Batch"
   - Fill in: Batch Name, Start Date, End Date
   - Click Create
   - View batch list with student counts

6. **Manage Projects**
   - Go to Projects page
   - Click "Add Project"
   - Fill in: Title, Description, Track, Order
   - Click Create
   - View projects table

7. **View Analytics**
   - Go to Analytics page
   - Check enrollment by track
   - View system activity metrics

8. **Configure Settings**
   - Go to Settings page
   - Update system settings
   - Check database status
   - Configure email settings

### Scenario 4: Super Admin Journey

1. **Login**
   - Go to `/auth/signin`
   - Enter superadmin credentials
   - Should redirect to `/superadmin`

2. **View Revenue Dashboard**
   - Check total revenue, monthly revenue
   - View revenue by track breakdown
   - View payment status breakdown

3. **Analyze Revenue**
   - Go to Revenue page
   - Set date range filters
   - View revenue by track with progress bars
   - View revenue by payment status

4. **Manage Payments**
   - Go to Payments page
   - View all payment transactions
   - Search for specific payment
   - Click "Export CSV" to download payments
   - Click "Export PDF" to download report

5. **View Financial Analytics**
   - Go to Financial Analytics page
   - Check payment success rate
   - View revenue per batch
   - View revenue per trainer
   - Analyze payment success metrics

6. **Access Admin Features**
   - Navigate to any admin page (Trainers, Students, etc.)
   - Verify all admin functionality works

---

## ✅ Testing Checklist

### Authentication
- [ ] Sign up with student role
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong credentials (should show error)
- [ ] Role-based redirect works (student → /student, trainer → /trainer, etc.)
- [ ] Protected routes block unauthorized access
- [ ] Sign out works

### Student Dashboard
- [ ] Overview page loads with correct stats
- [ ] Projects page shows all 3 projects
- [ ] Locked projects cannot be accessed
- [ ] Project submission form works
- [ ] Submission history displays correctly
- [ ] Tasks can be filtered
- [ ] Task status can be updated
- [ ] Workspace can be provisioned
- [ ] Workspace can be started/stopped/deleted
- [ ] Messages can be sent to trainer
- [ ] Profile can be updated

### Trainer Dashboard
- [ ] Students overview loads
- [ ] Student detail page shows correct data
- [ ] Submissions can be reviewed
- [ ] Feedback can be provided
- [ ] Submissions can be approved/rejected
- [ ] Tasks can be created
- [ ] Tasks can be assigned to students
- [ ] Messages work with students
- [ ] Analytics display correctly

### Admin Dashboard
- [ ] System overview loads with stats
- [ ] Trainers can be created
- [ ] Trainers can be deleted
- [ ] Students can be created
- [ ] Students can be assigned to trainer/batch
- [ ] Batches can be created
- [ ] Projects can be created
- [ ] Analytics display correctly
- [ ] Settings can be updated

### Super Admin Dashboard
- [ ] Revenue stats display correctly
- [ ] Revenue by track shows breakdown
- [ ] Payment status breakdown works
- [ ] Date range filters work
- [ ] Payments table loads
- [ ] Export CSV works
- [ ] Export PDF works
- [ ] Financial analytics display correctly
- [ ] All admin features accessible

### UI/UX
- [ ] Dark/light theme toggle works
- [ ] Theme persists across page refreshes
- [ ] Responsive design works on mobile
- [ ] Responsive design works on tablet
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty states display correctly
- [ ] Toast notifications appear
- [ ] Search functionality works
- [ ] Pagination works
- [ ] No console errors
- [ ] No console warnings

---

## 🐛 Common Issues & Solutions

### Issue: Backend won't start
**Solution**: Check `.env` file has correct Supabase credentials

### Issue: Frontend can't connect to backend
**Solution**: Check `NEXT_PUBLIC_API_URL` in `.env.local` is correct

### Issue: Workspace provisioning fails
**Solution**: Make sure Docker is running and accessible

### Issue: Payments don't work
**Solution**: Check Stripe API keys in backend `.env`

### Issue: Theme doesn't persist
**Solution**: Check localStorage is enabled in browser

---

## 📊 Expected Results

After testing, you should see:
- ✅ All 4 dashboards fully functional
- ✅ Role-based access working correctly
- ✅ Data flowing between components
- ✅ Real-time updates with React Query
- ✅ Smooth user experience
- ✅ No errors in console
- ✅ Responsive design on all devices

---

**Happy Testing! 🎉**

