-- 008_team_leader.sql
-- team_leader 역할 DB 지원 추가

-- 1. profiles role 제약에 team_leader 추가
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'team_leader', 'volunteer', '50plus'));

-- 2. assignments: team_leader가 모든 배정을 관리할 수 있도록 RLS 정책 추가
create policy "assignments_team_leader_all" on assignments for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'team_leader')
);

-- 3. slot_settings: team_leader가 정원 설정 가능하도록 RLS 정책 추가
create policy "slot_settings_team_leader_all" on slot_settings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'team_leader')
);
