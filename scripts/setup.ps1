# TraceMap Windows Setup Script
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  TraceMap -- Automated Setup (Windows)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify Prerequisites
Write-Host "`n[1/4] Verifying prerequisites..." -ForegroundColor Yellow

try {
    $pythonVersion = & python --version 2>&1
    Write-Host ("  [OK] Found: " + $pythonVersion) -ForegroundColor Green
} catch {
    Write-Error "Python 3.11+ is required but not found in PATH."
}

try {
    $nodeVersion = & node --version 2>&1
    Write-Host ("  [OK] Found Node: " + $nodeVersion) -ForegroundColor Green
} catch {
    Write-Error "Node.js is required but not found in PATH."
}

try {
    $npmVersion = & npm --version 2>&1
    Write-Host ("  [OK] Found npm: v" + $npmVersion) -ForegroundColor Green
} catch {
    Write-Error "npm is required but not found in PATH."
}

# 2. Setup Backend Virtual Environment
Write-Host "`n[2/4] Setting up Python backend virtual environment..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "..\backend"
$venvDir = Join-Path $backendDir ".venv"

if (-not (Test-Path $venvDir)) {
    Write-Host ("  Creating venv at " + $venvDir + "...") -ForegroundColor Gray
    & python -m venv $venvDir
}

$venvPython = Join-Path $venvDir "Scripts\python.exe"
$venvPip = Join-Path $venvDir "Scripts\pip.exe"

Write-Host "  Upgrading pip..." -ForegroundColor Gray
& $venvPython -m pip install --upgrade pip --quiet

Write-Host "  Installing backend dependencies from requirements.txt..." -ForegroundColor Gray
& $venvPip install -r (Join-Path $backendDir "requirements.txt") --quiet
Write-Host "  [OK] Backend dependencies installed successfully." -ForegroundColor Green

# 3. Setup Frontend Dependencies
Write-Host "`n[3/4] Installing frontend npm dependencies..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
Push-Location $frontendDir
try {
    & npm install
    Write-Host "  [OK] Frontend packages installed successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Initialize Database
Write-Host "`n[4/4] Initializing local SQLite database..." -ForegroundColor Yellow
$env:PYTHONPATH = $backendDir
& $venvPython -c "from app.database import init_db; init_db(); print('  [OK] Database initialized successfully.')"

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  TraceMap Setup Complete!               " -ForegroundColor Green
Write-Host "  To start the application, run:          " -ForegroundColor Green
Write-Host "    .\scripts\start.ps1                   " -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
