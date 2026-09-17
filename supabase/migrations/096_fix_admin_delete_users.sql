-- admin_delete_users: 개발 DB의 auth.users CASCADE 미적용 환경에서도 완전 삭제
-- 운영 DB에서는 명시적 DELETE가 CASCADE와 중복되지만 에러 없이 무해하게 동작함

CREATE OR REPLACE FUNCTION admin_delete_users(target_user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NOT is_super_admin_caller() THEN
    RAISE EXCEPTION 'Unauthorized: super admin only';
  END IF;

  DELETE FROM public.assignment_snapshots WHERE created_by = ANY(target_user_ids);
  DELETE FROM public.lesson_packages    WHERE user_id     = ANY(target_user_ids)
                                           OR created_by  = ANY(target_user_ids);
  DELETE FROM public.assignments        WHERE user_id     = ANY(target_user_ids);
  DELETE FROM public.tenant_members     WHERE user_id     = ANY(target_user_ids);
  DELETE FROM public.profiles           WHERE id          = ANY(target_user_ids);
  DELETE FROM auth.users                WHERE id          = ANY(target_user_ids);
END;
$func$;
