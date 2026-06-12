-- 030_rename_volunteer_columns.sql에서 unique_member_assignment 인덱스를 재생성할 때
-- 013_tenant_id_not_null.sql에서 추가했던 tenant_id가 누락되어,
-- 서로 다른 조직(tenant)에서 동일한 이름으로 같은 날짜/시간대에 등록하면
-- "duplicate key value violates unique constraint unique_member_assignment" 오류가 발생하던 문제를 수정.
DROP INDEX IF EXISTS unique_member_assignment;
CREATE UNIQUE INDEX unique_member_assignment
  ON assignments (tenant_id, year, month, day, time_slot, member_name)
  WHERE member_type != 'admin_note';
