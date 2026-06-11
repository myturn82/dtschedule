-- 040_fix_handle_new_user_role.sql
-- 039에서 reset_db.sql의 오래된 정의를 그대로 가져오면서 이미 024에서 제거된
-- profiles.role 컬럼을 다시 참조하는 바람에 모든 회원가입이
-- "Database error saving new user"로 실패하던 문제를 수정한다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, is_approved, is_super_admin, terms_agreed_at, privacy_agreed_at)
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
