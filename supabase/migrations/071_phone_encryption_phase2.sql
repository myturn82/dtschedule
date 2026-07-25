-- 071_phone_encryption_phase2.sql
-- 전화번호 암호화 Phase 2: 평문 phone 컬럼 제거 + 복호화 RPC 제공
--
-- 변경 내용:
-- 1. get_tenant_member_phones(tenant_id) — 관리자용 배치 복호화
-- 2. get_member_phone(user_id)           — 개인/관리자용 단건 복호화
-- 3. update_profile_phone_enc(user_id, phone) — 전화번호 암호화 저장
-- 4. service_set_profile_phone_enc(user_id, phone) — Edge Function 전용
-- 5. get_customer_phone / update_customer_phone_enc — 고객 전화번호 RPC
-- 6. admin_update_member_phone → phone_enc 기록으로 전환
-- 7. handle_new_user → phone 컬럼 없이 phone_enc에 직접 암호화
-- 8. 암호화 동기화 트리거 제거 (phone 컬럼 삭제로 불필요)
-- 9. profiles.phone / customers.phone 컬럼 DROP

-- ── 1. 테넌트 멤버 전화번호 일괄 복호화 (관리자 전용) ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_tenant_member_phones(p_tenant_id uuid)
RETURNS TABLE(user_id uuid, phone text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
BEGIN
  IF NOT (
    is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = p_tenant_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  RETURN QUERY
  SELECT tm.user_id, public.decrypt_phone(p.phone_enc)
  FROM tenant_members tm
  JOIN profiles p ON p.id = tm.user_id
  WHERE tm.tenant_id = p_tenant_id
    AND tm.is_approved = true
    AND p.phone_enc IS NOT NULL;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_tenant_member_phones(uuid) TO authenticated;

-- ── 2. 개인 전화번호 단건 복호화 (본인 또는 관리자) ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_member_phone(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
BEGIN
  IF NOT (
    auth.uid() = p_user_id
    OR is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members tm_target
      JOIN tenant_members tm_admin
        ON tm_admin.tenant_id = tm_target.tenant_id
       AND tm_admin.user_id = auth.uid()
       AND tm_admin.role = 'admin'
       AND tm_admin.is_approved = true
      WHERE tm_target.user_id = p_user_id
    )
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  RETURN (SELECT public.decrypt_phone(phone_enc) FROM profiles WHERE id = p_user_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.get_member_phone(uuid) TO authenticated;

-- ── 3. 전화번호 암호화 저장 (본인 또는 관리자) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_profile_phone_enc(p_user_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  v_phone text := NULLIF(trim(p_phone), '');
BEGIN
  IF NOT (
    auth.uid() = p_user_id
    OR is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members tm_target
      JOIN tenant_members tm_admin
        ON tm_admin.tenant_id = tm_target.tenant_id
       AND tm_admin.user_id = auth.uid()
       AND tm_admin.role = 'admin'
       AND tm_admin.is_approved = true
      WHERE tm_target.user_id = p_user_id
    )
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  UPDATE profiles
  SET phone_enc = CASE WHEN v_phone IS NOT NULL THEN public.encrypt_phone(v_phone) ELSE NULL END
  WHERE id = p_user_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.update_profile_phone_enc(uuid, text) TO authenticated;

-- ── 4. Edge Function 전용 서비스롤 RPC ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.service_set_profile_phone_enc(p_user_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  v_phone text := NULLIF(trim(p_phone), '');
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role only';
  END IF;

  UPDATE profiles
  SET phone_enc = CASE WHEN v_phone IS NOT NULL THEN public.encrypt_phone(v_phone) ELSE NULL END
  WHERE id = p_user_id;
END; $$;

REVOKE ALL ON FUNCTION public.service_set_profile_phone_enc(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_set_profile_phone_enc(uuid, text) TO service_role;

-- ── 5. 고객 전화번호 RPC ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_customer_phone(p_customer_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
BEGIN
  IF NOT (
    is_super_admin_caller()
    OR EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id AND owner_user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  RETURN (SELECT public.decrypt_phone(phone_enc) FROM customers WHERE id = p_customer_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.get_customer_phone(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_customer_phone_enc(p_customer_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  v_phone text := NULLIF(trim(p_phone), '');
BEGIN
  IF NOT (
    is_super_admin_caller()
    OR EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id AND owner_user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  UPDATE customers
  SET phone_enc = CASE WHEN v_phone IS NOT NULL THEN public.encrypt_phone(v_phone) ELSE NULL END
  WHERE id = p_customer_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.update_customer_phone_enc(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.service_set_customer_phone_enc(p_customer_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  v_phone text := NULLIF(trim(p_phone), '');
BEGIN
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: service_role only';
  END IF;

  UPDATE customers
  SET phone_enc = CASE WHEN v_phone IS NOT NULL THEN public.encrypt_phone(v_phone) ELSE NULL END
  WHERE id = p_customer_id;
END; $$;

REVOKE ALL ON FUNCTION public.service_set_customer_phone_enc(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_set_customer_phone_enc(uuid, text) TO service_role;

-- ── 6. admin_update_member_phone → phone_enc 쓰기로 전환 ─────────────────
CREATE OR REPLACE FUNCTION public.admin_update_member_phone(p_user_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  v_phone text := NULLIF(trim(p_phone), '');
BEGIN
  IF NOT (
    is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members tm_target
      JOIN tenant_members tm_admin
        ON tm_admin.tenant_id = tm_target.tenant_id
       AND tm_admin.user_id = auth.uid()
       AND tm_admin.role = 'admin'
      WHERE tm_target.user_id = p_user_id
    )
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  UPDATE profiles
  SET phone_enc = CASE WHEN v_phone IS NOT NULL THEN public.encrypt_phone(v_phone) ELSE NULL END
  WHERE id = p_user_id;
END; $$;

-- ── 7. handle_new_user: phone 컬럼 없이 phone_enc에 직접 암호화 ───────────
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
    phone_enc
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
    encrypted_enc
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

-- ── 8. 동기화 트리거 제거 (phone 컬럼 삭제로 불필요) ──────────────────────
DROP TRIGGER IF EXISTS trg_encrypt_profile_phone ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_phone_enc() CASCADE;
DROP TRIGGER IF EXISTS trg_encrypt_customer_phone ON public.customers;
DROP FUNCTION IF EXISTS public.sync_customer_phone_enc() CASCADE;

-- ── 9. 평문 phone 컬럼 삭제 ──────────────────────────────────────────────
ALTER TABLE public.profiles  DROP COLUMN IF EXISTS phone;
ALTER TABLE public.customers DROP COLUMN IF EXISTS phone;

-- ── 함수 드롭 목록 정리 (reset_db.sql 참조용) ─────────────────────────────
-- DROP FUNCTION IF EXISTS public.get_tenant_member_phones(uuid)  등은 reset_db.sql에 반영
