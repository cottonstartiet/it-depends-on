#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build script to create a VSIX package for the ItDependsOn VS Code extension.

.DESCRIPTION
    This script performs the following steps:
    1. Installs dependencies for both the main extension and webview
    2. Compiles the TypeScript code
    3. Builds the webview React application
    4. Packages everything into a VSIX file

.PARAMETER Clean
    If specified, cleans the dist and out directories before building.

.PARAMETER SkipInstall
    If specified, skips the npm install step (useful for CI/CD when dependencies are cached).

.EXAMPLE
    .\scripts\build-vsix.ps1
    
.EXAMPLE
    .\scripts\build-vsix.ps1 -Clean
    
.EXAMPLE
    .\scripts\build-vsix.ps1 -SkipInstall
#>

param(
    [switch]$Clean,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

# Get the script's directory and navigate to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ItDependsOn VSIX Build Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Clean if requested
if ($Clean) {
    Write-Host "[1/6] Cleaning build directories..." -ForegroundColor Yellow
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
    if (Test-Path "webview/dist") { Remove-Item -Recurse -Force "webview/dist" }
    if (Test-Path "*.vsix") { Remove-Item -Force "*.vsix" }
    Write-Host "  Clean completed." -ForegroundColor Green
} else {
    Write-Host "[1/6] Skipping clean (use -Clean flag to enable)" -ForegroundColor Gray
}

# Install dependencies
if (-not $SkipInstall) {
    Write-Host ""
    Write-Host "[2/6] Installing main extension dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to install main dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Main dependencies installed." -ForegroundColor Green

    Write-Host ""
    Write-Host "[3/6] Installing webview dependencies..." -ForegroundColor Yellow
    Set-Location webview
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to install webview dependencies" -ForegroundColor Red
        exit 1
    }
    Set-Location $ProjectRoot
    Write-Host "  Webview dependencies installed." -ForegroundColor Green
} else {
    Write-Host "[2/6] Skipping main dependency install (--SkipInstall)" -ForegroundColor Gray
    Write-Host "[3/6] Skipping webview dependency install (--SkipInstall)" -ForegroundColor Gray
}

# Compile extension TypeScript
Write-Host ""
Write-Host "[4/6] Compiling extension TypeScript..." -ForegroundColor Yellow
npm run compile:extension
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to compile extension" -ForegroundColor Red
    exit 1
}
Write-Host "  Extension compiled successfully." -ForegroundColor Green

# Build webview
Write-Host ""
Write-Host "[5/6] Building webview React application..." -ForegroundColor Yellow
npm run compile:webview
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to build webview" -ForegroundColor Red
    exit 1
}
Write-Host "  Webview built successfully." -ForegroundColor Green

# Package VSIX
Write-Host ""
Write-Host "[6/6] Packaging VSIX..." -ForegroundColor Yellow
npx vsce package
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to create VSIX package" -ForegroundColor Red
    exit 1
}
Write-Host "  VSIX package created successfully." -ForegroundColor Green

# Find and display the created VSIX file
$VsixFile = Get-ChildItem -Path $ProjectRoot -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($VsixFile) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  Build Complete!" -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  VSIX file: $($VsixFile.Name)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($VsixFile.Length / 1KB, 2)) KB" -ForegroundColor White
    Write-Host "  Path: $($VsixFile.FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "  To install:" -ForegroundColor Yellow
    Write-Host "    code --install-extension $($VsixFile.Name)" -ForegroundColor White
    Write-Host ""
}