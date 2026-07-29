-- supabase/migrations/083_feedback_posts_delete.sql
-- 시스템관리자(슈퍼관리자)가 문의내역을 삭제할 수 있도록 DELETE 정책을 추가한다.
-- feedback_replies는 feedback_posts를 ON DELETE CASCADE로 참조하므로,
-- cascade 삭제가 RLS에 막히지 않도록 feedback_replies에도 동일한 DELETE 정책을 둔다.

CREATE POLICY "feedback_posts_delete" ON feedback_posts FOR DELETE
USING (public.is_super_admin_caller());

CREATE POLICY "feedback_replies_delete" ON feedback_replies FOR DELETE
USING (public.is_super_admin_caller());
