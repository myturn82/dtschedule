// src/lib/brandConfig.ts
import type { VerticalId } from './verticalPresets'

export const BRAND = {
  name:     import.meta.env.VITE_BRAND_NAME    ?? 'Dynamic Team Schedule',
  tagline:  import.meta.env.VITE_BRAND_TAGLINE ?? '다중 조직 스케줄 관리',
  color:    import.meta.env.VITE_BRAND_COLOR   ?? '#E05A3A',
  vertical: (import.meta.env.VITE_VERTICAL     ?? 'generic') as VerticalId | 'generic',
  appId:    import.meta.env.VITE_APP_ID        ?? 'com.dtschedule.app',
} as const
