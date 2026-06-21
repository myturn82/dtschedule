import { useState } from 'react'
import { RolePreviewCalendar } from '../RolePreviewCalendar'
import type { TenantRole } from '../../../types'

interface Props {
  roles: TenantRole[]
  error: string
  onAdd: (name: string, splitCell: boolean, requiresCustomerInfo: boolean, indicatorBar: boolean) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
}

type DisplayMode = 'none' | 'split' | 'bar'

const DISPLAY_OPTIONS: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'none',  label: '표시 없음', desc: '역할로만 분류, 칸 구분 없음' },
  { value: 'split', label: '칸 분리',   desc: '역할별로 달력에 칸이 나뉩니다' },
  { value: 'bar',   label: '바 표시',   desc: '셀 좌측에 색상 바가 나타납니다' },
]

export function Step4Roles({ roles, error, onAdd, onDelete }: Props) {
  const [name, setName] = useState('')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('none')
  const [requiresCustomerInfo, setRequiresCustomerInfo] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    setAddError('')
    const err = await onAdd(name.trim(), displayMode === 'split', requiresCustomerInfo, displayMode === 'bar')
    if (err) setAddError(err)
    else { setName(''); setDisplayMode('none'); setRequiresCustomerInfo(false) }
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">👥</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">역할이 필요한가요?</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">'팀장·봉사자', '강사·보조' 처럼 역할을 구분하면 달력에서 역할별로 칸이 나뉩니다.</p>
      </div>

      {/* Live preview */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">미리보기</p>
        <RolePreviewCalendar roles={roles} />
      </div>

      {/* Current roles */}
      {roles.length > 0 && (
        <div className="space-y-1.5">
          {roles.map(role => (
            <div key={role.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
              <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{role.name}</span>
              {role.split_cell && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">칸분리</span>}
              {role.indicator_bar && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">바표시</span>}
              {role.requires_customer_info && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">고객정보</span>}
              <button onClick={() => onDelete(role.id)} className="text-[var(--color-text-muted)] hover:text-red-500 text-sm select-none">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="space-y-3 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">역할 추가</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="예: 팀장, 강사, 봉사자"
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-1.5">달력 표시 방식</p>
          <div className="flex gap-1.5">
            {DISPLAY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDisplayMode(opt.value)}
                className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-medium border transition-colors ${
                  displayMode === opt.value
                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 text-[var(--color-brand-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)]/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
            {DISPLAY_OPTIONS.find(o => o.value === displayMode)?.desc}
          </p>
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={requiresCustomerInfo} onChange={e => setRequiresCustomerInfo(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--color-brand-primary)] mt-0.5 shrink-0" />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm text-[var(--color-text-secondary)]">배정 시 고객 정보 수집</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">이 역할의 배정 등록 시 담당 고객 연락처 등을 함께 입력받습니다 (예: PT 트레이너)</span>
          </span>
        </label>
        {addError && <p className="text-xs text-red-500">{addError}</p>}
        <button
          onClick={handleAdd}
          disabled={!name.trim() || adding}
          className="w-full py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 disabled:opacity-40 transition-colors"
        >
          {adding ? '추가 중...' : '+ 역할 추가'}
        </button>
      </div>

      {/* Note */}
      <p className="text-sm text-center text-[var(--color-text-muted)]">
        💡 역할이 없어도 괜찮아요 — 시간대별 배정만 필요하다면 바로 다음으로 넘어가세요.
      </p>

      {/* Error */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
