import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../i18n' // 실제 앱과 동일한 i18next 초기화 (schedule 네임스페이스 등)
import '../../index.css' // 실제 앱 디자인 토큰 + Tailwind
import './promo.css' // 릴스 프레임 전용 마케팅 크롬 (스케줄 UI 아님)
import { applyThemePreset } from '../../lib/themePresets'
import { AppRoot } from './App'

// --color-brand-primary 등은 런타임에 TenantContext가 주입하는 값이라
// 실제 앱과 동일한 함수로 포인트 컬러 프리셋을 직접 적용해준다.
applyThemePreset('original', false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
