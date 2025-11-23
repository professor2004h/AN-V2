# Comprehensive Workspace Enhancement Testing Plan

**Test Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Features to Test:**
1. Auto-Save Configuration
2. Real-Time Provisioning Progress
3. Workspace Performance (First-time vs Subsequent)
4. Auto-Termination After Inactivity
5. Workspace Deletion Restrictions

---

## Test 1: Auto-Save Configuration

### Objective
Verify that Code-Server has auto-save enabled by default without requiring manual configuration.

### Steps
1. Provision a new workspace for a test student
2. Access the workspace via Code-Server
3. Create a new file in the project folder
4. Type some content
5. Wait 2 seconds without saving manually
6. Check if file is automatically saved (no asterisk/dot indicator)
7. Verify settings.json exists in workspace data directory

### Expected Results
- ✅ Auto-save is enabled immediately
- ✅ Files save automatically 1 second after typing stops
- ✅ settings.json file exists at: `workspace-data/<student-id>/.local/share/code-server/User/settings.json`
- ✅ Settings contain: `"files.autoSave": "afterDelay"` and `"files.autoSaveDelay": 1000`

---

## Test 2: Real-Time Provisioning Progress

### Objective
Verify that students see live progress updates during workspace provisioning.

### Steps
1. Login as a student who doesn't have a workspace
2. Click "Provision Workspace" button
3. Observe the progress bar and messages
4. Verify progress updates appear in real-time
5. Check that estimated time remaining is displayed
6. Confirm final "Workspace ready!" message appears

### Expected Progress Messages
- ✅ "Starting provisioning..." (0%)
- ✅ "Fetching student details..." (10%)
- ✅ "Initializing workspace..." (15%)
- ✅ "Creating workspace directory..." (20%)
- ✅ "Configuring auto-save settings..." (25%)
- ✅ "Checking Docker image..." (30%)
- ✅ "Creating Docker container..." (50%)
- ✅ "Container created successfully" (60%)
- ✅ "Starting container..." (65%)
- ✅ "Container is running" (70%)
- ✅ "Installing Python 3.11..." (75-80%)
- ✅ "Installing Node.js 20..." (85%)
- ✅ "Installing Git and development tools..." (90%)
- ✅ "Finalizing workspace..." (95%)
- ✅ "Workspace ready!" (100%)

### Expected Results
- ✅ Progress bar updates smoothly
- ✅ Estimated time remaining is shown
- ✅ Total provisioning time: 3-4 minutes
- ✅ No errors during provisioning

---

## Test 3: Workspace Performance

### Objective
Verify that first-time provisioning takes 3-4 minutes, but subsequent access is fast (<5 seconds).

### Test 3A: First-Time Provisioning
1. Provision workspace for new student
2. Measure time from "Provision Workspace" click to "Workspace ready!"
3. Expected: 3-4 minutes

### Test 3B: Subsequent Access (After Stop/Start)
1. Stop the workspace
2. Start the workspace
3. Measure time from "Start Workspace" click to "Running" status
4. Expected: <5 seconds

### Test 3C: Subsequent Access (After Container Removal)
1. Manually remove container: `docker rm -f codeserver-<student-id>`
2. Update DB status to 'stopped'
3. Start workspace again
4. Measure time
5. Expected: ~10-15 seconds (container recreation, but tools already in volume)

### Expected Results
- ✅ First-time: 3-4 minutes (includes tool installation)
- ✅ Stop/Start: <5 seconds
- ✅ Container recreation: ~10-15 seconds (no tool reinstallation)

---

## Test 4: Auto-Termination After Inactivity

### Objective
Verify that workspaces automatically stop after 15 minutes of inactivity.

### Test 4A: Inactivity Detection
1. Provision and start a workspace
2. Access the workspace (triggers heartbeat)
3. Close the Code-Server tab
4. Wait 16 minutes
5. Check workspace status in database
6. Expected: Status should be 'stopped'

### Test 4B: Heartbeat Keeps Workspace Alive
1. Provision and start a workspace
2. Keep the workspace page open (heartbeat runs every 60 seconds)
3. Wait 20 minutes
4. Check workspace status
5. Expected: Status should still be 'running'

### Test 4C: Tab Close Detection
1. Open workspace page (heartbeat starts)
2. Close the browser tab
3. Wait 16 minutes
4. Check workspace status
5. Expected: Status should be 'stopped'

### Expected Results
- ✅ Workspace stops after 15 minutes of no heartbeat
- ✅ Heartbeat keeps workspace alive when page is open
- ✅ Closing tab triggers eventual auto-stop
- ✅ Container is stopped (not deleted)
- ✅ Data is preserved

