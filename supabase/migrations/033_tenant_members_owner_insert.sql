-- 033_tenant_members_owner_insert.sql
-- customer owner가 자신의 테넌트에 멤버를 admin으로 직접 등록할 수 있도록 허용.
-- 기존 "tenant_members_self_apply" 정책은 role=member, is_approved=false만 허용해서
-- 조직 생성자가 admin으로 등록되지 못하는 문제를 해결.

drop policy if exists "tenant_members_customer_owner_insert" on tenant_members;

create policy "tenant_members_customer_owner_insert" on tenant_members
  for insert with check (
    is_super_admin()
    or exists (
      select 1 from tenants t
      join customers c on c.id = t.customer_id
      where t.id = tenant_members.tenant_id
        and c.owner_user_id = auth.uid()
        and c.is_active = true
    )
  );
