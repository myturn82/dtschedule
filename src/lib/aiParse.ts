import { supabase } from './supabase'
import { getFunctionErrorMessage } from './functionsError'
import type { CustomFieldType, OptionValueType } from '../types'

export type WizardDisplayMode = 'none' | 'split' | 'bar'

export interface SetupProposalRole {
  name: string
  display_mode?: WizardDisplayMode
}

export interface SetupProposalCustomFieldOption {
  name: string
  value: string
  value_type?: OptionValueType
}

export interface SetupProposalCustomField {
  label: string
  type: CustomFieldType
  required?: boolean
  options?: SetupProposalCustomFieldOption[]
}

export interface SetupProposal {
  roles: SetupProposalRole[]
  custom_fields: SetupProposalCustomField[]
  closed_weekdays: number[]
  slot_capacity_hint?: number
}

export type BookingAction = 'create' | 'update' | 'delete'

export type BookingTargetScope = 'single' | 'range'

export interface BookingProposal {
  action: BookingAction
  person_name_guess: string | null
  // create: 등록할 시간대 전부. update/delete: 대상을 좁힐 시간대(비어있으면 그 날짜/기간 전체에서 검색)
  time_slots_guess: string[]
  is_recurring: boolean
  // action === 'update' | 'delete'일 때만 사용 — 단일 날짜 대상인지, 기간 전체 대상인지
  target_scope?: BookingTargetScope
  // is_recurring === false일 때(create) 또는 target_scope === 'single'일 때(update/delete) 사용 — 대상 날짜
  weekday_guess: number
  resolved_date: string // YYYY-MM-DD, LLM 계산 — 클라이언트에서 반드시 재검증
  // action === 'create' && is_recurring === true일 때 사용
  recurrence_weekdays?: number[]
  recurrence_start_date?: string // YYYY-MM-DD
  recurrence_end_date?: string   // YYYY-MM-DD
  // action !== 'create' && target_scope === 'range'일 때 사용
  range_start_date?: string // YYYY-MM-DD
  range_end_date?: string   // YYYY-MM-DD
  note?: string | null
  // action === 'update'일 때 사용 — 바뀔 값 (변경 안 하면 null)
  new_time_slot_guess?: string | null
  new_note?: string | null
  custom_field_guesses?: Record<string, string>
}

interface BookingParseContext {
  today: string
  todayWeekday: number
  timeSlots: string[]
  customFields: { id: string; label: string; type: string }[]
}

async function callAiParse<T>(mode: 'setup' | 'booking', text: string, context?: unknown): Promise<{ proposal: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('ai-parse', { body: { mode, text, context } })
  if (error) return { proposal: null, error: await getFunctionErrorMessage(error, 'AI 파싱에 실패했습니다.') }
  if (data?.error) return { proposal: null, error: data.error as string }
  return { proposal: (data?.proposal as T) ?? null, error: null }
}

export function parseSetupText(text: string, context?: { industry?: string }) {
  return callAiParse<SetupProposal>('setup', text, context)
}

export function parseBookingText(text: string, context: BookingParseContext) {
  return callAiParse<BookingProposal>('booking', text, context)
}
