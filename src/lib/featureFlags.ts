export interface FeatureFlags {
  lesson_packages?:  boolean  // 레슨권/수강권 기능 (기본 true)
  autoassign?:       boolean  // 자동 배정 (기본 true)
  notifications?:    boolean  // D-1 알림 (기본 true)
  attendance?:       boolean  // 출석 체크 (기본 false)
  volunteer_hours?:  boolean  // 봉사/근무 시간 집계 (기본 false)
  care_mapping?:     boolean  // 담당자-케어 대상 매핑 (기본 false)
  public_booking?:   boolean  // 고객용 예약 링크 (기본 false)
  calendar_sync?:    boolean  // Google Calendar 연동 (기본 false)
}

const DEFAULT_FLAGS: Record<keyof FeatureFlags, boolean> = {
  lesson_packages: true,
  autoassign:      true,
  notifications:   true,
  attendance:      false,
  volunteer_hours: false,
  care_mapping:    false,
  public_booking:  false,
  calendar_sync:   false,
}

// undefined는 기본값(DEFAULT_FLAGS)으로 처리 — 기존 조직 하위 호환
export function getFF(
  flags: FeatureFlags | undefined | null,
  key: keyof FeatureFlags,
): boolean {
  if (!flags) return DEFAULT_FLAGS[key]
  const val = flags[key]
  return val === undefined ? DEFAULT_FLAGS[key] : val
}
