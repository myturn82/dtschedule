import { supabase } from './supabase'
import type { TimeSlot } from '../types'

/** slot_settings를 (tenant_id, time_slot) 기준으로 upsert한다. 행이 없어도 새로 생성된다. */
export async function upsertSlotCapacity(tenantId: string, timeSlot: TimeSlot, maxCapacity: number): Promise<string | null> {
  const { error } = await supabase
    .from('slot_settings')
    .upsert(
      { tenant_id: tenantId, time_slot: timeSlot, max_capacity: maxCapacity },
      { onConflict: 'tenant_id,time_slot' }
    )
  return error?.message ?? null
}
