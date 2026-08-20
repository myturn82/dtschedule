-- 개별 배정 잠금 해제 권한을 슈퍼관리자에서 테넌트 관리자까지 확대한다.
-- 기존: 슈퍼관리자만 is_locked true → false 가능
-- 변경: 테넌트 관리자(is_tenant_admin) 또는 슈퍼관리자 모두 가능

CREATE OR REPLACE FUNCTION public.check_assignment_lock_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $func$
DECLARE
  new_cmp assignments;
  old_cmp assignments;
  account_deleted_now boolean;
BEGIN
  account_deleted_now := (NEW.user_id IS NULL AND OLD.user_id IS NOT NULL);

  IF OLD.is_locked THEN
    new_cmp := NEW;
    old_cmp := OLD;
    new_cmp.is_locked := false;
    old_cmp.is_locked := false;

    -- 계정 삭제로 인한 user_id -> NULL 변경 및 account_deleted 플래그 설정은 허용
    IF account_deleted_now THEN
      new_cmp.user_id := old_cmp.user_id;
      new_cmp.account_deleted := old_cmp.account_deleted;
    END IF;

    -- 잠긴 동안 잠금 여부 외 다른 필드 변경은 전면 차단
    IF new_cmp IS DISTINCT FROM old_cmp THEN
      RAISE EXCEPTION 'assignment is locked';
    END IF;

    -- 잠금 해제는 테넌트 관리자 이상만 가능
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked
       AND NOT (is_tenant_admin(OLD.tenant_id) OR is_super_admin_caller()) THEN
      RAISE EXCEPTION 'only admins can unlock';
    END IF;
  ELSE
    -- 잠금 설정(false -> true)은 관리자 이상만 가능
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked
       AND NOT (is_tenant_admin(OLD.tenant_id) OR is_super_admin_caller()) THEN
      RAISE EXCEPTION 'only admins can change lock status';
    END IF;
  END IF;

  IF account_deleted_now THEN
    NEW.account_deleted := true;
  END IF;

  RETURN NEW;
END;
$func$;
