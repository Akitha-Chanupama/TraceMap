# TraceMap Windows Startup Script
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting TraceMap Platform...           " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
$pidFile = Join-Path $rootDir ".tracemap.pids"

# Verify setup was run
if (-not (Test-Path $venvPython)) {
    Write-Warning "Backend virtual environment not found. Running setup first..."
    & (Join-Path $PSScriptRoot "setup.ps1")
}

# Stop any previous instances
if (Test-Path $pidFile) {
    & (Join-Path $PSScriptRoot "stop.ps1")
}

# 1. Start Backend
Write-Host "[1/3] Launching FastAPI backend on 127.0.0.1:8000..." -ForegroundColor Yellow
$backendProcess = Start-Process `
    -FilePath $venvPython `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" `
    -WorkingDirectory $backendDir `
    -PassThru `
    -WindowStyle Hidden

Write-Host "  ✓ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green

# 2. Start Frontend
Write-Host "[2/3] Launching Vite frontend on localhost:5173..." -ForegroundColor Yellow
$frontendProcess = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory $frontendDir `
    -PassThru `
    -WindowStyle Hidden

Write-Host "  ✓ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green

# Record PIDs
"$($backendProcess.Id)`n$($frontendProcess.Id)" | Out-File -FilePath $pidFile -Encoding ascii

# 3. Wait for services and open browser
Write-Host "[3/3] Waiting for backend service readiness..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 1
        if ($resp.status -eq "healthy" -or $resp.status -eq "degraded") {
            $ready = $true
            break
        }
    } catch {
        # still booting
    }
}

if ($ready) {
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host "  TraceMap is Live!                       " -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:5173         " -ForegroundColor Cyan
    Write-Host "  Backend:  http://127.0.0.1:8000/docs    " -ForegroundColor Cyan
    Write-Host "  To stop TraceMap, run:                  " -ForegroundColor White
    Write-Host "    .\scripts\stop.ps1                    " -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Green
    Start-Process "http://localhost:5173"
} else {
    Write-Warning "Backend is still starting. Check http://localhost:5173 shortly."
}

