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

-- 테넌트 소속 인증 사용자만 자신의 테넌트 폴더에 업로드 허용
-- 경로: {tenantId}/{uuid}.webp → (storage.foldername(name))[1] = tenantId
DROP POLICY IF EXISTS "authenticated_upload_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_upload_schedule_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'schedule-images'
    AND EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.tenant_id::text = (storage.foldername(name))[1]
      AND tm.is_approved = true
    )
  );

-- 공개 읽기 (버킷이 public이므로 URL 직접 접근 허용)
DROP POLICY IF EXISTS "public_read_schedule_images" ON storage.objects;
CREATE POLICY "public_read_schedule_images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'schedule-images');

-- 테넌트 소속 인증 사용자만 자신의 테넌트 폴더에서 삭제 허용
DROP POLICY IF EXISTS "authenticated_delete_schedule_images" ON storage.objects;
CREATE POLICY "authenticated_delete_schedule_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'schedule-images'
    AND EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.tenant_id::text = (storage.foldername(name))[1]
      AND tm.is_approved = true
    )
  );
