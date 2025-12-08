<#
.SYNOPSIS
Generates properly-sized iOS AppIcon images and Android mipmap icons
from `assets/BuddyBoardicon.png` using ImageMagick (`magick`).

USAGE
Run from the repo root PowerShell prompt:
  .\scripts\generate_resized_icons.ps1

This script is idempotent and will create required directories.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve repo root (assumes script is in ./scripts)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir '..')

Write-Host "Repo root: $repoRoot"

$source = Join-Path $repoRoot 'assets\\BuddyBoardicon.png'
if (-not (Test-Path $source)) {
    Write-Error "Source icon not found at $source. Put your 1024x1024 icon at assets\\BuddyBoardicon.png and re-run."
    exit 2
}

if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
    Write-Error "ImageMagick 'magick' not found in PATH. Install ImageMagick and ensure 'magick' is available."
    exit 3
}

function Convert-Image($src, $dest, $size) {
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Write-Host "Generating $dest ($size x $size)"
    & magick `"$src`" -resize ${size}x${size} `"$dest`" 2>&1 | ForEach-Object { Write-Verbose $_ }
}

try {
    # iOS AppIcon.appiconset
    $iosDir = Join-Path $repoRoot 'ios\\AppIcon.appiconset'
    New-Item -ItemType Directory -Force -Path $iosDir | Out-Null

    $iosIcons = @(
        @{name='Icon-20@2x.png'; size=40},
        @{name='Icon-20@3x.png'; size=60},
        @{name='Icon-29@2x.png'; size=58},
        @{name='Icon-29@3x.png'; size=87},
        @{name='Icon-40@2x.png'; size=80},
        @{name='Icon-40@3x.png'; size=120},
        @{name='Icon-60@2x.png'; size=120},
        @{name='Icon-60@3x.png'; size=180},
        @{name='Icon-76.png'; size=76},
        @{name='Icon-76@2x.png'; size=152},
        @{name='Icon-83.5@2x.png'; size=167},
        @{name='Icon-1024.png'; size=1024}
    )

    foreach ($icon in $iosIcons) {
        $dest = Join-Path $iosDir $icon['name']
        Convert-Image $source $dest $icon['size']
    }

    # Android mipmaps
    $androidRes = Join-Path $repoRoot 'android\\app\\src\\main\\res'
    $mipmapSizes = @(
        @{dir='mipmap-mdpi'; size=48},
        @{dir='mipmap-hdpi'; size=72},
        @{dir='mipmap-xhdpi'; size=96},
        @{dir='mipmap-xxhdpi'; size=144},
        @{dir='mipmap-xxxhdpi'; size=192},
        @{dir='mipmap-playstore'; size=512; name='ic_launcher_playstore.png'}
    )

    foreach ($m in $mipmapSizes) {
        $dir = Join-Path $androidRes $m['dir']
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        $filename = if ($m['name']) { $m['name'] } else { 'ic_launcher.png' }
        $dest = Join-Path $dir $filename
        Convert-Image $source $dest $m['size']
    }

    Write-Host "Icon generation complete." -ForegroundColor Green
    exit 0
}
catch {
    Write-Error "Failed to generate icons: $_"
    exit 1
}
