# COMPREHENSIVE SYSTEM TESTING SCRIPT
# This script performs complete end-to-end testing of the Apranova LMS

$API_URL = "http://localhost:3001/api"

# Color codes for output
$SUCCESS_COLOR = "Green"
$ERROR_COLOR = "Red"
$INFO_COLOR = "Cyan"
$WARNING_COLOR = "Yellow"

# Test results tracking
$testResults = @{
    Passed   = 0
    Failed   = 0
    Warnings = 0
    Tests    = @()
}

function Write-TestHeader {
    param([string]$title)
    Write-Host "`n" -NoNewline
    Write-Host "=" * 80 -ForegroundColor $INFO_COLOR
    Write-Host " $title" -ForegroundColor $INFO_COLOR
    Write-Host "=" * 80 -ForegroundColor $INFO_COLOR
}

function Write-TestResult {
    param(
        [string]$testName,
        [bool]$passed,
        [string]$message = ""
    )
    
    if ($passed) {
        Write-Host "[PASS] $testName" -ForegroundColor $SUCCESS_COLOR
        if ($message) { Write-Host "  -> $message" -ForegroundColor Gray }
        $testResults.Passed++
    }
    else {
        Write-Host "[FAIL] $testName" -ForegroundColor $ERROR_COLOR
        if ($message) { Write-Host "  -> $message" -ForegroundColor $ERROR_COLOR }
        $testResults.Failed++
    }
    
    $testResults.Tests += @{
        Name    = $testName
        Passed  = $passed
        Message = $message
    }
}

