import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TAB_LABELS, type Tab } from '../lib/adminTabs'
import { getFF, type FeatureFlags } from '../lib/featureFlags'
import { useAdminFavorites } from '../hooks/useAdminFavorites'

// ─── 최근 본 메뉴 (localStorage) ─────────────────────────────────────────────
const RECENT_KEY = 'dts_recent_menus'
const MAX_RECENT = 8

interface RecentItem { id: string; label: string }

function getRecent(): RecentItem[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
export function pushRecent(item: RecentItem) {
  const list = getRecent().filter(i => i.id !== item.id)
  list.unshift(item)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
}
function dropRecent(id: string) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter(i => i.id !== id)))
}

// ─── 타입 정의 ───────────────────────────────────────────────────────────────
interface NavMenuItem { id: string; label: string; path: string; keywords?: string[] }
interface NavMenuGroup { id: string; label: string; description: string; items: NavMenuItem[] }

export interface ExtraMenuItem {
  id: string
  label: string
  active?: boolean
  danger?: boolean
  action: (close: () => void) => void
}
export interface ExtraMenuGroup {
  id: string
  label: string
  description: string
  items: ExtraMenuItem[]
}

// ─── 관리자 탭 그룹 (전체) ───────────────────────────────────────────────────
export const MENU_GROUPS: NavMenuGroup[] = [
  {
    id: 'members', label: '회원 관리', description: '회원 · 역할 · 입력항목 · 출석',
    items: [
      { id: 'tab:members',       label: '회원 관리',           path: '/admin?tab=members',      keywords: ['회원', '멤버', '사용자'] },
      { id: 'tab:roles',         label: '역할 관리',           path: '/admin?tab=roles',         keywords: ['역할', '권한'] },
      { id: 'tab:custom_fields', label: '입력항목',            path: '/admin?tab=custom_fields', keywords: ['입력', '필드', '커스텀'] },
      { id: 'tab:attendance',    label: '출석 현황',           path: '/admin?tab=attendance',    keywords: ['출석', '현황'] },
      { id: 'tab:hours',         label: '시간 집계',           path: '/admin?tab=hours',         keywords: ['시간', '집계', '통계'] },
    ],
  },
  {
    id: 'schedule', label: '스케줄 설정', description: '시간 · 요일 · 자동배정 · 범례',
    items: [
      { id: 'tab:rules',      label: '날짜·요일·시간 설정', path: '/admin?tab=rules',      keywords: ['날짜', '요일', '시간', '규칙'] },
      { id: 'tab:autoassign', label: '자동배정관리',          path: '/admin?tab=autoassign', keywords: ['자동', '배정'] },
      { id: 'tab:legend',     label: '범례 관리',           path: '/admin?tab=legend',     keywords: ['범례', '색상'] },
    ],
  },
  {
    id: 'service', label: '서비스 설정', description: '조직 설정 · 알림 · 레슨권 · 피드백',
    items: [
      { id: 'tab:settings',      label: '조직 설정', path: '/admin?tab=settings',      keywords: ['조직', '설정'] },
      { id: 'tab:notifications', label: '배정알림',  path: '/admin?tab=notifications', keywords: ['알림'] },
      { id: 'tab:lessons',       label: '레슨권',    path: '/admin?tab=lessons',       keywords: ['레슨', '수업권'] },
      { id: 'tab:feedback',      label: '피드백',    path: '/admin?tab=feedback',      keywords: ['피드백', '의견'] },
    ],
  },
]

// ─── Props ───────────────────────────────────────────────────────────────────
interface FullScreenMenuProps {
  profile: { name: string } | null
  tenant: {
    name: string
    settings?: {
      title?: string
      feature_flags?: FeatureFlags
      tenant_mode?: string
    }
  } | null
  isPrivileged: boolean
  isSuperAdmin: boolean
  isCustomerAdmin: boolean
  extraMenuGroups?: ExtraMenuGroup[]
  asSidebar?: boolean
  onClose: () => void
  onShowProfile?: () => void
  onShowNotifications?: () => void
  unreadCount?: number
  isDark: boolean
  onToggleDark: () => void
  onSignOut: () => void
}

// ─── 카드 아이콘 ─────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
)
const MinusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
)

