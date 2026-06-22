import type { TenantRole } from '../../types'

const INDICATOR_BAR_COLOR = 'oklch(0.65 0.15 60)'
const SAMPLE_NAMES = ['김민준', '이서연', '박지호']
const SAMPLE_SLOTS = ['9-11', '11-13', '13-15']

interface Props {
  roles: TenantRole[]
  previewMode?: 'none' | 'split' | 'bar'
  previewName?: string
}

export function RolePreviewCalendar({ roles, previewMode, previewName }: Props) {
  const previewRole: TenantRole | null = previewMode && previewMode !== 'none'
    ? {
        id: '__preview__',
        tenant_id: '',
        name: previewName || '새 역할',
        split_cell: previewMode === 'split',
        indicator_bar: previewMode === 'bar',
        requires_customer_info: false,
        display_order: 999,
        created_at: '',
      }
    : null
  const allRoles = previewRole ? [...roles, previewRole] : roles
  const splitRoles = allRoles.filter(r => r.split_cell && !r.indicator_bar)
  const barRoles = allRoles.filter(r => r.indicator_bar)
  const hasSplit = splitRoles.length > 0

  function slotLabel(slot: string) {
    const [s, e] = slot.split('-').map(Number)
    return `${s}:00~${e}:00`
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-sm text-[var(--color-text-primary)]">
      {/* Header */}
      <div className="flex bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
        <div className="w-16 shrink-0 px-1 py-1.5 text-[9px] font-medium text-[var(--color-text-muted)] text-center">시간</div>
        <div className="flex-1 border-l border-[var(--color-border)]">
          {hasSplit ? (
            <div className="grid" style={{ gridTemplateColumns: `repeat(${splitRoles.length}, 1fr)` }}>
              {splitRoles.map((r, i) => (
                <div key={r.id} className={`py-1 px-1 text-[9px] font-semibold text-center text-[var(--color-text-secondary)] truncate ${i > 0 ? 'border-l border-dashed border-[var(--color-border)]' : ''}`}>
                  {r.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-1 px-2 text-[9px] font-medium text-center text-[var(--color-text-muted)]">
              {new Date().getMonth() + 1}월 스케줄
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      {SAMPLE_SLOTS.map((slot, si) => (
        <div key={slot} className="flex border-b border-[var(--color-border)] last:border-b-0" style={{ minHeight: 40 }}>
          <div className="w-16 shrink-0 flex items-center justify-center text-[9px] text-[var(--color-text-muted)] border-r border-[var(--color-border)] bg-[var(--color-surface-secondary)] font-medium px-1 text-center leading-tight">
            {slotLabel(slot)}
          </div>
          <div className="flex-1 relative flex items-stretch">
            {barRoles.length > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] z-10" style={{ background: INDICATOR_BAR_COLOR }} />
            )}
            {hasSplit ? (
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${splitRoles.length}, 1fr)` }}>
                {splitRoles.map((role, ri) => {
                  const name = SAMPLE_NAMES[(si + ri) % SAMPLE_NAMES.length]
                  const hasSample = (si + ri) % 3 !== 2
                  return (
                    <div key={role.id}
                      className={`flex items-center justify-center p-1 ${ri > 0 ? 'border-l border-dashed border-[var(--color-border-strong)]' : ''}`}
                      style={{ background: hasSample ? 'var(--tint-sun)' : undefined }}
                    >
                      {hasSample && (
                        <span className="text-[9px] font-semibold truncate" style={{ color: 'var(--tint-sun-ink)' }}>{name}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-1"
                style={{ background: si < 2 ? 'var(--tint-sun)' : undefined }}>
                {si < 2 && (
                  <span className="text-[9px] font-semibold" style={{ color: 'var(--tint-sun-ink)' }}>
                    {SAMPLE_NAMES[si]}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="px-3 py-1.5 text-[9px] text-[var(--color-text-muted)] text-center bg-[var(--color-surface-secondary)]">
        {roles.length === 0 && '역할이 없으면 단일 칸으로 표시됩니다'}
        {hasSplit && `역할 ${splitRoles.length}개 칸 분리 미리보기`}
        {!hasSplit && barRoles.length > 0 && `바 표시(${barRoles.map(r => r.name).join(', ')}) 미리보기`}
      </div>
    </div>
  )
}
