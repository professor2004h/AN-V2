# Comprehensive System Test Report
Generated: 2025-11-23 10:49:11

## Summary
- **Total Tests**: 31
- **Passed**: 24
- **Failed**: 7
- **Success Rate**: 77.42%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 69e9b0e8-d786-41e0-8403-7642a1687daf

### [PASS] - Create Batch 2 (Full Stack)
- ID: 0a9577d8-0144-4c69-9a8e-491350deb290

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
- Found 31 batches

### [PASS] - View all students
- Found 8 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 3 students

### [PASS] - View created tasks
- Found 7 tasks

### [PASS] - Alice login
- Token obtained

### [PASS] - View Alice's profile
- Profile loaded

### [PASS] - View Alice's tasks
- Found 5 tasks

### [PASS] - View Alice's projects
- Found 3 projects

### [PASS] - View Alice's notifications
- Found 0 notifications

### [PASS] - Bob login
- Token obtained

### [PASS] - View Bob's profile
- Profile loaded

### [PASS] - View Bob's tasks
- Found 2 tasks

### [FAIL] - Data isolation (Bob's tasks)
- Bob can see tasks from other students

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


