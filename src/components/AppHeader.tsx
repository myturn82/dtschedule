import { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCustomerAdmin } from '../hooks/useCustomerAdmin'
import { useTenant } from '../contexts/TenantContext'
import { displayMode } from '../lib/tenantMode'
import { DashboardNav } from './DashboardNav'
import { ProfileModal } from './auth/ProfileModal'
import { JoinOrgModal } from './modals/JoinOrgModal'
import { StartServiceModal } from './modals/StartServiceModal'
import { QuickBookingModal } from './modals/QuickBookingModal'
import { useNotifications } from '../hooks/useNotifications'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { NotificationPanel } from './notifications/NotificationPanel'
import { useDarkMode } from '../contexts/DarkModeContext'
import { FeedbackModal } from './modals/FeedbackModal'
import { useFeedbackBadge } from '../hooks/useFeedbackBadge'
import { FullScreenMenu, MENU_GROUPS, type ExtraMenuGroup } from './FullScreenMenu'
import { WizardIcon } from './setup/WizardIcons'

function SidebarGroupIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    members: <WizardIcon.users size={11} />,
    schedule: <WizardIcon.calendar size={11} />,
    service: <WizardIcon.gear size={11} />,
  }
  return <>{icons[id] ?? null}</>
}

function SidebarItemIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    'tab:members':       <WizardIcon.user size={11} />,
    'tab:roles':         <WizardIcon.tag size={11} />,
    'tab:custom_fields': <WizardIcon.text size={11} />,
    'tab:attendance':    <WizardIcon.check2 size={11} />,
    'tab:hours':         <WizardIcon.calendarClock size={11} />,
    'tab:rules':         <WizardIcon.calendar size={11} />,
    'tab:autoassign':    <WizardIcon.refresh size={11} />,
    'tab:legend':        <WizardIcon.palette size={11} />,
    'tab:settings':      <WizardIcon.gear size={11} />,
    'tab:notifications': <WizardIcon.bell size={11} />,
    'tab:lessons':       <WizardIcon.ticket size={11} />,
    'tab:feedback':      <WizardIcon.message size={11} />,
  }
  return <>{icons[id] ?? null}</>
}

// 웹푸시 배치 발송(GitHub Actions cron)이 비활성화된 동안 구독 유도 UI도 숨김.
// 재활성화 시 true로 되돌리면 됨.
const PUSH_NOTIFICATIONS_ENABLED = false


