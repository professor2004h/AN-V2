# Comprehensive System Test Report
Generated: 2025-11-23 10:20:45

## Summary
- **Total Tests**: 24
- **Passed**: 14
- **Failed**: 10
- **Success Rate**: 58.33%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 8a86b78b-d417-42b7-a4a2-7512313e0c6a

### [PASS] - Create Batch 2 (Full Stack)
- ID: fbd7a2b9-3221-401f-81d3-c72deaad3977

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
- Total Students: 6

### [PASS] - View all batches
- Found 21 batches

### [PASS] - View all students
- Found 6 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 1 students

### [PASS] - View created tasks
- Found 0 tasks

### [FAIL] - Alice login
- The remote server returned an error: (401) Unauthorized.

### [FAIL] - Bob login
- The remote server returned an error: (401) Unauthorized.

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (401) Unauthorized.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (401) Unauthorized.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


