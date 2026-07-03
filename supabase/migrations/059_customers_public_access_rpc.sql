-- ============================================================
-- 059_customers_public_access_rpc.sql
--
-- 보안 검토(H-1): customers_select_has_active_tenant 정책이
-- auth.uid() 검증 없이 anon 포함 전체 컬럼(phone, owner_user_id, plan 등)을
-- 노출하고 있었음. RLS는 컬럼 단위 제한이 불가능하므로 정책을 제거하고,
-- 실제로 필요한 두 가지 접근 패턴만 SECURITY DEFINER RPC로 좁혀서 제공한다.
--
--   1) list_active_org_customers()
--      - 회원가입/조직가입 화면에서 "가입 가능한 조직" 목록 표시용
--      - 활성 테넌트가 있는 고객의 id/name/tenant_id만 반환 (anon 포함 누구나 호출 가능)
--   2) get_customer_plan_for_tenant(p_tenant_id)
--      - 회원 추가 시 플랜 한도 체크용
--      - 호출자가 해당 테넌트의 승인된 admin 또는 super_admin일 때만 plan 반환
-- ============================================================

DROP POLICY IF EXISTS "customers_select_has_active_tenant" ON customers;

CREATE OR REPLACE FUNCTION public.list_active_org_customers()
RETURNS TABLE(customer_id uuid, customer_name text, tenant_id uuid)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT c.id, c.name, t.id
  FROM customers c
  JOIN tenants t ON t.customer_id = c.id
  WHERE t.is_active = true
  ORDER BY c.name;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_org_customers() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_customer_plan_for_tenant(p_tenant_id uuid)
RETURNS TABLE(plan text)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT c.plan
  FROM customers c
  JOIN tenants t ON t.customer_id = c.id
  WHERE t.id = p_tenant_id
    AND (
      is_super_admin()
      OR EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.tenant_id = p_tenant_id
          AND tm.user_id = auth.uid()
          AND tm.role = 'admin'
          AND tm.is_approved = true
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_plan_for_tenant(uuid) TO authenticated;
