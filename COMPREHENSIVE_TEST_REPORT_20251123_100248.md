# Comprehensive System Test Report
Generated: 2025-11-23 10:02:48

## Summary
- **Total Tests**: 24
- **Passed**: 8
- **Failed**: 16
- **Success Rate**: 33.33%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: ac782eab-fe41-46e8-9b3f-34dd049e126f

### [PASS] - Create Batch 2 (Full Stack)
- ID: 480d1ed0-db36-46c9-b673-167bef555ee6

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
- The remote server returned an error: (500) Internal Server Error.

### [FAIL] - View all students
- The remote server returned an error: (500) Internal Server Error.

### [PASS] - View all trainers
- Found  trainers

### [FAIL] - View assigned students
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - View created tasks
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - Alice login
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - Bob login
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (429) Too Many Requests.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


