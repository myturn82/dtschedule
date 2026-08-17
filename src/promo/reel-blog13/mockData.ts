export const BEFORE_ENTRIES = [
  { date: '8/16 (일)', lines: ['10:00  조은수, 윤소이', '11:00  이하나'], type: 'normal' as const },
  { date: '8/18 (화)', lines: ['10:00  이하나, 김민지', '※ 김민지 다음주 취소 요청'], type: 'warn' as const },
  { date: '8/20 (목)', lines: ['09:00  조은수', '성시호→박진희??  확인필요'], type: 'uncertain' as const },
]

export const PACKAGES = [
  { name: '1:1 PT 10회', member: '조은수', used: 8, total: 10, color: '#F2604E', badge: '만료 D-4', badgeCls: 'warn' },
  { name: '그룹 필라테스', member: '이하나', used: 5, total: 12, color: '#818cf8', badge: '정기', badgeCls: 'period' },
  { name: '개인 PT 20회', member: '박진희', used: 14, total: 20, color: '#22c55e', badge: '사용중', badgeCls: 'brand' },
]
