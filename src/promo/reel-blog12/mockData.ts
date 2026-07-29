// blog12 — 레슨권 패키지 관리

export const PACKAGE_TYPES = [
  { id: '1', name: '4회 레슨',  session_count: 4,  validity_weeks: null },
  { id: '2', name: '8회 레슨',  session_count: 8,  validity_weeks: 8   },
  { id: '3', name: '12회 레슨', session_count: 12, validity_weeks: 12  },
]

export type PkgStatus = 'active' | 'warn' | 'done'

export const PACKAGES: {
  id: string; name: string; pkg: string
  used: number; total: number; status: PkgStatus; expires: string | null
}[] = [
  { id: '1', name: '김지연', pkg: '12회 레슨', used: 10, total: 12, status: 'warn',   expires: '8/3'  },
  { id: '2', name: '박서준', pkg: '8회 레슨',  used: 3,  total: 8,  status: 'active', expires: '9/15' },
  { id: '3', name: '이하은', pkg: '4회 레슨',  used: 4,  total: 4,  status: 'done',   expires: null   },
  { id: '4', name: '최민준', pkg: '8회 레슨',  used: 7,  total: 8,  status: 'warn',   expires: '8/5'  },
  { id: '5', name: '정수아', pkg: '12회 레슨', used: 2,  total: 12, status: 'active', expires: '10/20'},
]

export const EXPIRY_RECIPIENTS = [
  { name: '김지연', pkg: '12회 레슨', remaining: 2, expires: '2026-08-03', daysLeft: 6 },
  { name: '최민준', pkg: '8회 레슨',  remaining: 1, expires: '2026-08-05', daysLeft: 8 },
]
