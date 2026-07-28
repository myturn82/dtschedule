-- 079_slot_settings_default_unlimited.sql
-- slot_settings.max_capacity 컬럼 DB 기본값을 2 -> 0(무제한)으로 변경
--
-- 앱 코드(DEFAULT_MAX_CAPACITY)는 이미 0을 "인원 제한 없음"으로 처리하도록 수정했다.
-- slot_settings 행이 아예 없는 시간대는 이 앱 레벨 기본값을 그대로 따르므로,
-- 조직이 "인원 설정"에서 명시적으로 값을 입력하지 않는 한 항상 무제한으로 동작한다.
-- 이 마이그레이션은 컬럼 DEFAULT만 맞추는 스키마 변경이며, 기존에 관리자가 이미
-- 저장해 둔 slot_settings 행(명시적으로 설정한 인원수)은 건드리지 않는다.

ALTER TABLE public.slot_settings ALTER COLUMN max_capacity SET DEFAULT 0;
