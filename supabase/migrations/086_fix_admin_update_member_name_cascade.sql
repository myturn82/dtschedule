-- admin_update_member_name: profiles.name 변경 시 assignments.member_name도 함께 갱신
-- 기존 함수는 profiles만 업데이트해 member_name/user_id 불일치 데이터 오염을 유발했음

CREATE OR REPLACE FUNCTION public.admin_update_member_name(p_user_id uuid, p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_name text := trim(p_name);
BEGIN
  IF v_name = '' THEN
    RAISE EXCEPTION '이름을 입력해 주세요.';
  END IF;

  IF NOT (
    is_super_admin_caller()
    OR EXISTS (
      SELECT 1 FROM tenant_members tm_target
      JOIN tenant_members tm_admin
        ON tm_admin.tenant_id = tm_target.tenant_id
       AND tm_admin.user_id = auth.uid()
       AND tm_admin.role = 'admin'
      WHERE tm_target.user_id = p_user_id
    )
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  UPDATE profiles SET name = v_name WHERE id = p_user_id;
  UPDATE assignments SET member_name = v_name WHERE user_id = p_user_id;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.admin_update_member_name(uuid, text) TO authenticated;
