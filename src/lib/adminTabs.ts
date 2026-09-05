export type Tab = 'members' | 'roles' | 'rules' | 'settings' | 'autoassign' | 'legend' | 'custom_fields' | 'notifications' | 'lessons' | 'feedback' | 'hours' | 'attendance'

export const TAB_LABELS: Record<Tab, string> = {
  members: '회원 관리',
  roles: '역할 관리',
  rules: '날짜·요일·시간',
  settings: '조직',
  autoassign: '자동배정관리',
  legend: '범례 관리',
  custom_fields: '입력항목',
  notifications: '배정알림',
  lessons: '레슨권',
  feedback: '피드백',
  hours: '시간 집계',
  attendance: '출석 현황',
}

export const DEFAULT_TAB_ORDER: Tab[] = Object.keys(TAB_LABELS) as Tab[]
