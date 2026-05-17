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
}

interface Props {
  legendItems?: LegendItem[]
}

export function Legend({ legendItems }: Props) {
  const items = legendItems ?? []
  const [active, setActive] = useState<Set<string>>(() => new Set(items.map(i => i.id)))

  if (!items.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 mb-0.5">
      <span className="text-[11px] font-medium text-[var(--color-text-muted)] mr-1 whitespace-nowrap">
        범례
      </span>
      {items.map(({ id, label, color }) => {
        const isActive = active.has(id)
        const s = LEGEND_COLOR_STYLES[color]
        const dot = DOT_COLORS[color]
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActive(prev => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })}
            className={`inline-flex items-center gap-1.5 px-2.5 py-[6px] rounded-full text-[12px] font-medium whitespace-nowrap transition-all duration-150
              ${isActive
                ? `${s.bg} border ${s.border} ${s.icon}`
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 flex-none"
              style={{ background: isActive ? dot : 'var(--color-text-muted)' }}
            />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
