-- 031_customers.sql
-- Billing/plan entity. Was missing from migration history (created manually in prod).

create table if not exists customers (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  owner_user_id   uuid references profiles(id) on delete set null,
  plan            text not null default 'basic'
                  check (plan in ('basic', 'pro', 'business')),
  plan_expires_at timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Link tenants to customer
alter table tenants
  add column if not exists customer_id uuid references customers(id) on delete set null;

create index if not exists idx_customers_owner on customers(owner_user_id);
create index if not exists idx_tenants_customer on tenants(customer_id);

-- RLS
alter table customers enable row level security;

create policy "customers_select_own" on customers
  for select using (owner_user_id = auth.uid() or is_super_admin());

create policy "customers_insert_own" on customers
  for insert with check (owner_user_id = auth.uid() or is_super_admin());

create policy "customers_update_own" on customers
  for update using (owner_user_id = auth.uid() or is_super_admin());

create policy "customers_delete_super_admin" on customers
  for delete using (is_super_admin());
