// blog10 — D-1 배정 알림 (순수 UI 데모)

export const NOTIFICATIONS = [
  { id: 'n1', name: '이준혁', slot: '10:00', read: false, time: '방금 전' },
  { id: 'n2', name: '박서연', slot: '13:00', read: false, time: '방금 전' },
  { id: 'n3', name: '최지민', slot: '15:00', read: true,  time: '방금 전' },
] as const

export const SEND_HISTORY = [
  { id: 'h1', name: '이준혁', msg: '내일 10:00 배정이 있습니다', read: true,  time: '09:00' },
  { id: 'h2', name: '박서연', msg: '내일 13:00 배정이 있습니다', read: false, time: '09:00' },
  { id: 'h3', name: '최지민', msg: '내일 15:00 배정이 있습니다', read: true,  time: '09:00' },
] as const

export const MSG_TEMPLATE = '안녕하세요 {{name}}님!\n내일 {{slot}} 배정이 있습니다 📅'
