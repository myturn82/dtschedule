-- 슈퍼관리자가 profiles를 삭제할 수 있도록 DELETE 정책 추가
-- SECURITY DEFINER인 is_super_admin_caller()를 사용하여 무한 재귀 방지
-- (profiles 테이블 직접 서브쿼리는 RLS 재귀 오류를 유발함)

DROP POLICY IF EXISTS "profiles_superadmin_delete" ON profiles;

CREATE POLICY "profiles_superadmin_delete"
  ON profiles
  FOR DELETE
  USING (is_super_admin_caller());
