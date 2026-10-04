param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('lesson-on','serve-on','shift-on','class-on','work-on','salon-on','care-on')]
    [string]$Vertical
)

$VERTICALS = @{
    'lesson-on' = @{ AppId = 'com.dtschedule.lessonon'; BrandName = 'LESSON:ON'; Variant = 'lessonon' }
    'serve-on'  = @{ AppId = 'com.dtschedule.serveon';  BrandName = 'SERVE:ON';  Variant = 'serveon'  }
    'shift-on'  = @{ AppId = 'com.dtschedule.shifton';  BrandName = 'SHIFT:ON';  Variant = 'shifton'  }
    'class-on'  = @{ AppId = 'com.dtschedule.classon';  BrandName = 'CLASS:ON';  Variant = 'classon'  }
    'work-on'   = @{ AppId = 'com.dtschedule.workon';   BrandName = 'WORK:ON';   Variant = 'workon'   }
    'salon-on'  = @{ AppId = 'com.dtschedule.salonon';  BrandName = 'SALON:ON';  Variant = 'salonon'  }
    'care-on'   = @{ AppId = 'com.dtschedule.careon';   BrandName = 'CARE:ON';   Variant = 'careon'   }
}

$ROOT = Split-Path $PSScriptRoot
Set-Location $ROOT

$v = $VERTICALS[$Vertical]
$ksFile = "android/app/keystore.$($v.Variant).properties"

if (-not (Test-Path $ksFile)) {
    Write-Error "키스토어 없음: $ksFile`n먼저 키스토어를 생성하세요."
    exit 1
}

Write-Host "▶ [$Vertical] 1/4 웹 빌드..."
npm run build:tokens
if (-not $?) { Write-Error "build:tokens 실패"; exit 1 }
npx vite build --mode $Vertical
if (-not $?) { Write-Error "vite build 실패"; exit 1 }

Write-Host "▶ [$Vertical] 2/4 cap sync..."
$env:VITE_APP_ID     = $v.AppId
$env:VITE_BRAND_NAME = $v.BrandName
npx cap sync android
$ok = $?
Remove-Item Env:VITE_APP_ID     -ErrorAction SilentlyContinue
Remove-Item Env:VITE_BRAND_NAME -ErrorAction SilentlyContinue
if (-not $ok) { Write-Error "cap sync 실패"; exit 1 }

Write-Host "▶ [$Vertical] 3/4 AAB 빌드..."
$env:VITE_APP_ID  = $v.AppId
$env:APP_VARIANT  = $v.Variant
Set-Location android
.\gradlew.bat bundleRelease
$ok = $?
Set-Location $ROOT
Remove-Item Env:VITE_APP_ID  -ErrorAction SilentlyContinue
Remove-Item Env:APP_VARIANT  -ErrorAction SilentlyContinue
if (-not $ok) { Write-Error "AAB 빌드 실패"; exit 1 }

Write-Host "▶ [$Vertical] 4/4 결과물 저장..."
if (-not (Test-Path "builds")) { New-Item -ItemType Directory "builds" | Out-Null }
Copy-Item "android/app/build/outputs/bundle/release/app-release.aab" "builds/$Vertical.aab" -Force

Write-Host "✅ [$Vertical] 완료 → builds/$Vertical.aab"