function Test-ApiEndpoint {
    param(
        [string]$url,
        [string]$method = "GET",
        [hashtable]$headers = @{},
        [object]$body = $null
    )
    
    try {
        $params = @{
            Uri         = $url
            Method      = $method
            Headers     = $headers
            ContentType = "application/json"
        }
        
        if ($body) {
            $params.Body = ($body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ============================================================================
# STEP 1: VERIFY BACKEND SERVER
# ============================================================================
Write-TestHeader "STEP 1: VERIFY BACKEND SERVER"

Write-Host "Checking backend health endpoint..." -ForegroundColor $INFO_COLOR
$healthCheck = Test-ApiEndpoint -url "http://localhost:3001/health"

if ($healthCheck.Success) {
    Write-TestResult "Backend server is running" $true "Health check passed"
}
else {
    Write-TestResult "Backend server is running" $false "Health check failed: $($healthCheck.Error)"
    Write-Host "`nERROR: Backend server is not responding. Please start it with 'npm run dev' in the backend directory." -ForegroundColor $ERROR_COLOR
    exit 1
}

# ============================================================================
# STEP 2: CREATE TEST DATA
# ============================================================================
Write-TestHeader "STEP 2: CREATE TEST DATA"

Write-Host "Logging in as Admin..." -ForegroundColor $INFO_COLOR
$adminLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "admin@apranova.com"
    password = "Admin123!"
}

if (-not $adminLogin.Success) {
    Write-TestResult "Admin login" $false $adminLogin.Error
    Write-Host "`nERROR: Cannot proceed without admin access." -ForegroundColor $ERROR_COLOR
    exit 1
}

$adminToken = $adminLogin.Data.session.access_token
Write-TestResult "Admin login" $true "Token obtained"

# Create Batches
Write-Host "`nCreating test batches..." -ForegroundColor $INFO_COLOR

$batch1 = Test-ApiEndpoint -url "$API_URL/admin/batches" -method POST `
    -headers @{ Authorization = "Bearer $adminToken" } `
    -body @{
    name        = "Batch 2024-Q1 Data Professional"
    track       = "data_professional"
    startDate   = "2024-01-15"
    endDate     = "2024-04-15"
    maxStudents = 30
}

if ($batch1.Success) {
    Write-TestResult "Create Batch 1 (Data Professional)" $true "ID: $($batch1.Data.id)"
}
else {
    Write-TestResult "Create Batch 1 (Data Professional)" $false $batch1.Error
}

$batch2 = Test-ApiEndpoint -url "$API_URL/admin/batches" -method POST `
    -headers @{ Authorization = "Bearer $adminToken" } `
    -body @{
    name        = "Batch 2024-Q2 Full Stack"
    track       = "full_stack_dev"
    startDate   = "2024-04-15"
    endDate     = "2024-07-15"
    maxStudents = 25
}

if ($batch2.Success) {
    Write-TestResult "Create Batch 2 (Full Stack)" $true "ID: $($batch2.Data.id)"
}
else {
    Write-TestResult "Create Batch 2 (Full Stack)" $false $batch2.Error
}

# Get Trainer
Write-Host "`nGetting trainer information..." -ForegroundColor $INFO_COLOR
$trainers = Test-ApiEndpoint -url "$API_URL/admin/trainers" `
    -headers @{ Authorization = "Bearer $adminToken" }

if ($trainers.Success) {
    # Handle nested structure: { trainers: [...], total: ... }
    $trainerList = if ($trainers.Data.trainers) { $trainers.Data.trainers } else { $trainers.Data }
    
    $trainer = $trainerList | Where-Object { $_.profile.email -eq "trainer@apranova.com" } | Select-Object -First 1
    if ($trainer) {
        Write-TestResult "Get trainer info" $true "Found: $($trainer.profile.full_name)"
    }
    else {
        Write-TestResult "Get trainer info" $false "Trainer not found"
    }
}
else {
    Write-TestResult "Get trainer info" $false $trainers.Error
}

# Create Students
Write-Host "`nCreating test students..." -ForegroundColor $INFO_COLOR

$student1 = Test-ApiEndpoint -url "$API_URL/admin/students" -method POST `
    -headers @{ Authorization = "Bearer $adminToken" } `
    -body @{
    fullName  = "Alice Johnson"
    email     = "alice@apranova.com"
    password  = "Student123!"
    track     = "data_professional"
    batchId   = $batch1.Data.id
    trainerId = $trainer.id
}

if ($student1.Success) {
    Write-TestResult "Create Student 1 (Alice)" $true "Email: alice@apranova.com"
}
else {
    Write-TestResult "Create Student 1 (Alice)" $false $student1.Error
}

$student2 = Test-ApiEndpoint -url "$API_URL/admin/students" -method POST `
    -headers @{ Authorization = "Bearer $adminToken" } `
    -body @{
    fullName  = "Bob Smith"
    email     = "bob@apranova.com"
    password  = "Student123!"
    track     = "full_stack_dev"
    batchId   = $batch2.Data.id
    trainerId = $trainer.id
}

if ($student2.Success) {
    Write-TestResult "Create Student 2 (Bob)" $true "Email: bob@apranova.com"
}
else {
    Write-TestResult "Create Student 2 (Bob)" $false $student2.Error
}

# ============================================================================
# STEP 3: CREATE TASKS AS TRAINER
# ============================================================================
Write-TestHeader "STEP 3: CREATE TASKS AS TRAINER"

Write-Host "Logging in as Trainer..." -ForegroundColor $INFO_COLOR
$trainerLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "trainer@apranova.com"
    password = "Trainer123!"
}

if ($trainerLogin.Success) {
    $trainerToken = $trainerLogin.Data.session.access_token
    Write-TestResult "Trainer login" $true "Token obtained"
}
else {
    Write-TestResult "Trainer login" $false $trainerLogin.Error
}

Write-Host "`nCreating tasks..." -ForegroundColor $INFO_COLOR

$dueDate1 = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$task1 = Test-ApiEndpoint -url "$API_URL/tasks" -method POST `
    -headers @{ Authorization = "Bearer $trainerToken" } `
    -body @{
    title       = "Complete Python Basics Module"
    description = "Learn Python fundamentals including variables, data types, loops, and functions"
    studentId   = $student1.Data.id
    dueDate     = $dueDate1
    priority    = "high"
}

if ($task1.Success) {
    Write-TestResult "Create Task 1 (High Priority)" $true "For Alice"
}
else {
    Write-TestResult "Create Task 1 (High Priority)" $false $task1.Error
}

$dueDate2 = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$task2 = Test-ApiEndpoint -url "$API_URL/tasks" -method POST `
    -headers @{ Authorization = "Bearer $trainerToken" } `
    -body @{
    title       = "Setup Development Environment"
    description = "Install VS Code, Python, and required libraries"
    studentId   = $student1.Data.id
    dueDate     = $dueDate2
    priority    = "medium"
}

if ($task2.Success) {
    Write-TestResult "Create Task 2 (Medium Priority)" $true "For Alice"
}
else {
    Write-TestResult "Create Task 2 (Medium Priority)" $false $task2.Error
}

$dueDate3 = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$task3 = Test-ApiEndpoint -url "$API_URL/tasks" -method POST `
    -headers @{ Authorization = "Bearer $trainerToken" } `
    -body @{
    title       = "Read Course Documentation"
    description = "Review the course syllabus and learning objectives"
    studentId   = $student2.Data.id
    dueDate     = $dueDate3
    priority    = "low"
}

if ($task3.Success) {
    Write-TestResult "Create Task 3 (Low Priority)" $true "For Bob"
}
else {
    Write-TestResult "Create Task 3 (Low Priority)" $false $task3.Error
}

# ============================================================================
# STEP 4: TEST SUPER ADMIN FEATURES
# ============================================================================
Write-TestHeader "STEP 4: TEST SUPER ADMIN FEATURES"

Write-Host "Logging in as Super Admin..." -ForegroundColor $INFO_COLOR
$superAdminLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "superadmin@apranova.com"
    password = "SuperAdmin123!"
}

if ($superAdminLogin.Success) {
    $superAdminToken = $superAdminLogin.Data.session.access_token
    Write-TestResult "Super Admin login" $true "Token obtained"
    
    # Test system analytics access
    Write-Host "`nTesting Super Admin features..." -ForegroundColor $INFO_COLOR
    
    # Test viewing system stats
    $stats = Test-ApiEndpoint -url "$API_URL/admin/stats" `
        -headers @{ Authorization = "Bearer $superAdminToken" }
    
    if ($stats.Success) {
        Write-TestResult "View system stats" $true "Total Students: $($stats.Data.totalStudents)"
    }
    else {
        Write-TestResult "View system stats" $false $stats.Error
    }
}
else {
    Write-TestResult "Super Admin login" $false $superAdminLogin.Error
}

# ============================================================================
# STEP 5: TEST ADMIN FEATURES
# ============================================================================
Write-TestHeader "STEP 5: TEST ADMIN FEATURES"

Write-Host "Testing Admin CRUD operations..." -ForegroundColor $INFO_COLOR

# View all batches
$allBatches = Test-ApiEndpoint -url "$API_URL/admin/batches" `
    -headers @{ Authorization = "Bearer $adminToken" }

if ($allBatches.Success) {
    $count = if ($allBatches.Data.total) { $allBatches.Data.total } else { $allBatches.Data.Count }
    Write-TestResult "View all batches" $true "Found $count batches"
}
else {
    Write-TestResult "View all batches" $false $allBatches.Error
}

# View all students
$allStudents = Test-ApiEndpoint -url "$API_URL/admin/students" `
    -headers @{ Authorization = "Bearer $adminToken" }

if ($allStudents.Success) {
    $count = if ($allStudents.Data.total) { $allStudents.Data.total } else { $allStudents.Data.Count }
    Write-TestResult "View all students" $true "Found $count students"
}
else {
    Write-TestResult "View all students" $false $allStudents.Error
}

# View all trainers
$allTrainers = Test-ApiEndpoint -url "$API_URL/admin/trainers" `
    -headers @{ Authorization = "Bearer $adminToken" }

if ($allTrainers.Success) {
    $count = if ($allTrainers.Data.total) { $allTrainers.Data.total } else { $allTrainers.Data.Count }
    Write-TestResult "View all trainers" $true "Found $count trainers"
}
else {
    Write-TestResult "View all trainers" $false $allTrainers.Error
}

# ============================================================================
# STEP 6: TEST TRAINER FEATURES
# ============================================================================
Write-TestHeader "STEP 6: TEST TRAINER FEATURES"

Write-Host "Testing Trainer features..." -ForegroundColor $INFO_COLOR

# View assigned students
$assignedStudents = Test-ApiEndpoint -url "$API_URL/trainers/me/students" `
    -headers @{ Authorization = "Bearer $trainerToken" }

if ($assignedStudents.Success) {
    $count = if ($assignedStudents.Data.Count) { $assignedStudents.Data.Count } else { $assignedStudents.Data.Length }
    Write-TestResult "View assigned students" $true "Found $count students"
}
else {
    Write-TestResult "View assigned students" $false $assignedStudents.Error
}

# View tasks
$trainerTasks = Test-ApiEndpoint -url "$API_URL/tasks" `
    -headers @{ Authorization = "Bearer $trainerToken" }

if ($trainerTasks.Success) {
    $count = if ($trainerTasks.Data.Count) { $trainerTasks.Data.Count } else { $trainerTasks.Data.Length }
    Write-TestResult "View created tasks" $true "Found $count tasks"
}
else {
    Write-TestResult "View created tasks" $false $trainerTasks.Error
}

# ============================================================================
# STEP 7: TEST STUDENT FEATURES (ALICE)
# ============================================================================
Write-TestHeader "STEP 7: TEST STUDENT FEATURES (ALICE)"

Write-Host "Logging in as Alice..." -ForegroundColor $INFO_COLOR
$aliceLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "alice@apranova.com"
    password = "Student123!"
}

if ($aliceLogin.Success) {
    $aliceToken = $aliceLogin.Data.session.access_token
    Write-TestResult "Alice login" $true "Token obtained"
    
    # View profile (dashboard)
    $aliceProfile = Test-ApiEndpoint -url "$API_URL/students/me" `
        -headers @{ Authorization = "Bearer $aliceToken" }
    
    if ($aliceProfile.Success) {
        Write-TestResult "View Alice's profile" $true "Profile loaded"
    }
    else {
        Write-TestResult "View Alice's profile" $false $aliceProfile.Error
    }
    
    # View tasks
    $aliceTasks = Test-ApiEndpoint -url "$API_URL/students/me/tasks" `
        -headers @{ Authorization = "Bearer $aliceToken" }
    
    if ($aliceTasks.Success) {
        $count = if ($aliceTasks.Data.Count) { $aliceTasks.Data.Count } else { $aliceTasks.Data.Length }
        Write-TestResult "View Alice's tasks" $true "Found $count tasks"
    }
    else {
        Write-TestResult "View Alice's tasks" $false $aliceTasks.Error
    }
    
    # View projects
    $aliceProjects = Test-ApiEndpoint -url "$API_URL/students/me/projects" `
        -headers @{ Authorization = "Bearer $aliceToken" }
    
    if ($aliceProjects.Success) {
        $count = if ($aliceProjects.Data.Count) { $aliceProjects.Data.Count } else { $aliceProjects.Data.Length }
        Write-TestResult "View Alice's projects" $true "Found $count projects"
    }
    else {
        Write-TestResult "View Alice's projects" $false $aliceProjects.Error
    }
    
    # View notifications
    $aliceNotifications = Test-ApiEndpoint -url "$API_URL/notifications" `
        -headers @{ Authorization = "Bearer $aliceToken" }
    
    if ($aliceNotifications.Success) {
        $count = if ($aliceNotifications.Data.Count) { $aliceNotifications.Data.Count } else { $aliceNotifications.Data.Length }
        Write-TestResult "View Alice's notifications" $true "Found $count notifications"
    }
    else {
        Write-TestResult "View Alice's notifications" $false $aliceNotifications.Error
    }
}
else {
    Write-TestResult "Alice login" $false $aliceLogin.Error
}

# ============================================================================
# STEP 8: TEST STUDENT FEATURES (BOB)
# ============================================================================
Write-TestHeader "STEP 8: TEST STUDENT FEATURES (BOB)"

Write-Host "Logging in as Bob..." -ForegroundColor $INFO_COLOR
$bobLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "bob@apranova.com"
    password = "Student123!"
}

