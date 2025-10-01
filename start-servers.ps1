# PowerShell script to start both servers and keep them running
# This script will start the backend and frontend servers and monitor them

Write-Host "🚀 Starting Sooner Mineral Application Servers..." -ForegroundColor Green

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

# Function to start backend server
function Start-BackendServer {
    Write-Host "📡 Starting backend server on port 3001..." -ForegroundColor Yellow
    
    if (Test-Port 3001) {
        Write-Host "✅ Backend server already running on port 3001" -ForegroundColor Green
        return
    }
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server" -WindowStyle Normal
    Write-Host "✅ Backend server started" -ForegroundColor Green
}

# Function to start frontend server
function Start-FrontendServer {
    Write-Host "🌐 Starting frontend server on port 5173..." -ForegroundColor Yellow
    
    if (Test-Port 5173) {
        Write-Host "✅ Frontend server already running on port 5173" -ForegroundColor Green
        return
    }
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
    Write-Host "✅ Frontend server started" -ForegroundColor Green
}

# Function to monitor servers
function Monitor-Servers {
    Write-Host "🔍 Monitoring servers..." -ForegroundColor Cyan
    
    while ($true) {
        $backendRunning = Test-Port 3001
        $frontendRunning = Test-Port 5173
        
        if (-not $backendRunning) {
            Write-Host "⚠️  Backend server down! Restarting..." -ForegroundColor Red
            Start-BackendServer
            Start-Sleep 5
        }
        
        if (-not $frontendRunning) {
            Write-Host "⚠️  Frontend server down! Restarting..." -ForegroundColor Red
            Start-FrontendServer
            Start-Sleep 5
        }
        
        if ($backendRunning -and $frontendRunning) {
            Write-Host "✅ Both servers running - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
        }
        
        Start-Sleep 30  # Check every 30 seconds
    }
}

# Main execution
try {
    # Start both servers
    Start-BackendServer
    Start-Sleep 3
    Start-FrontendServer
    Start-Sleep 3
    
    # Display status
    Write-Host "`n📊 Server Status:" -ForegroundColor Cyan
    Write-Host "Backend (API):  http://localhost:3001" -ForegroundColor White
    Write-Host "Frontend (UI):  http://localhost:5173" -ForegroundColor White
    Write-Host "Health Check:   http://localhost:3001/api/health" -ForegroundColor White
    
    Write-Host "`n🔍 Starting server monitoring..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
    
    # Start monitoring
    Monitor-Servers
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
