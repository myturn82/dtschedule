import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTenant } from '../contexts/TenantContext'
import type { Profile } from '../types'

export function useProfiles() {
  const { tenant } = useTenant()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    supabase
      .from('tenant_members')
      .select('profiles(*)')
      .eq('tenant_id', tenant.id)
      .then(({ data }) => {
        const list = ((data ?? []) as unknown as { profiles: Profile | null }[])
          .map(m => m.profiles)
          .filter(Boolean) as Profile[]
        list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
        setProfiles(list)
        setLoading(false)
      })
  }, [tenant?.id])

  return { profiles, loading }
}
