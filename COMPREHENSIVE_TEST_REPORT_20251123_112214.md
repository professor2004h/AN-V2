# Comprehensive System Test Report
Generated: 2025-11-23 11:22:14

## Summary
- **Total Tests**: 32
- **Passed**: 29
- **Failed**: 3
- **Success Rate**: 90.62%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 369c1678-0990-4026-b594-d0017154fd1d

### [PASS] - Create Batch 2 (Full Stack)
- ID: ea993da7-1e8c-42ad-b846-1735a449b1e1

### [PASS] - Get trainer info
- Found: John Trainer

### [PASS] - Create Student 1 (Alice)
- Email: alice@apranova.com

### [PASS] - Create Student 2 (Bob)
- Email: bob@apranova.com

### [PASS] - Trainer login
- Token obtained

### [PASS] - Create Task 1 (High Priority)
- For Alice

### [PASS] - Create Task 2 (Medium Priority)
- For Alice

### [PASS] - Create Task 3 (Low Priority)
- For Bob

### [PASS] - Super Admin login
- Token obtained

### [PASS] - View system stats
- Total Students: 8

### [PASS] - View all batches
- Found 39 batches

### [PASS] - View all students
- Found 8 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 3 students

### [PASS] - View created tasks
- Found 21 tasks

### [PASS] - Alice login
- Token obtained

### [PASS] - View Alice's profile
- Profile loaded

### [PASS] - View Alice's tasks
- Found 15 tasks

### [PASS] - View Alice's projects
- Found 3 projects

### [PASS] - View Alice's notifications
- Found 3 notifications

### [PASS] - Bob login
- Token obtained

### [PASS] - View Bob's profile
- Profile loaded

### [PASS] - View Bob's tasks
- Found 6 tasks

### [FAIL] - Data isolation (Bob's tasks)
- Bob can see tasks from other students

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Provision Bob's workspace
- Workspace ID: 0a0f8f30-48a4-486d-a166-09a7f02a5baa

### [FAIL] - Workspace isolation
- Workspaces are not properly isolated

### [PASS] - Redis container running

### [PASS] - Student workspace containers
- Found 1 workspace container(s)


