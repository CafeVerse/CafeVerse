#!/usr/bin/env bash
# CafeVerse Installer & Updater for Linux
# Downloads the latest release from GitHub Releases and runs or installs the best Linux asset.
# Usage: curl -sL https://raw.githubusercontent.com/CafeVerse/CafeVerse/main/install.sh | bash

set -euo pipefail

REPO="CafeVerse/CafeVerse"
API_LATEST="https://api.github.com/repos/$REPO/releases/latest"
API_RELEASES="https://api.github.com/repos/$REPO/releases"
TMPDIR="/tmp/CafeVerse-Install"
mkdir -p "$TMPDIR"

echo
echo "  CafeVerse Installer & Updater"
echo "  ------------------------------"
echo

echo "  -> Fetching latest release..."
# Try /releases/latest first
release_json=""
if command -v curl >/dev/null 2>&1; then
  release_json=$(curl -sSL -H "Accept: application/vnd.github+json" "$API_LATEST" || true)
else
  if command -v wget >/dev/null 2>&1; then
    release_json=$(wget -qO- --header="Accept: application/vnd.github+json" "$API_LATEST" || true)
  else
    echo "  [X] Neither curl nor wget is available. Please install one and retry." >&2
    exit 1
  fi
fi

# Python helper to pick a Linux-friendly asset (AppImage, .deb, .tar.gz) and print url,name,size
pick_asset() {
  if ! command -v python3 >/dev/null 2>&1; then
    echo ""; return 1
  fi
  python3 - <<'PY'
import sys, json
try:
  data = json.load(sys.stdin)
except Exception:
  sys.exit(2)

def choose(rel):
  assets = rel.get('assets', [])
  assets = [a for a in assets if 'blockmap' not in a.get('name','').lower()]
  prefer = ['.appimage', '.deb', '.tar.gz', '.zip']
  # Try preferred extensions in order
  for ext in prefer:
    for a in assets:
      if ext in a.get('name','').lower():
        print(a['browser_download_url'])
        print(a['name'])
        print(a['size'])
        return 0
  # fallback: first non-empty asset
  if assets:
    a = assets[0]
    print(a['browser_download_url'])
    print(a['name'])
    print(a['size'])
    return 0
  return 1

if isinstance(data, list):
  for r in data:
    if not r.get('draft'):
      if choose(r) == 0:
        sys.exit(0)
  sys.exit(1)
else:
  sys.exit(choose(data))
PY
}

asset_info=""
if [ -n "${release_json:-}" ]; then
  asset_info=$(printf "%s" "$release_json" | pick_asset) || true
fi

if [ -z "${asset_info:-}" ]; then
  # Fallback: fetch releases list and pick first non-draft
  echo "  -> Fallback: querying releases list..."
  if command -v curl >/dev/null 2>&1; then
    release_json=$(curl -sSL -H "Accept: application/vnd.github+json" "$API_RELEASES")
  else
    release_json=$(wget -qO- --header="Accept: application/vnd.github+json" "$API_RELEASES")
  fi
  asset_info=$(printf "%s" "$release_json" | pick_asset) || true
fi

if [ -z "${asset_info:-}" ]; then
  echo "  [X] Failed to locate a downloadable release asset for $REPO." >&2
  exit 1
fi

# read the three lines printed by the python helper: url, name, size
download_url=$(printf "%s" "$asset_info" | sed -n '1p')
file_name=$(printf "%s" "$asset_info" | sed -n '2p')
file_size_bytes=$(printf "%s" "$asset_info" | sed -n '3p')

if [ -z "$download_url" ] || [ -z "$file_name" ]; then
  echo "  [X] Invalid asset metadata." >&2
  exit 1
fi

file_size_mb=$(awk "BEGIN {printf \"%.1f\", $file_size_bytes/1024/1024}")
installer_path="$TMPDIR/$file_name"

echo "  [+] Found asset: $file_name ($file_size_mb MB)"
echo "  -> Downloading $file_name..."

# Download with curl or wget, showing progress
if command -v curl >/dev/null 2>&1; then
  curl -L --progress-bar -o "$installer_path" "$download_url"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$installer_path" "$download_url"
fi

# Verify download
if [ ! -f "$installer_path" ]; then
  echo "  [X] Download failed." >&2
  rm -rf "$TMPDIR" || true
  exit 1
fi

actual_size=$(stat -c%s "$installer_path" 2>/dev/null || stat -f%z "$installer_path" 2>/dev/null || echo 0)
if [ "$actual_size" -lt 1048576 ]; then
  echo "  [X] Downloaded file is too small ($(awk "BEGIN {printf \"%.2f\", $actual_size/1024/1024}") MB). Installation may be corrupted." >&2
  rm -rf "$TMPDIR" || true
  exit 1
fi

echo "  [+] Downloaded to $installer_path"

# Decide how to handle the asset based on the filename
lower_name=$(printf "%s" "$file_name" | tr '[:upper:]' '[:lower:]')

run_and_cleanup() {
  echo "  -> Running: $*"
  "$@"
  ret=$?
  rm -rf "$TMPDIR" || true
  exit $ret
}

if [[ "$lower_name" == *.appimage ]]; then
  chmod +x "$installer_path"
  echo "  -> Launching AppImage..."
  "$installer_path" || { echo "  [X] Failed to run AppImage." >&2; exit 1; }
  echo "  [+] AppImage executed (it may have installed or run the app)."
  rm -rf "$TMPDIR" || true
  exit 0
elif [[ "$lower_name" == *.deb ]]; then
  echo "  -> Installing .deb (requires sudo)..."
  if command -v sudo >/dev/null 2>&1; then
    sudo dpkg -i "$installer_path" || sudo apt-get install -f -y
    echo "  [+] .deb installed (or attempted)."
    rm -rf "$TMPDIR" || true
    exit 0
  else
    echo "  [!] sudo not available. You can install manually: sudo dpkg -i $installer_path && sudo apt-get install -f -y"
    exit 1
  fi
elif [[ "$lower_name" == *.tar.gz ]] || [[ "$lower_name" == *.tgz ]]; then
  echo "  -> Extracting tarball..."
  mkdir -p "$TMPDIR/extract"
  tar -xzf "$installer_path" -C "$TMPDIR/extract"
  echo "  [+] Extracted to $TMPDIR/extract"
  echo "  -> Looking for an AppImage or binary to run inside the tarball..."
  found=$(find "$TMPDIR/extract" -maxdepth 3 -type f \( -iname "*.appimage" -o -perm -u+x \) | head -n 1 || true)
  if [ -n "$found" ]; then
    echo "  -> Found $found"
    chmod +x "$found"
    echo "  -> Launching..."
    "$found" || { echo "  [X] Failed to run extracted binary." >&2; exit 1; }
    rm -rf "$TMPDIR" || true
    exit 0
  else
    echo "  [!] No runnable binary found inside the tarball. You can inspect $TMPDIR/extract and run the app manually or move files to /opt." 
    echo "  Example: sudo mv $TMPDIR/extract/YOUR_DIR /opt/CafeVerse && /opt/CafeVerse/CafeVerse"
    exit 0
  fi
else
  # Unknown type: give user instructions
  echo "  [!] Downloaded asset is a '$file_name' — not an AppImage/.deb/.tar.gz we explicitly handle."
  echo "  You can inspect and run it from: $installer_path"
  echo "  To cleanup after: rm -rf $TMPDIR"
  exit 0
fi
