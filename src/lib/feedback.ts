import { supabase } from './supabase'
import type { FeedbackCategory, FeedbackPost, FeedbackReply, FeedbackStatus } from '../types'

export type FeedbackScope = { kind: 'mine'; userId: string } | { kind: 'org'; tenantId: string } | { kind: 'system' }

export async function fetchFeedbackPosts(scope: FeedbackScope): Promise<FeedbackPost[]> {
  let query = supabase.from('feedback_posts').select('*').order('created_at', { ascending: false })

  if (scope.kind === 'mine') query = query.eq('author_id', scope.userId)
  else if (scope.kind === 'org') query = query.eq('target_type', 'org_admin').eq('tenant_id', scope.tenantId)
  // scope.kind === 'system': target_type 필터 없이 전체 조회.
  // 조직관리자가 없거나 본인뿐인 조직에서 올라온 '단순 문의(org_admin)'도 시스템관리자가 항상 확인할 수 있어야 사각지대가 없다.

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as FeedbackPost[]
}

export async function countOpenFeedback(scope: Exclude<FeedbackScope, { kind: 'mine'; userId: string }>): Promise<number> {
  let query = supabase.from('feedback_posts').select('id', { count: 'exact', head: true }).eq('status', 'open')
  if (scope.kind === 'org') query = query.eq('target_type', 'org_admin').eq('tenant_id', scope.tenantId)
  // scope.kind === 'system': fetchFeedbackPosts와 동일하게 target_type 필터 없이 전체 카운트

  const { count, error } = await query
  if (error) return 0
  return count ?? 0
}

export async function fetchFeedbackReplies(postId: string): Promise<FeedbackReply[]> {
  const { data, error } = await supabase
    .from('feedback_replies')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as FeedbackReply[]
}

export async function submitFeedbackPost(input: {
  tenantId: string
  authorId: string
  authorName: string
  authorEmail: string | null
  category: FeedbackCategory
  title: string
  content: string
  attachments: string[]
}): Promise<{ post: FeedbackPost | null; error: string | null }> {
  const { data, error } = await supabase
    .from('feedback_posts')
    .insert({
      tenant_id: input.tenantId,
      author_id: input.authorId,
      author_name: input.authorName,
      author_email: input.authorEmail,
      category: input.category,
      title: input.title,
      content: input.content,
      attachments: input.attachments,
      // target_type은 서버 트리거가 category 기준으로 강제 결정한다
      target_type: 'system',
    })
    .select()
    .single()

  if (error) return { post: null, error: error.message }
  return { post: data as FeedbackPost, error: null }
}

export async function addFeedbackReply(input: {
  postId: string
  authorId: string
  authorName: string
  content: string
}): Promise<string | null> {
  const { error } = await supabase.from('feedback_replies').insert({
    post_id: input.postId,
    author_id: input.authorId,
    author_name: input.authorName,
    content: input.content,
    // author_role은 서버 트리거가 호출자 기준으로 강제 결정한다
  })
  return error?.message ?? null
}

export async function updateFeedbackStatus(postId: string, status: FeedbackStatus): Promise<string | null> {
  const { error } = await supabase.from('feedback_posts').update({ status, updated_at: new Date().toISOString() }).eq('id', postId)
  return error?.message ?? null
}

export async function deleteFeedbackPost(postId: string): Promise<string | null> {
  const { error } = await supabase.from('feedback_posts').delete().eq('id', postId)
  return error?.message ?? null
}