function IconChip({ children, active, danger }: { children: React.ReactNode; active?: boolean; danger?: boolean }) {
  return (
    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
      active
        ? 'bg-[var(--color-brand-primary)] border-transparent text-[var(--color-brand-primary-contrast)]'
        : danger
        ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-red-500 group-hover:border-red-200 group-hover:bg-red-50'
        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:border-[var(--color-border-strong)]'
    }`}>{children}</span>
  )
}

function NavLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] first:pt-1">{children}</p>
}

interface AppHeaderProps {
  funcMenuItems?: (closeMenu: () => void) => React.ReactNode
  extraMenuGroups?: ExtraMenuGroup[]
  userMenuItems?: (closeMenu: () => void) => React.ReactNode
  leftSlot?: React.ReactNode
  memberSelectSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  roleLabel?: string
  onShowLogin?: () => void
}

export function AppHeader({ funcMenuItems, extraMenuGroups, userMenuItems, leftSlot, memberSelectSlot, rightSlot, roleLabel, onShowLogin }: AppHeaderProps) {
  const navigate = useNavigate()
  const { profile, loading: authLoading, signOut, deleteAccount, linkGoogle, linkKakao, getIdentities } = useAuth()
  const { isCustomerAdmin } = useCustomerAdmin()
  const { tenant, tenantRole, tenantPlan, memberships, resetTenantSelection, reloadMemberships } = useTenant()
  // 데스크탑 사이드바 상태 (lg 이상에서 사용)
  const [showFuncMenu, setShowFuncMenu] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  // PC 사이드바 관리자콘솔 섹션 접기 (기본 접힘)
  const [sidebarAdminOpen, setSidebarAdminOpen] = useState(false)
  // 모바일 풀스크린 메뉴 상태
  const [showFullMenu, setShowFullMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showJoinOrg, setShowJoinOrg] = useState(false)
  const [showStartService, setShowStartService] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showQuickBooking, setShowQuickBooking] = useState(false)
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { isSubscribed, isLoading: pushLoading, isSupported: pushSupported, subscribe, unsubscribe } = usePushSubscription()

  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const { isDark, toggle: toggleDark } = useDarkMode()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackReloadKey, setFeedbackReloadKey] = useState(0)
  const isTenantFreeform = displayMode(tenant?.settings?.tenant_mode) === '비회원'
  const isPrivileged = profile?.is_super_admin || tenantRole === 'admin'
  const showHamburger = !!isPrivileged || isCustomerAdmin
  const feedbackBadgeScope = profile?.is_super_admin
    ? ({ kind: 'system' as const })
    : (tenantRole === 'admin' && tenant) ? ({ kind: 'org' as const, tenantId: tenant.id }) : null
  const feedbackBadgeCount = useFeedbackBadge(feedbackBadgeScope, feedbackReloadKey)

  // 창 크기 변경 시 데스크탑 사이드바 자동 표시/숨김
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setShowFuncMenu(w >= 1024)
      setIsWideMobile(w > 430 && w < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 와이드 모바일 감지 (430px 초과 = 폴더블 등, 1024px 미만 = 데스크탑 아님)
  const [isWideMobile, setIsWideMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth > 430 && window.innerWidth < 1024
  )

  // 데스크탑 사이드바가 열리면 body에 data-sidebar 속성 설정 (레이아웃 padding 조정용)
  useLayoutEffect(() => {
    if (!showHamburger) return
    document.body.setAttribute('data-sidebar', showFuncMenu ? 'open' : 'closed')
    return () => document.body.removeAttribute('data-sidebar')
  }, [showFuncMenu, showHamburger])

  const menuBtn = 'w-full text-left px-3 py-2 text-sm rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors'
  const navItemCls = 'group w-full flex items-center gap-2.5 text-left px-2.5 py-2 text-[13px] font-medium rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors'
  const sep = <div className="h-px bg-[var(--color-border)] mx-1 my-1" />

  // 햄버거 클릭: 모바일에서는 풀스크린, 데스크탑에서는 사이드바 토글
  const handleHamburgerClick = () => {
    if (window.innerWidth >= 1024) {
      setShowFuncMenu(v => !v)
    } else {
      setShowFullMenu(true)
    }
  }

  return (
    <>
      <div className="relative bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-5">

          {/* Left: hamburger + leftSlot + memberSelectSlot */}
          <div className="flex flex-1 items-center gap-1.5 min-w-0">
            {showHamburger && (
              <button
                onClick={handleHamburgerClick}
                aria-label="기능 메뉴"
                className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto px-0 py-0 sm:px-3 sm:py-1.5 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all shrink-0"
              >
                {showFuncMenu
                  ? <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
                  : <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>
                }
                <span className="hidden sm:inline">메뉴</span>
              </button>
            )}
            {leftSlot && (
              <>
                <span className="sm:hidden text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1 min-w-0">
                  {tenant?.settings?.title || tenant?.name}
                </span>
                <button
                  onClick={() => setShowMobileSearch(v => !v)}
                  aria-label="검색"
                  className="sm:hidden flex items-center justify-center w-8 h-8 shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all"
                >
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="6"/><path d="M17 17l-3.5-3.5"/></svg>
                </button>
                <div className="hidden sm:flex">{leftSlot}</div>
              </>
            )}
            {!leftSlot && memberSelectSlot}
            {leftSlot && memberSelectSlot && <div className="hidden sm:block">{memberSelectSlot}</div>}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            {rightSlot}
            {isPrivileged && tenant && (
              <button
                onClick={() => setShowQuickBooking(true)}
                aria-label="자연어로 예약 등록"
                title="자연어로 예약 등록"
                className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto px-0 py-0 sm:px-3 sm:py-1.5 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8Z"/></svg>
                <span className="hidden sm:inline">AI 등록</span>
              </button>
            )}
            {profile && (
              <div>
                <button
                  onClick={() => setShowNotifications(v => !v)}
                  aria-label="알림"
                  className="relative flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto px-0 py-0 sm:px-3 sm:py-1.5 text-xs font-medium rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all shrink-0"
                >
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6z"/>
                    <path d="M8 16a2 2 0 0 0 4 0"/>
                  </svg>
                  <span className="hidden sm:inline">알림</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none select-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
            {profile && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="hidden sm:block text-sm font-semibold text-[var(--color-text-primary)] max-w-[80px] truncate">{profile.name}</span>
                {roleLabel && (
                  <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-lg border border-[var(--color-border)] whitespace-nowrap hidden sm:block">
                    {roleLabel}
                  </span>
                )}
              </div>
            )}
            {authLoading ? (
              <div className="w-8 h-8" />
            ) : profile ? (
              <button
                onClick={() => setShowUserMenu(v => !v)}
                aria-label="사용자 메뉴"
                className="w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all"
              >
                {showUserMenu
                  ? <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
                  : <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10" cy="7" r="3" strokeWidth="2"/><path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeWidth="2" strokeLinecap="round"/></svg>
                }
              </button>
            ) : (
              onShowLogin && (
                <button
                  onClick={onShowLogin}
                  className="px-3 py-1.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] transition-all"
                >
                  로그인
                </button>
              )
            )}
          </div>
        </div>

        {/* 모바일 검색바 확장 영역 */}
        {leftSlot && showMobileSearch && (
          <div className="sm:hidden px-3 pb-2 pt-1 border-t border-[var(--color-border)]">
            {leftSlot}
            {memberSelectSlot && <div className="mt-1.5">{memberSelectSlot}</div>}
          </div>
        )}

        {/* 알림 패널 */}
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClose={() => setShowNotifications(false)}
          />
        )}

        {/* 데스크탑 사이드바 (lg 이상) */}
        {showHamburger && showFuncMenu && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setShowFuncMenu(false)} />
            <div className="
              w-56 bg-[var(--color-surface)] z-40 overflow-y-auto
              absolute top-full left-3 sm:left-5 mt-1 rounded-2xl shadow-lg border border-[var(--color-border)]
              lg:fixed lg:top-0 lg:left-0 lg:bottom-0 lg:mt-0 lg:w-44 lg:rounded-none lg:shadow-none
              lg:border-0 lg:border-r lg:border-[var(--color-border)]
            ">
              <div className="p-2 lg:p-0 lg:h-full lg:flex lg:flex-col">
                <div className="hidden lg:flex items-center gap-2.5 px-3 shrink-0 h-[59px] border-b border-[var(--color-border)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] flex items-center justify-center text-[13px] font-bold shrink-0">
                    {(tenant?.settings?.title || tenant?.name || '?').charAt(0)}
                  </div>
                  <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                    {tenant?.settings?.title || tenant?.name}
                  </span>
                </div>
                <div className="lg:flex-1 lg:overflow-y-auto lg:px-2 lg:py-2 lg:pb-0">
                  <NavLabel>콘솔</NavLabel>
                  {profile?.is_super_admin && (
                    <button onClick={() => { navigate('/superadmin'); setShowFuncMenu(false) }} className={navItemCls}>
                      <IconChip><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></IconChip>
                      조직관리
                    </button>
                  )}
                  {(isCustomerAdmin && !profile?.is_super_admin) && (
                    <button onClick={() => { navigate('/customer-admin'); setShowFuncMenu(false) }} className={navItemCls}>
                      <IconChip><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg></IconChip>
                      고객 어드민
                    </button>
                  )}
                  <button
                    onClick={() => setSidebarAdminOpen(v => !v)}
                    className="w-full flex items-center justify-between px-2.5 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <span>관리자콘솔</span>
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      className={`transition-transform duration-200 ${sidebarAdminOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {sidebarAdminOpen && MENU_GROUPS.map(group => (
                    <div key={group.id}>
                      <p className="px-3 pt-2 pb-0.5 text-[10.5px] font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <SidebarGroupIcon id={group.id} />
                        {group.label}
                      </p>
                      {group.items.map(item => (
                        <button key={item.id} onClick={() => { navigate(item.path); setShowFuncMenu(false) }}
                          className="w-full text-left pl-6 pr-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] rounded-xl transition-colors flex items-center gap-1.5">
                          <SidebarItemIcon id={item.id} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  {funcMenuItems && <div className="h-px bg-[var(--color-border)] mx-2.5 my-2.5" />}
                  {funcMenuItems?.(() => { if (window.innerWidth < 1024) setShowFuncMenu(false) })}
                </div>
                <div className="hidden lg:block border-t border-[var(--color-border)] px-2 py-2 mt-auto">
                  <button onClick={toggleDark} className={navItemCls}>
                    <IconChip>
                      {isDark
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      }
                    </IconChip>
                    {isDark ? '라이트 모드' : '다크 모드'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 모바일 풀스크린 메뉴 (lg 미만에서만) */}
        {showHamburger && showFullMenu && (
          <FullScreenMenu
            profile={profile}
            tenant={tenant}
            isPrivileged={!!isPrivileged}
            isSuperAdmin={!!profile?.is_super_admin}
            isCustomerAdmin={isCustomerAdmin}
            extraMenuGroups={extraMenuGroups}
            asSidebar={isWideMobile}
            onClose={() => setShowFullMenu(false)}
            onShowProfile={() => setShowProfile(true)}
            onShowNotifications={() => setShowNotifications(true)}
            unreadCount={unreadCount}
            isDark={isDark}
            onToggleDark={toggleDark}
            onSignOut={signOut}
          />
        )}

        {/* 사용자 메뉴 드롭다운 */}
        {showUserMenu && profile && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div className="absolute top-full right-3 sm:right-5 mt-1 w-52 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{profile.name}</p>
              </div>
              <div className="p-2">
                <button onClick={() => { setShowProfile(true); setShowUserMenu(false) }} className={menuBtn}>
                  <span className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    계정 연동
                  </span>
                </button>
                {sep}
                {(memberships.length > 1 || profile?.is_super_admin) && (
                  <button onClick={() => { resetTenantSelection(); setShowUserMenu(false) }} className={menuBtn}>
                    <span className="flex items-center gap-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                      조직 변경
                    </span>
                  </button>
                )}
                {!profile?.is_super_admin && (
                  <button onClick={() => { setShowJoinOrg(true); setShowUserMenu(false) }} className={menuBtn}>
                    <span className="flex items-center gap-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
                      다른 조직 가입
                    </span>
                  </button>
                )}
                {!profile?.is_super_admin && !isCustomerAdmin && (
                  <button onClick={() => { setShowStartService(true); setShowUserMenu(false) }} className={menuBtn}>
                    <span className="flex items-center gap-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/></svg>
                      내 서비스 시작하기
                    </span>
                  </button>
                )}
                {sep}
                {userMenuItems?.(() => setShowUserMenu(false))}
                <button onClick={() => { setShowFeedback(true); setShowUserMenu(false) }} className={menuBtn}>
                  <span className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    피드백
                    {feedbackBadgeCount > 0 && (
                      <span className="ml-auto min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {feedbackBadgeCount > 9 ? '9+' : feedbackBadgeCount}
                      </span>
                    )}
                  </span>
                </button>
                {sep}
                <button onClick={() => { navigate('/help'); setShowUserMenu(false) }} className={menuBtn}>
                  <span className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    도움말
                  </span>
                </button>
                {PUSH_NOTIFICATIONS_ENABLED && pushSupported && !isTenantFreeform && (
                  <button onClick={async () => { isSubscribed ? await unsubscribe() : await subscribe(); setShowUserMenu(false) }} disabled={pushLoading} className={menuBtn}>
                    <span className="flex items-center gap-2.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      {pushLoading ? '처리 중...' : isSubscribed ? '푸시 알림 끄기' : '푸시 알림 켜기'}
                    </span>
                  </button>
                )}
                {sep}
                <button onClick={() => { toggleDark(); setShowUserMenu(false) }} className={menuBtn}>
                  <span className="flex items-center gap-2.5">
                    {isDark
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    }
                    {isDark ? '라이트 모드' : '다크 모드'}
                  </span>
                </button>
                <button onClick={() => { signOut(); setShowUserMenu(false) }} className={menuBtn}>
                  <span className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    로그아웃
                  </span>
                </button>
                <button onClick={() => { setShowWithdrawModal(true); setShowUserMenu(false) }} className={menuBtn}>
                  <span className="flex items-center gap-2.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="23" y2="14"/><line x1="23" y1="8" x2="17" y2="14"/></svg>
                    회원탈퇴
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {joinSuccessMsg && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
          <span>{joinSuccessMsg}</span>
          <button onClick={() => setJoinSuccessMsg(null)} className="shrink-0 opacity-60 hover:opacity-100 text-base leading-none">✕</button>
        </div>
      )}

      {isPrivileged && (profile?.is_super_admin || tenantPlan === 'business') && <DashboardNav />}

      {showProfile && profile && (
        <ProfileModal profile={profile} onClose={() => setShowProfile(false)} linkGoogle={linkGoogle} linkKakao={linkKakao} getIdentities={getIdentities} />
      )}

      {showJoinOrg && profile && (
        <JoinOrgModal
          userId={profile.id}
          onClose={() => setShowJoinOrg(false)}
          onSuccess={() => { setShowJoinOrg(false); setJoinSuccessMsg('가입 신청이 완료됐습니다. 관리자 승인 후 이용하실 수 있습니다.') }}
        />
      )}

      {showStartService && profile && (
        <StartServiceModal userId={profile.id} onClose={() => setShowStartService(false)} />
      )}

      {showQuickBooking && (
        <QuickBookingModal onClose={() => setShowQuickBooking(false)} />
      )}

      {showFeedback && (
        <FeedbackModal
          onClose={() => { setShowFeedback(false); setFeedbackReloadKey(k => k + 1) }}
          onSubmitted={() => setFeedbackReloadKey(k => k + 1)}
        />
      )}

      {showWithdrawModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowWithdrawModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-lg w-full max-w-xs p-5 space-y-3">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">탈퇴 방식 선택</h2>
              {tenant && memberships.filter(m => m.is_approved).length > 1 && (
                <button
                  onClick={async () => { setShowWithdrawModal(false); const err = await deleteAccount(tenant.id); if (err) alert(err); else await reloadMemberships() }}
                  className="w-full px-4 py-3 text-left rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">현재 조직 탈퇴</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{tenant.name}에서만 탈퇴합니다. 계정은 유지됩니다.</p>
                </button>
              )}
              <button
                onClick={async () => { setShowWithdrawModal(false); const err = await deleteAccount(); if (err) alert(err) }}
                className="w-full px-4 py-3 text-left rounded-xl border border-red-200 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <p className="text-sm font-medium text-red-600 dark:text-red-400">전체 계정 삭제</p>
                <p className="text-xs text-red-400 dark:text-red-500 mt-0.5">모든 조직에서 탈퇴하고 계정을 완전히 삭제합니다.</p>
              </button>
              <button onClick={() => setShowWithdrawModal(false)} className="w-full py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                취소
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
