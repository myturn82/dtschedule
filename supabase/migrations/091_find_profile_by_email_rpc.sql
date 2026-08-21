-- ============================================================
-- 091_find_profile_by_email_rpc.sql
--
-- 회원 추가 시 다른 조직에 이미 가입된 사용자를 이메일로 조회할 수 있도록
-- SECURITY DEFINER RPC를 추가한다.
--
-- profiles 테이블의 RLS(profiles_select_same_tenant)가 같은 조직 멤버만
-- 조회를 허용하기 때문에, 다른 조직 사용자의 이메일을 입력하면
-- "해당 이메일로 가입된 사용자가 없습니다" 오류가 발생하는 문제를 해결한다.
--
-- 보안:
--   - authenticated 유저만 호출 가능 (anon 제외)
--   - 반환값은 회원 추가에 필요한 최소 컬럼만 (id, name, is_super_admin)
--   - tenant_members insert는 기존 RLS가 계속 보호
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_profile_by_email(p_email text)
RETURNS TABLE(id uuid, name text, is_super_admin boolean)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $func$
  SELECT p.id, p.name, p.is_super_admin
  FROM profiles p
  WHERE p.email = p_email
  LIMIT 1;
$func$;

GRANT EXECUTE ON FUNCTION public.find_profile_by_email(text) TO authenticated;
