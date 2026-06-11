-- 조직 관리자(이상)가 멤버의 성명을 직접 수정할 수 있는 RPC
-- 카카오 등 소셜 로그인 시 닉네임/계정ID가 성명으로 들어가는 경우를 관리자가 보정할 수 있도록 함

CREATE OR REPLACE FUNCTION public.admin_update_member_name(p_user_id uuid, p_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_member_name(uuid, text) TO authenticated;
