-- 결제권에 "시스템 도입 전 이미 사용한 횟수" 오프셋 컬럼 추가
-- remaining = total_sessions - initial_used_sessions - COUNT(actual assignments)
ALTER TABLE lesson_packages
  ADD COLUMN IF NOT EXISTS initial_used_sessions INT NOT NULL DEFAULT 0;