if ($bobLogin.Success) {
    $bobToken = $bobLogin.Data.session.access_token
    Write-TestResult "Bob login" $true "Token obtained"
    
    # View profile (dashboard)
    $bobProfile = Test-ApiEndpoint -url "$API_URL/students/me" `
        -headers @{ Authorization = "Bearer $bobToken" }
    
    if ($bobProfile.Success) {
        Write-TestResult "View Bob's profile" $true "Profile loaded"
    }
    else {
        Write-TestResult "View Bob's profile" $false $bobProfile.Error
    }
    
    # View tasks
    $bobTasks = Test-ApiEndpoint -url "$API_URL/students/me/tasks" `
        -headers @{ Authorization = "Bearer $bobToken" }
    
    if ($bobTasks.Success) {
        $count = if ($bobTasks.Data.Count) { $bobTasks.Data.Count } else { $bobTasks.Data.Length }
        Write-TestResult "View Bob's tasks" $true "Found $count tasks"
        
        # Verify data isolation - All tasks should belong to Bob
        $otherStudentTasks = $bobTasks.Data | Where-Object { $_.student_id -ne $bobStudentId }
        
        if ($otherStudentTasks.Count -eq 0) {
            Write-TestResult "Data isolation (Bob's tasks)" $true "Bob can only see his own tasks"
        }
        else {
            Write-Host "DEBUG: Bob Student ID: $bobStudentId" -ForegroundColor Yellow
            $bobTasks.Data | ForEach-Object { Write-Host "Task Student ID: $($_.student_id)" -ForegroundColor Yellow }
            Write-TestResult "Data isolation (Bob's tasks)" $false "Bob can see tasks from other students"
        }
    }
    else {
        Write-TestResult "View Bob's tasks" $false $bobTasks.Error
    }
}
else {
    Write-TestResult "Bob login" $false $bobLogin.Error
}

