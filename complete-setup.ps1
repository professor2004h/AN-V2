# COMPLETE SYSTEM SETUP AND DOCKER PROVISIONING SCRIPT
# This script sets up the entire system including Docker containers for student workspaces

$API_URL = "http://localhost:3001/api"
$DOCKER_NETWORK = "apranova-network"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "APRANOVA LMS - COMPLETE SYSTEM SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# STEP 1: START DOCKER SERVICES
# ============================================================================
Write-Host "[1/7] Starting Docker services..." -ForegroundColor Yellow

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "  [OK] Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "  [ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start Redis if not running
$redisRunning = docker ps --filter "name=apranova-redis" --format "{{.Names}}"
if (-not $redisRunning) {
    Write-Host "  Starting Redis container..." -ForegroundColor Cyan
    docker-compose up -d redis
    Start-Sleep -Seconds 3
    Write-Host "  [OK] Redis started" -ForegroundColor Green
}
else {
    Write-Host "  [OK] Redis already running" -ForegroundColor Green
}

# ============================================================================
# STEP 2: VERIFY BACKEND
# ============================================================================
Write-Host "`n[2/7] Verifying backend server..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health"
    Write-Host "  [OK] Backend is running on port 3001" -ForegroundColor Green
}
catch {
    Write-Host "  [ERROR] Backend is not running. Please start it with 'npm run dev' in the backend directory." -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 3: CREATE TRAINER PROFILE
# ============================================================================
Write-Host "`n[3/7] Setting up trainer profile..." -ForegroundColor Yellow

# Login as admin
$adminLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST `
    -Body (@{email = "admin@apranova.com"; password = "Admin123!" } | ConvertTo-Json) `
    -ContentType "application/json"
$adminToken = $adminLogin.session.access_token
Write-Host "  [OK] Logged in as admin" -ForegroundColor Green

# Check if trainer profile exists
$trainers = Invoke-RestMethod -Uri "$API_URL/admin/trainers" `
    -Headers @{Authorization = "Bearer $adminToken" }

if ($trainers.total -eq 0) {
    Write-Host "  Creating trainer profile..." -ForegroundColor Cyan
    
    # Get trainer user ID
    $trainerLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST `
        -Body (@{email = "trainer@apranova.com"; password = "Trainer123!" } | ConvertTo-Json) `
        -ContentType "application/json"
    
    # Create trainer profile via admin endpoint
    try {
        $newTrainer = Invoke-RestMethod -Uri "$API_URL/admin/trainers" -Method POST `
            -Headers @{Authorization = "Bearer $adminToken" } `
            -Body (@{
                fullName       = "John Trainer"
                email          = "trainer@apranova.com"
                password       = "Trainer123!"
                specialization = "Full Stack Development"
            } | ConvertTo-Json) -ContentType "application/json"
        Write-Host "  [OK] Trainer profile created" -ForegroundColor Green
    }
    catch {
        Write-Host "  [WARNING] Could not create trainer profile: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  [OK] Trainer profile already exists" -ForegroundColor Green
}

# ============================================================================
# STEP 4: CREATE TEST DATA
# ============================================================================
Write-Host "`n[4/7] Creating test data..." -ForegroundColor Yellow

# Create Batches
Write-Host "  Creating batches..." -ForegroundColor Cyan

try {
    $batch1 = Invoke-RestMethod -Uri "$API_URL/admin/batches" -Method POST `
        -Headers @{Authorization = "Bearer $adminToken" } `
        -Body (@{
            name        = "Batch 2024-Q1 Data Professional"
            track       = "data_professional"
            startDate   = "2024-01-15"
            endDate     = "2024-04-15"
            maxStudents = 30
        } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "    [OK] Created: $($batch1.name)" -ForegroundColor Green
}
catch {
    Write-Host "    [WARNING] Batch 1 may already exist" -ForegroundColor Yellow
    # Try to get existing batches
    $allBatches = Invoke-RestMethod -Uri "$API_URL/admin/batches" `
        -Headers @{Authorization = "Bearer $adminToken" }
    $batch1 = $allBatches | Where-Object { $_.name -like "*Data Professional*" } | Select-Object -First 1
}

try {
    $batch2 = Invoke-RestMethod -Uri "$API_URL/admin/batches" -Method POST `
        -Headers @{Authorization = "Bearer $adminToken" } `
        -Body (@{
            name        = "Batch 2024-Q2 Full Stack"
            track       = "full_stack_dev"
            startDate   = "2024-04-15"
            endDate     = "2024-07-15"
            maxStudents = 25
        } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "    [OK] Created: $($batch2.name)" -ForegroundColor Green
}
catch {
    Write-Host "    [WARNING] Batch 2 may already exist" -ForegroundColor Yellow
    $allBatches = Invoke-RestMethod -Uri "$API_URL/admin/batches" `
        -Headers @{Authorization = "Bearer $adminToken" }
    $batch2 = $allBatches | Where-Object { $_.name -like "*Full Stack*" } | Select-Object -First 1
}

# Get trainer info
$trainers = Invoke-RestMethod -Uri "$API_URL/admin/trainers" `
    -Headers @{Authorization = "Bearer $adminToken" }
$trainer = $trainers.trainers | Select-Object -First 1

if (-not $trainer) {
    Write-Host "  [ERROR] No trainer found. Cannot create students." -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Using trainer: $($trainer.full_name)" -ForegroundColor Green

# Create Students
Write-Host "  Creating students..." -ForegroundColor Cyan

try {
    $student1 = Invoke-RestMethod -Uri "$API_URL/admin/students" -Method POST `
        -Headers @{Authorization = "Bearer $adminToken" } `
        -Body (@{
            fullName  = "Alice Johnson"
            email     = "alice@apranova.com"
            password  = "Student123!"
            track     = "data_professional"
            batchId   = $batch1.id
            trainerId = $trainer.id
        } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "    [OK] Created: Alice Johnson" -ForegroundColor Green
}
catch {
    Write-Host "    [WARNING] Alice may already exist" -ForegroundColor Yellow
}

try {
    $student2 = Invoke-RestMethod -Uri "$API_URL/admin/students" -Method POST `
        -Headers @{Authorization = "Bearer $adminToken" } `
        -Body (@{
            fullName  = "Bob Smith"
            email     = "bob@apranova.com"
            password  = "Student123!"
            track     = "full_stack_dev"
            batchId   = $batch2.id
            trainerId = $trainer.id
        } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "    [OK] Created: Bob Smith" -ForegroundColor Green
}
catch {
    Write-Host "    [WARNING] Bob may already exist" -ForegroundColor Yellow
}

# ============================================================================
# STEP 5: CREATE TASKS
# ============================================================================
Write-Host "`n[5/7] Creating tasks..." -ForegroundColor Yellow

$trainerLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST `
    -Body (@{email = "trainer@apranova.com"; password = "Trainer123!" } | ConvertTo-Json) `
    -ContentType "application/json"
$trainerToken = $trainerLogin.session.access_token

# Get students
$students = Invoke-RestMethod -Uri "$API_URL/admin/students" `
    -Headers @{Authorization = "Bearer $adminToken" }

$alice = $students.students | Where-Object { $_.email -eq "alice@apranova.com" } | Select-Object -First 1
$bob = $students.students | Where-Object { $_.email -eq "bob@apranova.com" } | Select-Object -First 1

if ($alice) {
    try {
        $dueDate1 = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $task1 = Invoke-RestMethod -Uri "$API_URL/tasks" -Method POST `
            -Headers @{Authorization = "Bearer $trainerToken" } `
            -Body (@{
                title       = "Complete Python Basics Module"
                description = "Learn Python fundamentals"
                studentId   = $alice.user_id
                dueDate     = $dueDate1
                priority    = "high"
            } | ConvertTo-Json) -ContentType "application/json"
        Write-Host "  [OK] Created task for Alice (High Priority)" -ForegroundColor Green
    }
    catch {
        Write-Host "  [WARNING] Could not create task for Alice" -ForegroundColor Yellow
    }
}

if ($bob) {
    try {
        $dueDate2 = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        $task2 = Invoke-RestMethod -Uri "$API_URL/tasks" -Method POST `
            -Headers @{Authorization = "Bearer $trainerToken" } `
            -Body (@{
                title       = "Read Course Documentation"
                description = "Review the course syllabus"
                studentId   = $bob.user_id
                dueDate     = $dueDate2
                priority    = "low"
            } | ConvertTo-Json) -ContentType "application/json"
        Write-Host "  [OK] Created task for Bob (Low Priority)" -ForegroundColor Green
    }
    catch {
        Write-Host "  [WARNING] Could not create task for Bob" -ForegroundColor Yellow
    }
}

# ============================================================================
# STEP 6: PROVISION DOCKER WORKSPACES
# ============================================================================
Write-Host "`n[6/7] Provisioning Docker workspaces for students..." -ForegroundColor Yellow

# Function to create workspace container
function New-StudentWorkspace {
    param(
        [string]$studentId,
        [string]$studentName,
        [string]$studentEmail
    )
    
    $containerName = "workspace-$studentId"
    $port = Get-Random -Minimum 8100 -Maximum 8200
    
    # Check if container already exists
    $existing = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
    
    if ($existing) {
        Write-Host "  [INFO] Workspace for $studentName already exists, starting it..." -ForegroundColor Cyan
        docker start $containerName | Out-Null
        Write-Host "  [OK] Workspace started for $studentName" -ForegroundColor Green
        return
    }
    
    Write-Host "  Creating workspace for $studentName..." -ForegroundColor Cyan
    
    # Create workspace container
    docker run -d `
        --name $containerName `
        --network $DOCKER_NETWORK `
        -p "${port}:8080" `
        -e "PASSWORD=Student123!" `
        -e "SUDO_PASSWORD=Student123!" `
        -e "STUDENT_ID=$studentId" `
        -e "STUDENT_EMAIL=$studentEmail" `
        -v "workspace-${studentId}:/home/coder/project" `
        codercom/code-server:latest | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Workspace created for $studentName on port $port" -ForegroundColor Green
        Write-Host "      URL: http://localhost:$port" -ForegroundColor Gray
    }
    else {
        Write-Host "  [ERROR] Failed to create workspace for $studentName" -ForegroundColor Red
    }
}

# Create workspaces for Alice and Bob
if ($alice) {
    New-StudentWorkspace -studentId $alice.user_id -studentName "Alice Johnson" -studentEmail "alice@apranova.com"
}

if ($bob) {
    New-StudentWorkspace -studentId $bob.user_id -studentName "Bob Smith" -studentEmail "bob@apranova.com"
}

# ============================================================================
# STEP 7: VERIFICATION
# ============================================================================
Write-Host "`n[7/7] Verifying system setup..." -ForegroundColor Yellow

# Check Docker containers
$containers = docker ps --format "{{.Names}}"
$redisRunning = $containers -match "apranova-redis"
$workspaceCount = ($containers -match "workspace-").Count

Write-Host "  Docker Containers:" -ForegroundColor Cyan
Write-Host "    Redis: $(if ($redisRunning) { '[RUNNING]' } else { '[NOT RUNNING]' })" -ForegroundColor $(if ($redisRunning) { 'Green' } else { 'Red' })
Write-Host "    Student Workspaces: $workspaceCount" -ForegroundColor $(if ($workspaceCount -gt 0) { 'Green' } else { 'Yellow' })

# Check database records
$batches = Invoke-RestMethod -Uri "$API_URL/admin/batches" -Headers @{Authorization = "Bearer $adminToken" }
$students = Invoke-RestMethod -Uri "$API_URL/admin/students" -Headers @{Authorization = "Bearer $adminToken" }
$trainers = Invoke-RestMethod -Uri "$API_URL/admin/trainers" -Headers @{Authorization = "Bearer $adminToken" }

Write-Host "`n  Database Records:" -ForegroundColor Cyan
Write-Host "    Batches: $($batches.total)" -ForegroundColor Green
Write-Host "    Students: $($students.total)" -ForegroundColor Green
Write-Host "    Trainers: $($trainers.total)" -ForegroundColor Green

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nSystem is ready for testing. You can now:" -ForegroundColor White
Write-Host "  1. Login as Admin: admin@apranova.com / Admin123!" -ForegroundColor Gray
Write-Host "  2. Login as Trainer: trainer@apranova.com / Trainer123!" -ForegroundColor Gray
Write-Host "  3. Login as Alice: alice@apranova.com / Student123!" -ForegroundColor Gray
Write-Host "  4. Login as Bob: bob@apranova.com / Student123!" -ForegroundColor Gray
Write-Host "`nDocker Workspaces:" -ForegroundColor White
Write-Host "  - Check running containers: docker ps" -ForegroundColor Gray
Write-Host "  - Access workspaces via the URLs shown above" -ForegroundColor Gray
Write-Host "`n"
