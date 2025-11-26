# Comprehensive System Test Report
Generated: 2025-11-26 15:01:49

## Summary
- **Total Tests**: 33
- **Passed**: 31
- **Failed**: 2
- **Success Rate**: 93.94%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 1a9088b2-03dc-48fd-8c4d-bad4d7b2d56c

### [PASS] - Create Batch 2 (Full Stack)
- ID: 1bb0ea9d-3b31-4fa9-a6c0-fc117e04b708

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
- Found 43 batches

### [PASS] - View all students
- Found 8 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 3 students

### [PASS] - View created tasks
- Found 27 tasks

### [PASS] - Alice login
- Token obtained

### [PASS] - View Alice's profile
- Profile loaded (ID: 210bdd1a-8546-40db-9d99-0083c07232a8)

### [PASS] - View Alice's tasks
- Found 19 tasks

### [PASS] - Data isolation (Alice's tasks)
- Alice can only see her own tasks

### [PASS] - View Alice's projects
- Found 3 projects

### [PASS] - View Alice's notifications
- Found 8 notifications

### [PASS] - Bob login
- Token obtained

### [PASS] - View Bob's profile
- Profile loaded (ID: 0a0f8f30-48a4-486d-a166-09a7f02a5baa)

### [PASS] - View Bob's tasks
- Found 8 tasks

### [PASS] - Data isolation (Bob's tasks)
- Bob can only see his own tasks

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - Provision Bob's workspace
- Workspace ID: 0a0f8f30-48a4-486d-a166-09a7f02a5baa

### [FAIL] - Workspace isolation
- Workspaces are not properly isolated

### [PASS] - Redis container running

### [PASS] - Student workspace containers
- Found 1 workspace container(s)


