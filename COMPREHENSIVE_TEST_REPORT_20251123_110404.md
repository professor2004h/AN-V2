# Comprehensive System Test Report
Generated: 2025-11-23 11:04:04

## Summary
- **Total Tests**: 31
- **Passed**: 27
- **Failed**: 4
- **Success Rate**: 87.1%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: acfe34a5-720e-405a-8daa-e308f22f5f05

### [PASS] - Create Batch 2 (Full Stack)
- ID: bd10826f-0a1b-475c-8b70-33d368b94892

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
- Found 35 batches

### [PASS] - View all students
- Found 8 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 3 students

### [PASS] - View created tasks
- Found 15 tasks

### [PASS] - Alice login
- Token obtained

### [PASS] - View Alice's profile
- Profile loaded

### [PASS] - View Alice's tasks
- Found 11 tasks

### [PASS] - View Alice's projects
- Found 3 projects

### [PASS] - View Alice's notifications
- Found 1 notifications

### [PASS] - Bob login
- Token obtained

### [PASS] - View Bob's profile
- Profile loaded

### [PASS] - View Bob's tasks
- Found 4 tasks

### [FAIL] - Data isolation (Bob's tasks)
- Bob can see tasks from other students

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


