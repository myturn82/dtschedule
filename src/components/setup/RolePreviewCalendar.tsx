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

  const lm = {
    bg:       '#ffffff',
    bgSub:    '#f9fafb',
    border:   '#e5e7eb',
    borderSt: '#d1d5db',
    textMd:   '#9ca3af',
    textSub:  '#6b7280',
    sun:      '#fef9c3',
    sunInk:   '#854d0e',
  }

  return (
    <div style={{ colorScheme: 'light', borderRadius: 12, border: `1px solid ${lm.border}`, overflow: 'hidden', background: lm.bg, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', color: '#111827' }}>
      {/* Header */}
      <div style={{ display: 'flex', background: lm.bgSub, borderBottom: `1px solid ${lm.border}` }}>
        <div style={{ width: 64, flexShrink: 0, padding: '6px 4px', fontSize: 9, fontWeight: 500, color: lm.textMd, textAlign: 'center' }}>시간</div>
        <div style={{ flex: 1, borderLeft: `1px solid ${lm.border}` }}>
          {hasSplit ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${splitRoles.length}, 1fr)` }}>
              {splitRoles.map((r, i) => (
                <div key={r.id} style={{ padding: '4px 4px', fontSize: 9, fontWeight: 600, textAlign: 'center', color: lm.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderLeft: i > 0 ? `1px dashed ${lm.border}` : undefined }}>
                  {r.name}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '4px 8px', fontSize: 9, fontWeight: 500, textAlign: 'center', color: lm.textMd }}>
              {new Date().getMonth() + 1}월 스케줄
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      {SAMPLE_SLOTS.map((slot, si) => (
        <div key={slot} style={{ display: 'flex', borderBottom: si < SAMPLE_SLOTS.length - 1 ? `1px solid ${lm.border}` : undefined, minHeight: 40 }}>
          <div style={{ width: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: lm.textMd, borderRight: `1px solid ${lm.border}`, background: lm.bgSub, fontWeight: 500, padding: '0 4px', textAlign: 'center', lineHeight: 1.3 }}>
            {slotLabel(slot)}
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'stretch' }}>
            {barRoles.length > 0 && (
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, zIndex: 10, background: INDICATOR_BAR_COLOR }} />
            )}
            {hasSplit ? (
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${splitRoles.length}, 1fr)` }}>
                {splitRoles.map((role, ri) => {
                  const name = SAMPLE_NAMES[(si + ri) % SAMPLE_NAMES.length]
                  const hasSample = (si + ri) % 3 !== 2
                  return (
                    <div key={role.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderLeft: ri > 0 ? `1px dashed ${lm.borderSt}` : undefined, background: hasSample ? lm.sun : undefined }}
                    >
                      {hasSample && (
                        <span style={{ fontSize: 9, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: lm.sunInk }}>{name}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, background: si < 2 ? lm.sun : undefined }}>
                {si < 2 && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: lm.sunInk }}>
                    {SAMPLE_NAMES[si]}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ padding: '6px 12px', fontSize: 9, color: lm.textMd, textAlign: 'center', background: lm.bgSub }}>
        {roles.length === 0 && '역할이 없으면 단일 칸으로 표시됩니다'}
        {hasSplit && `역할 ${splitRoles.length}개 칸 분리 미리보기`}
        {!hasSplit && barRoles.length > 0 && `바 표시(${barRoles.map(r => r.name).join(', ')}) 미리보기`}
      </div>
    </div>
  )
}
