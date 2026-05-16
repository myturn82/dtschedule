import type { LegendItem, LegendColor } from '../../types'

export const DEFAULT_LEGEND_ITEMS: LegendItem[] = []

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

interface Props {
  legendItems?: LegendItem[]
}

export function Legend({ legendItems }: Props) {
  const items = legendItems ?? []
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-3 mb-0.5">
      {items.map(({ id, icon, label, color }) => {
        const s = LEGEND_COLOR_STYLES[color]
        return (
          <div key={id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${s.bg} ${s.border}`}>
            <span className={`text-[10px] font-bold ${s.icon}`}>{icon}</span>
            <span className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] font-medium whitespace-nowrap">
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
