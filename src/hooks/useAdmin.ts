import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, ScheduleRule, DateOverride, TenantSettings, TenantMemberWithRole, TenantAccessRole } from '../types'

interface AdminState {
  members: TenantMemberWithRole[]
  profiles: Profile[]                    // computed from members for backward compat
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  loading: boolean
  reloadMembers: () => Promise<void>
  addMember: (email: string, roleId?: string) => Promise<string | null>
  removeMember: (userId: string) => Promise<string | null>
  updateMemberTenantRole: (userId: string, roleId: string | null) => Promise<string | null>
  updateMemberAccess: (userId: string, role: TenantAccessRole) => Promise<string | null>
  toggleScheduleRule: (ruleId: string, currentIsOpen: boolean) => Promise<string | null>
  upsertScheduleRulesForSlots: (slots: string[]) => Promise<string | null>
  addDateOverride: (date: string, isOpen: boolean, isHoliday: boolean, label: string | null) => Promise<string | null>
  deleteDateOverride: (id: string) => Promise<string | null>
  updateTenantSettings: (tenantId: string, settings: Partial<TenantSettings>) => Promise<string | null>
  updateTenantName: (tenantId: string, name: string) => Promise<string | null>
  approveUser: (userId: string) => Promise<string | null>
}

export function useAdmin(tenantId: string): AdminState {
  const [members, setMembers] = useState<TenantMemberWithRole[]>([])
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([])
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])
  const [loading, setLoading] = useState(true)

  const reloadMembers = useCallback(async () => {
    if (!tenantId) return
    const m = await supabase
      .from('tenant_members')
      .select('*, profile:profiles(*), tenant_role:tenant_roles(*)')
      .eq('tenant_id', tenantId)
    setMembers(
      ((m.data ?? []) as unknown as TenantMemberWithRole[])
        .filter(member => member.profile?.is_super_admin !== true)
    )
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    async function loadAll() {
      const [m, r, d] = await Promise.all([
        supabase
          .from('tenant_members')
          .select('*, profile:profiles(*), tenant_role:tenant_roles(*)')
          .eq('tenant_id', tenantId),
        supabase.from('schedule_rules').select('*').eq('tenant_id', tenantId)
          .order('day_of_week').order('time_slot'),
        supabase.from('date_overrides').select('*').eq('tenant_id', tenantId).order('date'),
      ])
      setMembers(
        ((m.data ?? []) as unknown as TenantMemberWithRole[])
          .filter(member => member.profile?.is_super_admin !== true)
      )
      setScheduleRules(r.data ?? [])
      setDateOverrides(d.data ?? [])
      setLoading(false)
    }
    loadAll()
  }, [tenantId])

  const profiles: Profile[] = members.map(m => m.profile).filter(Boolean)

  const addMember = useCallback(async (email: string, roleId?: string): Promise<string | null> => {
    const { data: user, error: findErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    if (findErr || !user) return '해당 이메일로 가입된 사용자가 없습니다.'
    if (user.is_super_admin) return '슈퍼어드민 계정은 조직에 추가할 수 없습니다.'

    const { data, error } = await supabase
      .from('tenant_members')
      .insert({ tenant_id: tenantId, user_id: user.id, role: 'member', role_id: roleId ?? null, is_approved: true })
      .select('*, profile:profiles(*), tenant_role:tenant_roles(*)')
      .single()
    if (error?.code === '23505') return '이미 소속된 회원입니다.'
    if (error) return error.message
    if (data) setMembers(prev => [...prev, data as unknown as TenantMemberWithRole])
    return null
  }, [tenantId])

  const removeMember = useCallback(async (userId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
    if (!error) setMembers(prev => prev.filter(m => m.user_id !== userId))
    return error?.message ?? null
  }, [tenantId])

  const updateMemberTenantRole = useCallback(async (userId: string, roleId: string | null): Promise<string | null> => {
    const { error } = await supabase
      .from('tenant_members')
      .update({ role_id: roleId })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
    if (!error) {
      setMembers(prev => prev.map(m => {
        if (m.user_id !== userId) return m
        const newRole = roleId ? members.flatMap(x => x.tenant_role ? [x.tenant_role] : []).find(r => r.id === roleId) ?? null : null
        return { ...m, role_id: roleId, tenant_role: newRole }
      }))
    }
    return error?.message ?? null
  }, [tenantId, members])

  const updateMemberAccess = useCallback(async (userId: string, role: TenantAccessRole): Promise<string | null> => {
    const { error } = await supabase
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
    if (!error) setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m))
    return error?.message ?? null
  }, [tenantId])

  const toggleScheduleRule = useCallback(async (ruleId: string, currentIsOpen: boolean): Promise<string | null> => {
    const newIsOpen = !currentIsOpen
    const { error } = await supabase.from('schedule_rules').update({ is_open: newIsOpen }).eq('id', ruleId)
    if (!error) setScheduleRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_open: newIsOpen } : r))
    return error?.message ?? null
  }, [])

  const upsertScheduleRulesForSlots = useCallback(async (slots: string[]): Promise<string | null> => {
    const rows = [0, 1, 2, 3, 4, 5, 6].flatMap(day =>
      slots.map(slot => ({ tenant_id: tenantId, day_of_week: day, time_slot: slot, is_open: true }))
    )
    const { data, error } = await supabase
      .from('schedule_rules')
      .upsert(rows, { onConflict: 'tenant_id,day_of_week,time_slot', ignoreDuplicates: true })
      .select()
    if (error) return error.message
    if (data?.length) {
      setScheduleRules(prev => {
        const newRules = (data as ScheduleRule[]).filter(r => !prev.some(p => p.id === r.id))
        return [...prev, ...newRules]
      })
    }
    return null
  }, [tenantId])

  const addDateOverride = useCallback(async (date: string, isOpen: boolean, isHoliday: boolean, label: string | null): Promise<string | null> => {
    const { data, error } = await supabase
      .from('date_overrides')
      .upsert({ tenant_id: tenantId, date, is_open: isOpen, is_holiday: isHoliday, label }, { onConflict: 'tenant_id,date' })
      .select().single()
    if (!error && data) {
      setDateOverrides(prev => {
        const idx = prev.findIndex(d => d.date === date)
        if (idx >= 0) return prev.map((d, i) => i === idx ? data : d)
        return [...prev, data].sort((a, b) => a.date.localeCompare(b.date))
      })
    }
    return error?.message ?? null
  }, [tenantId])

  const deleteDateOverride = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('date_overrides').delete().eq('id', id)
    if (!error) setDateOverrides(prev => prev.filter(d => d.id !== id))
    return error?.message ?? null
  }, [])

  const updateTenantSettings = useCallback(async (tid: string, settings: Partial<TenantSettings>): Promise<string | null> => {
    const { data: current } = await supabase.from('tenants').select('settings').eq('id', tid).single()
    const merged = { ...(current?.settings ?? {}), ...settings }
    const { error } = await supabase.from('tenants').update({ settings: merged, updated_at: new Date().toISOString() }).eq('id', tid)
    return error?.message ?? null
  }, [])

  const updateTenantName = useCallback(async (tid: string, name: string): Promise<string | null> => {
    const { error } = await supabase.from('tenants').update({ name, updated_at: new Date().toISOString() }).eq('id', tid)
    return error?.message ?? null
  }, [])

  const approveUser = useCallback(async (userId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('tenant_members')
      .update({ is_approved: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
    if (!error) {
      setMembers(prev => prev.map(m =>
        m.user_id === userId ? { ...m, is_approved: true } : m
      ))
    }
    return error?.message ?? null
  }, [tenantId])

  return {
    members, profiles, scheduleRules, dateOverrides, loading,
    reloadMembers,
    addMember, removeMember, updateMemberTenantRole, updateMemberAccess,
    toggleScheduleRule, upsertScheduleRulesForSlots,
    addDateOverride, deleteDateOverride,
    updateTenantSettings, updateTenantName, approveUser,
  }
}
