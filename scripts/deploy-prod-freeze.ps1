param(
    [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[frontend-prod-freeze] $Message"
}

if (-not $AllowDirty) {
    $status = git status --porcelain
    if ($status) {
        Write-Error "Working tree is dirty. Deploy from a clean checkout or pass -AllowDirty intentionally."
    }
}

Write-Step "running upload freeze gate"
npm run freeze:upload
if ($LASTEXITCODE -ne 0) {
    throw "upload freeze gate failed"
}

Write-Step "deploying Cloudflare Worker"
npx wrangler deploy
if ($LASTEXITCODE -ne 0) {
    throw "wrangler deploy failed"
}

Write-Step "OK"
