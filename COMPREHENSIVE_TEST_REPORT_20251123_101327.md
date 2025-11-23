# Comprehensive System Test Report
Generated: 2025-11-23 10:13:27

## Summary
- **Total Tests**: 24
- **Passed**: 11
- **Failed**: 13
- **Success Rate**: 45.83%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: b4d33377-233c-4d2f-823d-ee032fd76c4a

### [PASS] - Create Batch 2 (Full Stack)
- ID: 102a6e84-3da2-462d-a62e-8c3b5999f03c

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

### [PASS] - View all batches
- Found 15 batches

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


