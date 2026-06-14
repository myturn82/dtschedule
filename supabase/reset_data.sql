-- ============================================================
-- 데이터 초기화 스크립트 (스키마 유지, 데이터만 삭제)
-- 생성일: 2026-06-10
--
-- ⚠️  주의: 모든 사용자·조직·배정 데이터가 삭제됩니다.
--           스키마(테이블·함수·정책)는 그대로 유지됩니다.
--           실행 전 반드시 백업을 먼저 수행하세요.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- STEP 1. 사용자 데이터 삭제 (auth.users → profiles cascade)
-- ────────────────────────────────────────────────────────────
-- auth.users 삭제 시 profiles, tenant_members가 cascade 삭제됨

DELETE FROM auth.users;


-- ────────────────────────────────────────────────────────────
-- STEP 2. 나머지 테이블 초기화 (FK 순서: 자식 → 부모)
-- ────────────────────────────────────────────────────────────

TRUNCATE TABLE
  slot_highlights,
  assignment_snapshots,
  date_overrides,
  schedule_rules,
  slot_settings,
  assignments,
  tenant_members,
  tenant_roles,
  tenants,
  customers,
  profiles,
  plan_limits
RESTART IDENTITY CASCADE;


-- ────────────────────────────────────────────────────────────
-- STEP 3. 초기 데이터 재삽입
-- ────────────────────────────────────────────────────────────

INSERT INTO plan_limits (plan, max_orgs, max_users) VALUES
  ('basic',    1,    20),
  ('pro',      5,   100),
  ('business', null, null)
ON CONFLICT (plan) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- STEP 4. 슈퍼어드민 지정 (회원가입 후 실행)
-- ────────────────────────────────────────────────────────────
-- 회원가입 완료 후 아래 SQL을 실행하세요:
--
--   UPDATE profiles
--   SET is_super_admin = true
--   WHERE email = 'yjsong82@gmail.com';
--
-- ============================================================
