# 🎓 Apranova LMS - Enterprise Learning Management System

A complete, production-ready Learning Management System built with Node.js, Next.js, and Supabase.

## 🚀 Features

### For Students
- 📚 Project-based learning with guided checkpoints
- 💻 Browser-based IDE workspaces (Code-Server)
- 📝 Git-based submission system
- 📊 Real-time progress tracking
- ✅ Task management from trainers
- 💬 Direct messaging with trainers
- 🔔 Real-time notifications
- 📈 Personal analytics dashboard

### For Trainers
- 👥 Student management and monitoring
- ✍️ Task assignment system
- 📋 Submission review queue
- 💬 Student communication
- 📊 Student progress tracking
- ⭐ Feedback and grading system

### For Admins
- 👨‍🏫 Trainer management
- 👨‍🎓 Student management
- 📦 Batch management
- 📊 System monitoring
- 📈 Analytics and reporting

### For Super Admins
- 💰 Revenue and payment visibility
- 🔧 Full system control
- 👥 Admin and trainer management
- 📊 Cross-batch analytics
- ⚙️ System settings

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Storage**: Supabase Storage
- **Job Queue**: Bull + Redis
- **Real-time**: Socket.io

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form

### DevOps
- **Containers**: Docker + Docker Compose
- **Orchestration**: AWS ECS Fargate

- **CI/CD**: GitHub Actions
- **Monitoring**: AWS CloudWatch

## 📋 Prerequisites

- Node.js 20+ and npm 10+
- Docker Desktop
- Git
- Supabase account (already configured)
- Stripe account (already configured)

## 🏃‍♂️ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd apranova-lms
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Database Setup

Run the SQL scripts in Supabase SQL Editor:
1. `-- Enable UUID extension.txt`
2. `-- Enable Row Level Security on all.txt`
3. `-- Seed Data for Apranova LMS.txt`

### 4. Start Development

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:3000
```

### 5. Start Code-Server (IDE Workspaces)

```bash
npm run docker:up
```

## 📁 Project Structure

```
apranova-lms/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── controllers/ # Business logic
│   │   ├── services/    # External services
│   │   ├── middleware/  # Auth, validation
│   │   └── utils/       # Helpers
│   └── package.json
├── frontend/            # Next.js application
│   ├── app/            # App router pages
│   │   ├── student/    # Student dashboard
│   │   ├── trainer/    # Trainer dashboard
│   │   ├── admin/      # Admin dashboard
│   │   └── superadmin/ # Super admin dashboard
│   ├── components/     # Reusable components
│   └── lib/           # Utils, hooks
├── docker/            # Docker configurations

└── package.json       # Root package.json
```

## 🔐 User Roles

- **Student**: Access to learning materials, projects, and submissions
- **Trainer**: Manage assigned students, review submissions, assign tasks
- **Admin**: Manage trainers, students, and batches
- **Super Admin**: Full system access + revenue visibility

## 🎨 Design System

- **Colors**: Black, white, navy blue, minimal green
- **Theme**: Dark/Light mode toggle
- **No gradients**: Clean, professional design
- **Responsive**: Mobile-first approach

## 📚 Learning Tracks

### Data Professional (DP)
1. Business Analytics Dashboard
2. Automated ETL Pipeline
3. End-to-End Analytics Solution

### Full-Stack Developer (FSD)
1. Responsive Portfolio Website
2. E-Commerce Platform
3. Social Dashboard with DevOps

## 🚢 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
docker-compose up -d
```



## 📧 Email Service Setup

Choose one:

**Option A: Resend (Recommended)**
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Add to `.env`: `RESEND_API_KEY=re_xxx`

**Option B: AWS SES**
1. Enable SES in AWS Console
2. Verify domain
3. Add credentials to `.env`

## 💳 Stripe Setup

1. Get webhook endpoint: `https://apranova.com/api/webhooks/stripe`
2. Add webhook in Stripe Dashboard
3. Copy webhook secret to `.env`

## 🔧 Configuration

All system settings are stored in the `system_settings` table:
- Enrollment fee
- Max students per trainer
- Workspace timeout
- Auto-save interval
- Google Meet integration
- Maintenance mode

## 📊 Database Schema

See SQL files:
- `-- Enable UUID extension.txt` - Schema definition
- `-- Enable Row Level Security on all.txt` - Security policies
- `-- Seed Data for Apranova LMS.txt` - Initial data

## 🤝 Contributing

This is a private project for Apranova.

## 📄 License

Proprietary - All rights reserved by Apranova

## 📊 Current Status

**Foundation**: ✅ Complete
**Backend API**: ✅ 85% Complete
**Frontend**: 🚧 40% Complete
**Dashboards**: 🚧 In Progress

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed progress.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```powershell
# Run setup script
.\scripts\setup.ps1

# Start development
.\scripts\start-dev.ps1
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Copy environment files
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local

# Start development
npm run dev
```

Then run the Supabase SQL scripts and open http://localhost:3000

See [QUICKSTART.md](./QUICKSTART.md) for 5-minute setup guide.

## 🆘 Support

For issues or questions, contact the development team.

