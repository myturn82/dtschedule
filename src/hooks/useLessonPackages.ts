import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { LessonPackageType, LessonPackage, LessonPackageWithUsage } from '../types'

export interface UseLessonPackagesResult {
  packageTypes: LessonPackageType[]
  packages: LessonPackageWithUsage[]
  loading: boolean
  addPackageType: (data: { name: string; session_count: number; validity_days: number | null; display_order?: number }) => Promise<string | null>
  updatePackageType: (id: string, data: Partial<Pick<LessonPackageType, 'name' | 'session_count' | 'validity_days' | 'is_active' | 'display_order'>>) => Promise<string | null>
  deletePackageType: (id: string) => Promise<string | null>
  movePackageType: (id: string, dir: -1 | 1) => void
  addPackage: (data: { user_id: string; package_type_id: string | null; package_name: string; total_sessions: number; initial_used_sessions?: number; payment_date: string; expires_at: string | null; notes: string | null; created_by: string | null }) => Promise<string | null>
  deletePackage: (id: string) => Promise<string | null>
  reload: () => Promise<void>
}

export function useLessonPackages(tenantId: string): UseLessonPackagesResult {
  const [packageTypes, setPackageTypes] = useState<LessonPackageType[]>([])
  const [packages, setPackages] = useState<LessonPackageWithUsage[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    const [typesRes, pkgsRes, assRes] = await Promise.all([
      supabase
        .from('lesson_package_types')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order')
        .order('created_at'),
      supabase
        .from('lesson_packages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('payment_date', { ascending: false }),
      supabase
        .from('assignments')
        .select('lesson_package_id')
        .eq('tenant_id', tenantId)
        .not('lesson_package_id', 'is', null),
    ])

    setPackageTypes((typesRes.data ?? []) as LessonPackageType[])

    const countMap = new Map<string, number>()
    for (const a of assRes.data ?? []) {
      if (a.lesson_package_id) {
        countMap.set(a.lesson_package_id, (countMap.get(a.lesson_package_id) ?? 0) + 1)
      }
    }

    setPackages(
      ((pkgsRes.data ?? []) as LessonPackage[]).map(p => ({
        ...p,
        used_sessions: (p.initial_used_sessions ?? 0) + (countMap.get(p.id) ?? 0),
      }))
    )

    setLoading(false)
  }, [tenantId])

  useEffect(() => { load() }, [load])

  const addPackageType = useCallback(async (data: { name: string; session_count: number; validity_days: number | null; display_order?: number }): Promise<string | null> => {
    const { data: inserted, error } = await supabase
      .from('lesson_package_types')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single()
    if (error) return error.message
    setPackageTypes(prev => [...prev, inserted as LessonPackageType].sort((a, b) => a.display_order - b.display_order))
    return null
  }, [tenantId])

  const updatePackageType = useCallback(async (id: string, data: Partial<Pick<LessonPackageType, 'name' | 'session_count' | 'validity_days' | 'is_active' | 'display_order'>>): Promise<string | null> => {
    const { error } = await supabase
      .from('lesson_package_types')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) return error.message
    setPackageTypes(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    return null
  }, [tenantId])

  const deletePackageType = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase
      .from('lesson_package_types')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) return error.message
    setPackageTypes(prev => prev.filter(t => t.id !== id))
    return null
  }, [tenantId])

  const movePackageType = useCallback((id: string, dir: -1 | 1) => {
    const sorted = [...packageTypes].sort((a, b) => a.display_order - b.display_order)
    const idx = sorted.findIndex(t => t.id === id)
    const target = idx + dir
    if (idx < 0 || target < 0 || target >= sorted.length) return
    const a = sorted[idx], b = sorted[target]
    const [orderA, orderB] = [a.display_order, b.display_order]
    setPackageTypes(prev => prev.map(t =>
      t.id === a.id ? { ...t, display_order: orderB }
      : t.id === b.id ? { ...t, display_order: orderA }
      : t
    ))
    Promise.all([
      supabase.from('lesson_package_types').update({ display_order: orderB }).eq('id', a.id),
      supabase.from('lesson_package_types').update({ display_order: orderA }).eq('id', b.id),
    ])
  }, [packageTypes])

  const addPackage = useCallback(async (data: { user_id: string; package_type_id: string | null; package_name: string; total_sessions: number; initial_used_sessions?: number; payment_date: string; expires_at: string | null; notes: string | null; created_by: string | null }): Promise<string | null> => {
    const { data: inserted, error } = await supabase
      .from('lesson_packages')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single()
    if (error) return error.message
    const pkg = inserted as LessonPackage
    setPackages(prev => [{ ...pkg, used_sessions: pkg.initial_used_sessions ?? 0 }, ...prev])
    return null
  }, [tenantId])

  const deletePackage = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase
      .from('lesson_packages')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    if (error) return error.message
    setPackages(prev => prev.filter(p => p.id !== id))
    return null
  }, [tenantId])

  return { packageTypes, packages, loading, addPackageType, updatePackageType, deletePackageType, movePackageType, addPackage, deletePackage, reload: load }
}
