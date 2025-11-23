# Apranova LMS - Start Development Servers
# This script starts both backend and frontend in development mode

Write-Host "🚀 Starting Apranova LMS Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Dependencies not installed. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Start Docker services (Redis)
Write-Host "Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d redis

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Redis started" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to start Redis (Docker may not be running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting development servers..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start both servers
npm run dev

