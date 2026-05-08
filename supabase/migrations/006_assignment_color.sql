-- 006_assignment_color.sql
-- 50플러스 봉사자 셀 색상 저장
alter table assignments add column if not exists color text;
