-- 050_slot_highlights.sql
-- 관리자가 빈 슬롯을 하이라이트하여 회원에게 알림

CREATE TABLE IF NOT EXISTS slot_highlights (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  time_slot   TEXT        NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_slot_highlights_tenant_date
  ON slot_highlights(tenant_id, date);

ALTER TABLE slot_highlights ENABLE ROW LEVEL SECURITY;

-- 관리자만 생성/수정/삭제
CREATE POLICY "slot_highlights_admin_all" ON slot_highlights
  FOR ALL
  USING  (is_tenant_admin(tenant_id) OR is_super_admin())
  WITH CHECK (is_tenant_admin(tenant_id) OR is_super_admin());

-- 테넌트 멤버 + 관리자 + 슈퍼어드민 조회 가능
CREATE POLICY "slot_highlights_member_select" ON slot_highlights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_members.tenant_id = slot_highlights.tenant_id
        AND tenant_members.user_id = auth.uid()
    )
    OR is_super_admin()
  );
