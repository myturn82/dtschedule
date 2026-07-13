-- 조직 관리자가 자기 조직의 발송내역(notifications)을 조회할 수 있도록 SELECT 정책 추가
-- (기존 notif_select_own은 본인 것만 허용하여 관리자가 다른 회원의 발송 기록을 볼 수 없었음)
CREATE POLICY "notif_select_tenant_admin" ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = notifications.tenant_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
  );

CREATE POLICY "notif_select_superadmin" ON notifications FOR SELECT
  USING (is_super_admin_caller());
