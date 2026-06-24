import { supabase } from './supabase'

export async function uploadScheduleImage(tenantId: string, blob: Blob): Promise<string> {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${tenantId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('schedule-images')
    .upload(path, blob, { contentType: blob.type })

  if (error) throw new Error(`이미지 업로드 실패: ${error.message}`)

  const { data } = supabase.storage.from('schedule-images').getPublicUrl(path)
  return data.publicUrl
}