# ============================================================================
# STEP 9: TEST DOCKER WORKSPACE PROVISIONING
# ============================================================================
Write-TestHeader "STEP 9: TEST DOCKER WORKSPACE PROVISIONING"

Write-Host "Testing workspace provisioning for Alice..." -ForegroundColor $INFO_COLOR

# Provision workspace for Alice
$aliceWorkspace = Test-ApiEndpoint -url "$API_URL/workspaces/provision" -method POST `
    -headers @{ Authorization = "Bearer $aliceToken" }

if ($aliceWorkspace.Success) {
    Write-TestResult "Provision Alice's workspace" $true "Workspace ID: $($aliceWorkspace.Data.id)"
    
    # Wait for workspace to start
    Write-Host "Waiting for workspace to start..." -ForegroundColor $INFO_COLOR
    Start-Sleep -Seconds 10
    
    # Check workspace status
    $aliceWorkspaceStatus = Test-ApiEndpoint -url "$API_URL/workspaces/$($aliceWorkspace.Data.id)" `
        -headers @{ Authorization = "Bearer $aliceToken" }
    
    if ($aliceWorkspaceStatus.Success) {
        Write-TestResult "Check Alice's workspace status" $true "Status: $($aliceWorkspaceStatus.Data.status)"
    }
    else {
        Write-TestResult "Check Alice's workspace status" $false $aliceWorkspaceStatus.Error
    }
}
else {
    Write-TestResult "Provision Alice's workspace" $false $aliceWorkspace.Error
}

