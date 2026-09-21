-- ① 기존 등록 해제 (없으면 무시)
DO $func$
BEGIN
  PERFORM cron.unschedule('pre-lesson-alerts');
EXCEPTION WHEN OTHERS THEN NULL;
END $func$;

-- ② 새 CRON_SECRET 값으로 재등록
--    x-cron-secret 값은 운영 Supabase Secrets의 CRON_SECRET 와 반드시 일치해야 함
SELECT cron.schedule(
  'pre-lesson-alerts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://bjnmaajhcmhxwonybnqc.supabase.co/functions/v1/send-pre-lesson-alerts',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbm1hYWpoY21oeHdvbnlibnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzY5MjYsImV4cCI6MjA5MzcxMjkyNn0.fzGwSPWueTJmC0wEA3FoXi9M07HG5xEUtko5HX2hHcI","x-cron-secret":"PROD_CRON_SECRET_HERE"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
