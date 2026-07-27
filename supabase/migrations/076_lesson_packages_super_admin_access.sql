-- 076_lesson_packages_super_admin_access.sql
-- lesson_package_types / lesson_packages RLS에 슈퍼어드민 예외 추가
--
-- 075에서 추가된 SELECT 정책이 is_tenant_member(tenant_id) / is_tenant_admin(tenant_id)만
-- 검사하고 is_super_admin_caller()를 빠뜨려, 시스템관리자가 자신이 멤버가 아닌
-- 조직의 레슨권 데이터를 조회할 수 없었다. 다른 테넌트 스코프 테이블
-- (예: tenant_members_tenant_select)과 동일한 패턴으로 맞춘다.

DROP POLICY IF EXISTS "lesson_package_types_select" ON public.lesson_package_types;
CREATE POLICY "lesson_package_types_select"
  ON public.lesson_package_types FOR SELECT
  USING (is_tenant_member(tenant_id) OR is_super_admin_caller());

DROP POLICY IF EXISTS "lesson_packages_select" ON public.lesson_packages;
CREATE POLICY "lesson_packages_select"
  ON public.lesson_packages FOR SELECT
  USING (
    is_tenant_admin(tenant_id) OR
    is_super_admin_caller() OR
    (is_tenant_member(tenant_id) AND user_id = auth.uid())
  );