Write-Host "`nTesting workspace provisioning for Bob..." -ForegroundColor $INFO_COLOR

# Provision workspace for Bob
$bobWorkspace = Test-ApiEndpoint -url "$API_URL/workspaces/provision" -method POST `
    -headers @{ Authorization = "Bearer $bobToken" }

if ($bobWorkspace.Success) {
    Write-TestResult "Provision Bob's workspace" $true "Workspace ID: $($bobWorkspace.Data.id)"
    
    # Verify workspace isolation
    if ($aliceWorkspace.Success -and $aliceWorkspace.Data.id -ne $bobWorkspace.Data.id) {
        Write-TestResult "Workspace isolation" $true "Alice and Bob have separate workspaces"
    }
    else {
        Write-TestResult "Workspace isolation" $false "Workspaces are not properly isolated"
    }
}
else {
    Write-TestResult "Provision Bob's workspace" $false $bobWorkspace.Error
}

# ============================================================================
# STEP 10: VERIFY DOCKER CONTAINERS
# ============================================================================
Write-TestHeader "STEP 10: VERIFY DOCKER CONTAINERS"

Write-Host "Checking Docker containers..." -ForegroundColor $INFO_COLOR

try {
    $dockerContainers = docker ps --format "{{.Names}}" | Out-String
    
    if ($dockerContainers -match "apranova-redis") {
        Write-TestResult "Redis container running" $true
    }
    else {
        Write-TestResult "Redis container running" $false "Redis container not found"
    }
    
    # Check for student workspace containers
    $workspaceContainers = docker ps --filter "name=codeserver-" --format "{{.Names}}" | Out-String
    $workspaceCount = ($workspaceContainers -split "`n" | Where-Object { $_ }).Count
    
    Write-TestResult "Student workspace containers" ($workspaceCount -gt 0) "Found $workspaceCount workspace container(s)"
}
catch {
    Write-TestResult "Docker verification" $false "Error checking Docker: $($_.Exception.Message)"
}

