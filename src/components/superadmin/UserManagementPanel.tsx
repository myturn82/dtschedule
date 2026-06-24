import { useState, useMemo } from 'react'
import { colorOf, initialsOf } from '../../lib/avatarColor'

export interface ProfileWithOrgCount {
  id: string
  name: string
  email: string | null
  is_super_admin: boolean
  created_at: string
  org_count: number
}

interface Props {
  users: ProfileWithOrgCount[]
  loading: boolean
  onDeleteUsers: (ids: string[]) => Promise<void>
}

export function UserManagementPanel({ users, loading, onDeleteUsers }: Props) {
  const [search, setSearch] = useState('')
  const [filterInactive, setFilterInactive] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<ProfileWithOrgCount[] | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (filterInactive && u.org_count > 0) return false
      if (q && !u.name.toLowerCase().includes(q) && !(u.email ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [users, search, filterInactive])

  const selectableIds = useMemo(
    () => new Set(filtered.filter(u => !u.is_super_admin).map(u => u.id)),
    [filtered]
  )

  const allChecked = selectableIds.size > 0 && [...selectableIds].every(id => selectedIds.has(id))

  function toggleAll() {
    if (allChecked) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectableIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setSelectedIds(prev => new Set([...prev, ...selectableIds]))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function openDeleteConfirm() {
    const toDelete = users.filter(u => selectedIds.has(u.id))
    setDeleteConfirm(toDelete)
  }

  async function executeDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    await onDeleteUsers(deleteConfirm.map(u => u.id))
    setSelectedIds(new Set())
    setDeleteConfirm(null)
    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름 또는 이메일 검색"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 focus:border-[var(--color-brand-primary)]"
        />
        <button
          onClick={() => setFilterInactive(v => !v)}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${filterInactive
            ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400'
            : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
        >
          미가입만
        </button>
      </div>

      {/* 액션바 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <span className="flex-1 text-sm font-semibold text-red-700 dark:text-red-400">
            {selectedIds.size}명 선택됨
          </span>
          <button
            onClick={openDeleteConfirm}
            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
          >
            선택 삭제
          </button>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide border-b border-[var(--color-border)]">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
          className="w-4 h-4 rounded accent-[var(--color-brand-primary)]"
        />
        <span className="flex-1">이름 / 이메일</span>
        <span className="w-16 text-right">조직</span>
        <span className="w-20 text-right">가입일</span>
      </div>

      {/* 목록 */}
      {loading && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">불러오는 중...</p>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">검색 결과가 없습니다.</p>
      )}
      {!loading && filtered.map(user => {
        const { bg, fg } = colorOf(user.name)
        const isChecked = selectedIds.has(user.id)
        const isDisabled = user.is_super_admin

        return (
          <label
            key={user.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors cursor-pointer ${isChecked
              ? 'bg-[var(--color-brand-primary)]/5 border-[var(--color-brand-primary)]/30'
              : 'border-transparent hover:bg-[var(--color-surface-hover)]'} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isDisabled}
              onChange={() => !isDisabled && toggleOne(user.id)}
              className="w-4 h-4 rounded accent-[var(--color-brand-primary)] flex-shrink-0"
            />
            <span className="hub-avatar flex-shrink-0" style={{ background: bg, color: fg }}>{initialsOf(user.name)}</span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{user.name}</span>
                {user.is_super_admin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">슈퍼관리자</span>
                )}
              </span>
              <span className="block text-[11px] text-[var(--color-text-muted)] truncate">{user.email ?? '-'}</span>
            </span>
            <span className="w-16 flex justify-end flex-shrink-0">
              {user.org_count === 0 ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                  미가입
                </span>
              ) : (
                <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">{user.org_count}개</span>
              )}
            </span>
            <span className="w-20 text-right text-[11px] text-[var(--color-text-muted)] flex-shrink-0" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {user.created_at.slice(0, 10)}
            </span>
          </label>
        )
      })}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg">사용자 {deleteConfirm.length}명 삭제</h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {deleteConfirm.map(u => (
                <div key={u.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-secondary)] text-sm">
                  <span className="font-semibold text-[var(--color-text-primary)] truncate">{u.name}</span>
                  <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0 ml-2">조직 {u.org_count}개</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-500">이 작업은 되돌릴 수 없습니다. 사용자의 프로필과 모든 소속 정보가 삭제됩니다.</p>
            <div className="flex gap-2">
              <button
                disabled={deleting}
                onClick={executeDelete}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {deleting ? '삭제 중...' : '영구 삭제'}
              </button>
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
