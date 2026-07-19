// 범례에서 사용 가능한 브랜드 SVG 아이콘 정의

export const BRAND_LEGEND_ICONS: Record<string, { label: string }> = {
  '[ig]':    { label: '인스타그램' },
  '[naver]': { label: '네이버블로그' },
}

export function isBrandLegendIcon(value: string): boolean {
  return value in BRAND_LEGEND_ICONS
}

export function BrandLegendIcon({ value, size = 16 }: { value: string; size?: number }) {
  if (value === '[ig]') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="6" fill="#E1306C" />
        <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
      </svg>
    )
  }
  if (value === '[naver]') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#03C75A" />
        <path d="M5.5 18V6h3.8l4.4 6.8V6H17.5v12h-3.8L9.3 11.2V18H5.5z" fill="white" />
      </svg>
    )
  }
  return null
}
