-- 조직 유입 버티컬 출처 기록
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS source_vertical text;
