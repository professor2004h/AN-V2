# 📊 Apranova LMS - Implementation Analysis

## 1. User Flow Analysis

### 1.1 Student User Flow
```
Sign Up → Email Verification → Sign In → Student Dashboard
  ↓
Overview (Current Project, Progress, Tasks)
  ↓
Projects → Select Project → View Requirements → Submit (GitHub URL)
  ↓
Trainer Reviews → Feedback Received → Notification
  ↓
Tasks → Complete Tasks → Update Status
  ↓
Messages → Communicate with Trainer
  ↓
Workspace → Launch Code-Server → Develop Project
```

### 1.2 Trainer User Flow
```
Sign In → Trainer Dashboard
  ↓
Students List → View Student Details → Monitor Progress
  ↓
Submission Queue → Review Submission → Approve/Reject + Feedback
  ↓
Create Task → Assign to Student → Set Due Date
  ↓
Messages → Respond to Student Questions
  ↓
Analytics → View Student Performance Metrics
```

### 1.3 Admin User Flow
```
Sign In → Admin Dashboard
  ↓
System Overview → Monitor Active Users, Workspaces
  ↓
Manage Trainers → Create/Edit/Deactivate → Assign to Batches
  ↓
Manage Students → Create/Edit/Deactivate → Assign to Trainers
  ↓
Manage Batches → Create/Edit → Set Dates → Assign Trainers
  ↓
Manage Projects → Create/Edit → Set Requirements
  ↓
Analytics → View System-wide Metrics
```

### 1.4 Super Admin User Flow
```
Sign In → Super Admin Dashboard
  ↓
All Admin Features (above)
  +
Revenue Dashboard → View Total Revenue → Filter by Track/Date
  ↓
Payment Details → View Stripe Transactions → Export Reports
  ↓
Financial Analytics → Revenue Trends → Payment Success Rates
  ↓
Advanced Controls → Manage Admins → System Settings
```

## 2. Data Relationship Map

### 2.1 Core Entities & Relationships
```
User (Profile)
  ├─ role: student | trainer | admin | superadmin
  │
  ├─ Student
  │   ├─ track: data_professional | full_stack_dev
  │   ├─ batch_id → Batch
  │   ├─ trainer_id → Trainer
  │   ├─ payment_status: pending | completed | failed
  │   ├─ workspace_url, workspace_status
  │   ├─ progress_percentage
  │   └─ StudentProjects[]
  │       ├─ project_id → Project
  │       ├─ status: locked | in_progress | submitted | under_review | approved | rejected
  │       ├─ progress_percentage
  │       ├─ Submissions[]
  │       │   ├─ github_repo_url
  │       │   ├─ live_demo_url
  │       │   ├─ commit_sha
  │       │   ├─ status: pending | approved | rejected
  │       │   └─ feedback (from trainer)
  │       └─ Checkpoints[]
  │
  ├─ Trainer
  │   ├─ specialization
  │   ├─ Students[] (assigned students)
  │   └─ Batches[] (assigned batches)
  │
  └─ Admin/SuperAdmin
      └─ Full system access

Project
  ├─ track: data_professional | full_stack_dev
  ├─ project_number: 1, 2, 3
  ├─ tech_stack[]
  ├─ requirements{}
  └─ ProgressCheckpoints[]

Task
  ├─ student_id → Student
  ├─ trainer_id → Trainer
  ├─ project_id → Project (optional)
  ├─ status: pending | in_progress | completed | overdue
  ├─ priority: 1-5
  └─ due_date

Payment
  ├─ student_id → Student
  ├─ amount
  ├─ status: pending | completed | failed | refunded
  ├─ stripe_payment_intent_id
  └─ stripe_checkout_session_id

Notification
  ├─ user_id → User
  ├─ type: info | success | warning | error
  ├─ is_read
  └─ action_url

Message
  ├─ sender_id → User
  ├─ recipient_id → User
  ├─ parent_message_id (for threading)
  └─ is_read
```

## 3. API Endpoints Mapping

### 3.1 Student Dashboard Endpoints
| Feature | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Overview | `/api/students/me` | GET | Get student profile + stats |
| Projects | `/api/students/me/projects` | GET | Get all student projects |
| Current Project | `/api/students/me/current-project` | GET | Get in-progress project |
| Submit Project | `/api/submissions` | POST | Create submission |
| Tasks | `/api/students/me/tasks` | GET | Get student tasks |
| Update Task | `/api/tasks/:id/status` | PATCH | Update task status |
| Notifications | `/api/notifications` | GET | Get notifications |
| Mark Read | `/api/notifications/:id/read` | PATCH | Mark notification read |
| Messages | `/api/messages` | GET | Get messages |
| Send Message | `/api/messages` | POST | Send message |
| Profile | `/api/auth/me` | GET | Get user profile |
| Update Profile | `/api/auth/me` | PATCH | Update profile (needs to be added) |

### 3.2 Trainer Dashboard Endpoints
| Feature | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Students List | `/api/trainers/me/students` | GET | Get assigned students |
| Student Detail | `/api/students/:id` | GET | Get student by ID |
| Submissions Queue | `/api/submissions/pending` | GET | Get pending submissions (needs to be added) |
| Review Submission | `/api/submissions/:id/review` | POST | Approve/reject submission (needs to be added) |
| Create Task | `/api/tasks` | POST | Create task |
| Assign Task | `/api/tasks/:id/assign` | POST | Assign task to student (needs to be added) |
| Messages | `/api/messages` | GET | Get messages |

