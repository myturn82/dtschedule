// 한국 전화번호 형식 검증 (휴대폰/시내전화, 하이픈 선택)
export const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.trim())
}

// 입력 중인 전화번호에 하이픈을 자동으로 붙여 'XXX-XXXX-XXXX' / '02-XXXX-XXXX' 형식으로 변환
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, -4)}-${digits.slice(-4)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`
  }
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, -4)}-${digits.slice(-4)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
}
