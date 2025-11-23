# Comprehensive System Test Report
Generated: 2025-11-23 10:15:16

## Summary
- **Total Tests**: 29
- **Passed**: 16
- **Failed**: 13
- **Success Rate**: 55.17%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: d39af34f-592a-4e9d-9639-27d6b22b54da

### [PASS] - Create Batch 2 (Full Stack)
- ID: 3a156be6-e642-440e-84c4-7920f063fc8b

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
- Found 17 batches

### [PASS] - View all students
- Found 7 students

### [PASS] - View all trainers
- Found 1 trainers

### [FAIL] - View assigned students
- The remote server returned an error: (404) Not Found.

### [PASS] - View created tasks
- Found 0 tasks

### [PASS] - Alice login
- Token obtained

### [FAIL] - View Alice's dashboard
- The remote server returned an error: (404) Not Found.

### [PASS] - View Alice's tasks
- Found 0 tasks

### [FAIL] - View Alice's projects
- The remote server returned an error: (404) Not Found.

### [PASS] - View Alice's notifications
- Found 0 notifications

### [FAIL] - Bob login
- The remote server returned an error: (401) Unauthorized.

### [PASS] - Provision Alice's workspace
- Workspace ID: 

### [FAIL] - Check Alice's workspace status
- The remote server returned an error: (404) Not Found.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (401) Unauthorized.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


