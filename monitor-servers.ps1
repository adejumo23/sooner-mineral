# Server monitoring script to ensure both servers stay running
param(
    [switch]$Continuous = $false
)

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

function Start-ServerIfDown {
    param([int]$Port, [string]$Command, [string]$Name)
    
    if (-not (Test-Port $Port)) {
        Write-Host "⚠️  $Name server down! Restarting..." -ForegroundColor Red
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; $Command" -WindowStyle Minimized
        Start-Sleep 3
        return $true
    }
    return $false
}

function Show-Status {
    $backendRunning = Test-Port 3001
    $frontendRunning = Test-Port 5173
    
    Write-Host "`n📊 Server Status - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    
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
    
    return ($backendRunning -and $frontendRunning)
}

# Main monitoring loop
Write-Host "🔍 Starting server monitoring..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow

try {
    do {
        $allRunning = Show-Status
        
        if (-not $allRunning) {
            # Try to restart any down servers
            Start-ServerIfDown 3001 "npm run server" "Backend"
            Start-ServerIfDown 5173 "npm run dev" "Frontend"
        }
        
        if ($Continuous) {
            Start-Sleep 30  # Check every 30 seconds
        }
    } while ($Continuous)
    
    if (-not $Continuous) {
        Show-Status
    }
}
catch {
    Write-Host "`n❌ Monitoring stopped: $($_.Exception.Message)" -ForegroundColor Red
}