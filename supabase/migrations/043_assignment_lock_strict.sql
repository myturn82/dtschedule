-- 잠긴(hold) 배정 건은 그 누구도(슈퍼관리자 포함) 수정/삭제할 수 없도록 강화.
-- 잠금 해제(is_locked: true -> false)만 슈퍼관리자에게 허용하며, 해제 후에는 기존 권한 규칙대로 수정/삭제 가능.

CREATE OR REPLACE FUNCTION public.check_assignment_lock_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  new_no_lock assignments;
  old_no_lock assignments;
BEGIN
  IF OLD.is_locked THEN
    new_no_lock := NEW;
    old_no_lock := OLD;
    new_no_lock.is_locked := false;
    old_no_lock.is_locked := false;

    -- 잠긴 동안 잠금 여부 외 다른 필드 변경은 전면 차단
    IF new_no_lock IS DISTINCT FROM old_no_lock THEN
      RAISE EXCEPTION 'assignment is locked';
    END IF;

    -- 잠금 해제는 슈퍼관리자만 가능
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked AND NOT is_super_admin_caller() THEN
      RAISE EXCEPTION 'only super admin can unlock';
    END IF;

    RETURN NEW;
  END IF;

  -- 잠금 설정(false -> true)은 관리자 이상만 가능
  IF NEW.is_locked IS DISTINCT FROM OLD.is_locked
     AND NOT (is_tenant_admin(OLD.tenant_id) OR is_super_admin_caller()) THEN
    RAISE EXCEPTION 'only admins can change lock status';
  END IF;

  RETURN NEW;
END;
$$;

-- DELETE: 잠긴 행은 누구도 삭제 불가 (슈퍼관리자도 예외 없음)
CREATE OR REPLACE FUNCTION public.check_assignment_lock_delete()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF OLD.is_locked THEN
    RAISE EXCEPTION 'assignment is locked';
  END IF;
  RETURN OLD;
END;
$$;