// ─── 그리드 배치 스타일 계산 ─────────────────────────────────────────────────
// 규칙: 확장 카드 → 풀폭 / 같은 열 → 제자리 / 다른 열 확장 행 이후 → 1행 아래
function computeGridStyle(idx: number, _groups: Array<{ id: string }>, expandedIdx: number): React.CSSProperties {
  if (expandedIdx < 0) return {}

  const naturalRow = Math.floor(idx / 2) + 1
  const naturalCol = (idx % 2) + 1
  const expRow = Math.floor(expandedIdx / 2) + 1
  const expCol = (expandedIdx % 2) + 1

  if (idx === expandedIdx) {
    return { gridRow: expRow, gridColumn: '1 / -1' }
  }

  // 같은 열: 항상 제자리
  if (naturalCol === expCol) {
    return { gridRow: naturalRow, gridColumn: naturalCol }
  }

  // 다른 열, 확장 행보다 위: 제자리
  if (naturalRow < expRow) {
    return { gridRow: naturalRow, gridColumn: naturalCol }
  }

  // 다른 열, 확장 행 이후: 1행 아래로
  return { gridRow: naturalRow + 1, gridColumn: naturalCol }
}

// ─── Nav 그룹 카드 (확장 포함) ───────────────────────────────────────────────
function NavGroupCard({ group, isExpanded, onToggle, isPrivileged, isFavorite, toggleFavorite, goTo, style }: {
  group: NavMenuGroup
  isExpanded: boolean
  onToggle: () => void
  isPrivileged: boolean
  isFavorite: (id: Tab) => boolean
  toggleFavorite: (id: Tab) => void
  goTo: (item: { id: string; label: string; path: string }) => void
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] overflow-hidden"
    >
      <button onClick={onToggle} className="w-full text-left p-3.5 hover:bg-[var(--color-surface-hover)] transition-colors">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-0.5 rounded-full bg-[var(--color-brand-primary)] opacity-70" />
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
            {isExpanded ? <MinusIcon /> : <PlusIcon />}
          </span>
        </div>
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{group.label}</p>
        <p className={`text-[11px] leading-snug text-[var(--color-text-muted)] overflow-hidden transition-all duration-250 ${isExpanded ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
          {group.description}
        </p>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="rounded-xl mx-3 mb-3 overflow-hidden border border-[var(--color-border)]">
          {group.items.map((item, idx) => {
            const tabId = item.id.replace('tab:', '') as Tab
            return (
              <div key={item.id} className="flex items-center" style={{ borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none' }}>
                <button onClick={() => goTo(item)}
                  className="flex-1 flex items-center justify-between px-4 py-3.5 hover:bg-[var(--color-surface-hover)] transition-colors text-left">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-[var(--color-text-muted)]"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                {isPrivileged && (
                  <button onClick={() => toggleFavorite(tabId)}
                    className={`px-4 py-3.5 hover:bg-[var(--color-surface-hover)] transition-colors ${isFavorite(tabId) ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-muted)] opacity-30 hover:opacity-70'}`}
                    title={isFavorite(tabId) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                    <StarIcon filled={isFavorite(tabId)} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Extra 그룹 카드 (확장 포함) ─────────────────────────────────────────────
function ExtraGroupCard({ group, isExpanded, onToggle, onClose, style }: {
  group: ExtraMenuGroup
  isExpanded: boolean
  onToggle: () => void
  onClose: () => void
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] overflow-hidden"
    >
      <button onClick={onToggle} className="w-full text-left p-3.5 hover:bg-[var(--color-surface-hover)] transition-colors">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 h-0.5 rounded-full bg-[var(--color-brand-primary)] opacity-70" />
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
            {isExpanded ? <MinusIcon /> : <PlusIcon />}
          </span>
        </div>
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{group.label}</p>
        <p className={`text-[11px] leading-snug text-[var(--color-text-muted)] overflow-hidden transition-all duration-250 ${isExpanded ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
          {group.description}
        </p>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="rounded-xl mx-3 mb-3 overflow-hidden border border-[var(--color-border)]">
          {group.items.map((item, idx) => (
            <button key={item.id} onClick={() => item.action(onClose)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
              style={{ borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none' }}>
              <span className={`text-sm font-medium ${item.danger ? 'text-red-500' : item.active ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-primary)]'}`}>{item.label}</span>
              {item.active && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]">ON</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export function FullScreenMenu({
  profile, tenant, isPrivileged, isSuperAdmin, isCustomerAdmin,
  extraMenuGroups = [], asSidebar = false, onClose,
  onShowProfile, onShowNotifications,
  unreadCount = 0, isDark, onToggleDark, onSignOut,
}: FullScreenMenuProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [recent, setRecent] = useState<RecentItem[]>(getRecent)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragTo, setDragTo] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const { favorites, isFavorite, toggleFavorite, reorderFavorites } = useAdminFavorites()

  // 피처 플래그 기반 메뉴 필터링
  const ff = tenant?.settings?.feature_flags
  const filteredMenuGroups = MENU_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      const tabId = item.id.replace('tab:', '')
      if (tabId === 'attendance'    && !getFF(ff, 'attendance'))      return false
      if (tabId === 'hours'         && !getFF(ff, 'volunteer_hours')) return false
      if (tabId === 'autoassign'    && !getFF(ff, 'autoassign'))      return false
      if (tabId === 'notifications' && !getFF(ff, 'notifications'))   return false
      if (tabId === 'lessons'       && !getFF(ff, 'lesson_packages')) return false
      return true
    }),
  })).filter(g => g.items.length > 0)

  const allFilteredNavItems = filteredMenuGroups.flatMap(g => g.items.map(i => ({ ...i, groupLabel: g.label })))

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const goTo = useCallback((item: { id: string; label: string; path: string }) => {
    pushRecent({ id: item.id, label: item.label })
    setRecent(getRecent())
    navigate(item.path)
    onClose()
  }, [navigate, onClose])

  const removeRecent = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dropRecent(id)
    setRecent(getRecent())
  }, [])

  // 검색 필터
  const q = search.trim().toLowerCase()
  const navResults = q
    ? allFilteredNavItems.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.groupLabel.toLowerCase().includes(q) ||
        (i.keywords ?? []).some(k => k.includes(q))
      )
    : []
  const extraResults = q
    ? extraMenuGroups.flatMap(g =>
        g.items
          .filter(i => i.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q))
          .map(i => ({ ...i, groupLabel: g.label }))
      )
    : []

  // 빠른 접근 링크
  const quickLinks = [
    { id: 'quick:schedule', label: '스케줄', path: '/schedule', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v4M16 4v4"/></svg> },
    ...(isPrivileged ? [{ id: 'quick:admin', label: '관리자콘솔', path: '/admin', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg> }] : []),
    ...(isSuperAdmin ? [{ id: 'quick:super', label: '조직관리', path: '/superadmin', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }] : []),
    ...(isCustomerAdmin && !isSuperAdmin ? [{ id: 'quick:cust', label: '고객 어드민', path: '/customer-admin', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/></svg> }] : []),
  ]

  const orgName = tenant?.settings?.title || tenant?.name || ''

  // 즐겨찾기 중 실제 필터링된 메뉴에 있는 것만 표시
  const visibleFavorites = favorites.filter(tabId =>
    allFilteredNavItems.some(i => i.id === `tab:${tabId}`)
  )

  const inputCls = "w-full pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-brand-primary)] transition-colors"

  return (
    <>
    {asSidebar && (
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
    )}
    <div className={asSidebar
      ? "fixed top-0 left-0 bottom-0 z-50 w-[400px] bg-[var(--color-bg)] overflow-y-auto shadow-2xl border-r border-[var(--color-border)]"
      : "fixed inset-0 z-50 bg-[var(--color-bg)] overflow-y-auto"
    }>
      {/* ── 헤더 ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 z-10 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          aria-label="닫기"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
        </button>
        <span className="text-sm font-semibold text-[var(--color-text-secondary)]">메뉴</span>
        <div className="flex items-center gap-2">
          {onShowNotifications && (
            <button
              onClick={() => { onShowNotifications(); onClose() }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label="알림"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6z"/><path d="M8 16a2 2 0 0 0 4 0"/></svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={onToggleDark}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label={isDark ? '라이트 모드' : '다크 모드'}
          >
            {isDark
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </div>

      {/* ── 프로필 ────────────────────────────────────────────────────────── */}
      {profile && (
        <button
          onClick={() => { onShowProfile?.(); onClose() }}
          className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[var(--color-surface-secondary)] transition-colors text-left border-b border-[var(--color-border)]"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-brand-primary-contrast)] text-xl font-bold shrink-0 bg-[var(--color-brand-primary)]">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-bold text-[var(--color-text-primary)]">{profile.name} 님</p>
            {orgName && <p className="text-sm text-[var(--color-text-muted)] truncate">{orgName}</p>}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-[var(--color-text-muted)]"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      <div className="px-4 pt-4 pb-6 space-y-4">
        {/* ── 검색 ─────────────────────────────────────────────────────────── */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="메뉴, 기능 등을 검색해 보세요."
            className={inputCls}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
            </button>
          )}
        </div>

        {/* ── 검색 결과 ─────────────────────────────────────────────────────── */}
        {search.trim() ? (
          <div className="space-y-4">
            {navResults.length === 0 && extraResults.length === 0 ? (
              <p className="text-sm py-8 text-center text-[var(--color-text-muted)]">검색 결과가 없습니다.</p>
            ) : (
              <>
                {navResults.length > 0 && (
                  (() => {
                    const byGroup: Record<string, typeof navResults> = {}
                    navResults.forEach(i => { if (!byGroup[i.groupLabel]) byGroup[i.groupLabel] = []; byGroup[i.groupLabel].push(i) })
                    return Object.entries(byGroup).map(([gl, items]) => (
                      <div key={gl}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[var(--color-text-muted)]">{gl}</p>
                        <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                          {items.map((item, idx) => {
                            const tabId = item.id.replace('tab:', '') as Tab
                            return (
                              <div key={item.id} className="flex items-center" style={{ borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none' }}>
                                <button onClick={() => goTo(item)}
                                  className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-hover)] transition-colors text-left">
                                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-[var(--color-text-muted)]"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                                {isPrivileged && (
                                  <button onClick={() => toggleFavorite(tabId)}
                                    className={`px-3 py-3 hover:bg-[var(--color-surface-hover)] transition-colors ${isFavorite(tabId) ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-muted)] opacity-40 hover:opacity-80'}`}
                                    title={isFavorite(tabId) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                                    <StarIcon filled={isFavorite(tabId)} />
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()
                )}
                {extraResults.length > 0 && (
                  (() => {
                    const byGroup: Record<string, typeof extraResults> = {}
                    extraResults.forEach(i => { if (!byGroup[i.groupLabel]) byGroup[i.groupLabel] = []; byGroup[i.groupLabel].push(i) })
                    return Object.entries(byGroup).map(([gl, items]) => (
                      <div key={gl}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[var(--color-text-muted)]">{gl}</p>
                        <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                          {items.map((item, idx) => (
                            <button key={item.id} onClick={() => { item.action(onClose) }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-surface-hover)] transition-colors text-left"
                              style={{ borderTop: idx > 0 ? '1px solid var(--color-border)' : 'none' }}>
                              <span className={`text-sm font-medium ${item.danger ? 'text-red-500' : item.active ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-primary)]'}`}>{item.label}</span>
                              {item.active && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)]">ON</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  })()
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* ── 빠른 접근 ─────────────────────────────────────────────────── */}
            <div className="flex gap-2">
              {quickLinks.map((link) => (
                <button key={link.id}
                  onClick={() => { pushRecent({ id: link.id, label: link.label }); setRecent(getRecent()); navigate(link.path); onClose() }}
                  className="flex-1 flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors min-w-0">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">{link.icon}</span>
                  <span className="text-[11px] font-medium text-[var(--color-text-primary)] text-center leading-tight truncate w-full">{link.label}</span>
                </button>
              ))}
            </div>

            {/* ── 즐겨찾기 (최근 본 메뉴 위) ──────────────────────────────── */}
            {isPrivileged && visibleFavorites.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[var(--color-text-muted)]">즐겨찾기 <span className="font-normal normal-case opacity-60">드래그로 순서 변경</span></p>
                <div className="grid grid-cols-3 gap-2">
                  {visibleFavorites.map((tabId, idx) => (
                    <div
                      key={tabId}
                      draggable
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragFrom(idx) }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragTo(idx) }}
                      onDrop={e => {
                        e.preventDefault()
                        if (dragFrom !== null && dragFrom !== idx) reorderFavorites(dragFrom, idx)
                        setDragFrom(null); setDragTo(null)
                      }}
                      onDragEnd={() => { setDragFrom(null); setDragTo(null) }}
                      className={`rounded-2xl transition-all ${dragFrom === idx ? 'opacity-40 scale-95' : ''} ${dragTo === idx && dragFrom !== idx ? 'ring-2 ring-[var(--color-brand-primary)]' : ''}`}
                    >
                      <button
                        onClick={() => goTo({ id: `tab:${tabId}`, label: TAB_LABELS[tabId], path: `/admin?tab=${tabId}` })}
                        className="text-left rounded-2xl p-2.5 border border-[var(--color-border)] bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors w-full cursor-grab active:cursor-grabbing">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="flex-1 h-0.5 rounded-full bg-[var(--color-brand-primary)] opacity-70" />
                          <span
                            role="button"
                            onClick={e => { e.stopPropagation(); toggleFavorite(tabId) }}
                            className="w-4 h-4 flex items-center justify-center rounded-md shrink-0 text-[var(--color-brand-primary)] opacity-60 hover:opacity-100 transition-opacity"
                            title="즐겨찾기 해제">
                            <StarIcon filled={true} />
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-primary)] leading-tight line-clamp-2">{TAB_LABELS[tabId]}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 최근 본 메뉴 ─────────────────────────────────────────────── */}
            {recent.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[var(--color-text-muted)]">최근 본 메뉴</p>
                <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                  {recent.slice(0, 8).map(item => {
                    const path = item.id.startsWith('tab:')
                      ? `/admin?tab=${item.id.replace('tab:', '')}`
                      : item.id === 'quick:schedule' ? '/schedule'
                      : item.id === 'quick:admin' ? '/admin'
                      : item.id === 'quick:super' ? '/superadmin'
                      : item.id === 'quick:cust' ? '/customer-admin'
                      : null
                    return (
                      <button
                        key={item.id}
                        onClick={() => { if (path) { navigate(path); onClose() } }}
                        className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg text-sm border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0"
                      >
                        <span className="whitespace-nowrap">{item.label}</span>
                        <span
                          role="button"
                          onClick={e => removeRecent(item.id, e)}
                          className="flex items-center justify-center w-4 h-4 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                          aria-label="삭제"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── 구분선 ───────────────────────────────────────────────────── */}
            <div className="h-px bg-[var(--color-border)]" />

            {/* ── 메뉴 카테고리 그리드 (제자리 확장) ──────────────────── */}
            <div className="space-y-4">
              {(() => {
                const expandedIdx = filteredMenuGroups.findIndex(g => g.id === expandedId)
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredMenuGroups.map((g, idx) => (
                      <NavGroupCard
                        key={g.id}
                        group={g}
                        isExpanded={expandedId === g.id}
                        onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                        isPrivileged={isPrivileged}
                        isFavorite={isFavorite}
                        toggleFavorite={toggleFavorite}
                        goTo={goTo}
                        style={expandedIdx >= 0 ? computeGridStyle(idx, filteredMenuGroups, expandedIdx) : undefined}
                      />
                    ))}
                  </div>
                )
              })()}

              {extraMenuGroups.length > 0 && (
                <div>
                  <div className="h-px bg-[var(--color-border)] mb-3" />
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-[var(--color-text-muted)]">스케줄 기능</p>
                  {(() => {
                    const expandedIdx = extraMenuGroups.findIndex(g => g.id === expandedId)
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {extraMenuGroups.map((g, idx) => (
                          <ExtraGroupCard
                            key={g.id}
                            group={g}
                            isExpanded={expandedId === g.id}
                            onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                            onClose={onClose}
                            style={expandedIdx >= 0 ? computeGridStyle(idx, extraMenuGroups, expandedIdx) : undefined}
                          />
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div>
                <div className="h-px bg-[var(--color-border)] mb-1" />
                <button onClick={() => { onSignOut(); onClose() }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors text-left">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">로그아웃</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  )
}
