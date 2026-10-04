$ALL_VERTICALS = @('lesson-on', 'serve-on', 'shift-on', 'class-on', 'work-on', 'salon-on', 'care-on')
$ROOT = Split-Path $PSScriptRoot
$results = @()

foreach ($vertical in $ALL_VERTICALS) {
    $variant = $vertical -replace '-', ''
    $ksFile = Join-Path $ROOT "android/app/keystore.$variant.properties"

    if (-not (Test-Path $ksFile)) {
        Write-Host "⏭  [$vertical] 키스토어 없음 - 건너뜀"
        $results += [PSCustomObject]@{ Vertical = $vertical; Status = 'skipped' }
        continue
    }

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host " 🔨 $vertical"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    & "$PSScriptRoot/build-android.ps1" -Vertical $vertical

    if ($?) {
        $results += [PSCustomObject]@{ Vertical = $vertical; Status = 'success' }
    } else {
        $results += [PSCustomObject]@{ Vertical = $vertical; Status = 'failed' }
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host " 빌드 결과"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
foreach ($r in $results) {
    $icon = switch ($r.Status) { 'success' { '✅' } 'failed' { '❌' } 'skipped' { '⏭ ' } }
    Write-Host "$icon  $($r.Vertical)"
}

$failed = $results | Where-Object { $_.Status -eq 'failed' }
if ($failed) { exit 1 }
