-- ① 기존 등록 해제 (없으면 무시)
DO $func$
BEGIN
  PERFORM cron.unschedule('pre-lesson-alerts');
EXCEPTION WHEN OTHERS THEN NULL;
END $func$;

-- ② 새 CRON_SECRET 값으로 재등록
--    x-cron-secret 값은 Supabase Secrets의 CRON_SECRET 와 반드시 일치해야 함
SELECT cron.schedule(
  'pre-lesson-alerts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://mcuszdvophmqrwostcah.supabase.co/functions/v1/send-pre-lesson-alerts',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdXN6ZHZvcGhtcXJ3b3N0Y2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4ODY4NDYsImV4cCI6MjA5NjQ2Mjg0Nn0.ZOBQM9Q_Dy8dl604Wjr0pAALfIdqKV85-ukCNCCYma0","x-cron-secret":"kNRjIGwfegT6QRhdM/tzi1NqhepGnPOTc09VuCIFPZs="}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
