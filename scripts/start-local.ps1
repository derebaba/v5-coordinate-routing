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

# Check if Docker daemon is running
& docker info --format "{{.ServerVersion}}" *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker is not running. Start Docker Desktop and try again."
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

# Ensure local CORS includes API origin.
$requiredOrigins = @(
    "http://localhost:5000",
    "http://127.0.0.1:5000"
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

$frontendUrl = "http://localhost:5000/index.html"
$frontendReady = $false

if ($SkipHealthCheck) {
    Write-Host "Started. Health check skipped."
    Write-Host "Open frontend at $frontendUrl"
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
            try {
                $frontendStatus = (Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 5).StatusCode
                if ($frontendStatus -eq 200) {
                    $frontendReady = $true
                }
            } catch {
                $frontendReady = $false
            }

            if ($frontendReady) {
                Write-Host "Frontend is healthy at $frontendUrl"
            } else {
                Write-Warning "Frontend did not return 200 yet at $frontendUrl"
            }
            exit 0
        }
    } catch {
        Start-Sleep -Milliseconds 750
    }
}

Write-Warning "Stack started, but health check did not pass yet. Check logs: docker compose logs -f api"
exit 1
