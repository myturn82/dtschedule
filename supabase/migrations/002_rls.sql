-- supabase/migrations/002_rls.sql

-- profiles RLS
alter table profiles enable row level security;
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- assignments RLS
alter table assignments enable row level security;
create policy "assignments_select_all" on assignments for select using (true);
create policy "assignments_insert_own" on assignments for insert with check (auth.uid() = user_id);
create policy "assignments_update_own" on assignments for update using (auth.uid() = user_id);
create policy "assignments_delete_own" on assignments for delete using (auth.uid() = user_id);
create policy "assignments_admin_all" on assignments for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- slot_settings RLS
alter table slot_settings enable row level security;
create policy "slot_settings_select_all" on slot_settings for select using (true);
create policy "slot_settings_admin_all" on slot_settings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- schedule_rules RLS
alter table schedule_rules enable row level security;
create policy "schedule_rules_select_all" on schedule_rules for select using (true);
create policy "schedule_rules_admin_all" on schedule_rules for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- date_overrides RLS
alter table date_overrides enable row level security;
create policy "date_overrides_select_all" on date_overrides for select using (true);
create policy "date_overrides_admin_all" on date_overrides for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
