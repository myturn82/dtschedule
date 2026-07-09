import { useEffect, useState } from 'react'
import { useTenant } from '../contexts/TenantContext'
import { displayMode } from '../lib/tenantMode'
import { supabase } from '../lib/supabase'
import { generateTimeSlots } from '../utils/timeSlots'
import type { TimeSlot } from '../utils/timeSlots'
import type { CustomFieldDef, LegendItem } from '../types'

interface ShareTenantSettings {
  tenant: ReturnType<typeof useTenant>['tenant']
  tenantId: string
  timeSlots: TimeSlot[]
  legendItems: LegendItem[]
  slotLabels: Record<string, string>
  isFreeformTenant: boolean
  tenantModeReady: boolean
  customFields: CustomFieldDef[]
  useDynamicFields: boolean
  detailFields: CustomFieldDef[]
}

/**
 * `/share`, `/embed` 등 tid 쿼리 파라미터로 테넌트를 지정하는 공개 페이지가 공유하는 훅.
 * tid가 현재 로그인 컨텍스트의 테넌트와 다르면(주로 비로그인 방문자) tenants.settings를
 * 직접 조회해 timeSlots/legendItems/slotLabels/tenantMode/customFields를 계산한다.
 */
export function useShareTenantSettings(tidFromUrl: string): ShareTenantSettings {
  const { tenant, timeSlots: contextTimeSlots, legendItems: contextLegendItems, slotLabels: contextSlotLabels } = useTenant()
  const tenantId = tidFromUrl || tenant?.id || ''

  const [fetchedTimeSlots, setFetchedTimeSlots] = useState<TimeSlot[] | null>(null)
  const [fetchedLegendItems, setFetchedLegendItems] = useState<LegendItem[] | null>(null)
  const [fetchedSlotLabels, setFetchedSlotLabels] = useState<Record<string, string> | null>(null)
  const [fetchedTenantMode, setFetchedTenantMode] = useState<string | undefined>(undefined)
  const [fetchedCustomFields, setFetchedCustomFields] = useState<CustomFieldDef[] | null>(null)

  useEffect(() => {
    if (!tidFromUrl || tidFromUrl === tenant?.id) {
      setFetchedTimeSlots(null)
      setFetchedLegendItems(null)
      setFetchedSlotLabels(null)
      setFetchedTenantMode(undefined)
      setFetchedCustomFields(null)
      return
    }
    supabase.from('tenants').select('settings').eq('id', tidFromUrl).single()
      .then(({ data }) => {
        if (!data?.settings) return
        const s = data.settings as Record<string, unknown>
        const slots = Array.isArray(s.time_slots) && (s.time_slots as string[]).length > 0
          ? s.time_slots as TimeSlot[]
          : generateTimeSlots(
              (s.open_from as string | undefined) ?? '09:00',
              (s.open_to as string | undefined) ?? '22:00',
              (s.slot_interval_minutes as number | undefined) ?? 120
            )
        setFetchedTimeSlots(slots)
        setFetchedLegendItems((s.legend_items as LegendItem[] | undefined) ?? [])
        setFetchedSlotLabels((s.slot_labels as Record<string, string> | undefined) ?? {})
        setFetchedTenantMode(s.tenant_mode as string | undefined)
        setFetchedCustomFields((s.custom_fields as CustomFieldDef[] | undefined) ?? [])
      })
  }, [tidFromUrl, tenant?.id])

  const timeSlots = fetchedTimeSlots ?? contextTimeSlots
  const legendItems = fetchedLegendItems ?? contextLegendItems
  const slotLabels = fetchedSlotLabels ?? contextSlotLabels
  const isFreeformTenant = displayMode((fetchedTenantMode ?? tenant?.settings?.tenant_mode) as string | undefined) === '비회원'
  const tenantModeReady = !tidFromUrl || tidFromUrl === tenant?.id || fetchedTenantMode !== undefined
  const customFields = fetchedCustomFields ?? tenant?.settings?.custom_fields ?? []
  const useDynamicFields = isFreeformTenant && customFields.length > 0
  const detailFields = useDynamicFields ? customFields.slice(1) : customFields

  return {
    tenant, tenantId, timeSlots, legendItems, slotLabels,
    isFreeformTenant, tenantModeReady, customFields, useDynamicFields, detailFields,
  }
}
