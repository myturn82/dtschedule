import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Tenant, TenantMember, TenantAccessRole, LegendItem, CustomFieldDef } from '../types'
import { generateTimeSlots, DEFAULT_TIME_SLOTS } from '../utils/timeSlots'

interface MembershipWithTenant extends TenantMember {
  tenant: Tenant
}

interface TenantContextValue {
  tenant: Tenant | null
  tenantRole: TenantAccessRole | null
  memberships: MembershipWithTenant[]
  loading: boolean
  tenantSelectedByUser: boolean
  timeSlots: string[]
  slotLabels: Record<string, string>
  legendItems: LegendItem[]
  customFields: CustomFieldDef[]
  setTenant: (tenant: Tenant, role: TenantAccessRole) => void
  resetTenantSelection: () => void
  updateCurrentTenant: (tenant: Tenant) => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant | null>(null)
  const [tenantRole, setTenantRole] = useState<TenantAccessRole | null>(null)
  const [memberships, setMemberships] = useState<MembershipWithTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantSelectedByUser, setTenantSelectedByUser] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchMemberships(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchMemberships(session.user.id)
      } else {
        setMemberships([])
        setTenantState(null)
        setTenantRole(null)
        setTenantSelectedByUser(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchMemberships(userId: string) {
    const { data } = await supabase
      .from('tenant_members')
      .select('*, tenant:tenants(*)')
      .eq('user_id', userId)

    const list = (data ?? []) as MembershipWithTenant[]
    // 승인된 멤버십만 사용 (is_approved가 없으면 true로 간주 — 마이그레이션 전 호환)
    const approved = list.filter(m => m.is_approved !== false)
    setMemberships(approved)

    if (approved.length === 1) {
      setTenantState(approved[0].tenant)
      setTenantRole(approved[0].role)
    }

    setLoading(false)
  }

  function setTenant(t: Tenant, role: TenantAccessRole) {
    setTenantState(t)
    setTenantRole(role)
    setTenantSelectedByUser(true)
  }

  function resetTenantSelection() {
    setTenantState(null)
    setTenantRole(null)
    setTenantSelectedByUser(false)
  }

  function updateCurrentTenant(updated: Tenant) {
    setTenantState(prev => prev?.id === updated.id ? updated : prev)
    setMemberships(prev => prev.map(m => m.tenant.id === updated.id ? { ...m, tenant: updated } : m))
  }

  const timeSlots = useMemo(() => {
    if (!tenant) return DEFAULT_TIME_SLOTS
    const s = tenant.settings
    if (s.time_slots?.length) return s.time_slots
    return generateTimeSlots(s.open_from, s.open_to, s.slot_interval_minutes)
  }, [tenant])

  const slotLabels = useMemo<Record<string, string>>(
    () => tenant?.settings?.slot_labels ?? {},
    [tenant]
  )

  const legendItems = useMemo<LegendItem[]>(
    () => tenant?.settings?.legend_items ?? [],
    [tenant]
  )

  const customFields = useMemo<CustomFieldDef[]>(
    () => tenant?.settings?.custom_fields ?? [],
    [tenant]
  )

  return (
    <TenantContext.Provider value={{
      tenant,
      tenantRole,
      memberships,
      loading,
      tenantSelectedByUser,
      timeSlots,
      slotLabels,
      legendItems,
      customFields,
      setTenant,
      resetTenantSelection,
      updateCurrentTenant,
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
