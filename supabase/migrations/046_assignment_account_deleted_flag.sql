-- 전체 회원탈퇴(계정 삭제) 후에도 예전에 등록했던 배정 건을 화면에서 "삭제됨"으로
-- 표시할 수 있도록 assignments.account_deleted 플래그를 추가한다.
--
-- assignments.user_id는 profiles(id)를 ON DELETE SET NULL로 참조하므로,
-- 계정이 삭제되면 해당 사용자의 배정 건은 user_id가 NULL로 바뀐다.
-- 이때 check_assignment_lock_update 트리거에서 account_deleted = true를 함께 기록해
-- 프런트엔드의 withdrawn(삭제됨) 표시 로직이 user_id 없이도 동작하도록 한다.
-- (동일 이메일로 재가입 시 새 계정은 새 user_id를 가지므로 이 플래그로 예전 항목과 구분된다.)

ALTER TABLE assignments ADD COLUMN account_deleted boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_assignment_lock_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
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

    -- 잠금 해제는 슈퍼관리자만 가능
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked AND NOT is_super_admin_caller() THEN
      RAISE EXCEPTION 'only super admin can unlock';
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
$$;
