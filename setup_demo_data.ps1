# Setup Demo Data for Manual Verification
$API_URL = "http://localhost:3001/api"

function Test-ApiEndpoint {
    param (
        [string]$url,
        [string]$method = "GET",
        [hashtable]$headers = @{},
        [hashtable]$body = @{}
    )
    try {
        $params = @{
            Uri         = $url
            Method      = $method
            ContentType = "application/json"
            Headers     = $headers
        }
        if ($method -ne "GET" -and $body.Count -gt 0) {
            $params.Body = $body | ConvertTo-Json -Depth 10
        }
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# 1. Login as Admin
Write-Host "Logging in as Admin..."
$adminLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "admin@apranova.com"
    password = "Admin123!"
}
$adminToken = $adminLogin.Data.session.access_token

# 2. Get Batch ID (use the first one)
$batches = Test-ApiEndpoint -url "$API_URL/admin/batches" -headers @{ Authorization = "Bearer $adminToken" }
$batchId = $batches.Data.data[0].id

# 3. Create Student Charlie
# Write-Host "Creating Student Charlie..."
# $charlie = Test-ApiEndpoint -url "$API_URL/students" -method POST -headers @{ Authorization = "Bearer $adminToken" } -body @{
#     email    = "charlie@apranova.com"
#     password = "Student123!"
#     fullName = "Charlie Davis"
#     batchId  = $batchId
# }

# 4. Login as Trainer
Write-Host "Logging in as Trainer..."
$trainerLogin = Test-ApiEndpoint -url "$API_URL/auth/signin" -method POST -body @{
    email    = "trainer@apranova.com"
    password = "Trainer123!"
}
$trainerToken = $trainerLogin.Data.session.access_token

# Get Student IDs
$students = Test-ApiEndpoint -url "$API_URL/admin/students" -headers @{ Authorization = "Bearer $adminToken" }
$alice = $students.Data.data | Where-Object { $_.user_id -ne $null } | Where-Object { 
    $userEmail = (Test-ApiEndpoint -url "$API_URL/auth/user/$($_.user_id)" -headers @{ Authorization = "Bearer $adminToken" }).Data.email
    $userEmail -eq "alice@apranova.com"
}
$bob = $students.Data.data | Where-Object { $_.user_id -ne $null } | Where-Object {
    $userEmail = (Test-ApiEndpoint -url "$API_URL/auth/user/$($_.user_id)" -headers @{ Authorization = "Bearer $adminToken" }).Data.email
    $userEmail -eq "bob@apranova.com"
}
$charlieData = $students.Data.data | Where-Object { $_.user_id -ne $null } | Where-Object {
    $userEmail = (Test-ApiEndpoint -url "$API_URL/auth/user/$($_.user_id)" -headers @{ Authorization = "Bearer $adminToken" }).Data.email
    $userEmail -eq "charlie@apranova.com"
}

# 5. Assign Tasks
Write-Host "Assigning Tasks..."

# Task for Alice
Test-ApiEndpoint -url "$API_URL/tasks" -method POST -headers @{ Authorization = "Bearer $trainerToken" } -body @{
    title       = "Alice's Special Project"
    description = "Complete the advanced analytics module"
    studentId   = $alice.id
    dueDate     = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    priority    = "high"
}

# Task for Bob
Test-ApiEndpoint -url "$API_URL/tasks" -method POST -headers @{ Authorization = "Bearer $trainerToken" } -body @{
    title       = "Bob's Backend Challenge"
    description = "Optimize the database queries"
    studentId   = $bob.id
    dueDate     = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    priority    = "medium"
}

# Task for Charlie
Test-ApiEndpoint -url "$API_URL/tasks" -method POST -headers @{ Authorization = "Bearer $trainerToken" } -body @{
    title       = "Charlie's First Assignment"
    description = "Setup your workspace and say hello"
    studentId   = $charlieData.id
    dueDate     = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    priority    = "low"
}

Write-Host "Setup Complete!"
