-- 070_phone_encryption_use_vault.sql
-- 전화번호 암호화 키 관리를 current_setting → Supabase Vault로 전환
-- pgcrypto는 Supabase의 extensions 스키마에 설치되므로 search_path에 포함 필수
--
-- ★ 사전 필수 작업 (이 마이그레이션 실행 전 SQL Editor에서 실행):
--   SELECT vault.create_secret(
--     'YOUR-KEY',                -- openssl rand -base64 32
--     'phone_encryption_key',
--     'AES-256 encryption key for phone numbers'
--   );
--
-- ★ 이후 기존 데이터 백필:
--   SELECT * FROM public.backfill_phone_encryption();

CREATE OR REPLACE FUNCTION public.encrypt_phone(plain_text text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE enc_key text;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO enc_key FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN RAISE EXCEPTION '암호화 키(phone_encryption_key)가 Vault에 설정되지 않았습니다.'; END IF;
  RETURN encode(pgp_sym_encrypt(plain_text, enc_key), 'base64');
END; $$;

CREATE OR REPLACE FUNCTION public.decrypt_phone(encrypted_text text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE enc_key text;
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO enc_key FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN RAISE EXCEPTION '암호화 키(phone_encryption_key)가 Vault에 설정되지 않았습니다.'; END IF;
  BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), enc_key);
  EXCEPTION WHEN OTHERS THEN RETURN NULL; END;
END; $$;

CREATE OR REPLACE FUNCTION public.backfill_phone_encryption()
RETURNS TABLE(profiles_updated int, assignments_updated int, customers_updated int)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE
  p_cnt int := 0; a_cnt int := 0; c_cnt int := 0;
BEGIN
  UPDATE public.profiles SET phone_enc = public.encrypt_phone(phone)
    WHERE phone IS NOT NULL AND phone != '' AND phone_enc IS NULL;
  GET DIAGNOSTICS p_cnt = ROW_COUNT;
  UPDATE public.assignments SET customer_phone_enc = public.encrypt_phone(customer_phone)
    WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone_enc IS NULL;
  GET DIAGNOSTICS a_cnt = ROW_COUNT;
  UPDATE public.customers SET phone_enc = public.encrypt_phone(phone)
    WHERE phone IS NOT NULL AND phone != '' AND phone_enc IS NULL;
  GET DIAGNOSTICS c_cnt = ROW_COUNT;
  RETURN QUERY SELECT p_cnt, a_cnt, c_cnt;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_profile_phone_enc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE enc_key text;
BEGIN
  SELECT decrypted_secret INTO enc_key FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN RETURN NEW; END IF;
  NEW.phone_enc := CASE WHEN NEW.phone IS NOT NULL AND NEW.phone != '' THEN public.encrypt_phone(NEW.phone) ELSE NULL END;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_assignment_customer_phone_enc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE enc_key text;
BEGIN
  SELECT decrypted_secret INTO enc_key FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN RETURN NEW; END IF;
  NEW.customer_phone_enc := CASE WHEN NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN public.encrypt_phone(NEW.customer_phone) ELSE NULL END;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.sync_customer_phone_enc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, extensions AS $$
DECLARE enc_key text;
BEGIN
  SELECT decrypted_secret INTO enc_key FROM vault.decrypted_secrets WHERE name = 'phone_encryption_key' LIMIT 1;
  IF enc_key IS NULL OR enc_key = '' THEN RETURN NEW; END IF;
  NEW.phone_enc := CASE WHEN NEW.phone IS NOT NULL AND NEW.phone != '' THEN public.encrypt_phone(NEW.phone) ELSE NULL END;
  RETURN NEW;
END; $$;
