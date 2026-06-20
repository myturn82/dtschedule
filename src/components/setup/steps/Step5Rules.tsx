import { useState } from 'react'
import { SCHEDULE_RULE_TEMPLATES } from '../../../utils/scheduleRuleTemplates'
import type { ScheduleRule } from '../../../types'

interface Props {
  rules: ScheduleRule[]
  timeSlots: string[]
  error: string
  onToggleRule: (ruleId: string, currentIsOpen: boolean) => Promise<string | null>
  onApplyTemplate: (openDays: number[]) => Promise<void>
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function slotLabel(slot: string) {
  const [start] = slot.split('-').map(Number)
  const h = Math.floor(start)
  const m = start % 1 === 0.5 ? '30' : '00'
  return `${h}:${m}`
}

export function Step5Rules({ rules, timeSlots, error, onToggleRule, onApplyTemplate }: Props) {
  const [showMatrix, setShowMatrix] = useState(false)
  const [applyingTemplate, setApplyingTemplate] = useState<number | null>(null)

  function getRule(day: number, slot: string) {
    return rules.find(r => r.day_of_week === day && r.time_slot === slot)
  }

  const openDaysSummary = () => {
    const openDays = [0, 1, 2, 3, 4, 5, 6].filter(d =>
      timeSlots.some(s => getRule(d, s)?.is_open)
    )
    if (openDays.length === 0) return '없음'
    if (openDays.length === 7) return '매일'
    return openDays.map(d => DAY_LABELS[d]).join('·')
  }

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">📅</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">언제 운영하나요?</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">운영하는 요일을 선택해주세요. 나중에 날짜별로 개별 설정도 가능합니다.</p>
      </div>

      {/* Templates */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">빠른 선택</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCHEDULE_RULE_TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              disabled={applyingTemplate !== null}
              onClick={async () => {
                setApplyingTemplate(i)
                await onApplyTemplate(t.openDays)
                setApplyingTemplate(null)
              }}
              className="text-left px-3 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-50"
            >
              <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                {applyingTemplate === i ? '적용 중...' : t.label}
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {rules.length > 0 && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-text-secondary)]">현재 운영 요일: </span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{openDaysSummary()}</span>
        </div>
      )}

      {/* Matrix toggle */}
      <button onClick={() => setShowMatrix(v => !v)} className="text-sm text-[var(--color-brand-primary)] hover:underline">
        {showMatrix ? '▲ 세부 설정 닫기' : '▼ 시간대별 직접 설정'}
      </button>

      {showMatrix && timeSlots.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="border-collapse text-[11px] w-full">
            <thead>
              <tr>
                <th className="border border-[var(--color-border)] px-2 py-1.5 bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] font-medium sticky left-0">시간</th>
                {DAY_LABELS.map((d, idx) => (
                  <th key={idx} className={`border border-[var(--color-border)] px-2 py-1.5 bg-[var(--color-surface-secondary)] font-semibold ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-[var(--color-text-secondary)]'}`}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot}>
                  <td className="border border-[var(--color-border)] px-2 py-1 bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] sticky left-0 font-medium whitespace-nowrap">
                    {slotLabel(slot)}
                  </td>
                  {[0, 1, 2, 3, 4, 5, 6].map(day => {
                    const rule = getRule(day, slot)
                    const isOpen = rule?.is_open ?? false
                    return (
                      <td key={day} className="border border-[var(--color-border)] p-0 text-center">
                        <button
                          onClick={() => rule && onToggleRule(rule.id, isOpen)}
                          disabled={!rule}
                          className={`w-full py-1.5 px-1 text-[10px] font-medium transition-colors ${
                            isOpen
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400'
                              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          {isOpen ? '운영' : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
