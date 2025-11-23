# ⚡ Apranova LMS - Quick Start (5 Minutes)

## 🎯 Fastest Way to Get Started

### Step 1: Run Setup Script (2 minutes)

Open PowerShell in the project directory and run:

```powershell
.\scripts\setup.ps1
```

This will:
- ✅ Check prerequisites (Node.js, npm, Docker)
- ✅ Install all dependencies
- ✅ Create environment files

### Step 2: Configure Database (2 minutes)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/phlkhoorckdjriswcpwz/sql)

2. Copy and run these 3 SQL files in order:
   - `-- Enable UUID extension.txt`
   - `-- ================================.txt` (simplified RLS policies)
   - `-- Seed Data for Apranova LMS.txt`

### Step 3: Start Development (1 minute)

```powershell
.\scripts\start-dev.ps1
```

Or manually:

```powershell
npm run dev
```

### Step 4: Open Browser

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/health

## 🧪 Test It Works

### Create a Test Student

```powershell
curl -X POST http://localhost:3001/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{
    "email": "student@test.com",
    "password": "password123",
    "fullName": "Test Student",
    "role": "student",
    "track": "data_professional"
  }'
```

### Sign In

Go to http://localhost:3000/auth/signin

- Email: `student@test.com`
- Password: `password123`

## 🎉 You're Ready!

The foundation is complete. Now we can build:

1. **Student Dashboard** - Projects, submissions, tasks
2. **Trainer Dashboard** - Student management, reviews
3. **Admin Dashboard** - System management
4. **Super Admin Dashboard** - Revenue + full control

## 📚 Need More Details?

See [SETUP.md](./SETUP.md) for comprehensive documentation.

## 🐛 Issues?

### Port Already in Use

```powershell
npx kill-port 3000
npx kill-port 3001
```

### Docker Not Running

Start Docker Desktop, then run:

```powershell
docker-compose up -d redis
```

### Dependencies Issues

```powershell
rm -r node_modules, backend/node_modules, frontend/node_modules
npm install
```

## ✅ What's Working Now

- ✅ Backend API with Supabase integration
- ✅ Authentication system (sign up, sign in)
- ✅ Student, Trainer, Admin, Super Admin roles
- ✅ Project management endpoints
- ✅ Submission system
- ✅ Task management
- ✅ Notifications
- ✅ Messaging
- ✅ Stripe payment integration
- ✅ Docker setup for Code-Server workspaces
- ✅ Frontend foundation with Next.js 14

## 🚧 What's Next

- [ ] Build authentication UI pages
- [ ] Build Student Dashboard
- [ ] Build Trainer Dashboard
- [ ] Build Admin Dashboard
- [ ] Build Super Admin Dashboard
- [ ] Implement workspace provisioning
- [ ] Add real-time features (Socket.io)
- [ ] Add email notifications

---

**Ready to build the dashboards?** Let me know and I'll continue! 🚀