### 3.3 Admin Dashboard Endpoints (Need to be added)
| Feature | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Trainers List | `/api/admin/trainers` | GET | Get all trainers |
| Create Trainer | `/api/admin/trainers` | POST | Create trainer |
| Update Trainer | `/api/admin/trainers/:id` | PATCH | Update trainer |
| Students List | `/api/admin/students` | GET | Get all students |
| Create Student | `/api/admin/students` | POST | Create student |
| Batches List | `/api/admin/batches` | GET | Get all batches |
| System Stats | `/api/admin/stats` | GET | Get system statistics |

### 3.4 Super Admin Endpoints (Need to be added)
| Feature | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Revenue Stats | `/api/superadmin/revenue` | GET | Get revenue statistics |
| Payments List | `/api/superadmin/payments` | GET | Get all payments |
| Payment Details | `/api/superadmin/payments/:id` | GET | Get payment details |
| Export Payments | `/api/superadmin/payments/export` | GET | Export payment report |

## 4. Component Hierarchy

### 4.1 Shared Components (Build First)
```
components/ui/
  ├─ button.tsx ✅
  ├─ card.tsx
  ├─ badge.tsx
  ├─ input.tsx
  ├─ label.tsx
  ├─ select.tsx
  ├─ textarea.tsx
  ├─ dialog.tsx
  ├─ dropdown-menu.tsx
  ├─ table.tsx
  ├─ tabs.tsx
  ├─ avatar.tsx
  ├─ progress.tsx
  ├─ skeleton.tsx
  ├─ alert.tsx
  └─ separator.tsx

components/shared/
  ├─ header.tsx (with theme toggle, notifications, user menu)
  ├─ sidebar.tsx (navigation for each role)
  ├─ theme-provider.tsx
  ├─ theme-toggle.tsx
  ├─ protected-route.tsx
  ├─ loading-spinner.tsx
  ├─ empty-state.tsx
  ├─ error-boundary.tsx
  └─ pagination.tsx
```

### 4.2 Student Dashboard Components
```
app/student/
  ├─ layout.tsx (sidebar + header)
  ├─ page.tsx (overview)
  ├─ projects/
  │   ├─ page.tsx (projects list)
  │   └─ [id]/page.tsx (project detail + submission)
  ├─ tasks/page.tsx
  ├─ workspace/page.tsx
  ├─ messages/page.tsx
  └─ settings/page.tsx

components/student/
  ├─ project-card.tsx
  ├─ progress-chart.tsx
  ├─ submission-form.tsx
  ├─ task-list.tsx
  └─ notification-panel.tsx
```

### 4.3 Trainer Dashboard Components
```
app/trainer/
  ├─ layout.tsx
  ├─ page.tsx (students overview)
  ├─ students/[id]/page.tsx (student detail)
  ├─ submissions/page.tsx (review queue)
  ├─ tasks/page.tsx (task management)
  ├─ messages/page.tsx
  └─ analytics/page.tsx

components/trainer/
  ├─ student-card.tsx
  ├─ student-progress-chart.tsx
  ├─ submission-review-card.tsx
  ├─ task-form.tsx
  └─ analytics-dashboard.tsx
```

## 5. State Management Strategy

### 5.1 Zustand Stores
```typescript
// authStore.ts
- user: Profile | null
- isAuthenticated: boolean
- login(), logout(), updateProfile()

// notificationStore.ts
- notifications: Notification[]
- unreadCount: number
- addNotification(), markAsRead(), markAllAsRead()

// themeStore.ts (using next-themes instead)
```

### 5.2 React Query Keys
```typescript
// Student queries
['student', 'me']
['student', 'projects']
['student', 'current-project']
['student', 'tasks', { status }]
['notifications', { unreadOnly }]
['messages', { type }]

// Trainer queries
['trainer', 'students']
['student', studentId]
['submissions', 'pending']
['tasks', { studentId }]

// Admin queries
['admin', 'trainers']
['admin', 'students']
['admin', 'batches']
['admin', 'stats']

// Super Admin queries
['superadmin', 'revenue', { startDate, endDate }]
['superadmin', 'payments', { filters }]
```

## 6. Missing Backend Endpoints (To Add)

1. **Profile Update**: `PATCH /api/auth/me`
2. **Pending Submissions**: `GET /api/submissions/pending`
3. **Review Submission**: `POST /api/submissions/:id/review`
4. **Admin - Trainers CRUD**: `/api/admin/trainers/*`
5. **Admin - Students CRUD**: `/api/admin/students/*`
6. **Admin - Batches CRUD**: `/api/admin/batches/*`
7. **Admin - System Stats**: `GET /api/admin/stats`
8. **Super Admin - Revenue**: `GET /api/superadmin/revenue`
9. **Super Admin - Payments**: `GET /api/superadmin/payments`
10. **Super Admin - Export**: `GET /api/superadmin/payments/export`

## 7. Implementation Priority

1. ✅ **Shared UI Components** (foundation)
2. ✅ **Authentication Pages** (entry point)
3. ✅ **Student Dashboard** (primary users)
4. ✅ **Trainer Dashboard** (support students)
5. ✅ **Admin Dashboard** (manage system)
6. ✅ **Super Admin Dashboard** (revenue + full control)
7. ✅ **Real-time Features** (polish)

---

**Next Step**: Start building shared UI components

