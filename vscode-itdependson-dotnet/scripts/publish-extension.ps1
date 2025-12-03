<#
.SYNOPSIS
Publishes the VS Code extension to the Marketplace using vsce.

.DESCRIPTION
- Ensures npm dependencies are installed.
- Ensures `vsce` CLI is available (installs locally if missing).
- Packages the extension and publishes it.
- Supports specifying version bump and dry-run.

.PARAMETER Version
Optional semver bump: major | minor | patch. If provided, runs `vsce publish <bump>`.

.PARAMETER Token
Optional Personal Access Token (PAT). If omitted, reads from environment variable `VSCE_TOKEN`.

.PARAMETER DryRun
If specified, performs packaging steps without publishing.

.NOTES
Requires a VS Code Marketplace publisher to be configured in `package.json` ("publisher": "your-publisher").
Ensure the PAT has `Publish` scope for the Marketplace.
#>
param(
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Version,
    [string]$Token,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

# Move to repo root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')
Push-Location $repoRoot

try {
    Write-Info "Repository root: $repoRoot"

    # 1) Ensure Node.js/npm present
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Err 'npm not found. Please install Node.js (https://nodejs.org/) and retry.'
        exit 1
    }

    # 2) Install root dependencies
    if (Test-Path 'package.json') {
        Write-Info 'Installing root npm dependencies'
        npm ci
    }

    # 3) Install webview dependencies if present
    if (Test-Path 'webview/package.json') {
        Write-Info 'Installing webview npm dependencies'
        Push-Location 'webview'
        npm ci
        Pop-Location
    }

    # 4) Ensure vsce available (prefer local devDependency)
    $vsceLocal = Join-Path $repoRoot 'node_modules/.bin/vsce'
    if (-not (Test-Path $vsceLocal)) {
        Write-Warn 'vsce not found locally. Installing as devDependency.'
        npm install -D vsce
    }
    $vsce = $vsceLocal
    if (-not (Test-Path $vsce)) {
        # fallback to global
        if (Get-Command vsce -ErrorAction SilentlyContinue) {
            $vsce = 'vsce'
        } else {
            Write-Err 'Failed to find or install vsce.'
            exit 1
        }
    }
    Write-Info "Using vsce: $vsce"

    # 5) Build extension assets if needed
    if (Test-Path 'package.json') {
        $pkg = Get-Content 'package.json' -Raw | ConvertFrom-Json
        if ($pkg.scripts -and $pkg.scripts.compile) {
            Write-Info 'Running build script: npm run compile'
            npm run compile
        }
    }

    # 6) Verify publisher in package.json
    $pkgJson = Get-Content 'package.json' -Raw | ConvertFrom-Json
    if (-not $pkgJson.publisher) {
        Write-Err 'package.json missing "publisher". Set your Marketplace publisher name.'
        exit 1
    }
    Write-Info "Publisher: $($pkgJson.publisher)"

    # 7) Resolve token
    if (-not $Token) {
        $Token = $env:VSCE_TOKEN
    }
    if (-not $Token -and -not $DryRun) {
        Write-Err 'No token provided. Set -Token or environment variable VSCE_TOKEN.'
        exit 1
    }

    # 8) Create package (.vsix)
    Write-Info 'Packaging extension (.vsix)'
    & $vsce package

    if ($DryRun) {
        Write-Info 'Dry run complete. Skipping publish.'
        exit 0
    }

    # 9) Publish - if Version bump specified, vsce can bump & publish in one step
    if ($Version) {
        Write-Info "Publishing with version bump: $Version"
        & $vsce publish $Version --pat $Token
    } else {
        Write-Info 'Publishing current version'
        & $vsce publish --pat $Token
    }

    Write-Info 'Publish completed successfully.'
}
catch {
    Write-Err $_
    exit 1
}
finally {
    Pop-Location
}
