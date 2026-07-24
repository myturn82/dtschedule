// 릴스용 데모 데이터 — blog_series_1.md의 시나리오 A(회원공유) / B(회원개별) / C(비회원)를 그대로 반영.
// 실제 앱 타입(Assignment, ScheduleRule, SlotSetting 등)을 그대로 사용하며,
// 컴포넌트(ScheduleHeader, MonthScheduleByDay, SlotEditModal)는 src/components에서 실제 파일을 import한다.
import type { Assignment, ScheduleRule, SlotSetting, TimeSlot, TenantMode, ModalTarget } from '../../types'

export const YEAR = 2026
export const MONTH = 7

function rulesFor(openDows: number[], slots: TimeSlot[]): ScheduleRule[] {
  const rules: ScheduleRule[] = []
  for (let dow = 0; dow < 7; dow++) {
    for (const slot of slots) {
      rules.push({ id: `r-${dow}-${slot}`, tenant_id: 't', day_of_week: dow, time_slot: slot, is_open: openDows.includes(dow) })
    }
  }
  return rules
}

function slotSettingsFor(slots: TimeSlot[], capacity: number): SlotSetting[] {
  return slots.map(s => ({ id: `ss-${s}`, tenant_id: 't', time_slot: s, max_capacity: capacity, updated_by: null }))
}

function a(over: Partial<Assignment> & Pick<Assignment, 'day' | 'time_slot' | 'member_name'>): Assignment {
  return {
    id: `a-${over.day}-${over.time_slot}-${over.member_name}`,
    tenant_id: 't', year: YEAR, month: MONTH,
    note: null, member_type: 'member', time_sub: null, color: null,
    user_id: null, role_id: null, customer_name: null, customer_phone: null,
    is_locked: false, account_deleted: false, created_at: '',
    ...over,
  }
}

// 그 달에서 특정 요일(0=일..6=토)에 해당하는 날짜(day) 목록
function datesIn(year: number, month: number, dow: number): number[] {
  const count = new Date(year, month, 0).getDate()
  const out: number[] = []
  for (let d = 1; d <= count; d++) {
    if (new Date(year, month - 1, d).getDay() === dow) out.push(d)
  }
  return out
}

export interface Scenario {
  key: string
  mode: TenantMode
  orgName: string
  orgTagline: string
  kicker: string
  headline: string
  sub: string
  timeSlots: TimeSlot[]
  scheduleRules: ScheduleRule[]
  slotSettings: SlotSetting[]
  assignments: Assignment[]
  displayAssignmentFilter?: (a: Assignment) => boolean
}

const SATURDAYS = datesIn(YEAR, MONTH, 6)
const SUNDAYS = datesIn(YEAR, MONTH, 0)
const MONDAYS = datesIn(YEAR, MONTH, 1)
const WEDNESDAYS = datesIn(YEAR, MONTH, 3)
const FRIDAYS = datesIn(YEAR, MONTH, 5)

// ── 시나리오 A: 회원공유 모드 — 주말 유기견 보호소 봉사단 ──────────────────────
const SLOTS_A: TimeSlot[] = ['09-12', '13-16', '16-19']
const NAMES_A = ['정민아', '이수현', '박지훈', '최유나', '김태오', '한서영', '오승민', '배지호']

export const SCENARIO_A: Scenario = {
  key: 'shared',
  mode: '회원공유',
  orgName: '행복 유기견 보호소',
  orgTagline: '주말 봉사단 · 회원 12명',
  kicker: '회원공유 모드',
  headline: '누가 언제 가는지\n모두가 봅니다',
  sub: '빈 슬롯을 직접 클릭해 본인 참여를 등록하고, 서로 일정을 조율해요',
  timeSlots: SLOTS_A,
  scheduleRules: rulesFor([0, 6], SLOTS_A), // 주말만 운영
  slotSettings: slotSettingsFor(SLOTS_A, 4),
  assignments: [
    ...SATURDAYS.flatMap((d, i) => [
      a({ day: d, time_slot: '09-12', member_name: NAMES_A[i % NAMES_A.length] }),
      a({ day: d, time_slot: '09-12', member_name: NAMES_A[(i + 1) % NAMES_A.length] }),
    ]),
    ...SUNDAYS.flatMap((d, i) => [
      a({ day: d, time_slot: '09-12', member_name: NAMES_A[(i + 2) % NAMES_A.length] }),
      a({ day: d, time_slot: '16-19', member_name: NAMES_A[(i + 3) % NAMES_A.length] }),
    ]),
    // 토요일 13-16 / 16-19는 의도적으로 비워 "빈 슬롯" 스토리와 등록 데모용 자리로 남겨둠
  ],
}

