import { supabase } from './supabase'
import type { Assignment, TimeSlot } from '../types'

export interface AddAssignmentParams {
  tenant_id: string
  year: number
  month: number
  day: number
  time_slot: TimeSlot
  member_name: string
  note?: string
  member_type: string
  time_sub?: string
  color?: string
  user_id: string | null
  role_id?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  extra_data?: Record<string, string>
}

/**
 * 배정을 추가한다. member_type이 'admin_note'가 아니면 동일 (년/월/일/시간대/이름) 중복을
 * 클라이언트에서 먼저 확인한다 — 서버 유니크 제약과 별개로 사용자에게 즉시 안내하기 위함.
 */
export async function insertAssignment(
  params: AddAssignmentParams,
  existingAssignments: Assignment[]
): Promise<{ error: string | null; data: Assignment | null }> {
  if (params.member_type !== 'admin_note') {
    const isDuplicate = existingAssignments.some(
      a => a.year === params.year && a.month === params.month &&
           a.day === params.day && a.time_slot === params.time_slot &&
           a.member_name === params.member_name
    )
    if (isDuplicate) return { error: '이미 같은 회원이 배정되어 있습니다', data: null }
  }
  const { data, error } = await supabase.from('assignments').insert(params).select().single()
  return { error: error?.message ?? null, data: (data as Assignment) ?? null }
}
