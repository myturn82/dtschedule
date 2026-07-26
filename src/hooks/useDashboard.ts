import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TenantMemberWithRole, SlotSetting, TenantRole, LessonPackageWithUsage } from '../types'

export interface AssignmentSummary {
  user_id: string | null
  member_name: string
  time_slot: string
  day: number
  role_id: string | null
  member_type?: string
  extra_data?: Record<string, string>
}

interface DashboardState {
  pendingMembers: TenantMemberWithRole[]
  members: TenantMemberWithRole[]
  assignments: AssignmentSummary[]
  slotSettings: SlotSetting[]
  tenantRoles: TenantRole[]
  lessonPackagesByUser: Map<string, LessonPackageWithUsage[]>
  loading: boolean
  approveUser: (userId: string) => Promise<string | null>
  rejectUser: (userId: string) => Promise<string | null>
}

export function useDashboard(tenantId: string, year: number, month: number): DashboardState {
  const [pendingMembers, setPendingMembers] = useState<TenantMemberWithRole[]>([])
  const [members, setMembers] = useState<TenantMemberWithRole[]>([])
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([])
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([])
  const [lessonPackagesByUser, setLessonPackagesByUser] = useState<Map<string, LessonPackageWithUsage[]>>(new Map())
  const [loading, setLoading] = useState(true)

  // 멤버/설정: tenantId 변경 시만 재조회
  useEffect(() => {
    if (!tenantId) return
    async function loadMeta() {
      const [membersRes, slotSettingsRes, rolesRes] = await Promise.all([
        supabase
          .from('tenant_members')
          .select('*, profile:profiles(*), tenant_role:tenant_roles(*)')
          .eq('tenant_id', tenantId),
        supabase
          .from('slot_settings')
          .select('*')
          .eq('tenant_id', tenantId),
        supabase
          .from('tenant_roles')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('display_order'),
      ])
      const allMembers = (membersRes.data ?? []) as unknown as TenantMemberWithRole[]
      setPendingMembers(allMembers.filter(m => m.is_approved === false))
      setMembers(allMembers.filter(m => m.is_approved !== false && !m.profile?.is_super_admin))
      setSlotSettings(slotSettingsRes.data ?? [])
      setTenantRoles((rolesRes.data ?? []) as TenantRole[])
    }
    loadMeta()
  }, [tenantId])

  // 레슨 패키지: tenantId 변경 시 재조회 (월 필터 없음)
  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      supabase.from('lesson_packages').select('*').eq('tenant_id', tenantId).order('payment_date', { ascending: false }),
      supabase.from('assignments').select('lesson_package_id').eq('tenant_id', tenantId).not('lesson_package_id', 'is', null),
    ]).then(([pkgsRes, assRes]) => {
      const countMap = new Map<string, number>()
      for (const a of assRes.data ?? []) {
        if (a.lesson_package_id) countMap.set(a.lesson_package_id, (countMap.get(a.lesson_package_id) ?? 0) + 1)
      }
      const byUser = new Map<string, LessonPackageWithUsage[]>()
      for (const p of pkgsRes.data ?? []) {
        if (!p.user_id) continue
        const withUsage = { ...p, used_sessions: countMap.get(p.id) ?? 0 } as LessonPackageWithUsage
        const arr = byUser.get(p.user_id) ?? []
        arr.push(withUsage)
        byUser.set(p.user_id, arr)
      }
      setLessonPackagesByUser(byUser)
    })
  }, [tenantId])

  // 배정: tenantId + year + month 변경 시 재조회
  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    supabase
      .from('assignments')
      .select('user_id, member_name, time_slot, day, role_id, member_type, extra_data')
      .eq('tenant_id', tenantId)
      .eq('year', year)
      .eq('month', month)
      .or('member_type.neq.admin_note,member_type.is.null')
      .then(({ data }) => {
        setAssignments(data ?? [])
        setLoading(false)
      })
  }, [tenantId, year, month])

  const approveUser = useCallback(async (userId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('tenant_members')
      .update({ is_approved: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
    if (!error) {
      setPendingMembers(prev => {
        const found = prev.find(m => m.user_id === userId)
        if (found) setMembers(ms => [...ms, { ...found, is_approved: true }])
        return prev.filter(m => m.user_id !== userId)
      })
    }
    return error?.message ?? null
  }, [tenantId])

  const rejectUser = useCallback(async (userId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
    if (!error) setPendingMembers(prev => prev.filter(m => m.user_id !== userId))
    return error?.message ?? null
  }, [tenantId])

  return { pendingMembers, members, assignments, slotSettings, tenantRoles, lessonPackagesByUser, loading, approveUser, rejectUser }
}
