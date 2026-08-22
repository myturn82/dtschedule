-- FCM 푸시 토큰 저장 테이블
-- 앱 설치 기기의 FCM 토큰을 user_id 별로 관리한다.
-- 여러 기기 로그인을 지원하기 위해 user_id + token 복합 유니크.

CREATE TABLE IF NOT EXISTS push_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text        NOT NULL,
  platform    text        NOT NULL DEFAULT 'android',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 토큰만 관리
DROP POLICY IF EXISTS "push_tokens_user_self" ON push_tokens;
CREATE POLICY "push_tokens_user_self" ON push_tokens
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 서비스 롤(Edge Function)은 전체 접근
DROP POLICY IF EXISTS "push_tokens_service_role" ON push_tokens;
CREATE POLICY "push_tokens_service_role" ON push_tokens
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_push_tokens_updated_at();
