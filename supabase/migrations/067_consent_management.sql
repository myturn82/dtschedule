-- 067_consent_management.sql
-- 동의 버전 관리 + 동의 이력 테이블 + 추가 동의 컬럼
-- 개인정보 보호법 제15조(수집·이용 동의), 제22조(동의 방법)

-- ── 약관 버전 테이블 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.policy_versions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type         text        NOT NULL
                           CHECK (type IN ('terms', 'privacy', 'marketing', 'push')),
  version      text        NOT NULL,          -- 예: '2026-07-01'
  content_url  text,                          -- 약관 전문 URL (선택)
  effective_at timestamptz NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL,
  UNIQUE (type, version)
);

ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

-- 모든 인증 사용자가 약관 버전 목록 조회 가능 (동의 화면 표시용)
CREATE POLICY "policy_versions_select_all" ON public.policy_versions
  FOR SELECT USING (true);

-- 슈퍼어드민만 생성/수정
CREATE POLICY "policy_versions_superadmin" ON public.policy_versions
  FOR ALL USING (public.is_super_admin_caller());

-- ── 동의 이력 테이블 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type        text        NOT NULL
                          CHECK (type IN ('terms', 'privacy', 'marketing', 'push')),
  version_id  uuid        REFERENCES public.policy_versions(id),  -- NULL 허용: 버전 미관리 시기
  agreed      boolean     NOT NULL,    -- true=동의, false=철회
  agreed_at   timestamptz DEFAULT now() NOT NULL,
  ip_address  text,                    -- 법적 증거용 (필요 시 암호화 적용)
  user_agent  text
);

CREATE INDEX IF NOT EXISTS idx_consent_logs_user_type
  ON public.consent_logs(user_id, type, agreed_at DESC);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- 본인 동의 이력만 조회
CREATE POLICY "consent_own_select" ON public.consent_logs
  FOR SELECT USING (user_id = auth.uid());

-- 본인 동의 기록 추가 (철회 포함)
CREATE POLICY "consent_own_insert" ON public.consent_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 슈퍼어드민 전체 조회 (법적 분쟁 시 근거 확인용)
CREATE POLICY "consent_superadmin" ON public.consent_logs
  FOR ALL USING (public.is_super_admin_caller());

-- ── profiles 추가 동의 컬럼 ───────────────────────────────────────────────────
-- (빠른 조회용 캐시 컬럼 – consent_logs가 원본, 이 컬럼은 최신 상태만 반영)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_agreed_at timestamptz,  -- 마케팅 동의 시점 (NULL=미동의)
  ADD COLUMN IF NOT EXISTS push_agreed_at      timestamptz,  -- 푸시알림 동의 시점
  ADD COLUMN IF NOT EXISTS phone_agreed_at     timestamptz;  -- 전화번호 수집 동의 시점

-- ── 기존 사용자 동의 이력 백필 ───────────────────────────────────────────────
-- terms_agreed_at, privacy_agreed_at 기준으로 consent_logs에 초기 기록 삽입
-- (버전 미관리 시기이므로 version_id = NULL)
INSERT INTO public.consent_logs (user_id, type, agreed, agreed_at)
  SELECT id, 'terms', true, terms_agreed_at
  FROM public.profiles
  WHERE terms_agreed_at IS NOT NULL;

INSERT INTO public.consent_logs (user_id, type, agreed, agreed_at)
  SELECT id, 'privacy', true, privacy_agreed_at
  FROM public.profiles
  WHERE privacy_agreed_at IS NOT NULL;
