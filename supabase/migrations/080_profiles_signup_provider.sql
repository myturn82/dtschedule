-- supabase/migrations/080_profiles_signup_provider.sql
-- 회원관리 화면에서 카카오 가입 여부를 표시하기 위해 최초 가입 provider를 저장한다.

-- 1. profiles에 signup_provider 컬럼 추가
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_provider text;

-- 2. 기존 회원 백필 (auth.users.raw_app_meta_data.provider 기준)
UPDATE public.profiles p
SET signup_provider = u.raw_app_meta_data->>'provider'
FROM auth.users u
WHERE p.id = u.id
  AND p.signup_provider IS NULL;

-- 3. handle_new_user: 가입 시 signup_provider도 함께 저장
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  raw_phone     text;
  encrypted_enc text;
BEGIN
  raw_phone := NULLIF(trim(new.raw_user_meta_data->>'phone'), '');

  IF raw_phone IS NOT NULL THEN
    BEGIN
      encrypted_enc := public.encrypt_phone(raw_phone);
    EXCEPTION WHEN OTHERS THEN
      encrypted_enc := NULL;
    END;
  END IF;

  INSERT INTO public.profiles (
    id, name, email, avatar_url,
    is_approved, is_super_admin,
    terms_agreed_at, privacy_agreed_at,
    phone_enc, signup_provider
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    false,
    false,
    (new.raw_user_meta_data->>'terms_agreed_at')::timestamptz,
    (new.raw_user_meta_data->>'privacy_agreed_at')::timestamptz,
    encrypted_enc,
    new.raw_app_meta_data->>'provider'
  )
  ON CONFLICT (id) DO NOTHING;

  IF new.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role, role_id, is_approved)
    VALUES (
      (new.raw_user_meta_data->>'tenant_id')::uuid,
      new.id,
      'member',
      CASE
        WHEN new.raw_user_meta_data->>'tenant_role_id' IS NOT NULL
        THEN (new.raw_user_meta_data->>'tenant_role_id')::uuid
        ELSE NULL
      END,
      false
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;
