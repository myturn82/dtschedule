ALTER TABLE tenant_roles
  ADD COLUMN IF NOT EXISTS indicator_bar boolean DEFAULT false;
