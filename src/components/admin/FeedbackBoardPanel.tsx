import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { fetchFeedbackPosts, fetchFeedbackReplies, addFeedbackReply, updateFeedbackStatus, deleteFeedbackPost } from '../../lib/feedback'
import { FEEDBACK_CATEGORY_LABELS, FEEDBACK_STATUS_LABELS } from '../../types'
import type { FeedbackPost, FeedbackReply, FeedbackStatus } from '../../types'

interface Props {
  scope: { kind: 'org'; tenantId: string } | { kind: 'system' }
}

const STATUS_CLS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700',
  answered: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700',
  closed: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)]',
}

const CATEGORY_ICON: Record<string, string> = { inquiry: '💌', bug: '🐛', feature: '💡' }

export function FeedbackBoardPanel({ scope }: Props) {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<FeedbackPost[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('open')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<FeedbackReply[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySaving, setReplySaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetchFeedbackPosts(scope).then(setPosts).catch(() => setPosts([])).finally(() => setLoading(false))
  }

  useEffect(load, [scope.kind, scope.kind === 'org' ? scope.tenantId : null])

  async function toggleExpand(post: FeedbackPost) {
    if (expandedId === post.id) { setExpandedId(null); return }
    setExpandedId(post.id)
    setReplyText('')
    setRepliesLoading(true)
    try {
      setReplies(await fetchFeedbackReplies(post.id))
    } finally {
      setRepliesLoading(false)
    }
  }

  async function handleReply(postId: string) {
    if (!profile || !replyText.trim()) return
    setReplySaving(true)
    const err = await addFeedbackReply({ postId, authorId: profile.id, authorName: profile.name, content: replyText.trim() })
    setReplySaving(false)
    if (err) return
    setReplyText('')
    setReplies(await fetchFeedbackReplies(postId))
    load()
  }

  async function handleStatusChange(postId: string, status: FeedbackStatus) {
    await updateFeedbackStatus(postId, status)
    load()
  }

  async function handleDelete(postId: string) {
    if (!window.confirm('이 문의를 삭제하시겠습니까? 답변 내역도 함께 삭제되며 되돌릴 수 없습니다.')) return
    setDeletingId(postId)
    await deleteFeedbackPost(postId)
    setDeletingId(null)
    if (expandedId === postId) setExpandedId(null)
    load()
  }

  const filtered = statusFilter === 'all' ? posts : posts.filter(p => p.status === statusFilter)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['open', 'answered', 'closed', 'all'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${statusFilter === s
              ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] border-[var(--color-brand-primary)]'
              : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'}`}
          >
            {s === 'all' ? '전체' : FEEDBACK_STATUS_LABELS[s]}
            {s !== 'all' && ` ${posts.filter(p => p.status === s).length}`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-10">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-10">문의가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => (
            <div key={post.id} className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
              <button onClick={() => toggleExpand(post)} className="w-full text-left px-4 py-3 hover:bg-[var(--color-surface-hover)] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm select-none shrink-0">{CATEGORY_ICON[post.category]}</span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{post.title}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {scope.kind === 'system' && post.target_type === 'org_admin' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)]">
                        조직관리자용
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CLS[post.status]}`}>
                      {FEEDBACK_STATUS_LABELS[post.status]}
                    </span>
                  </span>
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  {FEEDBACK_CATEGORY_LABELS[post.category]} · {post.author_name}
                  {scope.kind === 'system' && post.tenant_name ? ` (${post.tenant_name})` : ''} · {post.created_at.slice(0, 10)}
                </div>
              </button>

              {expandedId === post.id && (
                <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 space-y-3">
                  <div>
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{post.content}</p>
                    {post.author_email && (
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-1">연락처: {post.author_email}</p>
                    )}
                  </div>

                  {post.attachments.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {post.attachments.map(url => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-[var(--color-border)]">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {repliesLoading ? (
                      <p className="text-xs text-[var(--color-text-muted)]">답변 불러오는 중...</p>
                    ) : (
                      replies.map(r => (
                        <div key={r.id} className={`rounded-lg px-3 py-2 text-xs ${r.author_role === 'author' ? 'bg-[var(--color-surface-secondary)]' : 'bg-[var(--color-brand-primary)]/8'}`}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {r.author_role === 'author' ? r.author_name : r.author_role === 'system_admin' ? '시스템 관리자' : '조직 관리자'}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">{r.created_at.slice(0, 10)}</span>
                          </div>
                          <p className="text-[var(--color-text-secondary)] whitespace-pre-line">{r.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="답변을 입력하세요"
                      rows={3}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-brand-primary)] resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleReply(post.id)}
                        disabled={replySaving || !replyText.trim()}
                        className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] disabled:opacity-40"
                      >
                        답변
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {post.status !== 'closed' ? (
                      <button
                        onClick={() => handleStatusChange(post.id, 'closed')}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline"
                      >
                        문의 종료 처리
                      </button>
                    ) : <span />}

                    {scope.kind === 'system' && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="text-xs text-red-500 hover:text-red-600 underline disabled:opacity-40"
                      >
                        {deletingId === post.id ? '삭제 중...' : '삭제'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
