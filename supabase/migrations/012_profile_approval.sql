-- profiles에 is_approved 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- 기존 회원은 소급 승인
UPDATE profiles SET is_approved = true;

-- handle_new_user 트리거 업데이트:
--   · role = 메타데이터에서 저장
--   · is_approved는 컬럼 DEFAULT(false)에 위임 (컬럼 없어도 트리거 동작)
--   · tenant_id가 있으면 tenant_members에도 자동 추가
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url',
             new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_user_meta_data->>'role', 'volunteer')
  );

  -- 조직 선택 시 tenant_members에 자동 추가 (활동유형 role_id 포함)
  IF new.raw_user_meta_data->>'tenant_id' IS NOT NULL THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role, role_id)
    VALUES (
      (new.raw_user_meta_data->>'tenant_id')::uuid,
      new.id,
      'member',
      CASE
        WHEN new.raw_user_meta_data->>'tenant_role_id' IS NOT NULL
        THEN (new.raw_user_meta_data->>'tenant_role_id')::uuid
        ELSE NULL
      END
    )
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 비로그인 사용자도 조직 목록 조회 가능 (가입 시 조직 선택용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'tenants_select_all'
  ) THEN
    CREATE POLICY "tenants_select_all" ON tenants FOR SELECT USING (true);
  END IF;
END $$;

-- 모든 사용자가 tenant_roles 조회 가능 (가입 시 활동유형 선택용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_roles' AND policyname = 'tenant_roles_select_all'
  ) THEN
    CREATE POLICY "tenant_roles_select_all" ON tenant_roles FOR SELECT USING (true);
  END IF;
END $$;

-- 사용자가 자기 자신을 조직에 신청(재신청)할 수 있도록 허용
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_members' AND policyname = 'tenant_members_self_insert'
  ) THEN
    CREATE POLICY "tenant_members_self_insert" ON tenant_members FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 슈퍼어드민도 is_approved 수정 가능
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_superadmin_update'
  ) THEN
    CREATE POLICY "profiles_superadmin_update" ON profiles FOR UPDATE
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));
  END IF;
END $$;
