-- tenant_members에 is_approved 추가 (조직별 독립 승인)
ALTER TABLE tenant_members
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- 기존 회원은 소급 승인
UPDATE tenant_members SET is_approved = true;

-- profiles.is_approved는 더 이상 사용하지 않음 (tenant_members.is_approved로 대체)
-- 기존 데이터 정리: 모든 프로필 is_approved = true로 초기화 (이미 012에서 설정됨)
