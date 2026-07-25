// blog9 — 소셜 로그인 + 승인 대기 흐름 (순수 UI 데모)

export const ORGS = [
  { id: 'gym',    icon: '🏋️', name: '파워짐 헬스클럽',  members: 42 },
  { id: 'studio', icon: '🎨', name: '강남 미술학원',    members: 18 },
] as const

export const APPLICANTS = [
  { id: 'a1', name: '김신입', via: '카카오', time: '방금 전' },
  { id: 'a2', name: '이새회원', via: '이메일', time: '3분 전' },
] as const
