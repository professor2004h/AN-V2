# Comprehensive System Test Report
Generated: 2025-11-23 10:25:13

## Summary
- **Total Tests**: 32
- **Passed**: 23
- **Failed**: 9
- **Success Rate**: 71.88%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 08d6c93e-d6f3-4e45-89e1-bceae2b808af

### [PASS] - Create Batch 2 (Full Stack)
- ID: 08cabd74-b974-4708-b96c-d446890ac0ec

### [PASS] - Get trainer info
- Found: John Trainer

### [FAIL] - Create Student 1 (Alice)
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Create Student 2 (Bob)
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Trainer login
- Token obtained

### [FAIL] - Create Task 1 (High Priority)
- The remote server returned an error: (400) Bad Request.

### [FAIL] - Create Task 2 (Medium Priority)
- The remote server returned an error: (400) Bad Request.

### [FAIL] - Create Task 3 (Low Priority)
- The remote server returned an error: (400) Bad Request.

### [PASS] - Super Admin login
- Token obtained

### [PASS] - View system stats
- Total Students: 8

### [PASS] - View all batches
- Found 25 batches

### [PASS] - View all students
- Found 8 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 3 students

### [PASS] - View created tasks
- Found 0 tasks

### [PASS] - Alice login
- Token obtained

### [PASS] - View Alice's profile
- Profile loaded

### [PASS] - View Alice's tasks
- Found 0 tasks

### [PASS] - View Alice's projects
- Found 3 projects

### [PASS] - View Alice's notifications
- Found 0 notifications

### [PASS] - Bob login
- Token obtained

### [PASS] - View Bob's profile
- Profile loaded

### [PASS] - View Bob's tasks
- Found 0 tasks

### [FAIL] - Data isolation (Bob's tasks)
- Bob can see tasks from other students

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Provision Bob's workspace
- Workspace ID: 

### [FAIL] - Workspace isolation
- Workspaces are not properly isolated

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


