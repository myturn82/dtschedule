-- assignments 잠금(hold) 기능
-- 관리자가 배정 건을 잠그면, 등록한 회원 본인/조직관리자 모두 수정·삭제 불가.
-- 슈퍼관리자만 잠긴 건을 수정·삭제·해제할 수 있다.

ALTER TABLE assignments ADD COLUMN is_locked boolean NOT NULL DEFAULT false;

-- UPDATE: 잠긴 행은 슈퍼관리자만 수정 가능, 잠금 상태 변경은 관리자 이상만 가능
CREATE OR REPLACE FUNCTION public.check_assignment_lock_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF OLD.is_locked AND NOT is_super_admin_caller() THEN
    RAISE EXCEPTION 'assignment is locked';
  END IF;
  IF NEW.is_locked IS DISTINCT FROM OLD.is_locked
     AND NOT (is_tenant_admin(OLD.tenant_id) OR is_super_admin_caller()) THEN
    RAISE EXCEPTION 'only admins can change lock status';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assignments_lock_update
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION check_assignment_lock_update();

-- DELETE: 잠긴 행은 슈퍼관리자만 삭제 가능
CREATE OR REPLACE FUNCTION public.check_assignment_lock_delete()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF OLD.is_locked AND NOT is_super_admin_caller() THEN
    RAISE EXCEPTION 'assignment is locked';
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_assignments_lock_delete
  BEFORE DELETE ON assignments
  FOR EACH ROW EXECUTE FUNCTION check_assignment_lock_delete();
