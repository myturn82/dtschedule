-- 094_pre_lesson_alert.sql
-- 레슨 시작 N분 전 관리자 Android 푸시 알림 기능

-- ── notification_settings 칼럼 추가 ─────────────────────────────────────────
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS pre_lesson_alert_enabled boolean  DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS pre_lesson_alert_minutes smallint DEFAULT 10    NOT NULL;

-- ── 중복 발송 방지 로그 테이블 ────────────────────────────────────────────────
-- PRIMARY KEY(tenant_id, alert_date, time_slot)로 동일 슬롯 재발송을 원천 차단한다.
CREATE TABLE IF NOT EXISTS pre_lesson_alert_log (
  tenant_id   uuid  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alert_date  date  NOT NULL,
  time_slot   text  NOT NULL,
  sent_at     timestamptz DEFAULT now(),
  PRIMARY KEY (tenant_id, alert_date, time_slot)
);

-- 30일 이상 된 로그 정리용 인덱스
CREATE INDEX IF NOT EXISTS idx_pre_lesson_log_sent_at
  ON pre_lesson_alert_log(sent_at);

ALTER TABLE pre_lesson_alert_log ENABLE ROW LEVEL SECURITY;
-- Edge Function(service_role)만 접근하므로 별도 사용자 정책 불필요

-- ── pg_cron 스케줄 등록 안내 ─────────────────────────────────────────────────
-- 함수는 verify_jwt=false로 배포되어 있으며, x-cron-secret 헤더로만 인증한다.
-- Authorization 헤더는 불필요하다 (긴 JWT를 cron 명령에 포함하면 줄바꿈 문제 발생).
--
-- Supabase Dashboard > Database > Cron Jobs 에서 아래 SQL을 실행한다:
--
--   이름: pre-lesson-alerts
--   스케줄: * * * * *  (매 1분)
--   명령 (단일 행으로 입력):
--
--     SELECT net.http_post(
--       url     := '{SUPABASE_URL}/functions/v1/send-pre-lesson-alerts',
--       headers := '{"Content-Type":"application/json","x-cron-secret":"{CRON_SECRET}"}'::jsonb,
--       body    := '{}'::jsonb
--     );
--
-- {SUPABASE_URL}과 {CRON_SECRET}은 실제 값으로 교체한다.
-- 주의: headers 값은 반드시 한 줄로 입력한다. 줄바꿈이 들어가면 JSON 파싱 오류 발생.
