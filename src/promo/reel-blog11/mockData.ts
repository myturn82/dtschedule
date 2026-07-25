// blog11 — 다크모드 + 디자인 시스템
import type { Assignment, ScheduleRule, SlotSetting, TimeSlot } from '../../types'

export const YEAR = 2026
export const MONTH = 7

const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

export const SCHEDULE_RULES: ScheduleRule[] = [1,2,3,4].flatMap(dow =>
  SLOTS.map(slot => ({ id: `r11-${dow}-${slot}`, tenant_id: 't11', day_of_week: dow, time_slot: slot, is_open: true }))
)
export const SLOT_SETTINGS: SlotSetting[] = SLOTS.map(s => ({
  id: `ss11-${s}`, tenant_id: 't11', time_slot: s, max_capacity: 2, updated_by: null,
}))

function a(day: number, slot: TimeSlot, name: string): Assignment {
  return {
    id: `a11-${day}-${slot}-${name}`, tenant_id: 't11',
    year: YEAR, month: MONTH, day, time_slot: slot,
    member_name: name, note: null, member_type: 'member',
    time_sub: null, color: null, user_id: null, role_id: null,
    customer_name: null, customer_phone: null,
    is_locked: false, account_deleted: false, created_at: '',
  }
}

const N = ['이배차','박기사','최드라이버','한배송','정퀵']

export const ASSIGNMENTS: Assignment[] = [
  a(7,'09-10',N[0]), a(7,'11-12',N[1]), a(7,'14-15',N[2]), a(7,'16-17',N[3]),
  a(8,'09-10',N[1]), a(8,'13-14',N[2]), a(8,'15-16',N[4]), a(8,'17-18',N[0]),
  a(9,'10-11',N[3]), a(9,'11-12',N[4]), a(9,'14-15',N[0]), a(9,'16-17',N[1]),
  a(10,'09-10',N[2]), a(10,'13-14',N[3]), a(10,'15-16',N[4]), a(10,'17-18',N[0]),
]

export const WEEK_DAYS = [7, 8, 9, 10].map(d => new Date(2026, 6, d))
