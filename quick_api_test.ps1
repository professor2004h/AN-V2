# Quick API Verification Tests
$API_URL = "http://localhost:3001/api"

Write-Host "`n🧪 QUICK API TESTS`n" -ForegroundColor Cyan
Write-Host ("=" * 60)

# Test 1: Alice Login
Write-Host "`n1️⃣  Testing Alice Login..." -ForegroundColor Yellow
try {
    $aliceLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST -ContentType "application/json" -Body (@{
            email    = "alice@apranova.com"
            password = "Student123!"
        } | ConvertTo-Json)
    
    $aliceToken = $aliceLogin.session.access_token
    Write-Host "✅ Alice logged in successfully" -ForegroundColor Green
    Write-Host "   Token: $($aliceToken.Substring(0,20))..." -ForegroundColor Gray
}
catch {
    Write-Host "❌ Alice login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Alice Tasks (Data Isolation)
Write-Host "`n2️⃣  Testing Alice's Tasks (Data Isolation)..." -ForegroundColor Yellow
try {
    $aliceTasks = Invoke-RestMethod -Uri "$API_URL/students/me/tasks" -Method GET -Headers @{
        Authorization = "Bearer $aliceToken"
    }
    
    $taskTitles = $aliceTasks | ForEach-Object { $_.title }
    Write-Host "✅ Alice can access tasks" -ForegroundColor Green
    Write-Host "   Tasks seen: $($taskTitles -join ', ')" -ForegroundColor Gray
    
    if ($taskTitles -contains "Alice's Special Project") {
        Write-Host "   ✅ Alice sees her own task" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Alice CANNOT see her own task!" -ForegroundColor Red
    }
    
    $otherTasks = @("Bob's Backend Challenge", "Charlie's First Assignment")
    $seesOthers = $false
    foreach ($task in $otherTasks) {
        if ($taskTitles -contains $task) {
            Write-Host "   ❌ ISOLATION BREACH: Alice can see '$task'" -ForegroundColor Red
            $seesOthers = $true
        }
    }
    if (-not $seesOthers) {
        Write-Host "   ✅ Data isolation verified - no other students tasks visible" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Failed to get Alice's tasks: $_" -ForegroundColor Red
}

# Test 3: Alice Workspace Provision
Write-Host "`n3️⃣  Testing Alice Workspace Provisioning..." -ForegroundColor Yellow
try {
    $aliceWorkspace = Invoke-RestMethod -Uri "$API_URL/workspaces/provision" -Method POST -Headers @{
        Authorization = "Bearer $aliceToken"
    } -ContentType "application/json" -Body "{}"
    
    Write-Host "✅ Alice workspace provisioned" -ForegroundColor Green
    Write-Host "   URL: $($aliceWorkspace.url)" -ForegroundColor Gray
    Write-Host "   Status: $($aliceWorkspace.status)" -ForegroundColor Gray
}
catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Alice workspace already exists" -ForegroundColor Green
        try {
            $aliceWorkspace = Invoke-RestMethod -Uri "$API_URL/workspaces/status" -Method GET -Headers @{
                Authorization = "Bearer $aliceToken"
            }
            Write-Host "   URL: $($aliceWorkspace.url)" -ForegroundColor Gray
            Write-Host "   Status: $($aliceWorkspace.status)" -ForegroundColor Gray
        }
        catch {
            Write-Host "❌ Failed to get workspace status: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "❌ Failed to provision workspace: $_" -ForegroundColor Red
    }
}

# Test 4: Bob Login
Write-Host "`n4️⃣  Testing Bob Login and Data Isolation..." -ForegroundColor Yellow
try {
    $bobLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST -ContentType "application/json" -Body (@{
            email    = "bob@apranova.com"
            password = "Student123!"
        } | ConvertTo-Json)
    
    $bobToken = $bobLogin.session.access_token
    Write-Host "✅ Bob logged in successfully" -ForegroundColor Green
    
    $bobTasks = Invoke-RestMethod -Uri "$API_URL/students/me/tasks" -Method GET -Headers @{
        Authorization = "Bearer $bobToken"
    }
    
    $taskTitles = $bobTasks | ForEach-Object { $_.title }
    Write-Host "   Tasks seen: $($taskTitles -join ', ')" -ForegroundColor Gray
    
    if ($taskTitles -contains "Bob's Backend Challenge") {
        Write-Host "   ✅ Bob sees his own task" -ForegroundColor Green
    }
    
    $otherTasks = @("Alice's Special Project", "Charlie's First Assignment")
    $seesOthers = $false
    foreach ($task in $otherTasks) {
        if ($taskTitles -contains $task) {
            Write-Host "   ❌ ISOLATION BREACH: Bob can see '$task'" -ForegroundColor Red
            $seesOthers = $true
        }
    }
    if (-not $seesOthers) {
        Write-Host "   ✅ Bob data isolation verified" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Bob test failed: $_" -ForegroundColor Red
}

# Test 5: Charlie Login
Write-Host "`n5️⃣  Testing Charlie Login and Data Isolation..." -ForegroundColor Yellow
try {
    $charlieLogin = Invoke-RestMethod -Uri "$API_URL/auth/signin" -Method POST -ContentType "application/json" -Body (@{
            email    = "charlie@apranova.com"
            password = "Student123!"
        } | ConvertTo-Json)
    
    $charlieToken = $charlieLogin.session.access_token
    Write-Host "✅ Charlie logged in successfully" -ForegroundColor Green
    
    $charlieTasks = Invoke-RestMethod -Uri "$API_URL/students/me/tasks" -Method GET -Headers @{
        Authorization = "Bearer $charlieToken"
    }
    
    $taskTitles = $charlieTasks | ForEach-Object { $_.title }
    Write-Host "   Tasks seen: $($taskTitles -join ', ')" -ForegroundColor Gray
    
    if ($taskTitles -contains "Charlie's First Assignment") {
        Write-Host "   ✅ Charlie sees his own task" -ForegroundColor Green
    }
    
    $otherTasks = @("Alice's Special Project", "Bob's Backend Challenge")
    $seesOthers = $false
    foreach ($task in $otherTasks) {
        if ($taskTitles -contains $task) {
            Write-Host "   ❌ ISOLATION BREACH: Charlie can see '$task'" -ForegroundColor Red
            $seesOthers = $true
        }
    }
    if (-not $seesOthers) {
        Write-Host "   ✅ Charlie data isolation verified" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Charlie test failed: $_" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
Write-Host ("=" * 60)
Write-Host "`n✨ API Tests Complete!`n" -ForegroundColor Cyan
