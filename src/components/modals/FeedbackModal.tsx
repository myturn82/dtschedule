import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTenant } from '../../contexts/TenantContext'
import { compressImage } from '../../lib/imageCompress'
import { uploadFeedbackAttachment } from '../../lib/uploadFeedbackAttachment'
import { submitFeedbackPost, fetchFeedbackPosts, fetchFeedbackReplies, addFeedbackReply } from '../../lib/feedback'
import { FEEDBACK_CATEGORY_LABELS, FEEDBACK_CATEGORY_HINT, FEEDBACK_STATUS_LABELS } from '../../types'
import type { FeedbackCategory, FeedbackPost, FeedbackReply } from '../../types'
import { DevFileLabel } from '../DevFileLabel'

interface Props {
  onClose: () => void
  onSubmitted?: () => void
  initialTab?: 'new' | 'mine'
}

const CATEGORIES: FeedbackCategory[] = ['inquiry', 'bug', 'feature']
const MAX_ATTACHMENTS = 3

const STATUS_CLS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  answered: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]',
}

interface PendingImage { blob: Blob; previewUrl: string; compressedKB: number }

export function FeedbackModal({ onClose, onSubmitted, initialTab = 'new' }: Props) {
  const { profile } = useAuth()
  const { tenant } = useTenant()
  const [tab, setTab] = useState<'new' | 'mine'>(initialTab)

  // ── 새 문의 작성 ─────────────────────────────────────────
  const [category, setCategory] = useState<FeedbackCategory>('inquiry')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pending, setPending] = useState<PendingImage[]>([])
  const [compressing, setCompressing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submittedOk, setSubmittedOk] = useState(false)

  // ── 내 문의 내역 ─────────────────────────────────────────
  const [myPosts, setMyPosts] = useState<FeedbackPost[]>([])
  const [myPostsLoading, setMyPostsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<FeedbackReply[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [followUp, setFollowUp] = useState('')
  const [followUpSaving, setFollowUpSaving] = useState(false)

  useEffect(() => {
    if (tab !== 'mine' || !profile) return
    setMyPostsLoading(true)
    fetchFeedbackPosts({ kind: 'mine', userId: profile.id })
      .then(setMyPosts)
      .catch(() => setMyPosts([]))
      .finally(() => setMyPostsLoading(false))
  }, [tab, profile])

  async function toggleExpand(post: FeedbackPost) {
    if (expandedId === post.id) { setExpandedId(null); return }
    setExpandedId(post.id)
    setRepliesLoading(true)
    try {
      setReplies(await fetchFeedbackReplies(post.id))
    } catch {
      setReplies([])
    } finally {
      setRepliesLoading(false)
    }
  }

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    const canAdd = MAX_ATTACHMENTS - pending.length
    setCompressing(true)
    const results: PendingImage[] = []
    for (const file of files.slice(0, canAdd)) {
      try {
        const r = await compressImage(file)
        results.push({ blob: r.blob, previewUrl: r.previewUrl, compressedKB: r.compressedKB })
      } catch (err) {
        setFormError(err instanceof Error ? err.message : '이미지 압축 실패')
      }
    }
    setPending(prev => [...prev, ...results])
    setCompressing(false)
  }

  function removePending(idx: number) {
    URL.revokeObjectURL(pending[idx].previewUrl)
    setPending(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !tenant) return
    if (!title.trim() || !content.trim()) { setFormError('제목과 내용을 입력해 주세요.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      const attachments: string[] = []
      for (const img of pending) {
        attachments.push(await uploadFeedbackAttachment(tenant.id, img.blob))
      }
      const { error } = await submitFeedbackPost({
        tenantId: tenant.id,
        authorId: profile.id,
        authorName: profile.name,
        authorEmail: profile.email,
        category,
        title: title.trim(),
        content: content.trim(),
        attachments,
      })
      if (error) { setFormError(error); setSubmitting(false); return }
      setSubmittedOk(true)
      setTitle(''); setContent(''); setPending([])
      onSubmitted?.()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '문의 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFollowUp(postId: string) {
    if (!profile || !followUp.trim()) return
    setFollowUpSaving(true)
    const err = await addFeedbackReply({ postId, authorId: profile.id, authorName: profile.name, content: followUp.trim() })
    setFollowUpSaving(false)
    if (err) { setFormError(err); return }
    setFollowUp('')
    setReplies(await fetchFeedbackReplies(postId))
    setMyPosts(await fetchFeedbackPosts({ kind: 'mine', userId: profile.id }))
  }

  const inputCls = 'w-full text-sm px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]'

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col pointer-events-auto">

          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] shrink-0">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">💬 피드백</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
            </button>
          </div>

          <div className="flex gap-1 p-1 mx-4 mt-3 bg-[var(--color-surface-secondary)] rounded-xl border border-[var(--color-border)] shrink-0">
            {(['new', 'mine'] as const).map(v => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === v ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
              >
                {v === 'new' ? '새 문의 작성' : '내 문의 내역'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {tab === 'new' ? (
              !tenant ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-8">조직을 먼저 선택해 주세요.</p>
              ) : submittedOk ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-2xl select-none">✅</p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">문의가 등록됐습니다.</p>
                  <p className="text-xs text-[var(--color-text-muted)]">답변이 등록되면 알림으로 안내드립니다.</p>
                  <button onClick={() => { setSubmittedOk(false); setTab('mine') }} className="text-xs text-[var(--color-brand-primary)] hover:underline mt-1">내 문의 내역 보기 →</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">문의 유형</label>
                    <div className="space-y-1.5">
                      {CATEGORIES.map(c => (
                        <label key={c} className={`flex items-start gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${category === c ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5' : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'}`}>
                          <input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)} className="mt-0.5 accent-[var(--color-brand-primary)]" />
                          <span>
                            <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{FEEDBACK_CATEGORY_LABELS[c]}</span>
                            <span className="block text-[11px] text-[var(--color-text-muted)] mt-0.5">{FEEDBACK_CATEGORY_HINT[c]}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">제목 *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="문의 제목을 입력하세요" className={inputCls} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">내용 *</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="문의 내용을 자세히 적어주세요" className={inputCls + ' resize-none'} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">이름</label>
                      <p className={inputCls + ' bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] cursor-not-allowed truncate'}>{profile?.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">이메일</label>
                      <p className={inputCls + ' bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] cursor-not-allowed truncate'}>{profile?.email ?? '-'}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] -mt-1.5">답변은 이메일이 아닌 로그인 계정 기준 알림(🔔)으로 전달됩니다.</p>

                  <div>
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">
                      첨부파일 <span className="font-normal text-[var(--color-text-muted)]">({pending.length}/{MAX_ATTACHMENTS}장, 선택)</span>
                    </label>
                    {pending.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-2">
                        {pending.map((img, i) => (
                          <div key={img.previewUrl} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--color-brand-primary)]/40 group flex-shrink-0">
                            <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removePending(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center select-none">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {pending.length < MAX_ATTACHMENTS && (
                      <label className="w-full h-10 border-2 border-dashed border-[var(--color-border-strong)] rounded-xl text-xs font-medium text-[var(--color-text-muted)] hover:border-[var(--color-brand-primary)]/50 hover:text-[var(--color-brand-primary)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
                        <span className="text-base select-none">📷</span>
                        {compressing ? '처리 중...' : '스크린샷 첨부'}
                      </label>
                    )}
                  </div>

                  {formError && <p className="text-xs text-red-500">{formError}</p>}

                  <button type="submit" disabled={submitting || compressing} className="w-full py-2.5 text-sm font-semibold rounded-xl bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-40 transition-colors">
                    {submitting ? '등록 중...' : '문의 등록'}
                  </button>
                </form>
              )
            ) : (
              <div className="space-y-1.5">
                {myPostsLoading ? (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-8">불러오는 중...</p>
                ) : myPosts.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-8">등록한 문의가 없습니다.</p>
                ) : (
                  myPosts.map(post => (
                    <div key={post.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                      <button onClick={() => toggleExpand(post)} className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{post.title}</span>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLS[post.status]}`}>{FEEDBACK_STATUS_LABELS[post.status]}</span>
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {FEEDBACK_CATEGORY_LABELS[post.category]} · {post.created_at.slice(0, 10)}
                        </div>
                      </button>
                      {expandedId === post.id && (
                        <div className="px-3 pb-3 border-t border-[var(--color-border)] pt-2.5 space-y-2">
                          <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line">{post.content}</p>
                          {post.attachments.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {post.attachments.map(url => (
                                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 rounded-lg overflow-hidden border border-[var(--color-border)]">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                          {repliesLoading ? (
                            <p className="text-xs text-[var(--color-text-muted)]">답변 불러오는 중...</p>
                          ) : (
                            replies.map(r => (
                              <div key={r.id} className={`rounded-lg px-2.5 py-2 text-xs ${r.author_role === 'author' ? 'bg-[var(--color-surface-secondary)]' : 'bg-[var(--color-brand-primary)]/8'}`}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-semibold text-[var(--color-text-primary)]">{r.author_role === 'author' ? r.author_name : r.author_role === 'system_admin' ? '시스템 관리자' : '조직 관리자'}</span>
                                  <span className="text-[10px] text-[var(--color-text-muted)]">{r.created_at.slice(0, 10)}</span>
                                </div>
                                <p className="text-[var(--color-text-secondary)] whitespace-pre-line">{r.content}</p>
                              </div>
                            ))
                          )}
                          <div className="flex gap-1.5 pt-1">
                            <input
                              value={followUp}
                              onChange={e => setFollowUp(e.target.value)}
                              placeholder="추가로 문의하기"
                              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-brand-primary)]"
                            />
                            <button
                              onClick={() => handleFollowUp(post.id)}
                              disabled={followUpSaving || !followUp.trim()}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-contrast)] disabled:opacity-40"
                            >
                              전송
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <DevFileLabel file="FeedbackModal.tsx" />
        </div>
      </div>
    </>
  )
}
