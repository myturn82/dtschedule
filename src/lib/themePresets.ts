// 조직별 포인트 컬러 프리셋 — claude.ai/design "Org Setup Wizard" 트윅스 패널의
// THEMES 토큰을 그대로 포팅. 다크 변형은 데이터로 보관하되 현재 앱은 다크모드가
// 비활성 상태라 적용하지 않는다(useDarkMode.ts 참고).

export type ThemePresetKey = 'midnight' | 'forest' | 'salmon' | 'beige' | 'original' | 'butter' | 'pistachio' | 'dusty_lavender' | 'terracotta' | 'monochrome' | 'deep_midnight' | 'brick' | 'sage' | 'mute_lavender'

export interface ThemeTokens {
  accent: string
  accentHover: string
  accentSoft: string
  accentRing: string
  accentText: string
  accentContrast: string
  pageOverride?: string
  surfaceOverride?: string
  borderOverride?: string
  tintBrand?: string
  tintBrandInk?: string
}

export interface ThemePreset {
  label: string
  light: ThemeTokens
  dark: ThemeTokens
}

export const THEME_PRESETS: Record<ThemePresetKey, ThemePreset> = {
  midnight: {
    label: '미드나잇',
    light: { accent: '#3056D3', accentHover: '#2742B5', accentSoft: '#EEF1FD', accentRing: '#C7D2F7', accentText: '#2742B5', accentContrast: '#FFFFFF' },
    dark: { accent: '#5B7BF5', accentHover: '#6E8AF7', accentSoft: '#1A2140', accentRing: '#2E3A6B', accentText: '#A9BCFB', accentContrast: '#0B0E18' },
  },
  forest: {
    label: '딥 그린',
    light: { accent: '#0E8A5F', accentHover: '#0B7050', accentSoft: '#E7F6EF', accentRing: '#B4E3CE', accentText: '#0B6E4F', accentContrast: '#FFFFFF' },
    dark: { accent: '#2BB37D', accentHover: '#36C189', accentSoft: '#10271E', accentRing: '#1F4A39', accentText: '#7FD9B4', accentContrast: '#08130E' },
  },
  salmon: {
    label: '살몬',
    light: { accent: '#F2604E', accentHover: '#DD4B3A', accentSoft: '#FDEDEA', accentRing: '#F8C9C0', accentText: '#C2402F', accentContrast: '#FFFFFF' },
    dark: { accent: '#FF7A66', accentHover: '#FF8C7A', accentSoft: '#30181590', accentRing: '#5A2E27', accentText: '#FFB3A4', accentContrast: '#1A0D0A' },
  },
  beige: {
    label: '베이지 (샌드)',
    light: { accent: '#B0744A', accentHover: '#955F3A', accentSoft: '#F3EADF', accentRing: '#E0C9AF', accentText: '#8A5733', accentContrast: '#FFFFFF', pageOverride: '#F4F1EA', surfaceOverride: '#FBF9F4', borderOverride: '#E6DECF' },
    dark: { accent: '#C8895C', accentHover: '#D69A6D', accentSoft: '#2A2017', accentRing: '#4A3A27', accentText: '#E0B488', accentContrast: '#1A130C', pageOverride: '#1A1712', surfaceOverride: '#221E18', borderOverride: '#352E24' },
  },
  original: {
    label: '오리지널 (기존)',
    light: { accent: '#D35438', accentHover: '#BC4630', accentSoft: '#FBEBE6', accentRing: '#F3C9BC', accentText: '#B23E27', accentContrast: '#FFFFFF', pageOverride: '#F5F4F1', surfaceOverride: '#FFFFFF', borderOverride: '#E9E6E0', tintBrand: 'oklch(0.93 0.06 70)', tintBrandInk: 'oklch(0.42 0.10 60)' },
    dark: { accent: '#E8694D', accentHover: '#F07A5F', accentSoft: '#2E1812', accentRing: '#5A2D22', accentText: '#F6A892', accentContrast: '#1A0E0A', pageOverride: '#15110F', surfaceOverride: '#1E1916', borderOverride: '#322A25' },
  },
  butter: {
    label: '버터 옐로우',
    light: { accent: '#D4A017', accentHover: '#BA8C12', accentSoft: '#FEF9E7', accentRing: '#F9E79F', accentText: '#8A6C0A', accentContrast: '#FFFFFF' },
    dark:  { accent: '#E8BB30', accentHover: '#F0C840', accentSoft: '#2A2210', accentRing: '#4A3B1A', accentText: '#F5DC80', accentContrast: '#1A1500' },
  },
  pistachio: {
    label: '피스타치오 민트',
    light: { accent: '#17A589', accentHover: '#138F76', accentSoft: '#E8F8F5', accentRing: '#A3E4D7', accentText: '#0E7A63', accentContrast: '#FFFFFF' },
    dark:  { accent: '#2EC4A4', accentHover: '#38D0B0', accentSoft: '#0E2822', accentRing: '#1A4A3C', accentText: '#7ADFD0', accentContrast: '#071A16' },
  },
  dusty_lavender: {
    label: '더스티 라벤더',
    light: { accent: '#9B59B6', accentHover: '#8549A1', accentSoft: '#F5EEF8', accentRing: '#D7BDE2', accentText: '#7D3C98', accentContrast: '#FFFFFF' },
    dark:  { accent: '#B27FCC', accentHover: '#BF90D8', accentSoft: '#1E1228', accentRing: '#3A2050', accentText: '#D4A8E8', accentContrast: '#100A18' },
  },
  terracotta: {
    label: '테라코타',
    light: { accent: '#DC7633', accentHover: '#C0651E', accentSoft: '#FDEBD0', accentRing: '#F0C5A0', accentText: '#A85218', accentContrast: '#FFFFFF' },
    dark:  { accent: '#E8904D', accentHover: '#F0A060', accentSoft: '#2A1808', accentRing: '#4A2C14', accentText: '#F5B885', accentContrast: '#18100A' },
  },
  monochrome: {
    label: '모노크롬',
    light: { accent: '#2C2C2C', accentHover: '#1A1A1A', accentSoft: '#F5F5F5', accentRing: '#C8C8C8', accentText: '#1A1A1A', accentContrast: '#FFFFFF' },
    dark:  { accent: '#D0D0D0', accentHover: '#E0E0E0', accentSoft: '#1E1E1E', accentRing: '#3A3A3A', accentText: '#E8E8E8', accentContrast: '#0A0A0A' },
  },
  deep_midnight: {
    label: '딥 미드나잇 블루',
    light: { accent: '#1E293B', accentHover: '#111827', accentSoft: '#F1F5F9', accentRing: '#CBD5E1', accentText: '#0F172A', accentContrast: '#FFFFFF' },
    dark:  { accent: '#94A3B8', accentHover: '#B0BDD0', accentSoft: '#0F1520', accentRing: '#1E2D40', accentText: '#CBD5E1', accentContrast: '#080E18' },
  },
  brick: {
    label: '브릭 (테라코타)',
    light: { accent: '#C05621', accentHover: '#A14418', accentSoft: '#FEF0E6', accentRing: '#FDBA74', accentText: '#9A3412', accentContrast: '#FFFFFF' },
    dark:  { accent: '#E07840', accentHover: '#EC8A52', accentSoft: '#2A1408', accentRing: '#4A2A14', accentText: '#F8B090', accentContrast: '#180A04' },
  },
  sage: {
    label: '세이지 그린',
    light: { accent: '#4D7C0F', accentHover: '#3A6009', accentSoft: '#F1F8E9', accentRing: '#C5E1A5', accentText: '#2E5706', accentContrast: '#FFFFFF' },
    dark:  { accent: '#7CB342', accentHover: '#8DC54F', accentSoft: '#141E08', accentRing: '#2A3C10', accentText: '#AED581', accentContrast: '#0A1204' },
  },
  mute_lavender: {
    label: '무트 라벤더',
    light: { accent: '#7C3AED', accentHover: '#6D28D9', accentSoft: '#EDE9FE', accentRing: '#C4B5FD', accentText: '#5B21B6', accentContrast: '#FFFFFF' },
    dark:  { accent: '#A78BFA', accentHover: '#B59DFC', accentSoft: '#1A1030', accentRing: '#312050', accentText: '#DDD6FE', accentContrast: '#0D0820' },
  },
}

