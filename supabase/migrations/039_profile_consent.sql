-- 039_profile_consent.sql
-- 회원가입 시 서비스 이용약관 / 개인정보 수집·이용 동의 시각을 profiles에 기록

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_agreed_at   timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_agreed_at timestamptz;

-- handle_new_user 트리거 업데이트: raw_user_meta_data의 동의 시각을 profiles에 기록
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role, is_approved, is_super_admin, terms_agreed_at, privacy_agreed_at)
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
    'volunteer',  -- 항상 volunteer, 메타데이터 무시
    false,        -- 관리자 승인 필요
    false,        -- DB에서만 super_admin 부여
    (new.raw_user_meta_data->>'terms_agreed_at')::timestamptz,
    (new.raw_user_meta_data->>'privacy_agreed_at')::timestamptz
  )
  ON CONFLICT (id) DO NOTHING;

  -- 가입 시 조직 선택했으면 tenant_members에 자동 추가
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
