# Comprehensive System Test Report
Generated: 2025-11-23 09:58:53

## Summary
- **Total Tests**: 24
- **Passed**: 7
- **Failed**: 17
- **Success Rate**: 29.17%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 1cff1204-7c76-4c59-b36e-58bab6f3ecf4

### [PASS] - Create Batch 2 (Full Stack)
- ID: a8d01acb-9a3c-43cc-8b0b-a80786b421b8

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


