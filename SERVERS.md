# Server Management for Sooner Mineral Application

## Current Status
✅ **Both servers are running:**
- Backend (API): http://localhost:3001 - PID 10760
- Frontend (UI): http://localhost:5173 - PID 26924

## Quick Commands

### Check Server Status
```powershell
.\server-status.ps1
```

### Start Servers (if not running)
```powershell
# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server"

# Frontend  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
```

### Check Ports
```powershell
netstat -ano | Select-String ":3001|:5173"
```

### Check Node.js Processes
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

## Server Details

### Backend Server (Port 3001)
- **Command**: `npm run server`
- **File**: `server-with-db.js`
- **Database**: MySQL (soonermineraldb)
- **Health Check**: http://localhost:3001/api/health

### Frontend Server (Port 5173)
- **Command**: `npm run dev`
- **Framework**: Vite + React
- **URL**: http://localhost:5173

## Troubleshooting

If servers stop running:
1. Check if ports are in use: `netstat -ano | Select-String ":3001|:5173"`
2. Check Node.js processes: `Get-Process | Where-Object {$_.ProcessName -like "*node*"}`
3. Restart servers using the commands above
4. Check for errors in the server console windows

## Database Connection
- **Host**: localhost
- **Port**: 3359
- **Database**: soonermineraldb
- **User**: soonermineral
- **Password**: soonermineralpass

## API Endpoints
- Health: http://localhost:3001/api/health
- Tracts: http://localhost:3001/api/tracts
- Users: http://localhost:3001/api/users
- Units: http://localhost:3001/api/units
- Pricing: http://localhost:3001/api/pricing/oklahoma
