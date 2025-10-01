# Quick server status check script
Write-Host "🔍 Checking Server Status..." -ForegroundColor Cyan

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

$backendRunning = Test-Port 3001
$frontendRunning = Test-Port 5173

Write-Host "`n📊 Server Status:" -ForegroundColor Cyan
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
} else {
    Write-Host "`n⚠️  Some servers are not running" -ForegroundColor Yellow
    Write-Host "Run start-servers.ps1 or start-servers.bat to start them" -ForegroundColor White
}

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
