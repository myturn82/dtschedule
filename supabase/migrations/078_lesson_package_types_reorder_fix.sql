-- 078_lesson_package_types_reorder_fix.sql
-- lesson_package_types.display_order 중복 데이터 정리
--
-- 레슨 종류 추가 시 display_order를 배열 길이(packageTypes.length)로 설정하던 버그로,
-- 종류를 삭제한 뒤 다시 추가하면 기존 항목과 display_order가 중복될 수 있었다.
-- 중복된 display_order가 있으면 정렬이 꼬여 순서 변경(▲▼) 버튼을 눌러도
-- 화면 순서가 바뀌지 않는 항목이 생긴다 (예: 램프팩토리 조직의 "그룹레슨-4회").
--
-- 테넌트별로 기존 순서(display_order, created_at 기준)를 유지한 채
-- 0부터 중복 없이 재부여한다. 클라이언트 코드는 이후 max(display_order)+1로
-- 신규 항목을 추가하도록 별도 수정됨.

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY display_order, created_at) - 1 AS new_order
  FROM public.lesson_package_types
)
UPDATE public.lesson_package_types t
SET display_order = r.new_order
FROM ranked r
WHERE t.id = r.id AND t.display_order != r.new_order;
