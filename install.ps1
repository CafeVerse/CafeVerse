<#
.SYNOPSIS
    CafeVerse Installer & Updater - Downloads and runs the latest release from GitHub.

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
Write-Host "  CafeVerse Installer & Updater" -ForegroundColor Cyan
Write-Host "  ------------------------------" -ForegroundColor DarkGray
Write-Host ""

# --- Fetch latest release metadata ---
Write-Host "  -> Fetching latest release..." -ForegroundColor Yellow
$release = $null

try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ Accept = "application/vnd.github+json" }
}
catch {
    # If /releases/latest returns 404 (e.g. when releases are marked as pre-release), fall back to /releases
    try {
        $allReleasesUrl = "https://api.github.com/repos/$repo/releases"
        $releases = Invoke-RestMethod -Uri $allReleasesUrl -Headers @{ Accept = "application/vnd.github+json" }
        $release = $releases | Where-Object { -not $_.draft } | Select-Object -First 1
    }
    catch {
        Write-Host "  [X] Failed to fetch release info from GitHub." -ForegroundColor Red
        Write-Host "    $_" -ForegroundColor DarkGray
        exit 1
    }
}

if (-not $release) {
    Write-Host "  [X] No published releases found for $repo." -ForegroundColor Red
    exit 1
}

$version = $release.tag_name
Write-Host "  [+] Found $version" -ForegroundColor Green

# --- Find the NSIS .exe installer asset ---
$asset = $release.assets | Where-Object { $_.name -match '\.exe$' -and $_.name -notmatch 'blockmap' } | Select-Object -First 1

if (-not $asset) {
    Write-Host "  [X] No .exe installer found in release $version." -ForegroundColor Red
    exit 1
}

$downloadUrl = $asset.browser_download_url
$fileName = $asset.name
$fileSizeMB = [math]::Round($asset.size / 1MB, 1)
$tempDir = Join-Path $env:TEMP "CafeVerse-Install"
$installerPath = Join-Path $tempDir $fileName

Write-Host "  -> Downloading $fileName ($fileSizeMB MB)..." -ForegroundColor Yellow

# --- Download with progress bar ---
try {
    if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir -Force | Out-Null }
    
    # Use a web client for better progress reporting
    $webClient = New-Object System.Net.WebClient
    $webClient.add_DownloadProgressChanged({
        $progressPercent = [math]::Round(($_.BytesReceived / $_.TotalBytesToReceive) * 100, 1)
        Write-Progress -Activity "Downloading $fileName" -Status "$progressPercent% ($([math]::Round($_.BytesReceived / 1MB, 1))MB / $fileSizeMB MB)" -PercentComplete $progressPercent
    })
    $webClient.add_DownloadFileCompleted({
        Write-Progress -Activity "Downloading $fileName" -Completed
    })
    
    $webClient.DownloadFile($downloadUrl, $installerPath)
}
catch {
    Write-Host "  [X] Download failed." -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor DarkGray
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "  [+] Downloaded to $installerPath" -ForegroundColor Green

# --- Verify installer file ---
if (-not (Test-Path $installerPath)) {
    Write-Host "  [X] Downloaded file does not exist." -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

$fileSize = (Get-Item $installerPath).Length
if ($fileSize -lt 1MB) {
    Write-Host "  [X] Downloaded file is too small ($([math]::Round($fileSize / 1MB, 2))MB). Installation may be corrupted." -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "  [+] Installer verified ($([math]::Round($fileSize / 1MB, 1))MB)" -ForegroundColor Green

# --- Run installer ---
Write-Host "  -> Launching installer..." -ForegroundColor Yellow
try {
    Start-Process -FilePath $installerPath -Wait
}
catch {
    Write-Host "  [X] Failed to launch installer." -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor DarkGray
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

# --- Cleanup ---
Write-Host "  -> Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  [+] CafeVerse $version installed/updated successfully!" -ForegroundColor Green
Write-Host ""

exit 0
