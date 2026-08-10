// reel-landing — LESSON:ON 랜딩 소개 릴스

export const BG_CARDS = [
  { label: '☐ 수강권 현황', val: '12', unit: '/ 20회', barPct: 60, sub: '만료 D-12', type: 'bar' as const },
  { label: '◎ D-1 알림', msg: '내일 수업 안내', body: '김민지님, 내일 오전 10시 필라테스 수업이 있습니다.', ok: '✓ 발송 완료 · 3명', type: 'notif' as const },
  { label: '○ 회원 현황', val: '8', unit: '명', trend: '↑ 이번 달 +3명', sub: '출석률 82%', type: 'stat' as const },
  { label: '☐ 이번 주', type: 'week' as const },
]

export const PACKAGES = [
  { name: '필라테스 20회권', member: '김민지', used: 12, total: 20, color: '#F2604E', badge: '횟수제', badgeCls: 'brand' },
  { name: 'PT 10회권',      member: '이준혁', used: 8,  total: 10, color: '#f59e0b', badge: '만료임박', badgeCls: 'warn' },
  { name: '요가 월정액',    member: '박서연', used: 15, total: 30, color: '#818cf8', badge: '기간제',  badgeCls: 'period' },
]

export const SENT_LIST = [
  { name: '김민지', time: '10:00 필라테스', read: true,  initial: '민', gradient: 'linear-gradient(135deg,#F2604E,#ff9a6c)' },
  { name: '이준혁', time: '14:00 PT',      read: true,  initial: '준', gradient: 'linear-gradient(135deg,#818cf8,#a78bfa)' },
  { name: '박서연', time: '16:00 요가',    read: false, initial: '서', gradient: 'linear-gradient(135deg,#22c55e,#4ade80)' },
]
