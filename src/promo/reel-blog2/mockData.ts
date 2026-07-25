// 릴스용 데모 데이터 — blog_series_2.md의 시나리오(필라테스 스튜디오)를 반영.
// 월·수·금 운영 규칙 + 날짜 오버라이드(휴관일 / 특별 운영일) 대조를 보여준다.
import type { Assignment, DateOverride, ScheduleRule, SlotSetting, TimeSlot } from '../../types'

export const YEAR = 2026
export const MONTH = 7

// 2026년 7월 요일 배치
// Mon(1): 6, 13, 20, 27
// Tue(2): 7, 14, 21, 28
// Wed(3): 1, 8, 15, 22, 29
// Fri(5): 3, 10, 17, 24, 31

function rulesFor(openDows: number[], slots: TimeSlot[]): ScheduleRule[] {
  const rules: ScheduleRule[] = []
  for (let dow = 0; dow < 7; dow++) {
    for (const slot of slots) {
      rules.push({ id: `r2-${dow}-${slot}`, tenant_id: 't2', day_of_week: dow, time_slot: slot, is_open: openDows.includes(dow) })
    }
  }
  return rules
}

function slotSettingsFor(slots: TimeSlot[], capacity: number): SlotSetting[] {
  return slots.map(s => ({ id: `ss2-${s}`, tenant_id: 't2', time_slot: s, max_capacity: capacity, updated_by: null }))
}

function a(day: number, timeSlot: TimeSlot, name: string): Assignment {
  return {
    id: `a2-${day}-${timeSlot}-${name}`,
    tenant_id: 't2', year: YEAR, month: MONTH, day, time_slot: timeSlot,
    member_name: name, note: null, member_type: 'member', time_sub: null, color: null,
    user_id: null, role_id: null, customer_name: null, customer_phone: null,
    is_locked: false, account_deleted: false, created_at: '',
  }
}

const SLOTS: TimeSlot[] = ['10-11', '11-12', '13-14', '14-15', '15-16']
const NAMES = ['이소현', '박지은', '최민서', '한수아', '정다빈', '강예린']

export const PILATES_SCENARIO = {
  timeSlots: SLOTS,
  scheduleRules: rulesFor([1, 3, 5], SLOTS), // 월·수·금만 운영
  slotSettings: slotSettingsFor(SLOTS, 2),
  assignments: [
    // 월요일 (6, 13, 20, 27)
    a(6,  '10-11', NAMES[0]), a(6,  '13-14', NAMES[1]),
    a(13, '10-11', NAMES[2]), a(13, '14-15', NAMES[3]),
    a(20, '11-12', NAMES[4]), a(20, '15-16', NAMES[5]),
    a(27, '10-11', NAMES[0]), a(27, '13-14', NAMES[2]),
    // 수요일 (1, 8, 15, 22, 29) — 15일은 오버라이드로 휴관 처리됨
    a(1,  '10-11', NAMES[1]), a(1,  '14-15', NAMES[4]),
    a(8,  '11-12', NAMES[3]), a(8,  '15-16', NAMES[0]),
    a(15, '10-11', NAMES[5]), a(15, '13-14', NAMES[2]), // 오버라이드 phase에선 표시 안 됨
    a(22, '10-11', NAMES[1]), a(22, '14-15', NAMES[3]),
    a(29, '11-12', NAMES[4]), a(29, '15-16', NAMES[5]),
    // 금요일 (3, 10, 17, 24, 31)
    a(3,  '13-14', NAMES[0]), a(3,  '15-16', NAMES[2]),
    a(10, '10-11', NAMES[1]), a(10, '14-15', NAMES[4]),
    a(17, '11-12', NAMES[3]), a(17, '13-14', NAMES[5]),
    a(24, '10-11', NAMES[0]), a(24, '15-16', NAMES[1]),
    a(31, '13-14', NAMES[2]), a(31, '14-15', NAMES[3]),
  ],
}

// 날짜 오버라이드 ① — 7월 15일(수) 추석 연휴로 휴관
export const OVERRIDE_HOLIDAY: DateOverride = {
  id: 'ov2-holiday', tenant_id: 't2',
  date: '2026-07-15', is_open: false, is_holiday: true, is_locked: false, label: '추석 연휴',
}

// 날짜 오버라이드 ② — 7월 14일(화) 특강 이벤트로 특별 운영
export const OVERRIDE_SPECIAL: DateOverride = {
  id: 'ov2-special', tenant_id: 't2',
  date: '2026-07-14', is_open: true, is_holiday: false, is_locked: false, label: '특강 이벤트',
}
