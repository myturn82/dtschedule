-- 054_customer_owner_tenant_access.sql
-- Customer owners could not SELECT their own tenants in SetupWizardPage immediately
-- after creation, because the tenants_select_member policy required is_tenant_member(id).
-- If the tenant_members INSERT failed (e.g. before migration 033 applied, or RLS race),
-- SetupWizardPage would navigate away to /customer-admin.
--
-- Fix 1: extend tenants SELECT to allow customer owners directly.
-- Fix 2: allow customer owners to INSERT schedule_rules for their tenants
--        (was 403 because user was not yet a tenant_member/admin at insert time).

-- ── tenants: customer owner can SELECT own tenants ────────────────────────────

drop policy if exists "tenants_select_member" on tenants;
drop policy if exists "tenants_select_member_or_owner" on tenants;

create policy "tenants_select_member_or_owner" on tenants
  for select using (
    is_tenant_member(id)
    or is_super_admin()
    or exists (
      select 1 from customers c
      where c.id = tenants.customer_id
        and c.owner_user_id = auth.uid()
        and c.is_active = true
    )
  );

-- ── schedule_rules: customer owner can INSERT for own tenants ─────────────────

drop policy if exists "schedule_rules_customer_owner_insert" on schedule_rules;

create policy "schedule_rules_customer_owner_insert" on schedule_rules
  for insert with check (
    is_super_admin()
    or is_tenant_admin(tenant_id)
    or exists (
      select 1 from tenants t
      join customers c on c.id = t.customer_id
      where t.id = schedule_rules.tenant_id
        and c.owner_user_id = auth.uid()
        and c.is_active = true
    )
  );
