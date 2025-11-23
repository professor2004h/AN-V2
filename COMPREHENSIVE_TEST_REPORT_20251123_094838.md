# Comprehensive System Test Report
Generated: 2025-11-23 09:48:38

## Summary
- **Total Tests**: 24
- **Passed**: 5
- **Failed**: 19
- **Success Rate**: 20.83%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [FAIL] - Create Batch 1 (Data Professional)
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Create Batch 2 (Full Stack)
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - Get trainer info
- Trainer not found

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
- The remote server returned an error: (401) Unauthorized.

### [FAIL] - View all students
- The remote server returned an error: (401) Unauthorized.

### [FAIL] - View all trainers
- The remote server returned an error: (401) Unauthorized.

### [FAIL] - View assigned students
- The remote server returned an error: (404) Not Found.

### [FAIL] - View created tasks
- The remote server returned an error: (401) Unauthorized.

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


