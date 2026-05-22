import { useState } from 'react'
import type { ProposedAssignment } from '../../utils/autoAssign'

interface Props {
  proposals: ProposedAssignment[]
  onConfirm: (selected: ProposedAssignment[]) => Promise<void>
  onClose: () => void
}

export function AutoAssignPreviewModal({ proposals, onConfirm, onClose }: Props) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const selected = proposals.filter(p => !excluded.has(p.id))
  const allChecked = excluded.size === 0

  function toggle(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setExcluded(allChecked ? new Set(proposals.map(p => p.id)) : new Set())
  }

  async function handleConfirm() {
    if (!selected.length) return
    setLoading(true)
    await onConfirm(selected)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-[var(--shadow-lg)] w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">자동배정 미리보기</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              총 <span className="font-semibold text-[var(--color-brand-primary)]">{selected.length}</span>건 배정 예정
              {excluded.size > 0 && (
                <span className="ml-1 text-[var(--color-text-muted)]">({excluded.size}건 제외)</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Table */}
        {proposals.length === 0 ? (
          <div className="flex items-center justify-center flex-1 py-12">
            <p className="text-sm text-[var(--color-text-muted)]">배정할 빈 슬롯이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-[var(--color-surface-secondary)] z-10">
                <tr>
                  <th className="px-3 py-2 text-left w-8">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded accent-[var(--color-brand-primary)]"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">날짜</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">시간대</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">역할</th>
                  <th className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)]">배정 회원</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => {
                  const isExcluded = excluded.has(p.id)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={`border-t border-[var(--color-border-table)] cursor-pointer transition-colors duration-100
                        ${isExcluded
                          ? 'opacity-40 bg-[var(--color-surface-secondary)]'
                          : 'hover:bg-[var(--color-surface-hover)]'}`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggle(p.id)}
                          onClick={e => e.stopPropagation()}
                          className="rounded accent-[var(--color-brand-primary)]"
                        />
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)] whitespace-nowrap">{p.dayLabel}</td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)] font-mono whitespace-nowrap">{p.timeSlot}</td>
                      <td className="px-3 py-2 text-[var(--color-text-muted)]">{p.roleName}</td>
                      <td className="px-3 py-2 font-semibold text-[var(--color-text-primary)]">{p.userName}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading || selected.length === 0}
            className="flex-1 bg-[var(--color-brand-primary)] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
          >
            {loading ? '저장 중...' : `${selected.length}건 저장`}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-xl py-2.5 text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-all duration-200"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
