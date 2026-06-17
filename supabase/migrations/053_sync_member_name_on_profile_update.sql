-- 프로필 이름 변경 시 기존 배정(assignments)의 member_name을 동기화한다.
-- assignments.member_name은 배정 시점에 복사된 비정규화 컬럼이므로,
-- 관리자가 회원 이름을 수정하면 해당 user_id의 모든 배정 이름이 함께 갱신된다.

CREATE OR REPLACE FUNCTION public.sync_assignment_member_name()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE assignments
    SET member_name = NEW.name
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_name_sync
AFTER UPDATE OF name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_assignment_member_name();
