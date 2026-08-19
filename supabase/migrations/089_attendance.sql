-- 출석 체크: assignments 테이블에 attended_at 컬럼 추가
-- 관리자가 회원의 출석 여부를 기록할 수 있도록 시간 저장

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS attended_at timestamptz DEFAULT NULL;

-- 주석: 기존 "assignments_update_own_or_admin" RLS 정책(migration 014)이
-- 관리자의 모든 컬럼 UPDATE를 이미 허용하므로 별도 정책 불필요
