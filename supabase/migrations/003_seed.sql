-- supabase/migrations/003_seed.sql
-- 요일별 기본 규칙 삽입 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)

-- 일요일 전체 CLOSE
insert into schedule_rules (day_of_week, time_slot, is_open) values
(0, '10-12', false), (0, '12-13', false), (0, '13-14', false),
(0, '14-16', false), (0, '16-18', false), (0, '18-20', false), (0, '20-22', false),
-- 월/수/금: 낮타임 오픈, 18시 이후 CLOSE
(1, '10-12', true),  (1, '12-13', false), (1, '13-14', true),
(1, '14-16', true),  (1, '16-18', true),  (1, '18-20', false), (1, '20-22', false),
(3, '10-12', true),  (3, '12-13', false), (3, '13-14', true),
(3, '14-16', true),  (3, '16-18', true),  (3, '18-20', false), (3, '20-22', false),
(5, '10-12', true),  (5, '12-13', false), (5, '13-14', true),
(5, '14-16', true),  (5, '16-18', true),  (5, '18-20', false), (5, '20-22', false),
-- 화/목: 낮타임 + 밤타임(18-22) 오픈
(2, '10-12', true),  (2, '12-13', false), (2, '13-14', true),
(2, '14-16', true),  (2, '16-18', true),  (2, '18-20', true),  (2, '20-22', true),
(4, '10-12', true),  (4, '12-13', false), (4, '13-14', true),
(4, '14-16', true),  (4, '16-18', true),  (4, '18-20', true),  (4, '20-22', true),
-- 토요일: 10-14시만 오픈
(6, '10-12', true),  (6, '12-13', false), (6, '13-14', true),
(6, '14-16', false), (6, '16-18', false), (6, '18-20', false), (6, '20-22', false);

-- 슬롯별 기본 인원 설정
insert into slot_settings (time_slot, max_capacity) values
('10-12', 2), ('12-13', 0), ('13-14', 2),
('14-16', 3), ('16-18', 2), ('18-20', 2), ('20-22', 2);

-- Supabase Auth 트리거: 신규 사용자 등록 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'volunteer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
