-- 1. orphan tenants 제거 (customer_id IS NULL인 행)
DELETE FROM tenants WHERE customer_id IS NULL;

-- 2. customer_id NOT NULL 제약 추가
ALTER TABLE tenants ALTER COLUMN customer_id SET NOT NULL;

-- 3. FK ON DELETE SET NULL → CASCADE 변경
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_customer_id_fkey;
ALTER TABLE tenants ADD CONSTRAINT tenants_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- 4. customers.deletion_requested_at 컬럼 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

-- 5. is_active 변경 시 소속 tenants에 cascade 적용하는 트리거
CREATE OR REPLACE FUNCTION cascade_customer_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE tenants SET is_active = false WHERE customer_id = NEW.id;
  END IF;
  IF NEW.is_active = true AND OLD.is_active = false THEN
    UPDATE tenants SET is_active = true WHERE customer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cascade_customer_soft_delete ON customers;
CREATE TRIGGER trg_cascade_customer_soft_delete
  AFTER UPDATE OF is_active ON customers
  FOR EACH ROW EXECUTE FUNCTION cascade_customer_soft_delete();
