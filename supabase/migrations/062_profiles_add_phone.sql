-- profiles 테이블에 phone 컬럼 추가 (061에서 handle_new_user가 참조하지만 컬럼이 누락되어 있었음)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
