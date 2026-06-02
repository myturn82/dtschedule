import { useState } from 'react'
import { DEFAULT_MAX_CAPACITY } from '../../types'
import type { SlotSetting, TimeSlot } from '../../types'
import { shortSlotLabel } from '../../utils/timeSlots'

interface Props {
  slotSettings: SlotSetting[]
  timeSlots: TimeSlot[]
  slotLabels?: Record<string, string>
  onClose: () => void
  onUpdate: (timeSlot: TimeSlot, maxCapacity: number) => Promise<string | null>
}

export function CapacityModal({ slotSettings, timeSlots, slotLabels = {}, onClose, onUpdate }: Props) {
  const initialValues = () => Object.fromEntries(
    timeSlots.map(slot => [slot, slotSettings.find(s => s.time_slot === slot)?.max_capacity ?? DEFAULT_MAX_CAPACITY])
  )

  const [values, setValues] = useState<Record<string, number>>(initialValues)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkApplying, setBulkApplying] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)

  function handleInputChange(slot: TimeSlot, raw: string) {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1) {
      setValues(prev => ({ ...prev, [slot]: n }))
      setError(null)
    }
  }

  async function handleSave() {
    for (const slot of timeSlots) {
      const n = values[slot]
      if (isNaN(n) || n < 1) { setError('최소 인원은 1명 이상이어야 합니다.'); return }
    }
    setError(null)
    setSaving(true)
    for (const slot of timeSlots) {
      const err = await onUpdate(slot as TimeSlot, values[slot])
      if (err) { setError(err); setSaving(false); return }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleBulkApply() {
    const n = parseInt(bulkValue, 10)
    if (isNaN(n) || n < 1) { setError('최소 인원은 1명 이상이어야 합니다.'); return }
    setError(null)
    setBulkApplying(true)
    for (const slot of timeSlots) {
      await onUpdate(slot as TimeSlot, n)
    }
    setValues(Object.fromEntries(timeSlots.map(slot => [slot, n])))
    setBulkApplying(false)
    setBulkDone(true)
    setTimeout(() => setBulkDone(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-md animate-scale-in flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-[var(--color-border)] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">인원 설정</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">시간대별 최대 인원 수</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)] transition-all duration-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable slot grid */}
        <div className="px-5 py-4 overflow-y-auto">
          {/* Bulk apply */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
            <span className="text-xs font-medium text-[var(--color-text-muted)] shrink-0">일괄 적용</span>
            <input
              type="number" min={1} max={99}
              value={bulkValue}
              onChange={e => setBulkValue(e.target.value)}
              placeholder="인원"
              className="w-16 border border-[var(--color-border-strong)] rounded-lg px-2 py-1 text-sm text-center bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60"
            />
            <span className="text-xs text-[var(--color-text-muted)] shrink-0">명</span>
            <button
              onClick={handleBulkApply}
              disabled={bulkApplying || !bulkValue}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors"
            >
              {bulkApplying ? '적용 중...' : bulkDone ? '완료 ✓' : '전체 적용'}
            </button>
          </div>
          {error && (
            <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 mb-3">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {timeSlots.map(slot => (
              <div
                key={slot}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]"
              >
                <span className="text-xs font-medium text-[var(--color-text-primary)] shrink-0">
                  {slotLabels[slot]
                    ? <>{slotLabels[slot]} <span className="text-[10px] text-[var(--color-text-muted)] font-normal">{shortSlotLabel(slot)}</span></>
                    : shortSlotLabel(slot)}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={values[slot] ?? DEFAULT_MAX_CAPACITY}
                    onChange={e => handleInputChange(slot as TimeSlot, e.target.value)}
                    className="w-16 border border-[var(--color-border-strong)] rounded-lg px-1 py-1 text-sm text-center bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition-all duration-200"
                  />
                  <span className="text-xs text-[var(--color-text-muted)]">명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-[var(--color-border)] shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-xl py-2.5 text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-all duration-200"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[var(--color-brand-primary)] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-all duration-200"
          >
            {saving ? '저장 중...' : saved ? '저장 완료 ✓' : '저장'}
          </button>
        </div>

      </div>
    </div>
  )
}
