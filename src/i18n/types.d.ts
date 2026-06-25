import type { resources } from './index'

/**
 * i18next 타입 오버라이드 — t('key') 호출 시 자동완성과 타입 검사가 활성화됩니다.
 * 새 네임스페이스 추가 시 resources 객체에 추가하면 자동 반영됩니다.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: (typeof resources)['ko']
  }
}
