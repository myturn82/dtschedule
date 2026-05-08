-- 005_volunteer_type.sql

-- 1. assignments 테이블에 volunteer_type, time_sub 컬럼 추가
alter table assignments add column if not exists volunteer_type text not null default 'volunteer';
alter table assignments add column if not exists time_sub text;

-- 2. profiles role 체크 제약 갱신 (50plus 허용)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'volunteer', '50plus'));
