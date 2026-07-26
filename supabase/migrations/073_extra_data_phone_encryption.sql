-- 073_extra_data_phone_encryption.sql
-- 1. batch_decrypt_phones: 암호화된 phone 값 배열을 한 번에 복호화
-- 2. encrypt_extra_data_phone_fields: 기존 assignments.extra_data의 phone 필드 일괄 암호화

-- ── 1. 배치 복호화 RPC ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.batch_decrypt_phones(p_values text[])
RETURNS text[]
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  enc_key text;
  result  text[];
  i       int;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN
    RETURN array_fill(NULL::text, ARRAY[coalesce(array_length(p_values, 1), 0)]);
  END IF;

  result := ARRAY[]::text[];
  FOR i IN 1..coalesce(array_length(p_values, 1), 0) LOOP
    BEGIN
      result := result || pgp_sym_decrypt(decode(p_values[i], 'base64'), enc_key);
    EXCEPTION WHEN OTHERS THEN
      result := result || NULL::text;
    END;
  END LOOP;
  RETURN result;
END; $$;

REVOKE ALL ON FUNCTION public.batch_decrypt_phones(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.batch_decrypt_phones(text[]) TO authenticated;

-- ── 2. 기존 extra_data phone 필드 일괄 암호화 ─────────────────────────────
-- 각 테넌트의 custom_fields 중 type='phone'인 필드 ID를 읽어
-- assignments.extra_data의 해당 필드 값을 enc:BASE64 형식으로 업데이트한다.
-- 이미 enc: 접두사가 있는 값은 건너뛴다.
CREATE OR REPLACE FUNCTION public.encrypt_extra_data_phone_fields()
RETURNS TABLE(tenant_id uuid, updated_count int)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  enc_key   text;
  t_rec     record;
  cf_def    jsonb;
  field_id  text;
  field_ids text[];
  a_rec     record;
  new_extra jsonb;
  old_val   text;
  enc_val   text;
  cnt       int;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'phone_encryption_key not found in Vault';
  END IF;

  FOR t_rec IN SELECT id, settings FROM public.tenants LOOP
    -- phone 타입 custom field ID 목록 수집
    field_ids := ARRAY[]::text[];
    FOR cf_def IN SELECT jsonb_array_elements(
      COALESCE(t_rec.settings->'custom_fields', '[]'::jsonb))
    LOOP
      IF cf_def->>'type' = 'phone' THEN
        field_ids := field_ids || (cf_def->>'id');
      END IF;
    END LOOP;

    IF array_length(field_ids, 1) IS NULL THEN CONTINUE; END IF;

    cnt := 0;
    FOR a_rec IN
      SELECT a2.id, a2.extra_data FROM public.assignments a2
      WHERE a2.tenant_id = t_rec.id AND a2.extra_data IS NOT NULL
    LOOP
      new_extra := a_rec.extra_data;
      FOR field_id IN SELECT unnest(field_ids) LOOP
        old_val := new_extra->>field_id;
        IF old_val IS NULL OR old_val = '' OR old_val LIKE 'enc:%' THEN CONTINUE; END IF;
        BEGIN
          enc_val := encode(pgp_sym_encrypt(old_val, enc_key), 'base64');
          new_extra := jsonb_set(new_extra, ARRAY[field_id], to_jsonb('enc:' || enc_val));
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;

      IF new_extra IS DISTINCT FROM a_rec.extra_data THEN
        UPDATE public.assignments SET extra_data = new_extra WHERE id = a_rec.id;
        cnt := cnt + 1;
      END IF;
    END LOOP;

    IF cnt > 0 THEN
      tenant_id    := t_rec.id;
      updated_count := cnt;
      RETURN NEXT;
    END IF;
  END LOOP;
END; $$;

REVOKE ALL ON FUNCTION public.encrypt_extra_data_phone_fields() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_extra_data_phone_fields() TO authenticated;

COMMENT ON FUNCTION public.encrypt_extra_data_phone_fields() IS
  '기존 extra_data phone 필드 일괄 암호화 (1회 실행): SELECT * FROM encrypt_extra_data_phone_fields();';
