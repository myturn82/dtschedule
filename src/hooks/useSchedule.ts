import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, VolunteerType } from '../types'

interface ScheduleData {
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  loading: boolean
  addAssignment: (params: AddParams) => Promise<string | null>
  updateAssignment: (id: string, params: UpdateParams) => Promise<string | null>
  deleteAssignment: (id: string) => Promise<string | null>
  clearAssignments: (days?: number[]) => Promise<string | null>
  updateSlotCapacity: (timeSlot: TimeSlot, maxCapacity: number) => Promise<string | null>
}

interface AddParams {
  tenant_id: string
  year: number
  month: number
  day: number
  time_slot: TimeSlot
  volunteer_name: string
  note?: string
  volunteer_type: string
  time_sub?: string
  color?: string
  user_id: string
  role_id?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  extra_data?: Record<string, string>
}

interface UpdateParams {
  volunteer_name?: string
  note?: string
  volunteer_type?: VolunteerType
  time_sub?: string
  color?: string
  role_id?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  extra_data?: Record<string, string>
}

export function useSchedule(tenantId: string, year: number, month: number): ScheduleData {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([])
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([])
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId, year, month])

  const addAssignment = useCallback(async (params: AddParams): Promise<string | null> => {
    if (params.volunteer_type !== 'admin_note') {
      const isDuplicate = assignments.some(
        a => a.year === params.year && a.month === params.month &&
             a.day === params.day && a.time_slot === params.time_slot &&
             a.volunteer_name === params.volunteer_name
      )
      if (isDuplicate) return '이미 같은 회원이 배정되어 있습니다'
    }
    const { data, error } = await supabase.from('assignments').insert(params).select().single()
    if (!error && data) setAssignments(prev =>
      prev.some(a => a.id === (data as Assignment).id) ? prev : [...prev, data as Assignment]
    )
    return error?.message ?? null
  }, [assignments])

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
    if (days?.length) query = query.in('day', days)
    const { error } = await query
    if (error) return error.message
    setAssignments(prev =>
      days?.length
        ? prev.filter(a => !(a.year === year && a.month === month && days.includes(a.day)))
        : []
    )
    return null
  }, [tenantId, year, month])

  const updateSlotCapacity = useCallback(async (timeSlot: TimeSlot, maxCapacity: number): Promise<string | null> => {
    const { error } = await supabase
      .from('slot_settings')
      .upsert(
        { tenant_id: tenantId, time_slot: timeSlot, max_capacity: maxCapacity },
        { onConflict: 'tenant_id,time_slot' }
      )
    if (error) return error.message
    const { data } = await supabase.from('slot_settings').select('*').eq('tenant_id', tenantId)
    if (data) setSlotSettings(data)
    return null
  }, [tenantId])

  return { assignments, slotSettings, scheduleRules, dateOverrides, loading, addAssignment, updateAssignment, deleteAssignment, clearAssignments, updateSlotCapacity }
}
