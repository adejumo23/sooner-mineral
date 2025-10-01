# Keep servers running script
Write-Host "🚀 Ensuring servers stay running..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to start server if not running
function Ensure-ServerRunning {
    param([int]$Port, [string]$Command, [string]$Name)
    
    if (-not (Test-Port $Port)) {
        Write-Host "⚠️  $Name server not running on port $Port. Starting..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; $Command" -WindowStyle Minimized
        Start-Sleep 3
        return $true
    } else {
        Write-Host "✅ $Name server already running on port $Port" -ForegroundColor Green
        return $false
    }
}

# Check and start servers if needed
$backendStarted = Ensure-ServerRunning 3001 "npm run server" "Backend"
$frontendStarted = Ensure-ServerRunning 5173 "npm run dev" "Frontend"

# Wait a moment for servers to start
if ($backendStarted -or $frontendStarted) {
    Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
    Start-Sleep 5
}

# Final status check
Write-Host "`n📊 Final Server Status:" -ForegroundColor Cyan
$backendRunning = Test-Port 3001
$frontendRunning = Test-Port 5173

if ($backendRunning) {
    Write-Host "✅ Backend (API):  http://localhost:3001 - RUNNING" -ForegroundColor Green
} else {
    Write-Host "❌ Backend (API):  http://localhost:3001 - NOT RUNNING" -ForegroundColor Red
}

if ($frontendRunning) {
    Write-Host "✅ Frontend (UI):  http://localhost:5173 - RUNNING" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend (UI):  http://localhost:5173 - NOT RUNNING" -ForegroundColor Red
}

if ($backendRunning -and $frontendRunning) {
    Write-Host "`n🎉 All servers are running!" -ForegroundColor Green
    Write-Host "🌐 Open http://localhost:5173 in your browser" -ForegroundColor White
    Write-Host "🔗 API available at http://localhost:3001/api" -ForegroundColor White
} else {
    Write-Host "`n⚠️  Some servers failed to start" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
