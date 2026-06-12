-- 날짜 단위 잠금: 월별 일괄 고정 시 해당 날짜의 미배정 슬롯도 함께 잠궈
-- 새 배정(등록) 자체를 차단한다. (기존 배정 건의 잠금/해제는 042/043에서 처리)
--
-- - 잠금/해제: 조직관리자 또는 슈퍼관리자 (date_overrides_admin_all 정책 재사용)
-- - 잠긴 날짜에는 그 누구도(관리자 포함) 새 배정을 추가할 수 없음 — 먼저 해제 필요

ALTER TABLE date_overrides ADD COLUMN is_locked boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_assignment_date_lock_insert()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM date_overrides
    WHERE tenant_id = NEW.tenant_id
      AND date = make_date(NEW.year, NEW.month, NEW.day)
      AND is_locked
  ) THEN
    RAISE EXCEPTION 'date is locked';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assignments_date_lock_insert
  BEFORE INSERT ON assignments
  FOR EACH ROW EXECUTE FUNCTION check_assignment_date_lock_insert();
