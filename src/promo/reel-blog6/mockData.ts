// blog6 — 브라우저 이미지 압축 (순수 UI 데모, 달력 데이터 없음)

export const MOCK_IMAGES = [
  { id: 1, bg: 'linear-gradient(135deg, #0f1923 0%, #1e3a5f 100%)', label: '시술 전', emoji: '📷' },
  { id: 2, bg: 'linear-gradient(135deg, #0f2318 0%, #1e5f3a 100%)', label: '시술 후', emoji: '✨' },
  { id: 3, bg: 'linear-gradient(135deg, #23150f 0%, #5f3a1e 100%)', label: '완성',   emoji: '🎨' },
] as const

export const ORIG_KB = 4296   // 원본 4.2 MB (표시: KB 단위)
export const COMP_KB = 312    // 압축 후 312 KB