// 등록 데모용 타깃: 첫째 주 토요일 16-19 (비어있는 슬롯)
export const REGISTER_TARGET: ModalTarget = {
  year: YEAR, month: MONTH, day: SATURDAYS[0], timeSlot: '16-19', memberType: 'member',
}
export const REGISTER_MEMBER_NAME = '박세아'

// ── 시나리오 B: 회원개별 모드 — PT 헬스장 ───────────────────────────────────
const SLOTS_B: TimeSlot[] = ['10-11', '14-15', '19-20', '20-21']
export const SCENARIO_B: Scenario = {
  key: 'individual',
  mode: '회원개별',
  orgName: '코어짐 PT',
  orgTagline: '트레이너 4명 · 1:1 세션',
  kicker: '회원개별 모드',
  headline: '내 예약만\n보입니다',
  sub: '다른 회원의 이름·시간은 노출되지 않아요. 본인 세션만 캘린더에 표시돼요',
  timeSlots: SLOTS_B,
  scheduleRules: rulesFor([1, 2, 3, 4, 5, 6], SLOTS_B), // 월~토 운영
  slotSettings: slotSettingsFor(SLOTS_B, 1),
  assignments: [
    ...MONDAYS.map(d => a({ day: d, time_slot: '19-20', member_name: '김도윤', user_id: 'me' })),
    ...WEDNESDAYS.map(d => a({ day: d, time_slot: '19-20', member_name: '김도윤', user_id: 'me' })),
    ...FRIDAYS.map(d => a({ day: d, time_slot: '10-11', member_name: '김도윤', user_id: 'me' })),
    // 다른 회원 예약 — displayAssignmentFilter로 필터링되어 화면엔 안 보임
    ...MONDAYS.map(d => a({ day: d, time_slot: '10-11', member_name: '이하은', user_id: 'u2' })),
    ...WEDNESDAYS.map(d => a({ day: d, time_slot: '14-15', member_name: '박성진', user_id: 'u3' })),
    ...FRIDAYS.map(d => a({ day: d, time_slot: '20-21', member_name: '최지안', user_id: 'u4' })),
  ],
  displayAssignmentFilter: (assignment) => assignment.user_id === 'me',
}

// ── 시나리오 C: 비회원 모드 — 대학가 카페 알바 ──────────────────────────────
const SLOTS_C: TimeSlot[] = ['07-13', '13-19', '19-23']
export const SCENARIO_C: Scenario = {
  key: 'freeform',
  mode: '비회원',
  orgName: '브루웨이브 카페',
  orgTagline: '점장 1명 · 알바 5명 · 회원가입 없음',
  kicker: '비회원 모드',
  headline: '가입 없이,\n링크 하나로',
  sub: '알바생은 회원가입 없이 공유 링크로 이번 달 근무를 바로 확인해요',
  timeSlots: SLOTS_C,
  scheduleRules: rulesFor([0, 1, 2, 3, 4, 5, 6], SLOTS_C), // 연중무휴
  slotSettings: slotSettingsFor(SLOTS_C, 1),
  assignments: [
    ...MONDAYS.map(d => a({ day: d, time_slot: '07-13', member_name: '유하린' })),
    ...MONDAYS.map(d => a({ day: d, time_slot: '13-19', member_name: '조은결' })),
    ...WEDNESDAYS.map(d => a({ day: d, time_slot: '19-23', member_name: '남도영' })),
    ...FRIDAYS.map(d => a({ day: d, time_slot: '13-19', member_name: '조은결' })),
    ...SATURDAYS.map(d => a({ day: d, time_slot: '07-13', member_name: '백서준' })),
  ],
}

export const SCENARIOS: Scenario[] = [SCENARIO_A, SCENARIO_B, SCENARIO_C]
