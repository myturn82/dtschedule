-- 048_fix_assignments_insert_null_user.sql
-- 비회원 모드(user_id = NULL)에서 일반 테넌트 멤버가 배정을 등록할 수 있도록 수정
-- 기존 정책: user_id = auth.uid() AND is_tenant_member → NULL 삽입 시 차단됨
-- 변경 정책: is_tenant_member AND (user_id = auth.uid() OR user_id IS NULL)

DROP POLICY IF EXISTS "assignments_tenant_insert" ON assignments;

CREATE POLICY "assignments_tenant_insert" ON assignments
  FOR INSERT WITH CHECK (
    is_tenant_member(tenant_id) AND (user_id = auth.uid() OR user_id IS NULL)
  );
