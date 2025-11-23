# Comprehensive System Test Report
Generated: 2025-11-23 10:17:09

## Summary
- **Total Tests**: 29
- **Passed**: 17
- **Failed**: 12
- **Success Rate**: 58.62%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 47dbbf5b-12c4-4ead-91b5-27239c4da016

### [PASS] - Create Batch 2 (Full Stack)
- ID: bb5495fb-5753-49c7-b5d7-fca9178bf0b2

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
- Total Students: 7

### [PASS] - View all batches
- Found 19 batches

### [PASS] - View all students
- Found 7 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 1 students

### [PASS] - View created tasks
- Found 0 tasks

### [PASS] - Alice login
- Token obtained

### [FAIL] - View Alice's profile
- The remote server returned an error: (404) Not Found.

### [FAIL] - View Alice's tasks
- The remote server returned an error: (404) Not Found.

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


