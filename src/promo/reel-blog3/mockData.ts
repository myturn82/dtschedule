// 릴스용 데모 데이터 — blog_series_3.md의 역할(Role) 기반 배정 시나리오를 반영.
// indicator_bar(팀장) / split_cell(커트팀·펌염색팀) / 역할없음 세 가지를 대조한다.
import type { Assignment, ScheduleRule, SlotSetting, TimeSlot, TenantRole } from '../../types'

export const YEAR = 2026
export const MONTH = 7

function rulesFor(openDows: number[], slots: TimeSlot[]): ScheduleRule[] {
  const rules: ScheduleRule[] = []
  for (let dow = 0; dow < 7; dow++)
    for (const slot of slots)
      rules.push({ id: `r3-${dow}-${slot}`, tenant_id: 't3', day_of_week: dow, time_slot: slot, is_open: openDows.includes(dow) })
  return rules
}

function slotSettingsFor(slots: TimeSlot[], cap: number): SlotSetting[] {
  return slots.map(s => ({ id: `ss3-${s}`, tenant_id: 't3', time_slot: s, max_capacity: cap, updated_by: null }))
}

function a(day: number, slot: TimeSlot, name: string, roleId?: string): Assignment {
  return {
    id: `a3-${day}-${slot}-${name}`, tenant_id: 't3', year: YEAR, month: MONTH,
    day, time_slot: slot, member_name: name, note: null, member_type: 'member',
    time_sub: null, color: null, user_id: null, role_id: roleId ?? null,
    customer_name: null, customer_phone: null, is_locked: false, account_deleted: false, created_at: '',
  }
}

function role(id: string, name: string, splitCell: boolean, indicatorBar: boolean, order: number): TenantRole {
  return { id, tenant_id: 't3', name, split_cell: splitCell, indicator_bar: indicatorBar, requires_customer_info: false, display_order: order, created_at: '' }
}

// ── 역할 정의 ─────────────────────────────────────────────────────────────────
export const ROLE_LEADER = role('r3-leader', '팀장',     false, true,  0)
export const ROLE_CUT    = role('r3-cut',    '커트팀',    true,  false, 0)
export const ROLE_PERM   = role('r3-perm',   '펌·염색팀', true,  false, 1)

// ── 시나리오 A: 스터디카페 — 역할 없음 ────────────────────────────────────────
const SLOTS_STUDY: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18','18-19','19-20']
const NS = ['이준혁','박서연','최지민','한아름','정우성','김나영','오동현','윤소희']
export const SCENARIO_NOROLE = {
  timeSlots: SLOTS_STUDY,
  scheduleRules: rulesFor([0,1,2,3,4,5,6], SLOTS_STUDY),
  slotSettings: slotSettingsFor(SLOTS_STUDY, 4),
  splitRoles: [] as TenantRole[],
  indicatorBarRoles: [] as TenantRole[],
  isSplitMode: false,
  assignments: [
    a(7,'09-10',NS[0]), a(7,'10-11',NS[1]), a(7,'13-14',NS[2]), a(7,'15-16',NS[3]),
    a(8,'09-10',NS[4]), a(8,'11-12',NS[5]), a(8,'14-15',NS[6]), a(8,'18-19',NS[7]),
    a(9,'10-11',NS[0]), a(9,'13-14',NS[1]), a(9,'16-17',NS[2]), a(9,'19-20',NS[3]),
    a(10,'09-10',NS[4]), a(10,'11-12',NS[5]), a(10,'14-15',NS[6]), a(10,'17-18',NS[7]),
  ],
}

