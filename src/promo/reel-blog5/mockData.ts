// blog5 — 자동배정 전체 워크플로우 (WeekGrid 기반)
import type { Assignment, ScheduleRule, SlotSetting, TimeSlot } from '../../types'

export const YEAR  = 2026
export const MONTH = 7

const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

export const SCHEDULE_RULES: ScheduleRule[] = [1,2,3,4].flatMap(dow =>
  SLOTS.map(slot => ({
    id: `r5-${dow}-${slot}`, tenant_id: 't5',
    day_of_week: dow, time_slot: slot, is_open: true,
  }))
)

export const SLOT_SETTINGS: SlotSetting[] = SLOTS.map(s => ({
  id: `ss5-${s}`, tenant_id: 't5',
  time_slot: s, max_capacity: 2, updated_by: null,
}))

function a(day: number, slot: TimeSlot, name: string): Assignment {
  return {
    id: `a5-${day}-${slot}-${name}`, tenant_id: 't5',
    year: YEAR, month: MONTH, day, time_slot: slot,
    member_name: name, note: null, member_type: 'member',
    time_sub: null, color: null, user_id: null, role_id: null,
    customer_name: null, customer_phone: null,
    is_locked: false, account_deleted: false, created_at: '',
  }
}

const N = ['이준혁','박서연','최지민','한아름','정우성','김나영','오동현','윤소희']

// 4일(월~목) × 8슬롯, 총 22개 배정 — 순서가 곧 채워지는 순서
export const ALL_ASSIGNMENTS: Assignment[] = [
  // 7일(월)
  a(7,'09-10',N[0]), a(7,'11-12',N[1]), a(7,'13-14',N[2]), a(7,'15-16',N[3]),
  a(7,'16-17',N[4]), a(7,'17-18',N[5]),
  // 8일(화)
  a(8,'09-10',N[1]), a(8,'10-11',N[2]), a(8,'11-12',N[3]),
  a(8,'13-14',N[4]), a(8,'14-15',N[5]), a(8,'16-17',N[6]),
  // 9일(수)
  a(9,'09-10',N[0]), a(9,'10-11',N[7]), a(9,'11-12',N[1]),
  a(9,'14-15',N[2]), a(9,'15-16',N[3]), a(9,'17-18',N[4]),
  // 10일(목)
  a(10,'09-10',N[5]), a(10,'11-12',N[6]),
  a(10,'14-15',N[7]), a(10,'16-17',N[0]),
]

export const WEEK_DAYS = [7, 8, 9, 10].map(d => new Date(2026, 6, d))

// 미리보기 모달용 대표 8건
export const MOCK_PROPOSALS = [
  { id: 'mp-0', dayLabel: '7/7(월)', timeSlot: '09-10', roleName: '봉사자', userName: '이준혁' },
  { id: 'mp-1', dayLabel: '7/7(월)', timeSlot: '11-12', roleName: '플러스', userName: '박서연' },
  { id: 'mp-2', dayLabel: '7/7(월)', timeSlot: '13-14', roleName: '봉사자', userName: '최지민' },
  { id: 'mp-3', dayLabel: '7/7(월)', timeSlot: '15-16', roleName: '봉사자', userName: '한아름' },
  { id: 'mp-4', dayLabel: '7/8(화)', timeSlot: '09-10', roleName: '봉사자', userName: '박서연' },
  { id: 'mp-5', dayLabel: '7/8(화)', timeSlot: '10-11', roleName: '플러스', userName: '최지민' },
  { id: 'mp-6', dayLabel: '7/9(수)', timeSlot: '09-10', roleName: '봉사자', userName: '이준혁' },
  { id: 'mp-7', dayLabel: '7/9(수)', timeSlot: '14-15', roleName: '플러스', userName: '한아름' },
]
