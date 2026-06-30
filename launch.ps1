# Cyber-Deck launcher - dev, release, audio spike
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

function Write-Banner {
    Write-Host ""
    Write-Host "  +==================================+" -ForegroundColor Cyan
    Write-Host "  |     VISUAL-CORE-77 LAUNCHER      |" -ForegroundColor Cyan
    Write-Host "  +==================================+" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Toolchain {
    $ok = $true
    foreach ($tool in @("node", "npm", "cargo")) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            Write-Host "  [X] $tool introuvable dans le PATH" -ForegroundColor Red
            $ok = $false
        }
    }
    if (-not $ok) {
        Write-Host ""
        Write-Host "  Installe Node.js + Rust, puis relance." -ForegroundColor Yellow
        Read-Host "  Entree pour quitter"
        exit 1
    }
}

function Ensure-Npm {
    if (-not (Test-Path "$Root\node_modules")) {
        Write-Host '  >> npm install...' -ForegroundColor DarkGray
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install a echoue" }
    }
}

function Start-Dev {
    Write-Host '  >> Mode DEV (hot reload, logs console)' -ForegroundColor Green
    Write-Host "    Ctrl+C pour arreter" -ForegroundColor DarkGray
    Write-Host ""
    Ensure-Npm
    npm run dev
}

function Start-Release {
    $exe = "$Root\src-tauri\target\release\cyber-deck.exe"
    if (-not (Test-Path $exe)) {
        Write-Host "  Build release introuvable." -ForegroundColor Yellow
        $build = Read-Host "  Lancer npm run build maintenant ? (O/n)"
        if ($build -eq "" -or $build -match "^[oOyY]") {
            Ensure-Npm
            npm run build
            if ($LASTEXITCODE -ne 0) { throw "build a echoue" }
        } else {
            return
        }
    }
    if (-not (Test-Path $exe)) {
        Write-Host "  [X] $exe toujours absent" -ForegroundColor Red
        return
    }
    Write-Host '  >> Lancement release: cyber-deck.exe' -ForegroundColor Green
    Start-Process -FilePath $exe -WorkingDirectory $Root
}

function Start-DebugExe {
    $exe = "$Root\src-tauri\target\debug\cyber-deck.exe"
    if (-not (Test-Path $exe)) {
        Write-Host "  Binaire debug absent - compilation..." -ForegroundColor Yellow
        Push-Location "$Root\src-tauri"
        cargo build
        Pop-Location
        if ($LASTEXITCODE -ne 0) { throw "cargo build a echoue" }
    }
    Write-Host '  >> Lancement debug: cyber-deck.exe' -ForegroundColor Green
    Start-Process -FilePath $exe -WorkingDirectory $Root
}

function Start-AudioSpike {
    Write-Host '  >> Audio spike CLI (WASAPI loopback + vumetre)' -ForegroundColor Green
    Write-Host "    Lance de la musique. Ctrl+C pour quitter." -ForegroundColor DarkGray
    Write-Host ""
    Push-Location "$Root\audio-spike"
    cargo run --release
    Pop-Location
}

function Show-Menu {
    Write-Banner
    Write-Host "  [1] DEV          - npm run dev (recommande pour tester)" -ForegroundColor White
    Write-Host "  [2] RELEASE      - binaire compile (prod)" -ForegroundColor White
    Write-Host "  [3] DEBUG EXE    - binaire debug sans npm" -ForegroundColor White
    Write-Host "  [4] AUDIO SPIKE  - test loopback seul (terminal)" -ForegroundColor White
    Write-Host "  [5] BUILD        - npm run build (installeur + exe)" -ForegroundColor White
    Write-Host "  [Q] Quitter" -ForegroundColor DarkGray
    Write-Host ""
}

Test-Toolchain

if ($args.Count -gt 0) {
    switch ($args[0].ToLower()) {
        "dev"     { Start-Dev; exit 0 }
        "release" { Start-Release; exit 0 }
        "debug"   { Start-DebugExe; exit 0 }
        "audio"   { Start-AudioSpike; exit 0 }
        "build"   { Ensure-Npm; npm run build; exit 0 }
        default   { Write-Host "Usage: launch.ps1 [dev|release|debug|audio|build]"; exit 1 }
    }
}

while ($true) {
    Show-Menu
    $choice = Read-Host "  Choix"
    switch ($choice.ToUpper()) {
        "1" { Start-Dev; break }
        "2" { Start-Release }
        "3" { Start-DebugExe }
        "4" { Start-AudioSpike }
        "5" { Ensure-Npm; npm run build }
        "Q" { break }
        default { Write-Host "  Choix invalide." -ForegroundColor Yellow }
    }
    Write-Host ""
}
