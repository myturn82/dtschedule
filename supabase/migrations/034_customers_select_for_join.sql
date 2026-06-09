-- 034_customers_select_for_join.sql
-- 가입 신청 UI에서 서비스명 표시를 위해,
-- 활성 테넌트가 있는 고객은 인증된 모든 유저가 id/name을 읽을 수 있도록 허용.
-- (tenants 테이블 자체가 이미 is_active=true일 때 공개되므로 안전)

drop policy if exists "customers_select_has_active_tenant" on customers;

create policy "customers_select_has_active_tenant" on customers
  for select using (
    exists (
      select 1 from tenants t
      where t.customer_id = customers.id
        and t.is_active = true
    )
  );