export const THEME_PRESET_LIST: { key: ThemePresetKey; label: string; preset: ThemePreset }[] =
  (Object.keys(THEME_PRESETS) as ThemePresetKey[]).map(key => ({ key, label: THEME_PRESETS[key].label, preset: THEME_PRESETS[key] }))

const TOKEN_TO_CSS_VAR: Record<keyof Pick<ThemeTokens, 'accent' | 'accentHover' | 'accentSoft' | 'accentRing' | 'accentText' | 'accentContrast'>, string> = {
  accent: '--color-brand-primary',
  accentHover: '--color-brand-primary-hover',
  accentSoft: '--color-brand-primary-soft',
  accentRing: '--color-brand-primary-ring',
  accentText: '--color-brand-primary-text',
  accentContrast: '--color-brand-primary-contrast',
}

// 조직의 포인트 컬러 프리셋을 전역 CSS 변수로 주입한다. 기존 31개 파일이 참조하는
// --color-brand-primary(-hover)를 이 한 곳에서만 바꾸면 버튼·포커스링 등에 자동 반영된다.
export function applyThemePreset(key: ThemePresetKey | null | undefined) {
  const root = document.documentElement
  const tokens = key ? THEME_PRESETS[key]?.light : undefined
  for (const [tokenKey, cssVar] of Object.entries(TOKEN_TO_CSS_VAR) as [keyof typeof TOKEN_TO_CSS_VAR, string][]) {
    const value = tokens?.[tokenKey]
    if (value) root.style.setProperty(cssVar, value)
    else root.style.removeProperty(cssVar)
  }
  // 셀 tint 오버라이드 — 미설정 시 index.css color-mix 공식으로 폴백
  if (tokens?.tintBrand) root.style.setProperty('--tint-brand', tokens.tintBrand)
  else root.style.removeProperty('--tint-brand')
  if (tokens?.tintBrandInk) root.style.setProperty('--tint-brand-ink', tokens.tintBrandInk)
  else root.style.removeProperty('--tint-brand-ink')
}
