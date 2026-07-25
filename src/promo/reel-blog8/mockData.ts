// blog8 — 엑셀 붙여넣기 모드 + 4종 내보내기
import type { Assignment, ScheduleRule, SlotSetting, TimeSlot } from '../../types'

export const YEAR = 2026
export const MONTH = 7

const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']

export const SCHEDULE_RULES: ScheduleRule[] = [1,2,3,4,5].flatMap(dow =>
  SLOTS.map(slot => ({ id: `r8-${dow}-${slot}`, tenant_id: 't8', day_of_week: dow, time_slot: slot, is_open: true }))
)
export const SLOT_SETTINGS: SlotSetting[] = SLOTS.map(s => ({
  id: `ss8-${s}`, tenant_id: 't8', time_slot: s, max_capacity: 3, updated_by: null,
}))

function a(day: number, slot: TimeSlot, name: string): Assignment {
  return {
    id: `a8-${day}-${slot}-${name}`, tenant_id: 't8',
    year: YEAR, month: MONTH, day, time_slot: slot,
    member_name: name, note: null, member_type: 'member',
    time_sub: null, color: null, user_id: null, role_id: null,
    customer_name: null, customer_phone: null,
    is_locked: false, account_deleted: false, created_at: '',
  }
}

const N = ['오픈1','오픈2','미들1','미들2','마감1','마감2']

export const BASE_ASSIGNMENTS: Assignment[] = [
  // 7일(월) - 복사 원본
  a(7,'09-10',N[0]), a(7,'10-11',N[1]),
  a(7,'13-14',N[2]), a(7,'14-15',N[3]),
  a(7,'16-17',N[4]), a(7,'17-18',N[5]),
  // 8일(화)
  a(8,'09-10',N[1]), a(8,'11-12',N[0]),
  a(8,'14-15',N[2]), a(8,'16-17',N[3]),
  // 9일(수)
  a(9,'10-11',N[4]), a(9,'13-14',N[5]),
]

export const PASTE_ASSIGNMENTS: Assignment[] = [
  ...BASE_ASSIGNMENTS,
  // 14일(월) - 붙여넣기 결과
  a(14,'09-10',N[0]), a(14,'10-11',N[1]),
  a(14,'13-14',N[2]), a(14,'14-15',N[3]),
  a(14,'16-17',N[4]), a(14,'17-18',N[5]),
]

// 7일 달력 (Mon 7 ~ Sun 13)
export const WEEK_DAYS = [7,8,9,10,11,12,13].map(d => new Date(2026, 6, d))

// 선택 범위: 7일 월요일 전체(슬롯 0~5)
export const SELECTION_RANGE = { minDay: 7, maxDay: 7, minSlotIdx: 0, maxSlotIdx: 5, minColIdx: 0, maxColIdx: 0 }
// 붙여넣기 대상: 14일 월요일
export const COPY_RANGE = { minDay: 14, maxDay: 14, minSlotIdx: 0, maxSlotIdx: 5, minColIdx: 0, maxColIdx: 0 }

export const EXPORT_FORMATS = [
  { id: 'xlsx', icon: '📊', label: 'Excel (.xlsx)', desc: '데이터 재가공에 적합' },
  { id: 'csv',  icon: '📄', label: 'CSV',           desc: '범용 텍스트 형식' },
  { id: 'docx', icon: '📝', label: 'Word (.docx)',  desc: '인쇄·공유에 적합' },
  { id: 'pdf',  icon: '🖨️', label: 'PDF',           desc: '게시판·벽보용' },
] as const
