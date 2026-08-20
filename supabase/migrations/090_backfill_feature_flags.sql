-- feature_flags가 없는 기존 조직을 source_vertical 기준으로 백필한다.
-- 이미 feature_flags가 설정된 조직은 건드리지 않는다.

UPDATE tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{feature_flags}',
  CASE source_vertical
    WHEN 'lessonon' THEN '{"lesson_packages": true,  "autoassign": true,  "notifications": true}'::jsonb
    WHEN 'classon'  THEN '{"lesson_packages": true,  "autoassign": true,  "attendance": true}'::jsonb
    WHEN 'shifton'  THEN '{"lesson_packages": false, "autoassign": true,  "notifications": true, "volunteer_hours": true}'::jsonb
    WHEN 'salonon'  THEN '{"lesson_packages": false, "autoassign": false, "public_booking": true}'::jsonb
    WHEN 'careon'   THEN '{"lesson_packages": false, "autoassign": true,  "notifications": true, "care_mapping": true, "volunteer_hours": true}'::jsonb
    WHEN 'serveon'  THEN '{"lesson_packages": false, "autoassign": true,  "volunteer_hours": true, "attendance": true}'::jsonb
    WHEN 'workon'   THEN '{"lesson_packages": false, "autoassign": true,  "calendar_sync": true, "volunteer_hours": true}'::jsonb
  END
)
WHERE source_vertical IN ('lessonon','classon','shifton','salonon','careon','serveon','workon');
