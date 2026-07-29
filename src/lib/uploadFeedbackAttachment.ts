import { supabase } from './supabase'

export async function uploadFeedbackAttachment(tenantId: string, blob: Blob): Promise<string> {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('feedback-attachments')
    .upload(path, blob, { contentType: blob.type })

  if (error) throw new Error(`첨부파일 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from('feedback-attachments').getPublicUrl(path)
  return data.publicUrl
}
