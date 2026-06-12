-- 회원 탈퇴(계정 삭제) 시 assignments.user_id가 ON DELETE SET NULL로 NULL이 되는데,
-- 잠긴(hold) 배정 건에 대해 check_assignment_lock_update 트리거가 이 변경도 차단하여
-- auth.admin.deleteUser()가 실패하던 문제 수정.
-- user_id가 NULL로 바뀌는 경우(계정 삭제로 인한 FK ON DELETE SET NULL cascade)는
-- 잠금 검사에서 예외로 허용한다. 그 외 필드 변경은 기존과 동일하게 전면 차단.

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

    -- 계정 삭제로 인한 user_id -> NULL 변경(FK ON DELETE SET NULL)은 허용
    IF NEW.user_id IS NULL AND OLD.user_id IS NOT NULL THEN
      new_no_lock.user_id := old_no_lock.user_id;
    END IF;

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
