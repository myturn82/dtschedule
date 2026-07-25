-- 068_notifications_retention.sql
-- 알림 보유기간 관리: 소프트 삭제 컬럼 + 자동 정리 함수
-- 개인정보 보호법 제21조(파기) – 목적 달성 후 지체 없이 파기

-- ── archived_at 컬럼 추가 (소프트 삭제) ─────────────────────────────────────
-- NULL = 활성 알림, NOT NULL = 보관 처리된 알림
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 활성 알림 조회 성능 최적화
CREATE INDEX IF NOT EXISTS idx_notifications_active
  ON public.notifications(user_id, created_at DESC)
  WHERE archived_at IS NULL;

-- ── 알림 정리 함수 ───────────────────────────────────────────────────────────
-- 읽은 알림: 30일 경과 시 소프트 삭제
-- 미읽은 알림: 90일 경과 시 소프트 삭제
-- Supabase Edge Function Cron 또는 pg_cron으로 주기 실행
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected int;
BEGIN
  UPDATE public.notifications
  SET archived_at = now()
  WHERE archived_at IS NULL
    AND (
      (is_read = true  AND created_at < now() - interval '30 days')
      OR
      (is_read = false AND created_at < now() - interval '90 days')
    );
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_notifications() IS
  '오래된 알림 소프트 삭제. Supabase Edge Function Cron (매일 새벽 3시)으로 호출 권장.';

-- ── 기존 알림 중 즉시 보관 처리 대상 (이미 오래된 것) ───────────────────────
-- 운영 데이터 안전을 위해 소프트 삭제(archived_at 설정)만 수행, 실제 DELETE는 하지 않음
UPDATE public.notifications
SET archived_at = now()
WHERE archived_at IS NULL
  AND (
    (is_read = true  AND created_at < now() - interval '30 days')
    OR
    (is_read = false AND created_at < now() - interval '90 days')
  );
