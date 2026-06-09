-- 032_tenants_customer_owner_policy.sql
-- Allow customer owners to insert/update their own tenants.

drop policy if exists "tenants_insert_customer_owner" on tenants;
drop policy if exists "tenants_update_customer_owner" on tenants;

create policy "tenants_insert_customer_owner" on tenants
  for insert with check (
    is_super_admin()
    or exists (
      select 1 from customers
      where id = tenants.customer_id
        and owner_user_id = auth.uid()
        and is_active = true
    )
  );

create policy "tenants_update_customer_owner" on tenants
  for update using (
    is_super_admin()
    or exists (
      select 1 from customers
      where id = tenants.customer_id
        and owner_user_id = auth.uid()
        and is_active = true
    )
  );
