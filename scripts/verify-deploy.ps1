param(
    [Parameter(Mandatory = $true)]
    [string]$AppUrl,

    [Parameter(Mandatory = $true)]
    [string]$BearerToken
)

$ErrorActionPreference = "Stop"

function Get-StatusCode {
    param([Parameter(Mandatory = $true)]$Exception)

    if ($Exception.PSObject.Properties.Name -contains "Response" -and $Exception.Response) {
        try {
            return [int]$Exception.Response.StatusCode
        } catch {
            try {
                return [int]$Exception.Response.StatusCode.value__
            } catch {
                return $null
            }
        }
    }

    return $null
}

$base = $AppUrl.TrimEnd("/")
$healthUrl = "$base/health"
$documentsUrl = "$base/documents"

Write-Host "Verifying deployment at: $base"
Write-Host "1) Health check: GET $healthUrl"

try {
    $health = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 20
} catch {
    Write-Error "Health check failed. Could not reach /health or API returned an error."
    exit 1
}

if (-not $health -or $health.status -ne "ok") {
    Write-Error "Health check failed. Expected response with status='ok'."
    exit 1
}

Write-Host "   OK: /health returned status=ok"
Write-Host "2) Upload check: POST $documentsUrl"

$payload = @{
    schemaVersion  = 5
    selectedCityId = "verify-city"
    cities         = @()
} | ConvertTo-Json -Depth 4

$headers = @{
    Authorization = "Bearer $BearerToken"
}

try {
    $create = Invoke-RestMethod -Method Post -Uri $documentsUrl -Headers $headers -ContentType "application/json" -Body $payload -TimeoutSec 30
} catch {
    $status = Get-StatusCode -Exception $_.Exception

    if ($status -eq 401 -or $status -eq 403) {
        Write-Error "Auth failure during POST /documents. Verify Bearer token (Auth__JwtSecret)."
        exit 1
    }

    if ($status -eq 400 -or $status -eq 413 -or $status -eq 422) {
        Write-Error "Payload rejected by POST /documents. Check JSON payload schema/content limits."
        exit 1
    }

    Write-Error "Upload check failed with unexpected API/transport error."
    exit 1
}

if (-not $create.id -or -not $create.url) {
    Write-Error "Upload check failed. Response did not include required fields: id and url."
    exit 1
}

Write-Host "   OK: created id=$($create.id)"
Write-Host "   URL: $($create.url)"
Write-Host "Deployment smoke verification PASSED."
exit 0
