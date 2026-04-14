$ErrorActionPreference = "Stop"

$gmCommand = Join-Path (Get-Location) "dist/cli.js"
$gmCacheDir = Join-Path (Get-Location) ".gmcache"

function Invoke-Test {
    param(
        [string]$Template,
        [string]$Target
    )

    Write-Output "=== E2E: template='$Template' target='$Target' ==="

    if (Test-Path "test-game") {
        Remove-Item -Recurse -Force "test-game"
    }

    node "$gmCommand" init --template "$Template" --name="test-game" --no-interactive --cache-dir "$gmCacheDir"
    if ($LASTEXITCODE -ne 0) { throw "init failed" }

    Set-Location "test-game"
    try {
        Write-Output "--- compile (cold) ---"
        node "$gmCommand" compile --target "$Target" --cache-dir "$gmCacheDir"
        if ($LASTEXITCODE -ne 0) { throw "compile (cold) failed" }

        Write-Output "--- compile (warm) ---"
        node "$gmCommand" compile --target "$Target" --cache-dir "$gmCacheDir"
        if ($LASTEXITCODE -ne 0) { throw "compile (warm) failed" }

        Write-Output "--- edit ---"
        node "$gmCommand" edit -C "resource list" --cache-dir "$gmCacheDir"
        if ($LASTEXITCODE -ne 0) { throw "edit failed" }
    }
    finally {
        Set-Location ..
    }

    Write-Output "=== PASSED: '$Template' / $Target ==="
}

New-Item -ItemType Directory -Force -Path ".prefabs" | Out-Null
$env:GAMEMAKER_PREFABS = (Get-Location).Path + "/.prefabs"
$env:NO_COLOR = "1"

Invoke-Test "Blank Game" "operagx"
Invoke-Test "Brick Breaker" "operagx"

if (Test-Path "test-game") {
    Remove-Item -Recurse -Force "test-game"
}
