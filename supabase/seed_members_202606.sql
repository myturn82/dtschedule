-- ============================================================
-- 2026년 06월 자원활동가 스케줄 회원 등록 스크립트
-- 출처: KakaoTalk_20260617_214439681_01.png
--
-- [변경 이력]
-- v1.1 : auth.users ON CONFLICT (email) -> WHERE NOT EXISTS 로 수정
-- v1.2 : auth.identities 신규 스키마 대응 (provider_id 추가)
-- v1.3 : DO 블록 제거 -> 순수 SQL 문으로 재작성 (SQL Editor 호환)
--
-- 활동가 : 이연화, 최민화 (2명)
-- 봉사자 : 나머지 17명 / 합계 19명
--
-- [사전 준비]
-- tenant_roles 에 '봉사자', '활동가' 역할이 존재해야 합니다.
-- Supabase SQL Editor (postgres/service role) 에서 실행하세요.
--
-- [기본 비밀번호] Volunteer2026!
-- ============================================================

-- ── 0. 기존 @lib.com 계정 초기화 ─────────────────────────────
DELETE FROM public.tenant_members
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@lib.com');

DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@lib.com');

DELETE FROM public.profiles
WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@lib.com');

DELETE FROM auth.users WHERE email LIKE '%@lib.com';

-- ── 1. auth.users 삽입 ───────────────────────────────────────
WITH members(uname, email) AS (
  VALUES
    ('이연화', 'leeyeonhwa@lib.com'),
    ('최민화', 'choiminhwa@lib.com'),
    ('이민화', 'leeminhwa@lib.com'),
    ('김미연', 'kimmiyeon@lib.com'),
    ('강다연', 'kangdayeon@lib.com'),
    ('이은진', 'leeunjin@lib.com'),
    ('이향주', 'leehyangju@lib.com'),
    ('안화숙', 'anhwasuk@lib.com'),
    ('이민주', 'leeminju@lib.com'),
    ('안유민', 'anyumin@lib.com'),
    ('김시연', 'kimsiyeon@lib.com'),
    ('송지현', 'songjihyeon@lib.com'),
    ('백주옥', 'baekjuok@lib.com'),
    ('안함숙', 'anhamsuk@lib.com'),
    ('전윤희', 'jeonyunhui@lib.com'),
    ('최희선', 'choihuiseon@lib.com'),
    ('김은진', 'kimeunjin@lib.com'),
    ('천윤선', 'cheonyunseon@lib.com'),
    ('이정매', 'leejungmae@lib.com'),
    ('정은선', 'jeongeunson@lib.com')
)
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  email,
  crypt('qweqwe', gen_salt('bf', 10)),
  now(),
  '', '',
  '', '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  json_build_object('name', uname)::jsonb,
  now(), now()
FROM members;

-- ── 2. auth.identities 삽입 ─────────────────────────────────
INSERT INTO auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
SELECT
  au.email,
  au.id,
  json_build_object(
    'sub',            au.id::text,
    'email',          au.email,
    'email_verified', true,
    'phone_verified', false
  )::jsonb,
  'email',
  now(), now(), now()
FROM auth.users au
WHERE au.email LIKE '%@lib.com';

-- ── 3. profiles 삽입 ─────────────────────────────────────────
WITH members(uname, email) AS (
  VALUES
    ('이연화', 'leeyeonhwa@lib.com'),
    ('최민화', 'choiminhwa@lib.com'),
    ('이민화', 'leeminhwa@lib.com'),
    ('김미연', 'kimmiyeon@lib.com'),
    ('강다연', 'kangdayeon@lib.com'),
    ('이은진', 'leeunjin@lib.com'),
    ('이향주', 'leehyangju@lib.com'),
    ('안화숙', 'anhwasuk@lib.com'),
    ('이민주', 'leeminju@lib.com'),
    ('안유민', 'anyumin@lib.com'),
    ('김시연', 'kimsiyeon@lib.com'),
    ('송지현', 'songjihyeon@lib.com'),
    ('백주옥', 'baekjuok@lib.com'),
    ('안함숙', 'anhamsuk@lib.com'),
    ('전윤희', 'jeonyunhui@lib.com'),
    ('최희선', 'choihuiseon@lib.com'),
    ('김은진', 'kimeunjin@lib.com'),
    ('천윤선', 'cheonyunseon@lib.com'),
    ('이정매', 'leejungmae@lib.com'),
    ('정은선', 'jeongeunson@lib.com')
)
INSERT INTO public.profiles (id, name, email, is_approved)
SELECT au.id, m.uname, au.email, true
FROM auth.users au
JOIN members m ON m.email = au.email
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, email = EXCLUDED.email, is_approved = true;

-- ── 4. tenant_members 삽입 ───────────────────────────────────
WITH members(email, role_name) AS (
  VALUES
    ('leeyeonhwa@lib.com', '활동가'),
    ('choiminhwa@lib.com',  '활동가'),
    ('leeminhwa@lib.com',   '봉사자'),
    ('kimmiyeon@lib.com',   '봉사자'),
    ('kangdayeon@lib.com',  '봉사자'),
    ('leeunjin@lib.com',    '봉사자'),
    ('leehyangju@lib.com',  '봉사자'),
    ('anhwasuk@lib.com',    '봉사자'),
    ('leeminju@lib.com',    '봉사자'),
    ('anyumin@lib.com',     '봉사자'),
    ('kimsiyeon@lib.com',   '봉사자'),
    ('songjihyeon@lib.com', '봉사자'),
    ('baekjuok@lib.com',    '봉사자'),
    ('anhamsuk@lib.com',    '봉사자'),
    ('jeonyunhui@lib.com',  '봉사자'),
    ('choihuiseon@lib.com', '봉사자'),
    ('kimeunjin@lib.com',   '봉사자'),
    ('cheonyunseon@lib.com','봉사자'),
    ('leejungmae@lib.com',  '봉사자'),
    ('jeongeunson@lib.com', '봉사자')
)
INSERT INTO public.tenant_members (tenant_id, user_id, role, role_id, is_approved)
SELECT
  '43b605e4-cbfb-4693-9bff-e380e9d722a4'::uuid,
  au.id,
  'member',
  tr.id,
  true
FROM auth.users au
JOIN members m ON m.email = au.email
JOIN public.tenant_roles tr
  ON tr.tenant_id = '43b605e4-cbfb-4693-9bff-e380e9d722a4'
  AND tr.name = m.role_name
ON CONFLICT DO NOTHING;
