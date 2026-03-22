param(
    [switch]$Foreground,
    [switch]$SkipHealthCheck
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI not found. Install Docker Desktop and try again."
}

if (-not (Test-Path ".env")) {
    if (-not (Test-Path ".env.example")) {
        throw ".env.example not found in repo root."
    }
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "(?m)^Auth__JwtSecret\s*=\s*$") {
    $secret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    $envContent = [Regex]::Replace(
        $envContent,
        "(?m)^Auth__JwtSecret\s*=\s*$",
        "Auth__JwtSecret=$secret"
    )
    Set-Content ".env" $envContent
    Write-Host "Generated local Auth__JwtSecret in .env"
}

# Ensure local CORS includes both API and static frontend origins.
$requiredOrigins = @(
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
)

if ($envContent -match "(?m)^Cors__AllowedOrigins\s*=\s*(.*)$") {
    $current = ($Matches[1] -split ",") | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    foreach ($origin in $requiredOrigins) {
        if ($current -notcontains $origin) {
            $current += $origin
        }
    }
    $corsLine = "Cors__AllowedOrigins=" + ($current -join ",")
    $envContent = [Regex]::Replace($envContent, "(?m)^Cors__AllowedOrigins\s*=\s*.*$", $corsLine)
} else {
    $envContent = $envContent.TrimEnd() + [Environment]::NewLine + "Cors__AllowedOrigins=" + ($requiredOrigins -join ",") + [Environment]::NewLine
}

Set-Content ".env" $envContent

$composeArgs = @("compose", "up", "--build")
if (-not $Foreground) {
    $composeArgs += "-d"
}

Write-Host "Starting local stack with Docker Compose..."
& docker @composeArgs

# Start local static frontend server on http://localhost:8080 if Python is available.
$frontendUrl = "http://localhost:8080/index.html"
$frontendReady = $false
$python = Get-Command python -ErrorAction SilentlyContinue

if ($python) {
    $existingServers = Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        Where-Object { $_.CommandLine -match "http\.server 8080" }

    foreach ($server in $existingServers) {
        if ($server.CommandLine -notmatch [Regex]::Escape($repoRoot)) {
            Stop-Process -Id $server.ProcessId
        }
    }

    $existingServers = Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        Where-Object { $_.CommandLine -match "http\.server 8080" }

    if (-not $existingServers) {
        Start-Process python -ArgumentList "-m", "http.server", "8080", "--directory", $repoRoot -WindowStyle Hidden | Out-Null
        Start-Sleep -Seconds 1
    }

    try {
        $frontendStatus = (Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 5).StatusCode
        if ($frontendStatus -eq 200) {
            $frontendReady = $true
        }
    } catch {
        $frontendReady = $false
    }
}

if ($SkipHealthCheck) {
    Write-Host "Started. Health check skipped."
    if ($frontendReady) {
        Write-Host "Frontend is available at $frontendUrl"
    } else {
        Write-Warning "Frontend on port 8080 not confirmed. If needed, run: python -m http.server 8080 --directory `"$repoRoot`""
    }
    exit 0
}

if ($Foreground) {
    Write-Host "Running in foreground. Skipping automated health check."
    exit 0
}

Write-Host "Waiting for API health check..."
for ($i = 1; $i -le 20; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 3
        if ($resp.status -eq "ok") {
            Write-Host "API is healthy at http://localhost:5000/health"
            if ($frontendReady) {
                Write-Host "Frontend is healthy at $frontendUrl"
            } else {
                Write-Warning "Frontend on port 8080 not confirmed. Open index.html directly or start: python -m http.server 8080 --directory `"$repoRoot`""
            }
            exit 0
        }
    } catch {
        Start-Sleep -Milliseconds 750
    }
}

Write-Warning "Stack started, but health check did not pass yet. Check logs: docker compose logs -f api"
exit 1