# ============================================================================
# FINAL REPORT
# ============================================================================
Write-TestHeader "COMPREHENSIVE TEST REPORT"

Write-Host "`nTest Summary:" -ForegroundColor $INFO_COLOR
Write-Host "  Total Tests: $($testResults.Passed + $testResults.Failed)" -ForegroundColor White
Write-Host "  Passed: $($testResults.Passed)" -ForegroundColor $SUCCESS_COLOR
Write-Host "  Failed: $($testResults.Failed)" -ForegroundColor $ERROR_COLOR

$successRate = [math]::Round(($testResults.Passed / ($testResults.Passed + $testResults.Failed)) * 100, 2)
Write-Host "  Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { $SUCCESS_COLOR } elseif ($successRate -ge 70) { $WARNING_COLOR } else { $ERROR_COLOR })

Write-Host "`nDetailed Results:" -ForegroundColor $INFO_COLOR
foreach ($test in $testResults.Tests) {
    $status = if ($test.Passed) { "[PASS]" } else { "[FAIL]" }
    $color = if ($test.Passed) { $SUCCESS_COLOR } else { $ERROR_COLOR }
    Write-Host "  $status $($test.Name)" -ForegroundColor $color
    if ($test.Message) {
        Write-Host "    -> $($test.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor $INFO_COLOR
Write-Host "Testing completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor $INFO_COLOR
Write-Host "=" * 80 -ForegroundColor $INFO_COLOR

# Save report to file
$reportPath = "e:\AN-V2\COMPREHENSIVE_TEST_REPORT_$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
$reportContent = @"
# Comprehensive System Test Report
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Summary
- **Total Tests**: $($testResults.Passed + $testResults.Failed)
- **Passed**: $($testResults.Passed)
- **Failed**: $($testResults.Failed)
- **Success Rate**: $successRate%

## Detailed Results

"@

foreach ($test in $testResults.Tests) {
    $status = if ($test.Passed) { "[PASS]" } else { "[FAIL]" }
    $reportContent += "### $status - $($test.Name)`n"
    if ($test.Message) {
        $reportContent += "- $($test.Message)`n"
    }
    $reportContent += "`n"
}

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "`nReport saved to: $reportPath" -ForegroundColor $SUCCESS_COLOR
