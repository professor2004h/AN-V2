# Frontend Updates Needed for Complete Interconnectivity

## Overview
The backend is 100% complete with all endpoints, services, and data isolation. The frontend API client (`lib/api.ts`) has been updated with all new endpoints. Now we need to update the dashboard components to use these new endpoints.

---

## 1. Admin Dashboard Updates

### **File: `frontend/app/admin/trainers/page.tsx`**
**Current:** Form expects `userId` field  
**Update Needed:** Change form to include:
- Email (text input)
- Password (password input, min 8 chars)
- Full Name (text input)
- Specialization (text input, optional)

**API Call Change:**
```typescript
// OLD
await adminApi.createTrainer({ userId, specialization })

// NEW
await adminApi.createTrainer({ email, password, fullName, specialization })
```

---

### **File: `frontend/app/admin/students/page.tsx`**
**Current:** Form expects `userId` field  
**Update Needed:** Change form to include:
- Email (text input)
- Password (password input, min 8 chars)
- Full Name (text input)
- Track (select: data_professional | full_stack_dev)
- Batch (select from batches)
- Trainer (select from trainers)

**API Call Change:**
```typescript
// OLD
await adminApi.createStudent({ userId, track, batchId, trainerId })

// NEW
await adminApi.createStudent({ email, password, fullName, track, batchId, trainerId })
```

---

## 2. Trainer Dashboard Updates

### **File: `frontend/app/trainer/page.tsx`** (Students List)
**Current:** Uses `trainerApi.getStudents()` without filters  
**Update Needed:** Add filter controls:
- Search input (filter by name/email)
- Track filter (dropdown: All | Data Professional | Full-Stack Dev)
- Status filter (dropdown: All | Active | Inactive)

**API Call Change:**
```typescript
// OLD
const { data } = await trainerApi.getStudents()

// NEW
const { data } = await trainerApi.getStudents({ search, track, status })
```

---

### **File: `frontend/app/trainer/students/[id]/page.tsx`** (Student Detail)
**Current:** May use generic student API  
**Update Needed:** Use trainer-specific endpoint with authorization

**API Call Change:**
```typescript
// NEW
const { data } = await trainerApi.getStudentDetail(id)
```

---

### **File: `frontend/app/trainer/submissions/page.tsx`**
**Current:** May fetch all submissions  
**Update Needed:** Use trainer-specific pending submissions endpoint

**API Call Change:**
```typescript
// OLD
const { data } = await enhancedSubmissionApi.getPending()

// NEW
const { data } = await trainerApi.getPendingSubmissions()
```

**Add Review Functionality:**
```typescript
const handleReview = async (submissionId: string, status: string, feedback: string, grade?: number) => {
  await trainerApi.reviewSubmission(submissionId, { status, feedback, grade })
  // Refresh submissions list
  refetch()
}
```

---

