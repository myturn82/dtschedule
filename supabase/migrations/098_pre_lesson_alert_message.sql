-- 레슨 시작 전 알림 메시지 직접 설정 지원
-- pre_lesson_alert_message: NULL이면 기본 템플릿 사용
-- 템플릿 변수: {{time}}, {{minutes}}, {{members}}

ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS pre_lesson_alert_message text;
