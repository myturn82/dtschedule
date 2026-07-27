-- 077_lesson_packages_admin_write_super_admin.sql
-- lesson_package_types / lesson_packages INSERT/UPDATE/DELETE RLS에 슈퍼어드민 예외 추가
--
-- 076에서 SELECT 정책에는 is_super_admin_caller()를 추가했지만
-- INSERT/UPDATE/DELETE 정책은 여전히 is_tenant_admin(tenant_id)만 검사해,
-- 시스템관리자가 자신이 소속되지 않은 조직에서 레슨권 결제를 등록/수정/삭제하면
-- RLS에 막혀 403 Forbidden이 발생했다. 다른 테넌트 스코프 쓰기 정책
-- (예: 023_security_hardening.sql의 여러 FOR ALL 정책)과 동일한 패턴으로 맞춘다.

DROP POLICY IF EXISTS "lesson_package_types_insert" ON public.lesson_package_types;
CREATE POLICY "lesson_package_types_insert"
  ON public.lesson_package_types FOR INSERT
  WITH CHECK (is_tenant_admin(tenant_id) OR is_super_admin_caller());

DROP POLICY IF EXISTS "lesson_package_types_update" ON public.lesson_package_types;
CREATE POLICY "lesson_package_types_update"
  ON public.lesson_package_types FOR UPDATE
  USING (is_tenant_admin(tenant_id) OR is_super_admin_caller())
  WITH CHECK (is_tenant_admin(tenant_id) OR is_super_admin_caller());

DROP POLICY IF EXISTS "lesson_package_types_delete" ON public.lesson_package_types;
CREATE POLICY "lesson_package_types_delete"
  ON public.lesson_package_types FOR DELETE
  USING (is_tenant_admin(tenant_id) OR is_super_admin_caller());

DROP POLICY IF EXISTS "lesson_packages_insert" ON public.lesson_packages;
CREATE POLICY "lesson_packages_insert"
  ON public.lesson_packages FOR INSERT
  WITH CHECK (is_tenant_admin(tenant_id) OR is_super_admin_caller());

DROP POLICY IF EXISTS "lesson_packages_update" ON public.lesson_packages;
CREATE POLICY "lesson_packages_update"
  ON public.lesson_packages FOR UPDATE
  USING (is_tenant_admin(tenant_id) OR is_super_admin_caller())
  WITH CHECK (is_tenant_admin(tenant_id) OR is_super_admin_caller());

DROP POLICY IF EXISTS "lesson_packages_delete" ON public.lesson_packages;
CREATE POLICY "lesson_packages_delete"
  ON public.lesson_packages FOR DELETE
  USING (is_tenant_admin(tenant_id) OR is_super_admin_caller());
