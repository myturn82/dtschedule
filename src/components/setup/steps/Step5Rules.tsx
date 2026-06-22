import { useState } from 'react'
import { SCHEDULE_RULE_TEMPLATES } from '../../../utils/scheduleRuleTemplates'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { Field, ErrLine } from '../WizardField'
import { WizardIcon } from '../WizardIcons'
import type { ScheduleRule } from '../../../types'

interface Props {
  rules: ScheduleRule[]
  timeSlots: string[]
  error: string
  onToggleRule: (ruleId: string, currentIsOpen: boolean) => Promise<string | null>
  onApplyTemplate: (openDays: number[], includeHolidays?: boolean) => Promise<void>
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
  const [closedDays, setClosedDays] = useState<Set<number>>(new Set())
  const [applyingHoliday, setApplyingHoliday] = useState(false)

  function getRule(day: number, slot: string) {
    return rules.find(r => r.day_of_week === day && r.time_slot === slot)
  }

  function toggleClosedDay(d: number) {
    setClosedDays(prev => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const openDaysSummary = () => {
    const openDays = [0, 1, 2, 3, 4, 5, 6].filter(d =>
      timeSlots.some(s => getRule(d, s)?.is_open)
    )
    if (openDays.length === 0) return '없음'
    if (openDays.length === 7) return '매일'
    return openDays.map(d => DAY_LABELS[d]).join('·')
  }

  const isApplying = applyingTemplate !== null || applyingHoliday

  return (
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[4]} />

      <Field label="빠른 선택">
        <div className="tpl-grid">
          {SCHEDULE_RULE_TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              disabled={isApplying}
              onClick={async () => {
                setApplyingTemplate(i)
                await onApplyTemplate(t.openDays, t.includeHolidays)
                setApplyingTemplate(null)
              }}
              className={`tpl-card${applyingTemplate === i ? ' on' : ''}`}
            >
              <span className="tpl-label">{applyingTemplate === i ? '적용 중...' : t.label}</span>
              <span className="tpl-sub">{t.description}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="정기휴일 직접 지정" hint="선택한 요일 = 휴무">
        <div className="addbox">
          <div className="day-row">
            {DAY_LABELS.map((d, idx) => (
              <button
                key={idx}
                className={`day-btn${closedDays.has(idx) ? ' closed' : ''}${idx === 0 ? ' sun' : ''}${idx === 6 ? ' sat' : ''}`}
                onClick={() => toggleClosedDay(idx)}
              >
                {d}
              </button>
            ))}
          </div>
          {closedDays.size > 0 ? (
            <div className="day-apply">
              <span>휴무일 <b>{[...closedDays].sort().map(d => DAY_LABELS[d]).join('·')}</b></span>
              <button
                className="btn btn-primary btn-sm"
                disabled={isApplying}
                onClick={async () => {
                  setApplyingHoliday(true)
                  const openDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !closedDays.has(d))
                  await onApplyTemplate(openDays)
                  setApplyingHoliday(false)
                }}
              >
                {applyingHoliday ? '적용 중...' : '적용'}
              </button>
            </div>
          ) : <p className="mini-hint">요일을 선택하면 해당 요일이 정기휴일로 지정됩니다</p>}
        </div>
      </Field>

      {rules.length > 0 && (
        <div className="summary-bar">현재 운영 요일 <b>{openDaysSummary()}</b></div>
      )}

      <button className="link-btn" onClick={() => setShowMatrix(v => !v)}>
        <WizardIcon.chevron size={14} style={{ transform: showMatrix ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        시간대별 직접 설정
      </button>

      {showMatrix && timeSlots.length > 0 && (
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="mx-time">시간</th>
                {DAY_LABELS.map((d, idx) => (
                  <th key={idx} className={idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot}>
                  <td className="mx-time">{slotLabel(slot)}</td>
                  {[0, 1, 2, 3, 4, 5, 6].map(day => {
                    const rule = getRule(day, slot)
                    const isOpen = rule?.is_open ?? false
                    return (
                      <td key={day} className="mx-cell">
                        <button className={`mx-btn${isOpen ? ' on' : ''}`} disabled={!rule} onClick={() => rule && onToggleRule(rule.id, isOpen)}>
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

      <ErrLine error={error} />
    </div>
  )
}
