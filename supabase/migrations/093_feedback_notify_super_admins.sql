-- supabase/migrations/093_feedback_notify_super_admins.sql
-- 새 피드백이 등록될 때 모든 슈퍼관리자에게 인앱 알림을 보낸다.

CREATE OR REPLACE FUNCTION public.notify_super_admins_on_new_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_admin RECORD;
  v_category_label text;
BEGIN
  v_category_label := CASE NEW.category
    WHEN 'inquiry' THEN '단순문의'
    WHEN 'bug'     THEN '오류'
    WHEN 'feature' THEN '기능개선'
    ELSE NEW.category
  END;

  FOR v_admin IN
    SELECT id FROM profiles WHERE is_super_admin = true
  LOOP
    INSERT INTO notifications (tenant_id, user_id, title, body, type, metadata)
    VALUES (
      NEW.tenant_id,
      v_admin.id,
      '새 피드백이 등록됐습니다',
      '[' || v_category_label || '] ' || NEW.title || ' — ' || NEW.author_name || ' (' || coalesce(NEW.tenant_name, '') || ')',
      'feedback_new',
      jsonb_build_object('feedback_post_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_feedback_post_after_insert
  AFTER INSERT ON feedback_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_super_admins_on_new_feedback();
