-- supabase/migrations/001_schema.sql

-- profiles 테이블
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'volunteer' check (role in ('admin', 'volunteer')),
  created_at timestamptz default now()
);

-- assignments 테이블
create table if not exists assignments (
  id uuid default gen_random_uuid() primary key,
  year int not null,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  time_slot text not null check (time_slot in ('10-12','12-13','13-14','14-16','16-18','18-20','20-22')),
  volunteer_name text not null,
  note text,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- slot_settings 테이블
create table if not exists slot_settings (
  id uuid default gen_random_uuid() primary key,
  time_slot text not null unique check (time_slot in ('10-12','12-13','13-14','14-16','16-18','18-20','20-22')),
  max_capacity int not null default 2,
  updated_by uuid references profiles(id)
);

-- schedule_rules 테이블 (요일별 기본 오픈/클로즈)
create table if not exists schedule_rules (
  id uuid default gen_random_uuid() primary key,
  day_of_week int not null check (day_of_week between 0 and 6),
  time_slot text not null check (time_slot in ('10-12','12-13','13-14','14-16','16-18','18-20','20-22')),
  is_open boolean not null default true,
  unique (day_of_week, time_slot)
);

-- date_overrides 테이블 (특정 날짜 예외 설정)
create table if not exists date_overrides (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  is_open boolean not null default true,
  is_holiday boolean not null default false,
  label text
);

-- Realtime 활성화
alter publication supabase_realtime add table assignments;
