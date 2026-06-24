-- schedule-images 버킷 Storage RLS 정책
-- 버킷 자체는 Supabase 대시보드 또는 아래 INSERT로 생성한다
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'schedule-images',
  'schedule-images',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자 업로드 허용
DROP POLICY IF EXISTS "authenticated_upload_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_upload_schedule_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'schedule-images');

-- 공개 읽기
DROP POLICY IF EXISTS "public_read_schedule_images" ON storage.objects;
CREATE POLICY "public_read_schedule_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedule-images');

-- 인증된 사용자 삭제 허용
DROP POLICY IF EXISTS "authenticated_delete_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_delete_schedule_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'schedule-images');