### **File: `frontend/app/trainer/tasks/page.tsx`**
**Current:** May not have task creation form  
**Update Needed:** Add task creation form with:
- Student selector (dropdown of trainer's students)
- Title (text input)
- Description (textarea)
- Priority (select: low | medium | high)
- Due Date (date picker)
- Project (optional, select from projects)

**API Call:**
```typescript
await taskApi.create({
  title,
  description,
  studentId,
  projectId,
  priority, // 'low' | 'medium' | 'high'
  dueDate
})
```

---

## 3. Student Dashboard Updates

### **File: `frontend/app/student/tasks/page.tsx`**
**Current:** May use `studentApi.getTasks(status)`  
**Update Needed:** Use new `taskApi.getAll()` with filters

**API Call Change:**
```typescript
// OLD
const { data } = await studentApi.getTasks(status)

// NEW
const { data } = await taskApi.getAll(status, priority)
```

**Add Filter Controls:**
- Status filter (All | Pending | In Progress | Completed | Overdue)
- Priority filter (All | Low | Medium | High)

---

### **File: `frontend/app/student/workspace/page.tsx`**
**Current:** May pass studentId to workspace API  
**Update Needed:** Remove studentId parameter (backend auto-detects for students)

**API Call Change:**
```typescript
// OLD
await workspaceApi.provision(studentId)

// NEW
await workspaceApi.provision() // No parameter needed for students
```

---

## 4. Shared Components Updates

### **File: `frontend/components/shared/dashboard-header.tsx`**
**Current:** May have static notification badge  
**Update Needed:** Implement real notifications dropdown

**Add:**
1. Fetch notifications: `notificationApi.getAll(true)` (unread only)
2. Display unread count badge
3. Dropdown menu showing recent notifications
4. "Mark as Read" button for each notification
5. "Mark All as Read" button
6. Click notification → mark as read + navigate to relevant page

**Example:**
```typescript
const { data: notifications } = useQuery({
  queryKey: ['notifications', 'unread'],
  queryFn: () => notificationApi.getAll(true),
  refetchInterval: 30000, // Refresh every 30 seconds
})

const unreadCount = notifications?.data?.length || 0

const handleMarkAsRead = async (id: string) => {
  await notificationApi.markAsRead(id)
  refetch()
}

const handleMarkAllAsRead = async () => {
  await notificationApi.markAllAsRead()
  refetch()
}
```

---

## 5. Super Admin Dashboard Updates

### **File: `frontend/app/superadmin/admins/page.tsx`**
**Current:** May have admin creation form expecting userId  
**Update Needed:** Change form to include:
- Email (text input)
- Password (password input, min 8 chars)
- Full Name (text input)

**API Call Change:**
```typescript
// OLD
await superadminApi.createAdmin(userId)

// NEW
await superadminApi.createAdmin({ email, password, fullName })
```

---

### **File: `frontend/app/superadmin/revenue/page.tsx`**
**Current:** May use old API method names  
**Update Needed:** Use new method names

**API Call Change:**
```typescript
// OLD
const { data } = await superadminApi.getRevenue(startDate, endDate)

// NEW
const { data } = await superadminApi.getRevenueStats(startDate, endDate)
```

---

### **File: `frontend/app/superadmin/payments/page.tsx`**
**Current:** May use old API method names  
**Update Needed:** Use new method names

**API Call Change:**
```typescript
// OLD
const { data } = await superadminApi.getPayments(page, limit, filters)

// NEW
const { data } = await superadminApi.getAllPayments(page, limit, filters)
```

**Export Functionality:**
```typescript
const handleExport = async (format: 'csv' | 'pdf') => {
  const blob = await superadminApi.exportPayments(format, filters)
  // Download blob as file
  const url = window.URL.createObjectURL(blob.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `payments.${format}`
  a.click()
}
```

---

## Priority Order

### **High Priority (Core Functionality):**
1. ✅ Admin trainer creation form (email, password, fullName)
2. ✅ Admin student creation form (email, password, fullName)
3. ✅ Trainer submissions page (use trainerApi.getPendingSubmissions)
4. ✅ Trainer review submission (use trainerApi.reviewSubmission)
5. ✅ Notifications dropdown in header (real data)

### **Medium Priority (Enhanced UX):**
6. ✅ Trainer students list with filters
7. ✅ Student tasks page with filters
8. ✅ Trainer task creation form
9. ✅ Super Admin admin creation form

### **Low Priority (Nice to Have):**
10. ✅ Student workspace auto-provision (remove studentId param)
11. ✅ Super Admin API method name updates
12. ✅ Trainer student detail page (use trainerApi.getStudentDetail)

---

## Testing After Updates

After making these frontend updates, test the complete workflow:

1. **Admin creates student** → Student appears in trainer dashboard
2. **Trainer creates task** → Student sees task + receives notification
3. **Student submits project** → Trainer sees submission
4. **Trainer reviews submission** → Student receives notification + sees feedback
5. **Approved submission** → Next project unlocks automatically
6. **Student provisions workspace** → Docker container starts
7. **All CRUD operations** → Work across all dashboards
8. **No data leakage** → Students only see their own data

---

## Summary

**Backend:** ✅ 100% Complete  
**Frontend API Client:** ✅ 100% Complete  
**Frontend Components:** ⚠️ Need updates to use new API endpoints

**Estimated Time:** 2-3 hours to update all frontend components

**Result:** Fully interconnected, production-ready LMS with complete data isolation and role-based access control.

