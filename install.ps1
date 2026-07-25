<#
.SYNOPSIS
    CaféVerse Installer & Updater - Downloads and runs the latest release from GitHub.

.DESCRIPTION
    This script fetches the latest CafeVerse release from GitHub Releases,
    downloads the NSIS installer (.exe), and launches it.
    Run it again at any time to update to the latest version.

.EXAMPLE
    iwr -useb https://raw.githubusercontent.com/cafeverse/cafeverse/main/install.ps1 | iex
#>

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$repo = "CafeVerse/CafeVerse"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"

Write-Host ""
Write-Host "  ☕ CaféVerse Installer & Updater" -ForegroundColor Cyan
Write-Host "  ──────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# --- Fetch latest release metadata ---
Write-Host "  → Fetching latest release..." -ForegroundColor Yellow
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ Accept = "application/vnd.github+json" }
} catch {
    Write-Host "  ✗ Failed to fetch release info from GitHub." -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor DarkGray
    exit 1
}

$version = $release.tag_name
Write-Host "  ✓ Found $version" -ForegroundColor Green

# --- Find the NSIS .exe installer asset ---
$asset = $release.assets | Where-Object { $_.name -match '\.exe$' -and $_.name -notmatch 'blockmap' } | Select-Object -First 1

if (-not $asset) {
    Write-Host "  ✗ No .exe installer found in release $version." -ForegroundColor Red
    exit 1
}

$downloadUrl = $asset.browser_download_url
$fileName = $asset.name
$fileSizeMB = [math]::Round($asset.size / 1MB, 1)
$tempDir = Join-Path $env:TEMP "CafeVerse-Install"
$installerPath = Join-Path $tempDir $fileName

Write-Host "  → Downloading $fileName ($fileSizeMB MB)..." -ForegroundColor Yellow

# --- Download ---
try {
    if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir -Force | Out-Null }
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
} catch {
    Write-Host "  ✗ Download failed." -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor DarkGray
    exit 1
}

Write-Host "  ✓ Downloaded to $installerPath" -ForegroundColor Green

# --- Run installer ---
Write-Host "  → Launching installer..." -ForegroundColor Yellow
try {
    Start-Process -FilePath $installerPath -Wait
} catch {
    Write-Host "  ✗ Failed to launch installer." -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor DarkGray
    exit 1
}

# --- Cleanup ---
Write-Host "  → Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  ✓ CaféVerse $version installed/updated successfully! ☕" -ForegroundColor Green
Write-Host ""
