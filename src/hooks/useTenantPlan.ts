// src/hooks/useTenantPlan.ts
import { useTenant } from '../contexts/TenantContext'
import { usePlanLimits } from '../contexts/PlanLimitsContext'
import type { PlanType, PlanLimits } from '../types'

export interface TenantPlanInfo extends PlanLimits {
  plan: PlanType
}

export function useTenantPlan(): TenantPlanInfo {
  const { tenant } = useTenant()
  const { planLimits } = usePlanLimits()
  const plan: PlanType = (tenant?.plan ?? 'basic') as PlanType
  return { plan, ...planLimits[plan] }
}

// -1 = 무제한. current >= max 이면 한도 도달.
export function isAtLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max
}

// 한도의 90% 이상이면 경고
export function isNearLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max * 0.9
}
