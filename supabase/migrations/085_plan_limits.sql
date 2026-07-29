-- 085_plan_limits.sql
-- plan_limits 테이블에 테넌트 기능 게이팅 컬럼 추가
-- 기존 plan 값('basic'|'pro'|'business') 및 max_orgs/max_users 유지

ALTER TABLE plan_limits
  ADD COLUMN IF NOT EXISTS max_members      INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_lesson_types INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sms_monthly      INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS has_ads          BOOLEAN NOT NULL DEFAULT true;

-- 기존 플랜 데이터 업데이트
UPDATE plan_limits SET
  max_members      = 10,
  max_lesson_types = 3,
  sms_monthly      = 10,
  has_ads          = true
WHERE plan = 'basic';

UPDATE plan_limits SET
  max_members      = 50,
  max_lesson_types = -1,
  sms_monthly      = 100,
  has_ads          = false
WHERE plan = 'pro';

UPDATE plan_limits SET
  max_members      = -1,
  max_lesson_types = -1,
  sms_monthly      = 500,
  has_ads          = false
WHERE plan = 'business';

-- tenants 테이블에 plan 컬럼 추가 (기본값 'basic')
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic'
  REFERENCES plan_limits(plan);

-- Realtime 등록 (tenants는 이미 FULL이면 스킵되지만 명시)
ALTER TABLE plan_limits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_limits;
