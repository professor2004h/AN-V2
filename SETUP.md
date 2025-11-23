# 🚀 Apranova LMS - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Node.js 20+** and **npm 10+**
- ✅ **Docker Desktop** (running)
- ✅ **Git**
- ✅ **Code editor** (VS Code recommended)

## 📋 Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd e:\AN-V2

# Install all dependencies (backend + frontend)
npm install

# This will install dependencies for both workspaces
```

### 2. Environment Configuration

```bash
# Copy environment example
cp .env.example .env

# Copy frontend environment
cp frontend/.env.local.example frontend/.env.local

# The .env file already contains your Supabase and Stripe credentials
# You just need to add email service credentials (optional for now)
```

### 3. Database Setup (Supabase)

Your Supabase database is already configured! Just run the SQL scripts:

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/phlkhoorckdjriswcpwz/sql)
2. Run these scripts in order:
   - `-- Enable UUID extension.txt`
   - `-- Enable Row Level Security on all.txt` (or `-- ================================.txt` for simpler policies)
   - `-- Seed Data for Apranova LMS.txt`

### 4. Start Development Servers

```bash
# Option 1: Start everything at once
npm run dev

# Option 2: Start individually
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:3000
```

### 5. Start Docker Services (Optional)

```bash
# Start Redis (for job queues)
docker-compose up -d redis

# Start Code-Server workspace (for testing)
docker-compose --profile workspace up -d code-server-template
```

## 🧪 Testing the Setup

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development"
}
```

### 2. Check Frontend

Open browser: http://localhost:3000

You should see the Apranova LMS homepage.

### 3. Create Test User

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "password123",
    "fullName": "Test Student",
    "role": "student",
    "track": "data_professional"
  }'
```

### 4. Sign In

Go to http://localhost:3000/auth/signin and use:
- Email: `student@test.com`
- Password: `password123`

## 📁 Project Structure

```
apranova-lms/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, validation
│   │   ├── lib/           # Supabase, Stripe, logger
│   │   └── config/        # Configuration
│   └── package.json
├── frontend/               # Next.js 14 application
│   ├── app/               # App router pages
│   │   ├── student/       # Student dashboard (TODO)
│   │   ├── trainer/       # Trainer dashboard (TODO)
│   │   ├── admin/         # Admin dashboard (TODO)
│   │   └── superadmin/    # Super admin dashboard (TODO)
│   ├── components/        # Reusable UI components
│   ├── lib/              # API client, utilities
│   └── package.json
├── docker/                # Docker configurations
│   └── code-server/      # Browser IDE setup
├── .env                  # Backend environment variables
├── docker-compose.yml    # Docker services
└── package.json          # Root package.json
```

## 🔧 Configuration

### Email Service (Optional - for notifications)

Choose one option:

**Option A: Resend (Recommended)**
1. Sign up at https://resend.com
2. Get API key
3. Add to `.env`:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_api_key_here
   ```

**Option B: AWS SES**
1. Enable SES in AWS Console
2. Verify domain
3. Add to `.env`:
   ```
   EMAIL_PROVIDER=aws-ses
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_SES_FROM_EMAIL=noreply@apranova.com
   ```

### Stripe Webhooks (For production)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3001/api/payments/webhook
   ```
3. Copy webhook secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 🎯 Next Steps

Now that the foundation is set up, we need to build:

1. ✅ **Authentication pages** (Sign in, Sign up)
2. ✅ **Student Dashboard** - Main interface for students
3. ✅ **Trainer Dashboard** - Student management and reviews
4. ✅ **Admin Dashboard** - System management
5. ✅ **Super Admin Dashboard** - Full control + revenue
6. ✅ **Workspace Integration** - Code-Server provisioning
7. ✅ **Real-time Features** - Notifications, messaging

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

### Docker Issues

```bash
# Restart Docker Desktop
# Then restart services
docker-compose down
docker-compose up -d
```

### Database Connection Issues

1. Check Supabase project status
2. Verify credentials in `.env`
3. Check RLS policies are applied

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

## 📚 Documentation

- **Backend API**: http://localhost:3001/health
- **Frontend**: http://localhost:3000
- **Code-Server**: http://localhost:8080 (when running)
- **Supabase Dashboard**: https://supabase.com/dashboard/project/phlkhoorckdjriswcpwz

## 🆘 Support

For issues or questions:
1. Check this setup guide
2. Review error logs in `backend/logs/`
3. Check browser console for frontend errors
4. Review Docker logs: `docker-compose logs -f`

## ✅ Setup Checklist

- [ ] Node.js 20+ installed
- [ ] Docker Desktop running
- [ ] Dependencies installed (`npm install`)
- [ ] Environment files configured
- [ ] Supabase SQL scripts executed
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Redis running (optional)
- [ ] Test user created and can sign in

Once all items are checked, you're ready to start development! 🎉

