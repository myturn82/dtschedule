import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useLessonPackages } from '../../../hooks/useLessonPackages'
import { StepHeader, LESSON_STEP_META } from '../StepHeader'
import { WizardIcon } from '../WizardIcons'

interface Props {
  tenantId: string
}

export interface Step6LessonTypesRef {
  flush: () => Promise<boolean>
}

const inputCls = 'px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]'

const QUICK_EXAMPLES = [
  { name: '1:1 레슨 10회', count: '10', weeks: '12' },
  { name: '그룹 수업 20회', count: '20', weeks: '12' },
  { name: '체험 레슨 3회', count: '3', weeks: '4' },
]

export const Step6LessonTypes = forwardRef<Step6LessonTypesRef, Props>(function Step6LessonTypes({ tenantId }, ref) {
  const { packageTypes, loading, addPackageType, deletePackageType } = useLessonPackages(tenantId)
  const [name, setName] = useState('')
  const [count, setCount] = useState('')
  const [weeks, setWeeks] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const addPending = useCallback(async (): Promise<boolean> => {
    if (!name.trim() || !count) return true
    setSaving(true); setErr(null)
    const maxOrder = packageTypes.reduce((m, t) => Math.max(m, t.display_order), -1)
    const error = await addPackageType({
      name: name.trim(),
      session_count: parseInt(count, 10),
      validity_days: weeks ? parseInt(weeks, 10) * 7 : null,
      display_order: maxOrder + 1,
    })
    setSaving(false)
    if (error) { setErr(error); return false }
    setName(''); setCount(''); setWeeks('')
    return true
  }, [addPackageType, packageTypes, name, count, weeks])

  useImperativeHandle(ref, () => ({ flush: addPending }), [addPending])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await addPending()
  }

  function applyExample(ex: typeof QUICK_EXAMPLES[0]) {
    setName(ex.name)
    setCount(ex.count)
    setWeeks(ex.weeks)
    setErr(null)
  }

  return (
    <div>
      <StepHeader step={LESSON_STEP_META} />

      {/* 안내 예시 박스 */}
      <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/30 p-3.5 text-xs">
        <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">레슨권이란?</p>
        <p className="text-amber-700 dark:text-amber-400 mb-3 leading-relaxed">
          회원에게 판매하는 수업 묶음이에요. 종류를 미리 등록해두면<br />
          나중에 결제 기록할 때 클릭 한 번으로 바로 선택할 수 있어요.
        </p>
        <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">유효 기간이란?</p>
        <p className="text-amber-700 dark:text-amber-400 mb-3 leading-relaxed">
          결제일을 기준으로 만료일이 자동 계산돼요.<br />
          예: 결제일 1/1 + 12주 → 3/27 만료<br />
          비워두면 회차를 모두 소진할 때까지 무기한 사용 가능해요.
        </p>
        <p className="font-medium text-amber-800 dark:text-amber-300 mb-1.5">빠른 예시 — 눌러서 바로 채워보세요</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_EXAMPLES.map(ex => (
            <button
              key={ex.name}
              type="button"
              onClick={() => applyExample(ex)}
              className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-700/50 transition-colors select-none"
            >
              {ex.name} · {ex.weeks}주
            </button>
          ))}
        </div>
      </div>

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
                onClick={() => deletePackageType(t.id)}
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
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            레슨 종류 이름
          </label>
          <input
            className={`${inputCls} w-full`}
            placeholder="예: 1:1 PT 10회 / 수영 그룹 20회"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              회차 수 <span className="text-red-400">*</span>
            </label>
            <input
              className={`${inputCls} w-full`}
              type="number"
              min={1}
              placeholder="예: 10"
              value={count}
              onChange={e => setCount(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              유효 기간 (주) <span className="text-[var(--color-text-muted)] font-normal">선택</span>
            </label>
            <input
              className={`${inputCls} w-full`}
              type="number"
              min={1}
              placeholder="예: 12 → 3개월"
              value={weeks}
              onChange={e => setWeeks(e.target.value)}
            />
          </div>
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
})
