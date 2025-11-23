# 🚀 ONE-CLICK SETUP GUIDE - APRANOVA LMS

## ✅ **COMPLETE AUTOMATED SETUP**

This guide will help you set up the entire system with just **2 steps**:
1. Execute SQL in Supabase (database migration)
2. Call one API endpoint (create default users)

---

## 📋 **STEP 1: DATABASE MIGRATION**

### **Execute the SQL Script**

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file **`COMPLETE_DATABASE_SETUP.sql`** in this project
5. Copy the **entire contents**
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for completion
9. You should see: **"✅ Database migration completed successfully!"**

**What this does:**
- ✅ Creates `task_priority` enum ('low', 'medium', 'high')
- ✅ Migrates `tasks.priority` from INTEGER to enum
- ✅ Fixes `trainers.specialization` from array to TEXT
- ✅ Fixes `students.trainer_id` to reference `trainers` table
- ✅ Adds `projects.order_index` column
- ✅ Adds `payments.stripe_payment_intent_id` column
- ✅ Creates 10 performance indexes

---

## 🎯 **STEP 2: CREATE DEFAULT USERS**

### **Call the Setup API Endpoint**

**Option A: Using PowerShell (Windows)**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/setup/create-default-users" -Method POST -ContentType "application/json" | ConvertTo-Json
```

**Option B: Using curl (Command Prompt)**
```bash
curl -X POST http://localhost:3001/api/setup/create-default-users
```

**Option C: Using Browser/Postman**
- Method: `POST`
- URL: `http://localhost:3001/api/setup/create-default-users`
- No body required
- Click Send

### **Expected Response:**
```json
{
  "success": true,
  "message": "Setup completed: 3 created, 0 already existed, 0 failed",
  "results": [
    {
      "email": "superadmin@apranova.com",
      "role": "superadmin",
      "status": "success",
      "message": "User created successfully"
    },
    {
      "email": "admin@apranova.com",
      "role": "admin",
      "status": "success",
      "message": "User created successfully"
    },
    {
      "email": "trainer@apranova.com",
      "role": "trainer",
      "status": "success",
      "message": "User created successfully"
    }
  ]
}
```

**What this does:**
- ✅ Creates Super Admin account in Supabase Auth
- ✅ Creates Admin account in Supabase Auth
- ✅ Creates Trainer account in Supabase Auth
- ✅ Creates all profile records with correct roles
- ✅ Creates trainer record with specialization and bio
- ✅ All accounts are ready to login immediately!

---

## 🎉 **STEP 3: LOGIN AND TEST**

### **Default Accounts Created:**

#### **1. Super Admin**
- **URL:** `http://localhost:3000/auth/login`
- **Email:** `superadmin@apranova.com`
- **Password:** `SuperAdmin123!`
- **Dashboard:** `/superadmin`
- **Can do:** Everything (create admins, view all data, financial analytics)

#### **2. Admin**
- **URL:** `http://localhost:3000/auth/login`
- **Email:** `admin@apranova.com`
- **Password:** `Admin123!`
- **Dashboard:** `/admin`
- **Can do:** Create trainers, create students, manage batches, manage projects

#### **3. Trainer**
- **URL:** `http://localhost:3000/auth/login`
- **Email:** `trainer@apranova.com`
- **Password:** `Trainer123!`
- **Dashboard:** `/trainer`
- **Can do:** View assigned students, create tasks, review submissions

---

## 🧪 **QUICK TEST FLOW**

### **Test 1: Login as Admin**
1. Go to `http://localhost:3000/auth/login`
2. Email: `admin@apranova.com`
3. Password: `Admin123!`
4. ✅ You should be redirected to `/admin` dashboard

### **Test 2: Create a Student**
1. In Admin Dashboard, click **Students** tab
2. Click **Add Student**
3. Fill in:
   - Full Name: `Jane Student`
   - Email: `student@apranova.com`
   - Password: `Student123!`
   - Track: `Data Professional`
   - Assign to Trainer: `John Trainer`
4. Click **Create Student**
5. ✅ Student created with projects auto-initialized!

### **Test 3: Login as Trainer**
1. Logout (click user menu → Sign Out)
2. Login with:
   - Email: `trainer@apranova.com`
   - Password: `Trainer123!`
3. ✅ You should see "Jane Student" in your students list

### **Test 4: Create a Task**
1. Go to **Tasks** tab
2. Click **Create Task**
3. Fill in:
   - Title: `Complete Python Basics`
   - Description: `Learn Python fundamentals`
   - Student: `Jane Student`
   - Priority: `High`
   - Due Date: Tomorrow
4. Click **Create Task**
5. ✅ Task created and notification sent to student!

### **Test 5: Login as Student**
1. Logout
2. Login with:
   - Email: `student@apranova.com`
   - Password: `Student123!`
3. ✅ You should see:
   - Notification bell with unread count (1)
   - Task in Tasks tab
   - First project unlocked in Projects tab

---

## 🔧 **TROUBLESHOOTING**

### **Error: "Failed to run sql query"**
- Make sure you executed `COMPLETE_DATABASE_SETUP.sql` first
- Check Supabase credentials in `backend/.env`

### **Error: "Cannot POST /api/setup/create-default-users"**
- Make sure backend is running: `cd backend && npm run dev`
- Check backend is on port 3001: `curl http://localhost:3001/health`

### **Error: "User already exists"**
- This is OK! The endpoint is idempotent
- It will skip users that already exist
- Check the response to see which users were created

### **Cannot login after setup**
- Verify the API call succeeded (check response)
- Try the exact credentials listed above
- Check browser console for errors

---

## 📁 **FILES INVOLVED**

1. **`COMPLETE_DATABASE_SETUP.sql`** - Database migration script
2. **`backend/src/routes/setup.ts`** - Setup API endpoint (NEW)
3. **`backend/src/index.ts`** - Registered setup route (MODIFIED)

---

## 🎯 **SUMMARY**

**Total Setup Time: ~2 minutes**

1. ✅ Execute SQL in Supabase (30 seconds)
2. ✅ Call API endpoint (10 seconds)
3. ✅ Login and test (1 minute)

**Result:**
- ✅ Database fully migrated
- ✅ 3 default accounts created
- ✅ Ready to create students and start using the system!

---

## 🔒 **SECURITY NOTE**

After initial setup, you may want to **disable the setup endpoint** for security:

**Option 1: Comment out the route**
```typescript
// backend/src/index.ts
// app.use('/api/setup', setupRoutes); // Disabled after initial setup
```

**Option 2: Add authentication**
Modify `backend/src/routes/setup.ts` to require a secret key or admin authentication.

---

## 🎉 **YOU'RE READY!**

The entire system is now fully functional and production-ready!

**Next steps:**
1. Login as admin
2. Create more trainers and students
3. Test the complete workflow
4. Customize the system to your needs

🚀 **Happy Learning!**