// ── 시나리오 B: 복지관 — 팀장 indicator_bar (평일 운영) ──────────────────────
// 시간별 슬롯으로 세분화 → 행이 많아져 꽉 찬 느낌
// 하이라이트 대상: 7월 7일(화) — 3일 뷰 가운데 열, 팀장 색 줄 강조
const SLOTS_SHELTER: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']
const NV = ['정민아','이수현','박지훈','최유나','김태오','한서영']
export const SCENARIO_INDICATOR = {
  timeSlots: SLOTS_SHELTER,
  scheduleRules: rulesFor([1,2,3,4,5], SLOTS_SHELTER),
  slotSettings: slotSettingsFor(SLOTS_SHELTER, 5),
  splitRoles: [] as TenantRole[],
  indicatorBarRoles: [ROLE_LEADER],
  isSplitMode: false,
  assignments: [
    // 월 6일
    a(6,'09-10','김민수','r3-leader'), a(6,'09-10',NV[0]), a(6,'10-11',NV[1]),
    a(6,'13-14',NV[2]), a(6,'14-15',NV[3]), a(6,'16-17',NV[4]),
    // 화 7일 (하이라이트)
    a(7,'09-10','김민수','r3-leader'), a(7,'09-10',NV[0]), a(7,'10-11',NV[1]),
    a(7,'11-12',NV[2]), a(7,'13-14',NV[3]), a(7,'14-15',NV[4]),
    a(7,'15-16',NV[5]), a(7,'16-17',NV[0]), a(7,'17-18',NV[1]),
    // 수 8일
    a(8,'09-10','박현우','r3-leader'), a(8,'09-10',NV[2]), a(8,'10-11',NV[3]),
    a(8,'13-14',NV[4]), a(8,'15-16',NV[5]), a(8,'17-18',NV[0]),
    // 목 9일
    a(9,'09-10','김민수','r3-leader'), a(9,'09-10',NV[1]), a(9,'11-12',NV[2]),
    a(9,'14-15',NV[3]), a(9,'16-17',NV[4]), a(9,'17-18',NV[5]),
  ],
}
export const HIGHLIGHT_INDICATOR_DAY = 7 // 화요일 (3일 뷰 가운데 열)

// ── 시나리오 C: 미용실 — 커트팀/펌염색팀 split_cell ──────────────────────────
// 시간별 슬롯 빽빽하게 → split 구분이 시각적으로 명확
// 하이라이트 대상: 7월 8일(수) — 3일 뷰 가운데 열
const SLOTS_SALON: TimeSlot[] = ['10-11','11-12','12-13','13-14','14-15','15-16','16-17','17-18']
const NC = ['이하은','최지안','박성진','김도윤','정소율']
const NP = ['강예린','오승민','윤하린','백서준','조은결']
export const SCENARIO_SPLIT = {
  timeSlots: SLOTS_SALON,
  scheduleRules: rulesFor([2,3,4,5,6], SLOTS_SALON),
  slotSettings: slotSettingsFor(SLOTS_SALON, 1),
  splitRoles: [ROLE_CUT, ROLE_PERM],
  indicatorBarRoles: [] as TenantRole[],
  isSplitMode: true,
  assignments: [
    // 화 7일
    a(7,'10-11',NC[0],'r3-cut'), a(7,'10-11',NP[0],'r3-perm'),
    a(7,'11-12',NC[1],'r3-cut'), a(7,'12-13',NP[1],'r3-perm'),
    a(7,'14-15',NC[2],'r3-cut'), a(7,'14-15',NP[2],'r3-perm'),
    a(7,'16-17',NC[3],'r3-cut'), a(7,'17-18',NP[3],'r3-perm'),
    // 수 8일 (하이라이트)
    a(8,'10-11',NC[4],'r3-cut'), a(8,'10-11',NP[4],'r3-perm'),
    a(8,'11-12',NC[0],'r3-cut'), a(8,'11-12',NP[0],'r3-perm'),
    a(8,'12-13',NC[1],'r3-cut'), a(8,'13-14',NP[1],'r3-perm'),
    a(8,'14-15',NC[2],'r3-cut'), a(8,'14-15',NP[2],'r3-perm'),
    a(8,'15-16',NC[3],'r3-cut'), a(8,'15-16',NP[3],'r3-perm'),
    a(8,'16-17',NC[4],'r3-cut'), a(8,'17-18',NP[4],'r3-perm'),
    // 목 9일
    a(9,'10-11',NC[0],'r3-cut'), a(9,'11-12',NP[0],'r3-perm'),
    a(9,'13-14',NC[1],'r3-cut'), a(9,'14-15',NP[1],'r3-perm'),
    a(9,'15-16',NC[2],'r3-cut'), a(9,'16-17',NP[2],'r3-perm'),
    // 금 10일
    a(10,'10-11',NC[3],'r3-cut'), a(10,'10-11',NP[3],'r3-perm'),
    a(10,'12-13',NC[4],'r3-cut'), a(10,'13-14',NP[4],'r3-perm'),
    a(10,'15-16',NC[0],'r3-cut'), a(10,'16-17',NP[0],'r3-perm'),
  ],
}
export const HIGHLIGHT_SPLIT_DAY = 8 // 수요일 (3일 뷰 가운데 열 — 화면 중앙)
