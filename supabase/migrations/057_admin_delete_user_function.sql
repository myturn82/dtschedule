-- 슈퍼관리자가 auth.users를 직접 삭제할 수 있도록 SECURITY DEFINER 함수 추가
-- auth.users 삭제 시 profiles는 FK CASCADE로 자동 삭제됨
-- profiles만 삭제하면 auth.users가 남아 동일 이메일 재가입 불가 문제 발생

CREATE OR REPLACE FUNCTION admin_delete_users(target_user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin_caller() THEN
    RAISE EXCEPTION 'Unauthorized: super admin only';
  END IF;

  DELETE FROM auth.users WHERE id = ANY(target_user_ids);
END;
$$;
