-- 072_fix_phone_functions.sql
-- 1. get_tenant_member_phones: RETURNS TABLE의 user_id 출력 변수와
--    EXISTS 서브쿼리 내 tenant_members.user_id 컬럼이 모호하게 충돌 → tm2 별칭으로 수정
-- 2. decrypt_phone: pgp_sym_decrypt 실패 시 함수 전체가 오류를 던지던 문제 →
--    EXCEPTION WHEN OTHERS 로 잡아 NULL 반환하도록 수정 (한 건 실패가 전체 쿼리를 막지 않음)

CREATE OR REPLACE FUNCTION public.get_tenant_member_phones(p_tenant_id uuid)
RETURNS TABLE(user_id uuid, phone text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
BEGIN
  IF NOT (
    is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members tm2
      WHERE tm2.tenant_id = p_tenant_id
        AND tm2.user_id   = auth.uid()
        AND tm2.role      = 'admin'
        AND tm2.is_approved = true
    )
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  RETURN QUERY
  SELECT tm.user_id, public.decrypt_phone(p.phone_enc)
  FROM tenant_members tm
  JOIN profiles p ON p.id = tm.user_id
  WHERE tm.tenant_id   = p_tenant_id
    AND tm.is_approved = true
    AND p.phone_enc    IS NOT NULL;
END; $$;

GRANT EXECUTE ON FUNCTION public.get_tenant_member_phones(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.decrypt_phone(encrypted_text text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  enc_key text;
  result  text;
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN RETURN NULL; END IF;
  BEGIN
    result := pgp_sym_decrypt(decode(encrypted_text, 'base64'), enc_key);
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END; $$;
