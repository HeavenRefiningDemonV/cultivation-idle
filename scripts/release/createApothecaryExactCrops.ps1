$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

function New-ApothecaryExactCrop {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination,
    [Parameter(Mandatory = $true)][int]$X,
    [Parameter(Mandatory = $true)][int]$Y,
    [Parameter(Mandatory = $true)][int]$Width,
    [Parameter(Mandatory = $true)][int]$Height
  )

  $sourcePath = Join-Path $repoRoot $Source
  $destinationPath = Join-Path $repoRoot $Destination
  $destinationDir = Split-Path $destinationPath -Parent

  if (-not (Test-Path $sourcePath)) {
    throw "Missing Apothecary Exact crop source: $Source"
  }

  New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null

  $image = [System.Drawing.Bitmap]::FromFile($sourcePath)
  try {
    $rect = New-Object System.Drawing.Rectangle($X, $Y, $Width, $Height)
    $crop = $image.Clone($rect, $image.PixelFormat)
    try {
      if (Test-Path $destinationPath) {
        Remove-Item -LiteralPath $destinationPath -Force
      }
      $crop.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $crop.Dispose()
    }
  } finally {
    $image.Dispose()
  }

  Write-Output "$Destination <= $Source [$X,$Y,$Width,$Height]"
}

New-ApothecaryExactCrop `
  -Source 'src/assets/apothecaryExact/raw/Prescription parchment frame-Photoroom.png' `
  -Destination 'src/assets/apothecaryExact/frames/prescription_parchment_frame_cropped.png' `
  -X 58 -Y 91 -Width 1572 -Height 775

New-ApothecaryExactCrop `
  -Source 'src/assets/apothecaryExact/raw/Medicine pouch object sprite.png' `
  -Destination 'src/assets/apothecaryExact/objects/medicine_pouch_object_cropped.png' `
  -X 188 -Y 129 -Width 878 -Height 971

New-ApothecaryExactCrop `
  -Source 'src/assets/apothecaryExact/raw/Gold CTA plaque-Photoroom (1).png' `
  -Destination 'src/assets/apothecaryExact/frames/gold_cta_plaque_cropped.png' `
  -X 44 -Y 119 -Width 2087 -Height 488
