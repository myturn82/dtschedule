import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TenantMemberWithRole, SlotSetting, TenantRole } from '../types'

export interface AssignmentSummary {
  user_id: string
  volunteer_name: string
  time_slot: string
  day: number
  role_id: string | null
  volunteer_type?: string
  extra_data?: Record<string, string>
}

interface DashboardState {
  pendingMembers: TenantMemberWithRole[]
  members: TenantMemberWithRole[]
  assignments: AssignmentSummary[]
  slotSettings: SlotSetting[]
  tenantRoles: TenantRole[]
  loading: boolean
  approveUser: (userId: string) => Promise<string | null>
  rejectUser: (userId: string) => Promise<string | null>
}

export function useDashboard(tenantId: string): DashboardState {
  const [pendingMembers, setPendingMembers] = useState<TenantMemberWithRole[]>([])
  const [members, setMembers] = useState<TenantMemberWithRole[]>([])
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([])
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    async function loadAll() {
      const [membersRes, assignmentsRes, slotSettingsRes, rolesRes] = await Promise.all([
        supabase
          .from('tenant_members')
          .select('*, profile:profiles(*), tenant_role:tenant_roles(*)')
          .eq('tenant_id', tenantId),
        supabase
          .from('assignments')
          .select('user_id, volunteer_name, time_slot, day, role_id, volunteer_type, extra_data')
          .eq('tenant_id', tenantId)
          .eq('year', year)
          .eq('month', month)
          .or('volunteer_type.neq.admin_note,volunteer_type.is.null'),
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
      setAssignments(assignmentsRes.data ?? [])
      setSlotSettings(slotSettingsRes.data ?? [])
      setTenantRoles((rolesRes.data ?? []) as TenantRole[])
      setLoading(false)
    }
    loadAll()
  }, [tenantId])

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

  return { pendingMembers, members, assignments, slotSettings, tenantRoles, loading, approveUser, rejectUser }
}
