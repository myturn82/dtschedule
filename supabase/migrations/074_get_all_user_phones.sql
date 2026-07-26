-- 074_get_all_user_phones.sql
-- 슈퍼관리자 전용: 전체 사용자 전화번호 일괄 복호화
-- 출력 컬럼명에 p_ 접두사를 붙여 profiles 테이블 컬럼과 이름 충돌 방지

CREATE OR REPLACE FUNCTION public.get_all_user_phones()
RETURNS TABLE(p_user_id uuid, p_phone text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  enc_key  text;
  r        record;
  dec_val  text;
BEGIN
  -- 슈퍼관리자만 호출 가능
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles prof
    WHERE prof.id = auth.uid() AND prof.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;

  IF enc_key IS NULL OR enc_key = '' THEN
    RETURN;
  END IF;

  FOR r IN
    SELECT prof2.id, prof2.phone_enc
    FROM public.profiles prof2
    WHERE prof2.phone_enc IS NOT NULL AND prof2.phone_enc != ''
  LOOP
    BEGIN
      dec_val   := pgp_sym_decrypt(decode(r.phone_enc, 'base64'), enc_key);
      p_user_id := r.id;
      p_phone   := dec_val;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      NULL;  -- 복호화 실패 시 해당 행 건너뜀
    END;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_user_phones() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_user_phones() TO authenticated;

COMMENT ON FUNCTION public.get_all_user_phones() IS
  '슈퍼관리자 전용: 모든 사용자의 복호화된 전화번호 반환 (phone_enc → plaintext)';
