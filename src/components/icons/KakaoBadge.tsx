interface KakaoBadgeProps {
  size?: number
  className?: string
  title?: string
}

// 카카오 브랜드 색상(#FEE500)을 그대로 표현하기 위한 SVG 배지.
// 이모지는 시스템이 색상을 강제해 카카오 특유의 노란색을 낼 수 없어 SVG로 대체.
export function KakaoBadge({ size = 14, className, title = '카카오 가입' }: KakaoBadgeProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <title>{title}</title>
      <circle cx="12" cy="12" r="12" fill="#FEE500" />
      <path fill="#181600" d="M12 6.5c-4.14 0-7.5 2.7-7.5 6 0 2.1 1.36 3.95 3.42 5.02-.15.55-.55 2-.63 2.32-.1.38.14.38.3.28.13-.08 2.02-1.35 2.83-1.9.51.08 1.04.12 1.58.12 4.14 0 7.5-2.7 7.5-6s-3.36-6-7.5-6Z" />
    </svg>
  )
}
