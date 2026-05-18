import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../contexts/TenantContext'
import type { Profile } from '../types'

export type ProfileWithRole = Profile & { tenantRoleId: string | null }

export function useProfiles() {
  const { tenant } = useTenant()
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    supabase
      .from('tenant_members')
      .select('role_id, profiles(*)')
      .eq('tenant_id', tenant.id)
      .then(({ data }) => {
        const list = ((data ?? []) as unknown as { role_id: string | null; profiles: Profile | null }[])
          .map(m => m.profiles ? { ...m.profiles, tenantRoleId: m.role_id ?? null } : null)
          .filter(Boolean) as ProfileWithRole[]
        list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        setProfiles(list)
        setLoading(false)
      })
  }, [tenant?.id])

  return { profiles, loading }
}