---

## Test 5: Workspace Deletion Restrictions

### Objective
Verify that students cannot delete their workspaces, only admins/trainers can.

### Test 5A: Student Cannot Delete
1. Login as a student
2. Navigate to workspace page
3. Verify "Delete Workspace" button is NOT visible
4. Attempt API call to delete endpoint
5. Expected: 403 Forbidden error

### Test 5B: Admin Can Delete
1. Login as admin
2. Navigate to student management
3. Find a student with a workspace
4. Click "Delete Workspace" for that student
5. Expected: Workspace is deleted successfully

### Test 5C: Trainer Can Delete
1. Login as trainer
2. Navigate to student management
3. Find a student with a workspace
4. Click "Delete Workspace" for that student
5. Expected: Workspace is deleted successfully

### Expected Results
- ✅ Students see NO delete button
- ✅ Students get 403 error if they try API call
- ✅ Admins can delete student workspaces
- ✅ Trainers can delete student workspaces
- ✅ Error message: "Students cannot delete workspaces. Please contact your trainer or admin."

---

## Test 6: Auto-Save Verification

### Objective
Verify auto-save works immediately without manual configuration.

### Steps
1. Provision a new workspace
2. Access Code-Server
3. Create file: `test-autosave.txt`
4. Type: "Testing auto-save feature"
5. Wait 2 seconds
6. Check file tab for unsaved indicator (should be none)
7. Close Code-Server
8. Reopen Code-Server
9. Verify file content is preserved

### Expected Results
- ✅ No manual settings configuration needed
- ✅ File saves automatically after 1 second
- ✅ No asterisk/dot on file tab
- ✅ Content persists across sessions

---

## Test 7: End-to-End Workflow

### Complete Student Journey
1. Student logs in (first time)
2. Navigates to workspace page
3. Sees "Provision Workspace" button
4. Clicks button
5. Sees real-time progress (3-4 minutes)
6. Workspace becomes available
7. Clicks "Open" to access Code-Server
8. Creates files (auto-save works)
9. Closes tab (workspace auto-stops after 15 min)
10. Returns next day
11. Clicks "Start Workspace" (<5 seconds)
12. All files are still there

### Expected Results
- ✅ Smooth onboarding experience
- ✅ Clear progress feedback
- ✅ Fast subsequent access
- ✅ Data persistence
- ✅ Auto-save works
- ✅ Auto-stop saves resources

---

## Manual Test Commands

### Check Auto-Save Settings
```powershell
# Check if settings.json exists
Get-Content "E:\AN-V2\backend\workspace-data\<student-id>\.local\share\code-server\User\settings.json"

# Expected output:
# {
#   "files.autoSave": "afterDelay",
#   "files.autoSaveDelay": 1000,
#   ...
# }
```

### Check Workspace Status
```powershell
# Query database for workspace status
npx tsx -e "
import { supabaseAdmin } from './src/lib/supabase';
const { data } = await supabaseAdmin
  .from('students')
  .select('workspace_status, workspace_last_activity')
  .eq('id', '<student-id>')
  .single();
console.log(data);
"
```

### Manually Trigger Cleanup
```powershell
# Run cleanup job manually
npx tsx -e "
import { workspaceService } from './src/services/workspaceService';
await workspaceService.cleanupWorkspaces();
"
```

### Check Container Status
```powershell
# List all workspace containers
docker ps -a | Select-String "codeserver"

# Check specific container
docker inspect codeserver-<student-id-prefix>
```

---

## Success Criteria

All tests must pass with the following results:

- ✅ Auto-save enabled by default (no manual config)
- ✅ Real-time progress display works
- ✅ First-time provisioning: 3-4 minutes
- ✅ Subsequent access: <5 seconds
- ✅ Auto-termination after 15 minutes inactivity
- ✅ Students cannot delete workspaces
- ✅ Admins/trainers can delete workspaces
- ✅ Data persists across all operations
- ✅ Heartbeat keeps workspace alive
- ✅ Tab close triggers eventual auto-stop

---

## Test Execution Log

| Test | Status | Time | Notes |
|------|--------|------|-------|
| Auto-Save Config | ⏳ Pending | - | - |
| Real-Time Progress | ⏳ Pending | - | - |
| First-Time Provisioning | ⏳ Pending | - | - |
| Subsequent Access | ⏳ Pending | - | - |
| Auto-Termination | ⏳ Pending | - | - |
| Delete Restrictions | ⏳ Pending | - | - |
| End-to-End Workflow | ⏳ Pending | - | - |

---

**Test Report will be generated after execution**
