-- 049_assignment_snapshots.sql
-- 스케줄 초기화 전 스냅샷 저장 테이블

CREATE TABLE assignment_snapshots (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  year           INT         NOT NULL,
  month          INT         NOT NULL CHECK (month BETWEEN 1 AND 12),
  scope          TEXT        NOT NULL CHECK (scope IN ('month', 'week', 'day')),
  days           INT[],
  snapshot_data  JSONB       NOT NULL,
  deleted_count  INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_assignment_snapshots_lookup
  ON assignment_snapshots(tenant_id, year, month, created_at DESC);

ALTER TABLE assignment_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_admin_all"
  ON assignment_snapshots FOR ALL
  USING  (is_tenant_admin(tenant_id) OR is_super_admin())
  WITH CHECK (is_tenant_admin(tenant_id) OR is_super_admin());
