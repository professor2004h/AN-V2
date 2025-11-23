# CREATE COMPREHENSIVE TEST DATA
# PowerShell script to create all test data via API

$API_URL = "http://localhost:3001/api"

Write-Host ""
Write-Host "Starting Test Data Creation..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Login as Admin
Write-Host "Logging in as Admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST -Body (@{
    email = "admin@apranova.com"
    password = "Admin123!"
} | ConvertTo-Json) -ContentType "application/json"

$adminToken = $loginResponse.session.access_token
Write-Host "Logged in as Admin" -ForegroundColor Green
Write-Host ""

# Step 2: Create Batches
Write-Host "Creating Test Batches..." -ForegroundColor Yellow

$batch1 = Invoke-RestMethod -Uri "$API_URL/admin/batches" -Method POST `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body (@{
        name = "Batch 2024-Q1 Data Professional"
        track = "data_professional"
        startDate = "2024-01-15"
        endDate = "2024-04-15"
        maxStudents = 30
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created batch: $($batch1.name)" -ForegroundColor Green

$batch2 = Invoke-RestMethod -Uri "$API_URL/admin/batches" -Method POST `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body (@{
        name = "Batch 2024-Q2 Full Stack"
        track = "full_stack_dev"
        startDate = "2024-04-15"
        endDate = "2024-07-15"
        maxStudents = 25
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created batch: $($batch2.name)" -ForegroundColor Green
Write-Host ""

# Step 3: Get Trainer Info
Write-Host "Getting Trainer Info..." -ForegroundColor Yellow
$trainers = Invoke-RestMethod -Uri "$API_URL/admin/trainers" `
    -Headers @{ Authorization = "Bearer $adminToken" }

$trainer = $trainers | Where-Object { $_.email -eq "trainer@apranova.com" } | Select-Object -First 1
Write-Host "Found trainer: $($trainer.full_name)" -ForegroundColor Green
Write-Host ""

# Step 4: Create Students
Write-Host "Creating Test Students..." -ForegroundColor Yellow

$student1 = Invoke-RestMethod -Uri "$API_URL/admin/students" -Method POST `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body (@{
        fullName = "Alice Johnson"
        email = "alice@apranova.com"
        password = "Student123!"
        track = "data_professional"
        batchId = $batch1.id
        trainerId = $trainer.id
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created student: Alice Johnson (alice@apranova.com)" -ForegroundColor Green

$student2 = Invoke-RestMethod -Uri "$API_URL/admin/students" -Method POST `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -Body (@{
        fullName = "Bob Smith"
        email = "bob@apranova.com"
        password = "Student123!"
        track = "full_stack_dev"
        batchId = $batch2.id
        trainerId = $trainer.id
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created student: Bob Smith (bob@apranova.com)" -ForegroundColor Green
Write-Host ""

# Step 5: Login as Trainer
Write-Host "Logging in as Trainer..." -ForegroundColor Yellow
$trainerLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST -Body (@{
    email = "trainer@apranova.com"
    password = "Trainer123!"
} | ConvertTo-Json) -ContentType "application/json"

$trainerToken = $trainerLogin.session.access_token
Write-Host "Logged in as Trainer" -ForegroundColor Green
Write-Host ""

# Step 6: Create Tasks
Write-Host "Creating Test Tasks..." -ForegroundColor Yellow

$dueDate1 = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$task1 = Invoke-RestMethod -Uri "$API_URL/tasks" -Method POST `
    -Headers @{ Authorization = "Bearer $trainerToken" } `
    -Body (@{
        title = "Complete Python Basics Module"
        description = "Learn Python fundamentals including variables, data types, loops, and functions"
        studentId = $student1.user_id
        dueDate = $dueDate1
        priority = "high"
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created task: $($task1.title) (Priority: high)" -ForegroundColor Green

$dueDate2 = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$task2 = Invoke-RestMethod -Uri "$API_URL/tasks" -Method POST `
    -Headers @{ Authorization = "Bearer $trainerToken" } `
    -Body (@{
        title = "Setup Development Environment"
        description = "Install VS Code, Python, and required libraries"
        studentId = $student1.user_id
        dueDate = $dueDate2
        priority = "medium"
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created task: $($task2.title) (Priority: medium)" -ForegroundColor Green

$dueDate3 = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$task3 = Invoke-RestMethod -Uri "$API_URL/tasks" -Method POST `
    -Headers @{ Authorization = "Bearer $trainerToken" } `
    -Body (@{
        title = "Read Course Documentation"
        description = "Review the course syllabus and learning objectives"
        studentId = $student2.user_id
        dueDate = $dueDate3
        priority = "low"
    } | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created task: $($task3.title) (Priority: low)" -ForegroundColor Green
Write-Host ""

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "TEST DATA CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan

