-- 036_fix_customers_rls_recursion.sql
-- "infinite recursion detected in policy for relation customers" 수정
--
-- 034에서 추가한 customers_select_has_active_tenant 정책이 tenants를 서브쿼리하고,
-- tenants의 customer_owner_select_tenants / tenants_insert_customer_owner /
-- tenants_update_customer_owner 정책이 다시 customers를 서브쿼리하면서
-- 두 테이블의 RLS가 서로를 호출하는 순환 참조가 발생함.
--
-- tenants 조회를 SECURITY DEFINER 함수로 우회(RLS 미적용)하여 순환을 끊는다.

CREATE OR REPLACE FUNCTION customer_has_active_tenant(p_customer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenants
    WHERE customer_id = p_customer_id AND is_active = true
  );
$$;

DROP POLICY IF EXISTS "customers_select_has_active_tenant" ON customers;

CREATE POLICY "customers_select_has_active_tenant" ON customers
  FOR SELECT USING (customer_has_active_tenant(id));
