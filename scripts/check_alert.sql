-- 오늘 23시 슬롯 배정 확인
SELECT id, year, month, day, time_slot, user_id
FROM assignments
WHERE tenant_id = 'ec6baec1-b257-4097-b4d0-ce158ea969f4'
  AND year = 2026 AND month = 9 AND day = 21
  AND time_slot LIKE '23-%';

-- pre_lesson_alert_log 확인 (오늘)
SELECT * FROM pre_lesson_alert_log
WHERE tenant_id = 'ec6baec1-b257-4097-b4d0-ce158ea969f4'
  AND alert_date = '2026-09-21'
ORDER BY sent_at DESC
LIMIT 10;

-- 최근 인앱 알림 확인
SELECT title, body, created_at FROM notifications
WHERE tenant_id = 'ec6baec1-b257-4097-b4d0-ce158ea969f4'
  AND type = 'pre_lesson'
ORDER BY created_at DESC
LIMIT 5;
