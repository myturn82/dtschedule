import { useState } from 'react'
import type { LegendItem, LegendColor } from '../../types'

export const DEFAULT_LEGEND_ITEMS: LegendItem[] = []

// CSS-based color mapping using Tailwind inline styles
export const LEGEND_COLOR_STYLES: Record<LegendColor, { bg: string; border: string; icon: string }> = {
  amber:  { bg: 'bg-amber-50 dark:bg-amber-950/20',   border: 'border-amber-200 dark:border-amber-900/60',   icon: 'text-amber-500' },
  pink:   { bg: 'bg-pink-50 dark:bg-pink-950/30',     border: 'border-pink-200 dark:border-pink-900/60',     icon: 'text-pink-400' },
  slate:  { bg: 'bg-slate-100 dark:bg-slate-800/40',  border: 'border-slate-200 dark:border-slate-700',      icon: 'text-slate-400' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-950/30',border: 'border-yellow-200 dark:border-yellow-900/60', icon: 'text-yellow-500' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-900/60',     icon: 'text-blue-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-950/20',   border: 'border-green-200 dark:border-green-900/60',   icon: 'text-green-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-900/60', icon: 'text-purple-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-950/20',       border: 'border-red-200 dark:border-red-900/60',       icon: 'text-red-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-200 dark:border-indigo-900/60', icon: 'text-indigo-500' },
  black:  { bg: 'bg-zinc-100 dark:bg-zinc-800/40',    border: 'border-zinc-300 dark:border-zinc-700',        icon: 'text-zinc-900 dark:text-zinc-200' },
}

const DOT_COLORS: Record<LegendColor, string> = {
  amber:  '#F59E0B',
  pink:   '#F472B6',
  slate:  '#94A3B8',
  yellow: '#EAB308',
  blue:   '#3B82F6',
  green:  '#22C55E',
  purple: '#A855F7',
  red:    '#EF4444',
  indigo: '#6366F1',
  black:  '#000000',
}

interface Props {
  legendItems?: LegendItem[]
}

export function Legend({ legendItems }: Props) {
  const [expanded, setExpanded] = useState(false)
  const items = legendItems ?? []

  if (!items.length) return null

  return (
    <div className="mt-3 mb-0.5">
      {/* 모바일: 토글 버튼 / 데스크탑: 레이블 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(p => !p)}
          className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          범례 {items.length}개
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
          </svg>
        </button>
        <span className="hidden sm:inline text-[11px] font-medium text-[var(--color-text-muted)] whitespace-nowrap">
          범례
        </span>
      </div>
      {/* 항목: 모바일 토글, 데스크탑 항상 표시 */}
      <div className={`flex-wrap items-center gap-2 mt-1.5 ${expanded ? 'flex' : 'hidden'} sm:flex`}>
        {items.map(({ id, icon, label, color }) => {
          const s = LEGEND_COLOR_STYLES[color]
          const dot = DOT_COLORS[color]
          return (
            <span
              key={id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-[6px] rounded-full text-[12px] font-medium whitespace-nowrap ${s.bg} border ${s.border} ${s.icon}`}
            >
              {icon ? (
                <span className="text-sm leading-none select-none">{icon}</span>
              ) : (
                <span className="w-2 h-2 rounded-full shrink-0 flex-none" style={{ background: dot }} />
              )}
              <span>{label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
