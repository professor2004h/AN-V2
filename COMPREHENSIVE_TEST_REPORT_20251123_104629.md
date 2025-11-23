# Comprehensive System Test Report
Generated: 2025-11-23 10:46:29

## Summary
- **Total Tests**: 31
- **Passed**: 25
- **Failed**: 6
- **Success Rate**: 80.65%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: e4f26b86-d7d1-4932-b86d-6b8542f724b2

### [PASS] - Create Batch 2 (Full Stack)
- ID: b9e58d28-4141-47e8-b0eb-34e0efbfe3d8

### [PASS] - Get trainer info
- Found: John Trainer

### [PASS] - Create Student 1 (Alice)
- Email: alice@apranova.com

### [PASS] - Create Student 2 (Bob)
- Email: bob@apranova.com

### [PASS] - Trainer login
- Token obtained

### [FAIL] - Create Task 1 (High Priority)
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Create Task 2 (Medium Priority)
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Create Task 3 (Low Priority)
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Super Admin login
- Token obtained

### [PASS] - View system stats
- Total Students: 8

### [PASS] - View all batches
- Found 29 batches

### [PASS] - View all students
- Found 8 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 3 students

### [PASS] - View created tasks
- Found 3 tasks

### [PASS] - Alice login
- Token obtained

### [PASS] - View Alice's profile
- Profile loaded

### [PASS] - View Alice's tasks
- Found 2 tasks

### [PASS] - View Alice's projects
- Found 3 projects

### [PASS] - View Alice's notifications
- Found 0 notifications

### [PASS] - Bob login
- Token obtained

### [PASS] - View Bob's profile
- Profile loaded

### [PASS] - View Bob's tasks
- Found 1 tasks

### [PASS] - Data isolation (Bob's tasks)
- Bob can only see his own task

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


