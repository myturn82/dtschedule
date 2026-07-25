// blog7 — Realtime 구독 (테니스 동호회, 회원공유 모드)
import type { Assignment, ScheduleRule, SlotSetting, TimeSlot } from '../../types'

export const YEAR = 2026
export const MONTH = 7

const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

export const SCHEDULE_RULES: ScheduleRule[] = [1,2,3,4].flatMap(dow =>
  SLOTS.map(slot => ({ id: `r7-${dow}-${slot}`, tenant_id: 't7', day_of_week: dow, time_slot: slot, is_open: true }))
)
export const SLOT_SETTINGS: SlotSetting[] = SLOTS.map(s => ({
  id: `ss7-${s}`, tenant_id: 't7', time_slot: s, max_capacity: 2, updated_by: null,
}))

function a(day: number, slot: TimeSlot, name: string): Assignment {
  return {
    id: `a7-${day}-${slot}-${name}`, tenant_id: 't7',
    year: YEAR, month: MONTH, day, time_slot: slot,
    member_name: name, note: null, member_type: 'member',
    time_sub: null, color: null, user_id: null, role_id: null,
    customer_name: null, customer_phone: null,
    is_locked: false, account_deleted: false, created_at: '',
  }
}

const N = ['김코트','이서브','박포핸드','최백핸드','정발리','윤스매시','강드롭','신로브']

// 실시간으로 하나씩 나타나는 순서
export const ALL_ASSIGNMENTS: Assignment[] = [
  a(7,'09-10',N[0]), a(7,'10-11',N[1]), a(7,'13-14',N[2]), a(7,'15-16',N[3]),
  a(8,'09-10',N[1]), a(8,'11-12',N[2]), a(8,'14-15',N[3]), a(8,'16-17',N[4]),
  a(9,'09-10',N[0]), a(9,'10-11',N[5]), a(9,'13-14',N[1]), a(9,'16-17',N[6]),
  a(10,'09-10',N[2]), a(10,'11-12',N[7]), a(10,'14-15',N[3]), a(10,'17-18',N[4]),
  a(7,'11-12',N[5]), a(8,'10-11',N[6]), a(9,'15-16',N[7]), a(10,'10-11',N[0]),
]

export const WEEK_DAYS = [7, 8, 9, 10].map(d => new Date(2026, 6, d))
