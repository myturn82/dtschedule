import { useState } from 'react'
import { useLessonPackages } from '../../../hooks/useLessonPackages'
import { StepHeader, LESSON_STEP_META } from '../StepHeader'
import { WizardIcon } from '../WizardIcons'

interface Props {
  tenantId: string
}

const inputCls = 'px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

export function Step6LessonTypes({ tenantId }: Props) {
  const { packageTypes, loading, addPackageType, deletePackageType } = useLessonPackages(tenantId)
  const [name, setName] = useState('')
  const [count, setCount] = useState('')
  const [weeks, setWeeks] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !count) return
    setSaving(true); setErr(null)
    const maxOrder = packageTypes.reduce((m, t) => Math.max(m, t.display_order), -1)
    const error = await addPackageType({
      name: name.trim(),
      session_count: parseInt(count, 10),
      validity_days: weeks ? parseInt(weeks, 10) * 7 : null,
      display_order: maxOrder + 1,
    })
    setSaving(false)
    if (error) { setErr(error); return }
    setName(''); setCount(''); setWeeks('')
  }

  async function handleDelete(id: string) {
    await deletePackageType(id)
  }

  return (
    <div>
      <StepHeader step={LESSON_STEP_META} />

      {/* 등록된 종류 목록 */}
      {packageTypes.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {packageTypes.map(t => (
            <li key={t.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">{t.name}</span>
              <span className="text-[var(--color-text-muted)]">
                {t.session_count}회
                {t.validity_days ? ` · ${t.validity_days / 7}주` : ''}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="ml-auto p-1 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                aria-label="삭제"
              >
                <WizardIcon.trash size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 추가 폼 */}
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input
          className={inputCls}
          placeholder="레슨 종류 이름 (예: 1:1 PT 10회)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            type="number"
            min={1}
            placeholder="회차 수"
            value={count}
            onChange={e => setCount(e.target.value)}
          />
          <input
            className={`${inputCls} flex-1`}
            type="number"
            min={1}
            placeholder="유효 기간(주, 선택)"
            value={weeks}
            onChange={e => setWeeks(e.target.value)}
          />
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button
          type="submit"
          disabled={!name.trim() || !count || saving || loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] text-sm font-semibold disabled:opacity-40 transition-opacity"
        >
          <WizardIcon.plus size={14} />
          {saving ? '추가 중...' : '레슨 종류 추가'}
        </button>
      </form>

      <p className="mt-4 text-xs text-center text-[var(--color-text-muted)]">
        나중에 관리자 화면에서 언제든 추가·수정할 수 있어요.
      </p>
    </div>
  )
}
