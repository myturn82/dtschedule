-- 065_anonymize_on_delete.sql
-- 회원 탈퇴(profiles DELETE) 시 개인정보 익명화 트리거
--
-- 동작: auth.users 삭제 → profiles CASCADE 삭제 → 이 트리거 실행
--   1. assignments.member_name → '탈퇴회원', user_id → NULL, note → NULL, account_deleted → true
--   2. customers.owner_user_id → NULL (레코드는 사업 기록으로 보존)
--
-- 안전성: BEFORE DELETE 트리거이므로 기존 데이터 변경 없음.
--          탈퇴 이벤트 발생 시점부터만 동작.

CREATE OR REPLACE FUNCTION public.anonymize_user_data_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. assignments: 이름·노트 익명화, user_id 해제, 탈퇴 플래그 설정
  UPDATE public.assignments
  SET
    member_name     = '탈퇴회원',
    note            = NULL,
    user_id         = NULL,
    account_deleted = true
  WHERE user_id = OLD.id;

  -- 2. customers: 소유자 참조 제거 (계정·결제 기록 자체는 보존)
  UPDATE public.customers
  SET owner_user_id = NULL
  WHERE owner_user_id = OLD.id;

  RETURN OLD;
END;
$$;

-- profiles BEFORE DELETE 에 연결 (이미 있으면 교체)
DROP TRIGGER IF EXISTS trg_anonymize_on_user_delete ON public.profiles;
CREATE TRIGGER trg_anonymize_on_user_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_user_data_on_delete();

COMMENT ON FUNCTION public.anonymize_user_data_on_delete() IS
  '개인정보 보호법 제21조 – 회원 탈퇴 시 개인정보 즉시 익명화';
