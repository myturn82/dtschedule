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
    if (n.metadata?.date) navigate(`/schedule?date=${n.metadata.date}`)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-1 w-80 max-h-[480px] flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
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
                <div className={!n.is_read ? '' : 'ml-[18px]'}>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{n.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
