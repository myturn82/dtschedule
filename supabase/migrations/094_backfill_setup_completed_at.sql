-- 기존 테넌트에 setup_completed_at 소급 적용
-- 이 마이그레이션 이후 Edge Function으로 신규 생성되는 테넌트는 setup_completed_at 없이 생성되므로
-- 관리자 최초 로그인 시 설정 위자드(SetupWizardPage)로 진입하게 된다.
-- DEV 원스텝 생성은 Edge Function 내에서 setup_completed_at 를 함께 설정하므로 위자드 진입 제외.
UPDATE tenants
SET settings = COALESCE(settings, '{}') ||
  jsonb_build_object(
    'setup_completed_at',
    to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )
WHERE settings->>'setup_completed_at' IS NULL;
