-- feature_flags는 tenants.settings JSONB 안의 키로 관리한다.
-- 별도 테이블 변경 없이 코드 레이어에서만 처리.
-- 하위 호환: feature_flags 키가 없는 기존 조직은 featureFlags.ts의 DEFAULT_FLAGS 값으로 동작.

COMMENT ON COLUMN tenants.settings IS
  'JSONB 설정. feature_flags 키 포함: { lesson_packages, autoassign, notifications, attendance, volunteer_hours, care_mapping, public_booking, calendar_sync }';
