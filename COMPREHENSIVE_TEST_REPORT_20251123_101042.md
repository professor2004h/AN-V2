# Comprehensive System Test Report
Generated: 2025-11-23 10:10:42

## Summary
- **Total Tests**: 24
- **Passed**: 10
- **Failed**: 14
- **Success Rate**: 41.67%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: ed8d4cd3-9d93-44c1-aca3-b9d5aaac5d83

### [PASS] - Create Batch 2 (Full Stack)
- ID: 9d610722-c975-48fc-84b2-b5cab5d1a94e

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

### [FAIL] - View all users
- The remote server returned an error: (404) Not Found.

### [FAIL] - View all batches
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - View all students
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - View all trainers
- Found 1 trainers

### [FAIL] - View assigned students
- The remote server returned an error: (404) Not Found.

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


