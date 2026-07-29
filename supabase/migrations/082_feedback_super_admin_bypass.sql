-- supabase/migrations/082_feedback_super_admin_bypass.sql
-- 081에서 feedback_posts_select/update와 feedback_replies는 슈퍼관리자 예외(is_super_admin_caller())를
-- 뒀지만, feedback_posts_insert와 첨부파일 업로드 정책에는 빠뜨렸다.
-- 슈퍼관리자가 자신이 승인 멤버가 아닌 조직(관리자콘솔에서 다른 조직 관리 중)에서
-- 피드백을 등록/첨부하려 하면 "new row violates row-level security policy"로 막히던 문제를 수정한다.

DROP POLICY IF EXISTS "feedback_posts_insert" ON feedback_posts;
CREATE POLICY "feedback_posts_insert" ON feedback_posts FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = feedback_posts.tenant_id AND tm.user_id = auth.uid() AND tm.is_approved = true
    )
  )
);

DROP POLICY IF EXISTS "authenticated_upload_feedback_attachments" ON storage.objects;
CREATE POLICY "authenticated_upload_feedback_attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-attachments'
    AND (
      public.is_super_admin_caller()
      OR EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.tenant_id::text = (storage.foldername(name))[1]
        AND tm.is_approved = true
      )
    )
  );
