import type { Assignment } from '../types'

export function isAssignmentHighlighted(a: Assignment, highlightName: string | null): boolean {
  if (!highlightName) return false
  const q = highlightName.toLowerCase()
  return (
    a.member_name.toLowerCase().includes(q) ||
    (!!a.note && a.note.toLowerCase().includes(q)) ||
    (!!a.customer_name && a.customer_name.toLowerCase().includes(q)) ||
    (!!a.customer_phone && a.customer_phone.includes(q)) ||
    (!!a.extra_data && Object.values(a.extra_data).some(v => String(v ?? '').toLowerCase().includes(q)))
  )
}
