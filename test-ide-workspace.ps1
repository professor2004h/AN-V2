# IDE Workspace Testing Script
# Run this after deploying the changes

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   IDE WORKSPACE FIX - TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuration
$ALB_DNS = "apranova-lms-alb-1990266756.us-east-1.elb.amazonaws.com"
$STUDENT_ID = "43bb6f91-f607-487a-90f5-614266d1f94d"
$WORKSPACE_URL = "http://$ALB_DNS/api/proxy/workspace/$STUDENT_ID"

Write-Host "Testing workspace access..." -ForegroundColor Yellow
Write-Host "Student ID: $STUDENT_ID" -ForegroundColor Gray
Write-Host "Workspace URL: $WORKSPACE_URL`n" -ForegroundColor Gray

# Test 1: Check if workspace is accessible (should not require auth header)
Write-Host "[Test 1] Checking workspace endpoint (no auth)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $WORKSPACE_URL -Method GET -ErrorAction Stop
    Write-Host "✓ Workspace endpoint accessible" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Gray
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✗ Still requires authentication (401)" -ForegroundColor Red
        Write-Host "  This means the proxy fix hasn't been deployed yet" -ForegroundColor Red
    }
    elseif ($statusCode -eq 403) {
        Write-Host "✗ Workspace not running (403)" -ForegroundColor Yellow
        Write-Host "  Start the workspace first from the UI" -ForegroundColor Yellow
    }
    elseif ($statusCode -eq 502) {
        Write-Host "✗ Cannot connect to workspace (502)" -ForegroundColor Red
        Write-Host "  Check if ECS task is running" -ForegroundColor Red
    }
    else {
        Write-Host "✗ Unexpected error: $statusCode" -ForegroundColor Red
        Write-Host "  $_" -ForegroundColor Gray
    }
}

Write-Host "`n[Test 2] Checking backend health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://$ALB_DNS/api/health" -Method GET -ErrorAction Stop
    $health = $healthResponse.Content | ConvertFrom-Json
    Write-Host "✓ Backend is healthy" -ForegroundColor Green
    Write-Host "  Environment: $($health.environment)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Backend health check failed" -ForegroundColor Red
}

Write-Host "`n[Test 3] Checking ECS cluster..." -ForegroundColor Yellow
try {
    $clusters = aws ecs list-clusters --output json | ConvertFrom-Json
    if ($clusters.clusterArns.Count -gt 0) {
        Write-Host "✓ ECS cluster exists" -ForegroundColor Green
        Write-Host "  Clusters: $($clusters.clusterArns.Count)" -ForegroundColor Gray
    }
    else {
        Write-Host "✗ No ECS clusters found" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ Failed to check ECS clusters" -ForegroundColor Red
}

Write-Host "`n[Test 4] Checking code-server tasks..." -ForegroundColor Yellow
try {
    $tasks = aws ecs list-tasks --cluster apranova-lms-cluster --family apranova-lms-code-server --output json | ConvertFrom-Json
    if ($tasks.taskArns.Count -gt 0) {
        Write-Host "✓ Code-server tasks running" -ForegroundColor Green
        Write-Host "  Active tasks: $($tasks.taskArns.Count)" -ForegroundColor Gray
        
        # Get task details
        $taskArn = $tasks.taskArns[0]
        $taskDetails = aws ecs describe-tasks --cluster apranova-lms-cluster --tasks $taskArn --output json | ConvertFrom-Json
        $task = $taskDetails.tasks[0]
        Write-Host "  Status: $($task.lastStatus)" -ForegroundColor Gray
        
        # Get private IP
        $ipDetail = $task.attachments[0].details | Where-Object { $_.name -eq "privateIPv4Address" }
        if ($ipDetail) {
            Write-Host "  Private IP: $($ipDetail.value)" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "⚠ No code-server tasks running" -ForegroundColor Yellow
        Write-Host "  Provision a workspace from the UI first" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "✗ Failed to check code-server tasks" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. If Test 1 shows 401 error:" -ForegroundColor Yellow
Write-Host "   - Deploy backend changes: git push" -ForegroundColor Gray
Write-Host "   - Wait for GitHub Actions to complete" -ForegroundColor Gray

Write-Host "`n2. If Test 1 shows 403 error:" -ForegroundColor Yellow
Write-Host "   - Login to the app as a student" -ForegroundColor Gray
Write-Host "   - Go to 'My Workspace'" -ForegroundColor Gray
Write-Host "   - Click 'Provision Workspace'" -ForegroundColor Gray

Write-Host "`n3. If Test 1 shows 502 error:" -ForegroundColor Yellow
Write-Host "   - Check ECS task is running" -ForegroundColor Gray
Write-Host "   - Check security groups allow port 8080" -ForegroundColor Gray
Write-Host "   - Check ECS task logs for errors" -ForegroundColor Gray

Write-Host "`n4. If Test 1 succeeds:" -ForegroundColor Yellow
Write-Host "   - Open workspace URL in browser" -ForegroundColor Gray
Write-Host "   - Enter password: workspace" -ForegroundColor Gray
Write-Host "   - Verify IDE loads correctly" -ForegroundColor Gray
Write-Host "   - Create a test file and verify auto-save" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan
