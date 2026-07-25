-- 066_phone_encryption_phase1.sql
-- 전화번호 암호화 1단계: 인프라 구축 + 기존 데이터 암호화 (병렬 컬럼 방식)
--
-- ★ 사전 필수 작업 (이 마이그레이션 실행 전 Supabase SQL 에디터에서 실행):
--   ALTER DATABASE postgres SET "app.settings.encryption_key" = 'YOUR-SECRET-KEY';
--   키는 32자 이상 무작위 문자열 권장: openssl rand -base64 32
--
-- ★ 안전 설계 원칙:
--   - phone / customer_phone 원본 컬럼은 유지 → 사용자 화면 변화 없음
--   - phone_enc / customer_phone_enc 를 병렬로 추가해 암호화 사본 관리
--   - 트리거로 신규 write 시 자동 암호화 (앱 코드 변경 불필요)
--   - 키가 미설정이면 경고 후 기존 데이터 마이그레이션만 건너뜀 (컬럼·함수·트리거는 생성)
--   - Phase 2(별도 배포)에서 원본 컬럼 제거 + 복호화 View 전환

-- ── pgcrypto 활성화 ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 암호화 / 복호화 함수 (SECURITY DEFINER: 키를 앱 레이어에 노출하지 않음) ─
CREATE OR REPLACE FUNCTION public.encrypt_phone(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key text;
BEGIN
  IF plain_text IS NULL OR plain_text = '' THEN
    RETURN NULL;
  END IF;
  enc_key := current_setting('app.settings.encryption_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'app.settings.encryption_key 가 설정되지 않았습니다.';
  END IF;
  RETURN encode(
    pgp_sym_encrypt(plain_text, enc_key, 'cipher-algo=aes256'),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_phone(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key text;
BEGIN
  IF encrypted_text IS NULL OR encrypted_text = '' THEN
    RETURN NULL;
  END IF;
  enc_key := current_setting('app.settings.encryption_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE EXCEPTION 'app.settings.encryption_key 가 설정되지 않았습니다.';
  END IF;
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(encrypted_text, 'base64'),
      enc_key
    );
  EXCEPTION WHEN OTHERS THEN
    -- 키 불일치 또는 손상된 값: NULL 반환 (조용한 실패)
    RETURN NULL;
  END;
END;
$$;

-- 기존 데이터 백필용 함수 (키 설정 후 별도 실행 가능)
CREATE OR REPLACE FUNCTION public.backfill_phone_encryption()
RETURNS TABLE(profiles_updated int, assignments_updated int, customers_updated int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_cnt int := 0;
  a_cnt int := 0;
  c_cnt int := 0;
BEGIN
  UPDATE public.profiles
    SET phone_enc = public.encrypt_phone(phone)
    WHERE phone IS NOT NULL AND phone != '' AND phone_enc IS NULL;
  GET DIAGNOSTICS p_cnt = ROW_COUNT;

  UPDATE public.assignments
    SET customer_phone_enc = public.encrypt_phone(customer_phone)
    WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone_enc IS NULL;
  GET DIAGNOSTICS a_cnt = ROW_COUNT;

  UPDATE public.customers
    SET phone_enc = public.encrypt_phone(phone)
    WHERE phone IS NOT NULL AND phone != '' AND phone_enc IS NULL;
  GET DIAGNOSTICS c_cnt = ROW_COUNT;

  RETURN QUERY SELECT p_cnt, a_cnt, c_cnt;
END;
$$;

COMMENT ON FUNCTION public.backfill_phone_encryption() IS
  '암호화 키 설정 후 기존 데이터 일괄 암호화: SELECT * FROM backfill_phone_encryption();';

-- ── 암호화 컬럼 추가 ─────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_enc text;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS customer_phone_enc text;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS phone_enc text;

-- 앱 레이어(authenticated/anon)에서 암호화 컬럼 직접 읽기/쓰기 차단
-- (SECURITY DEFINER 함수만 접근 가능)
DO $$
BEGIN
  -- profiles.phone_enc
  BEGIN
    EXECUTE 'REVOKE SELECT (phone_enc) ON public.profiles FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'REVOKE INSERT (phone_enc) ON public.profiles FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'REVOKE UPDATE (phone_enc) ON public.profiles FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  -- assignments.customer_phone_enc
  BEGIN
    EXECUTE 'REVOKE SELECT (customer_phone_enc) ON public.assignments FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'REVOKE INSERT (customer_phone_enc) ON public.assignments FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'REVOKE UPDATE (customer_phone_enc) ON public.assignments FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  -- customers.phone_enc
  BEGIN
    EXECUTE 'REVOKE SELECT (phone_enc) ON public.customers FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'REVOKE INSERT (phone_enc) ON public.customers FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    EXECUTE 'REVOKE UPDATE (phone_enc) ON public.customers FROM authenticated, anon';
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
END;
$$;

-- ── 자동 암호화 트리거 (신규 write 시 phone_enc 자동 동기화) ─────────────────

-- profiles.phone → phone_enc
CREATE OR REPLACE FUNCTION public.sync_profile_phone_enc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key text;
BEGIN
  enc_key := current_setting('app.settings.encryption_key', true);
  -- 키가 없으면 암호화 없이 통과 (마이그레이션 전 단계 허용)
  IF enc_key IS NULL OR enc_key = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_enc := public.encrypt_phone(NEW.phone);
  ELSE
    NEW.phone_enc := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_encrypt_profile_phone ON public.profiles;
CREATE TRIGGER trg_encrypt_profile_phone
  BEFORE INSERT OR UPDATE OF phone ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_phone_enc();

-- assignments.customer_phone → customer_phone_enc
CREATE OR REPLACE FUNCTION public.sync_assignment_customer_phone_enc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key text;
BEGIN
  enc_key := current_setting('app.settings.encryption_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_phone IS NOT NULL AND NEW.customer_phone != '' THEN
    NEW.customer_phone_enc := public.encrypt_phone(NEW.customer_phone);
  ELSE
    NEW.customer_phone_enc := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_encrypt_assignment_customer_phone ON public.assignments;
CREATE TRIGGER trg_encrypt_assignment_customer_phone
  BEFORE INSERT OR UPDATE OF customer_phone ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_assignment_customer_phone_enc();

-- customers.phone → phone_enc
CREATE OR REPLACE FUNCTION public.sync_customer_phone_enc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key text;
BEGIN
  enc_key := current_setting('app.settings.encryption_key', true);
  IF enc_key IS NULL OR enc_key = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    NEW.phone_enc := public.encrypt_phone(NEW.phone);
  ELSE
    NEW.phone_enc := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_encrypt_customer_phone ON public.customers;
CREATE TRIGGER trg_encrypt_customer_phone
  BEFORE INSERT OR UPDATE OF phone ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_phone_enc();

-- ── 기존 데이터 암호화 (키가 설정된 경우에만 실행) ───────────────────────────
DO $$
DECLARE
  enc_key text;
  p_cnt   int;
  a_cnt   int;
  c_cnt   int;
BEGIN
  enc_key := current_setting('app.settings.encryption_key', true);

  IF enc_key IS NULL OR enc_key = '' THEN
    RAISE WARNING
      E'[066] 암호화 키가 설정되지 않아 기존 데이터 마이그레이션을 건너뜁니다.\n'
      '키 설정 후 아래를 실행하세요:\n'
      '  ALTER DATABASE postgres SET "app.settings.encryption_key" = ''<YOUR-KEY>'';\n'
      '  SELECT * FROM public.backfill_phone_encryption();';
    RETURN;
  END IF;

  -- profiles
  UPDATE public.profiles
    SET phone_enc = public.encrypt_phone(phone)
    WHERE phone IS NOT NULL AND phone != '' AND phone_enc IS NULL;
  GET DIAGNOSTICS p_cnt = ROW_COUNT;

  -- assignments
  UPDATE public.assignments
    SET customer_phone_enc = public.encrypt_phone(customer_phone)
    WHERE customer_phone IS NOT NULL AND customer_phone != '' AND customer_phone_enc IS NULL;
  GET DIAGNOSTICS a_cnt = ROW_COUNT;

  -- customers
  UPDATE public.customers
    SET phone_enc = public.encrypt_phone(phone)
    WHERE phone IS NOT NULL AND phone != '' AND phone_enc IS NULL;
  GET DIAGNOSTICS c_cnt = ROW_COUNT;

  RAISE NOTICE '[066] 전화번호 암호화 완료 – profiles: %, assignments: %, customers: %',
    p_cnt, a_cnt, c_cnt;
END;
$$;
