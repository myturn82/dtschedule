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

export function maskPhone(value: string | null | undefined): string {
  const formatted = fmtPhone(value)
  if (!formatted) return ''
  const parts = formatted.split('-')
  if (parts.length !== 3) return formatted
  return `${parts[0]}-****-${parts[2]}`
}

export function maskEmail(value: string | null | undefined): string {
  if (!value) return ''
  const at = value.indexOf('@')
  if (at <= 0) return value
  const local = value.slice(0, at)
  const domain = value.slice(at)
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 2))}${domain}`
}

export function maskName(value: string | null | undefined): string {
  if (!value) return ''
  const chars = [...value]
  if (chars.length <= 1) return value
  if (chars.length === 2) return `${chars[0]}*`
  return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`
}
