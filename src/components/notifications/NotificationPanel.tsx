import { useNavigate } from 'react-router-dom'
import type { AppNotification } from '../../hooks/useNotifications'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'd1_reminder') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] shrink-0 mt-0.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  }
  if (type === 'pre_lesson') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] shrink-0 mt-0.5">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  }
  if (type === 'feedback_new') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] shrink-0 mt-0.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] shrink-0 mt-0.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

interface NotificationPanelProps {
  notifications: AppNotification[]
  onMarkAsRead: (id: string) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onClose: () => void
}

export function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }: NotificationPanelProps) {
  const navigate = useNavigate()

  async function handleClick(n: AppNotification) {
    await onMarkAsRead(n.id)
    if (n.type === 'feedback_new') {
      navigate('/superadmin')
    } else if (n.metadata?.date) {
      navigate(`/schedule?date=${n.metadata.date}`)
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-3 sm:right-5 mt-1 w-[min(320px,calc(100vw-24px))] max-h-[480px] flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">알림</span>
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            모두 읽음
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              새 알림이 없습니다
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors flex items-start gap-2.5 ${
                  !n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''
                }`}
              >
                {!n.is_read && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--color-brand-primary)] flex-shrink-0" />
                )}
                <div className={`flex items-start gap-2 ${!n.is_read ? '' : 'ml-[18px]'}`}>
                  <NotifIcon type={n.type} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{n.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
