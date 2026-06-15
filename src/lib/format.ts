import { formatPhone } from './phone'

export function fmtPhone(value: string | null | undefined): string {
  if (!value) return ''
  return formatPhone(value)
}

export function fmtNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return String(value)
  return n.toLocaleString('ko-KR')
}

export function maskPhone(v: string): string { return fmtPhone(v) }
export function maskEmail(v: string): string { return v }
export function maskName(v: string):  string { return v }
