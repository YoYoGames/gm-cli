$ErrorActionPreference = "Stop"

$gmCommand = Join-Path (Get-Location) "dist/cli.js"
$gmCacheDir = Join-Path (Get-Location) ".gmcache"

function Invoke-Test {
    param(
        [string]$Template,
        [string]$Target,
        [string]$Toolchain = ""
    )

    Write-Output "=== E2E: template='$Template' target='$Target' toolchain='$(if ($Toolchain) { $Toolchain } else { "default" })' ==="

    if (Test-Path "test-game") {
        Remove-Item -Recurse -Force "test-game"
    }

    node "$gmCommand" init --template "$Template" --name="test-game" --no-interactive --cache-dir "$gmCacheDir"
    if ($LASTEXITCODE -ne 0) { throw "init failed" }

    $compileArgs = @("--target", $Target, "--cache-dir", $gmCacheDir)
    if ($Toolchain) {
        $compileArgs += @("--toolchain", $Toolchain)
    }

    Set-Location "test-game"
    try {
        Write-Output "--- compile (cold) ---"
        node "$gmCommand" compile @compileArgs
        if ($LASTEXITCODE -ne 0) { throw "compile (cold) failed" }

        Write-Output "--- compile (warm) ---"
        node "$gmCommand" compile @compileArgs
        if ($LASTEXITCODE -ne 0) { throw "compile (warm) failed" }

        Write-Output "--- resourcetool ---"
        node "$gmCommand" resourcetool eval "resource list" --cache-dir "$gmCacheDir"
        if ($LASTEXITCODE -ne 0) { throw "resourcetool failed" }
    }
    finally {
        Set-Location ..
    }

    Write-Output "=== PASSED: '$Template' / $Target / toolchain='$(if ($Toolchain) { $Toolchain } else { "default" })' ==="
}

$env:NO_COLOR = "1"

Invoke-Test "Blank Game" "operagx"

# The platformer game is a good tests since it makes use of prefabs
Invoke-Test "Platformer" "operagx"

# Make sure windows target works too!
Invoke-Test "Blank Game" "windows"

# Also test gmrt on windows
Invoke-Test "Blank Game" "windows" "gmrt"

if (Test-Path "test-game") {
    Remove-Item -Recurse -Force "test-game"
}
