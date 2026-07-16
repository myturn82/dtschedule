import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { upsertSlotCapacity } from '../lib/slotSettings'
import { insertAssignment, type AddAssignmentParams } from '../lib/assignments'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, MemberType } from '../types'

interface ScheduleData {
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  loading: boolean
  addAssignment: (params: AddParams) => Promise<string | null>
  addAssignmentWithId: (params: AddParams) => Promise<{ error: string | null; id: string | null }>
  updateAssignment: (id: string, params: UpdateParams) => Promise<string | null>
  deleteAssignment: (id: string) => Promise<string | null>
  clearAssignments: (days?: number[]) => Promise<string | null>
  lockAssignments: (locked: boolean, isSuperAdmin: boolean, days?: number[]) => Promise<string | null>
  updateSlotCapacity: (timeSlot: TimeSlot, maxCapacity: number) => Promise<string | null>
}

type AddParams = AddAssignmentParams

interface UpdateParams {
  member_name?: string
  note?: string
  member_type?: MemberType
  time_sub?: string
  color?: string
  role_id?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  extra_data?: Record<string, string>
  is_locked?: boolean
}

export function useSchedule(tenantId: string, year: number, month: number): ScheduleData {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([])
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([])
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      supabase.from('assignments').select('*')
        .eq('tenant_id', tenantId).eq('year', year).eq('month', month),
      supabase.from('slot_settings').select('*')
        .eq('tenant_id', tenantId),
      supabase.from('schedule_rules').select('*')
        .eq('tenant_id', tenantId),
      supabase.from('date_overrides').select('*')
        .eq('tenant_id', tenantId)
        .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('date', `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`),
    ]).then(([a, ss, sr, dov]) => {
      if (a.data) setAssignments(a.data)
      if (ss.data) setSlotSettings(ss.data)
      if (sr.data) setScheduleRules(sr.data)
      if (dov.data) setDateOverrides(dov.data)
      setLoading(false)
    })

    const channel = supabase
      .channel(`assignments-${tenantId}-${year}-${month}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'assignments',
        filter: `tenant_id=eq.${tenantId}`,
      }, payload => setAssignments(prev => {
        const incoming = payload.new as Assignment
        if (incoming.year !== year || incoming.month !== month) return prev
        return prev.some(a => a.id === incoming.id) ? prev : [...prev, incoming]
      }))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'assignments',
        filter: `tenant_id=eq.${tenantId}`,
      }, payload => {
        const updated = payload.new as Assignment
        if (updated.year === year && updated.month === month) {
          setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a))
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'assignments',
      }, payload => setAssignments(prev => prev.filter(a => a.id !== payload.old.id)))
      // ── date_overrides 실시간 구독 (잠금·휴관 즉시 반영) ──────────────────
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'date_overrides',
        filter: `tenant_id=eq.${tenantId}`,
      }, payload => {
        const row = payload.new as DateOverride
        const pad = (n: number) => String(n).padStart(2, '0')
        const from = `${year}-${pad(month)}-01`
        const to   = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`
        if (row.date < from || row.date > to) return
        setDateOverrides(prev => prev.some(d => d.id === row.id) ? prev : [...prev, row])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'date_overrides',
        filter: `tenant_id=eq.${tenantId}`,
      }, payload => {
        const row = payload.new as DateOverride
        const pad = (n: number) => String(n).padStart(2, '0')
        const from = `${year}-${pad(month)}-01`
        const to   = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`
        if (row.date < from || row.date > to) return
        setDateOverrides(prev =>
          prev.some(d => d.id === row.id)
            ? prev.map(d => d.id === row.id ? row : d)
            : [...prev, row]
        )
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'date_overrides',
        filter: `tenant_id=eq.${tenantId}`,
        // REPLICA IDENTITY FULL 설정으로 DELETE filter 가능
      }, payload => {
        setDateOverrides(prev => prev.filter(d => d.id !== (payload.old as { id: string }).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId, year, month])

  const addAssignmentWithId = useCallback(async (params: AddParams): Promise<{ error: string | null; id: string | null }> => {
    const { data, error } = await insertAssignment(params, assignments)
    if (!error && data) setAssignments(prev => prev.some(a => a.id === data.id) ? prev : [...prev, data])
    return { error, id: data?.id ?? null }
  }, [assignments])

  const addAssignment = useCallback(async (params: AddParams): Promise<string | null> => {
    const { error } = await addAssignmentWithId(params)
    return error
  }, [addAssignmentWithId])

  const updateAssignment = useCallback(async (id: string, params: UpdateParams): Promise<string | null> => {
    const { error } = await supabase.from('assignments').update(params).eq('id', id)
    if (error) return error.message
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...params } : a))
    return null
  }, [])

  const deleteAssignment = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) return error.message
    setAssignments(prev => prev.filter(a => a.id !== id))
    return null
  }, [])

  const clearAssignments = useCallback(async (days?: number[]): Promise<string | null> => {
    let query = supabase.from('assignments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('year', year)
      .eq('month', month)
      .eq('is_locked', false)
    if (days?.length) query = query.in('day', days)
    const { error } = await query
    if (error) return error.message
    setAssignments(prev =>
      prev.filter(a => a.is_locked || !(
        a.year === year && a.month === month && (!days?.length || days.includes(a.day))
      ))
    )
    return null
  }, [tenantId, year, month])

  const lockAssignments = useCallback(async (locked: boolean, isSuperAdmin: boolean, days?: number[]): Promise<string | null> => {
    // 1. 날짜 단위 잠금 — 미배정 슬롯의 신규 등록 차단/허용 (date_overrides.is_locked)
    const daysInMonth = new Date(year, month, 0).getDate()
    const targetDays = days?.length ? days : Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const targetDates = targetDays.map(d => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)

    if (locked) {
      const { error: dovError } = await supabase
        .from('date_overrides')
        .upsert(targetDates.map(date => ({ tenant_id: tenantId, date, is_locked: true })), { onConflict: 'tenant_id,date' })
      if (dovError) return dovError.message
      setDateOverrides(prev => {
        const next = [...prev]
        targetDates.forEach(date => {
          const idx = next.findIndex(o => o.date === date)
          if (idx >= 0) next[idx] = { ...next[idx], is_locked: true }
          else next.push({ id: crypto.randomUUID(), tenant_id: tenantId, date, is_open: true, is_holiday: false, is_locked: true, label: null })
        })
        return next
      })
    } else {
      const { error: dovError } = await supabase
        .from('date_overrides')
        .update({ is_locked: false })
        .eq('tenant_id', tenantId)
        .in('date', targetDates)
      if (dovError) return dovError.message
      setDateOverrides(prev => prev.map(o => targetDates.includes(o.date) ? { ...o, is_locked: false } : o))
    }

    // 2. 기존 배정 건의 잠금/해제 — 해제는 슈퍼관리자만 가능 (043 트리거)
    if (locked || isSuperAdmin) {
      let query = supabase.from('assignments')
        .update({ is_locked: locked })
        .eq('tenant_id', tenantId)
        .eq('year', year)
        .eq('month', month)
        .eq('is_locked', !locked)
      if (days?.length) query = query.in('day', days)
      const { error } = await query
      if (error) return error.message
      setAssignments(prev => prev.map(a =>
        a.year === year && a.month === month && (!days?.length || days.includes(a.day)) && a.is_locked === !locked
          ? { ...a, is_locked: locked }
          : a
      ))
    }

    return null
  }, [tenantId, year, month])

  const updateSlotCapacity = useCallback(async (timeSlot: TimeSlot, maxCapacity: number): Promise<string | null> => {
    const err = await upsertSlotCapacity(tenantId, timeSlot, maxCapacity)
    if (err) return err
    const { data } = await supabase.from('slot_settings').select('*').eq('tenant_id', tenantId)
    if (data) setSlotSettings(data)
    return null
  }, [tenantId])

  return { assignments, slotSettings, scheduleRules, dateOverrides, loading, addAssignment, addAssignmentWithId, updateAssignment, deleteAssignment, clearAssignments, lockAssignments, updateSlotCapacity }
}
