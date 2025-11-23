# Comprehensive System Test Report
Generated: 2025-11-23 10:23:01

## Summary
- **Total Tests**: 28
- **Passed**: 16
- **Failed**: 12
- **Success Rate**: 57.14%

## Detailed Results
### [PASS] - Backend server is running
- Health check passed

### [PASS] - Admin login
- Token obtained

### [PASS] - Create Batch 1 (Data Professional)
- ID: 55107de8-a207-4f0a-bf1b-82b9c443b04b

### [PASS] - Create Batch 2 (Full Stack)
- ID: 706f2f5a-327a-4bab-b015-328aaf904bdb

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
- Found 23 batches

### [PASS] - View all students
- Found 7 students

### [PASS] - View all trainers
- Found 1 trainers

### [PASS] - View assigned students
- Found 2 students

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
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - Provision Alice's workspace
- The remote server returned an error: (429) Too Many Requests.

### [FAIL] - Provision Bob's workspace
- The remote server returned an error: (429) Too Many Requests.

### [PASS] - Redis container running

### [FAIL] - Student workspace containers
- Found 0 workspace container(s)


