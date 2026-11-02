# TraceMap Windows Shutdown Script
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Stopping TraceMap background processes..." -ForegroundColor Yellow

$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
$pidFile = Join-Path $rootDir ".tracemap.pids"

if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    foreach ($p in $pids) {
        if ($p -and $p.Trim()) {
            $procId = [int]$p.Trim()
            try {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host ("  [+] Terminated PID " + $procId) -ForegroundColor Gray
            } catch {
                # Already stopped
            }
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Also cleanup any stray uvicorn or vite processes if needed
Get-Process -Name "python", "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*uvicorn*" -or $_.CommandLine -like "*vite*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "TraceMap stopped successfully." -ForegroundColor Green
