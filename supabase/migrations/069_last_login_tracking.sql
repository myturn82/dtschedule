-- 069_last_login_tracking.sql
-- 휴면 계정 판별용 마지막 로그인 시점 기록
-- 개인정보 보호법 시행령 제48조의5 (장기 미이용자 처리)

-- ── last_login_at 컬럼 추가 ───────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 기존 사용자: created_at 을 초기값으로 설정 (실제 로그인 기록 없으므로 근사값)
UPDATE public.profiles
  SET last_login_at = created_at
  WHERE last_login_at IS NULL;

-- ── 휴면 계정 조회 함수 ────────────────────────────────────────────────────────
-- 슈퍼어드민만 호출 가능. 보유기간(기본 3년) 경과 계정 목록 반환.
CREATE OR REPLACE FUNCTION public.get_dormant_accounts(retention_years int DEFAULT 3)
RETURNS TABLE (
  user_id      uuid,
  name         text,
  email        text,
  last_login   timestamptz,
  account_age  interval
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                                   AS user_id,
    p.name,
    p.email,
    p.last_login_at                        AS last_login,
    now() - COALESCE(p.last_login_at, p.created_at) AS account_age
  FROM public.profiles p
  WHERE
    NOT p.is_super_admin
    AND COALESCE(p.last_login_at, p.created_at) < now() - make_interval(years => retention_years)
  ORDER BY COALESCE(p.last_login_at, p.created_at) ASC
$$;

-- 함수 실행 권한: 슈퍼어드민 체크는 내부 is_super_admin_caller()로 보호되나,
-- 함수 자체는 authenticated 에게 EXECUTE 권한 부여 필요
REVOKE ALL ON FUNCTION public.get_dormant_accounts(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dormant_accounts(int) TO authenticated;

COMMENT ON FUNCTION public.get_dormant_accounts(int) IS
  '장기 미이용 계정 목록 조회. 슈퍼어드민 전용. 예: SELECT * FROM get_dormant_accounts(3);';

COMMENT ON COLUMN public.profiles.last_login_at IS
  '마지막 로그인 시점. AuthContext.fetchProfile()에서 갱신. 휴면 계정 판별 기준.';
