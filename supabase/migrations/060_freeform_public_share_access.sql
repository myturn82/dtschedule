-- 비회원(프리폼) 모드 테넌트의 공유 뷰(SharePage)를 로그인 없이 조회 가능하게 한다.
-- 회원공유/회원개별 모드는 기존 is_tenant_member 기반 정책만 적용되어 동작이 바뀌지 않는다.
-- (permissive 정책은 OR로 결합되므로, 아래 정책은 freeform 테넌트에 한해 접근 경로를 하나 추가할 뿐이다.)

CREATE OR REPLACE FUNCTION public.is_freeform_tenant(tid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenants
    WHERE id = tid
      AND is_active = true
      AND settings->>'tenant_mode' = '비회원'
  );
$$;

CREATE POLICY "assignments_public_share_select" ON assignments
  FOR SELECT USING (is_freeform_tenant(tenant_id));

CREATE POLICY "slot_settings_public_share_select" ON slot_settings
  FOR SELECT USING (is_freeform_tenant(tenant_id));

CREATE POLICY "schedule_rules_public_share_select" ON schedule_rules
  FOR SELECT USING (is_freeform_tenant(tenant_id));

CREATE POLICY "date_overrides_public_share_select" ON date_overrides
  FOR SELECT USING (is_freeform_tenant(tenant_id));
