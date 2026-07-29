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

// Dual-sentinel convention for "unlimited":
//   max === -1       → unlimited for maxMembers, maxLessonTypes, smsMonthly
//   max === Infinity → unlimited for maxOrgs, maxUsers (legacy convention from original code)
// Both sentinels are handled explicitly below to prevent future regression.
export function isAtLimit(current: number, max: number): boolean {
  if (max === -1 || max === Infinity) return false
  return current >= max
}

// 한도의 90% 이상이면 경고 (same dual-sentinel guard)
export function isNearLimit(current: number, max: number): boolean {
  if (max === -1 || max === Infinity) return false
  return current >= max * 0.9
}
