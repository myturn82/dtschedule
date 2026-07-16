import type { TenantRole } from '../types'

export const INDICATOR_BAR_COLOR = 'var(--color-brand-primary)'

// 바표시 역할이 여러 개일 때 역할별로 구분되는 색상 팔레트 — indicatorBarRoles 배열 내 순서로 고정 매핑되어
// 월/주 뷰에서 동일 역할이 항상 같은 색으로 보인다.
// 임의의 무지개색 대신 조직의 포인트 컬러(--color-brand-primary)를 명암만 다르게 섞어
// 항상 그 조직 테마와 어울리도록 한다.
export const INDICATOR_BAR_PALETTE = [
  INDICATOR_BAR_COLOR,
  'color-mix(in srgb, var(--color-brand-primary) 55%, black)',
  'color-mix(in srgb, var(--color-brand-primary) 55%, white)',
  'color-mix(in srgb, var(--color-brand-primary) 30%, black)',
  'color-mix(in srgb, var(--color-brand-primary) 30%, white)',
]

export function indicatorBarColorFor(role: TenantRole, allBarRoles: TenantRole[]): string {
  const idx = allBarRoles.findIndex(r => r.id === role.id)
  return INDICATOR_BAR_PALETTE[(idx < 0 ? 0 : idx) % INDICATOR_BAR_PALETTE.length]
}
