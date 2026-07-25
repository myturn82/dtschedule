// blog4 — 셋업 위자드 + 커스텀 필드 (순수 UI 데모, 달력 데이터 없음)

export const FIELD_TYPES = [
  { id: 'text',          icon: '📝', label: '텍스트' },
  { id: 'number',        icon: '🔢', label: '숫자' },
  { id: 'select',        icon: '📋', label: '드롭다운' },
  { id: 'radio',         icon: '⭕', label: '라디오' },
  { id: 'checkbox',      icon: '✅', label: '체크박스' },
  { id: 'checkbox_group',icon: '📦', label: '체크박스그룹' },
  { id: 'phone',         icon: '📞', label: '전화번호' },
  { id: 'image_upload',  icon: '🖼️', label: '이미지첨부' },
] as const

export const MODE_CARDS = [
  { id: 'shared',    icon: '🤝', label: '회원 공유',  desc: '모든 회원이 같은 달력' },
  { id: 'individual',icon: '👤', label: '회원 개별',  desc: '각 회원마다 개별 관리' },
  { id: 'anon',      icon: '🚶', label: '비회원',     desc: '회원 없이 바로 배정' },
] as const
