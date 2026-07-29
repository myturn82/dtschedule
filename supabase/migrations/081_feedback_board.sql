-- supabase/migrations/081_feedback_board.sql
-- 자체 피드백 게시판: 회원/조직관리자 → 시스템관리자 또는 조직관리자에게 문의를 등록하고 답변받는 기능.
-- 외부 Tally 폼을 대체한다.

-- ── 1. feedback_posts (문의 글) ───────────────────────────────────────────
CREATE TABLE feedback_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_name  text,
  author_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_name  text NOT NULL,
  author_email text,
  category     text NOT NULL CHECK (category IN ('inquiry', 'bug', 'feature')),
  target_type  text NOT NULL CHECK (target_type IN ('system', 'org_admin')),
  title        text NOT NULL,
  content      text NOT NULL,
  attachments  text[] NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_posts_tenant   ON feedback_posts(tenant_id);
CREATE INDEX idx_feedback_posts_target   ON feedback_posts(target_type, status);
CREATE INDEX idx_feedback_posts_author   ON feedback_posts(author_id);

-- ── 2. feedback_replies (답변/추가 문의) ──────────────────────────────────
CREATE TABLE feedback_replies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES feedback_posts(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_role text NOT NULL DEFAULT 'author' CHECK (author_role IN ('system_admin', 'org_admin', 'author')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_replies_post ON feedback_replies(post_id);

-- ── 3. feedback_posts BEFORE INSERT: target_type·tenant_name 서버 결정 ────
-- category(단순문의→조직관리자, 오류/기능개선→시스템관리자)로 target_type을 서버가 강제하고,
-- tenant_name은 스냅샷으로 저장해 이후 조직명이 바뀌거나 삭제돼도 문의 이력이 남는다.
CREATE OR REPLACE FUNCTION public.set_feedback_post_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.target_type := CASE WHEN NEW.category = 'inquiry' THEN 'org_admin' ELSE 'system' END;
  SELECT name INTO NEW.tenant_name FROM tenants WHERE id = NEW.tenant_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feedback_post_before_insert
  BEFORE INSERT ON feedback_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_feedback_post_defaults();

-- ── 4. feedback_replies BEFORE INSERT: author_role 서버 결정 ──────────────
-- 클라이언트가 보낸 role을 신뢰하지 않고, 실제 호출자가 글쓴이 본인인지/슈퍼관리자인지/
-- 조직관리자인지를 서버에서 판정해 덮어쓴다.
CREATE OR REPLACE FUNCTION public.set_feedback_reply_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author uuid;
BEGIN
  SELECT author_id INTO v_post_author FROM feedback_posts WHERE id = NEW.post_id;

  IF v_post_author = NEW.author_id THEN
    NEW.author_role := 'author';
  ELSIF public.is_super_admin_caller() THEN
    NEW.author_role := 'system_admin';
  ELSE
    NEW.author_role := 'org_admin';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feedback_reply_before_insert
  BEFORE INSERT ON feedback_replies
  FOR EACH ROW EXECUTE FUNCTION public.set_feedback_reply_role();

-- ── 5. feedback_replies AFTER INSERT: 상태 갱신 + 작성자 알림 ─────────────
-- 관리자가 답변하면 답변완료 처리 + 글쓴이에게 기존 notifications로 알림.
-- 글쓴이가 추가 문의를 남기면 다시 담당자 응대 대기(open) 상태로 되돌린다.
CREATE OR REPLACE FUNCTION public.handle_feedback_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post RECORD;
BEGIN
  SELECT * INTO v_post FROM feedback_posts WHERE id = NEW.post_id;

  IF NEW.author_role = 'author' THEN
    UPDATE feedback_posts SET status = 'open', updated_at = now() WHERE id = NEW.post_id;
  ELSE
    UPDATE feedback_posts SET status = 'answered', updated_at = now() WHERE id = NEW.post_id;

    IF v_post.author_id IS NOT NULL AND v_post.author_id <> NEW.author_id THEN
      INSERT INTO notifications (tenant_id, user_id, title, body, type, metadata)
      VALUES (
        v_post.tenant_id,
        v_post.author_id,
        '💬 문의에 답변이 등록됐습니다',
        left(NEW.content, 120),
        'feedback_reply',
        jsonb_build_object('feedback_post_id', NEW.post_id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feedback_reply_after_insert
  AFTER INSERT ON feedback_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_feedback_reply();

-- ── 6. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE feedback_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_posts_select" ON feedback_posts FOR SELECT
USING (
  author_id = auth.uid()
  OR public.is_super_admin_caller()
  OR (
    target_type = 'org_admin'
    AND EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = feedback_posts.tenant_id
        AND tm.user_id = auth.uid() AND tm.role = 'admin' AND tm.is_approved = true
    )
  )
);

CREATE POLICY "feedback_posts_insert" ON feedback_posts FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = feedback_posts.tenant_id AND tm.user_id = auth.uid() AND tm.is_approved = true
  )
);

CREATE POLICY "feedback_posts_update" ON feedback_posts FOR UPDATE
USING (
  author_id = auth.uid()
  OR public.is_super_admin_caller()
  OR (
    target_type = 'org_admin'
    AND EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = feedback_posts.tenant_id
        AND tm.user_id = auth.uid() AND tm.role = 'admin' AND tm.is_approved = true
    )
  )
);

CREATE POLICY "feedback_replies_select" ON feedback_replies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM feedback_posts fp
    WHERE fp.id = feedback_replies.post_id
      AND (
        fp.author_id = auth.uid()
        OR public.is_super_admin_caller()
        OR (
          fp.target_type = 'org_admin'
          AND EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = fp.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin' AND tm.is_approved = true
          )
        )
      )
  )
);

CREATE POLICY "feedback_replies_insert" ON feedback_replies FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM feedback_posts fp
    WHERE fp.id = feedback_replies.post_id
      AND (
        fp.author_id = auth.uid()
        OR public.is_super_admin_caller()
        OR (
          fp.target_type = 'org_admin'
          AND EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = fp.tenant_id AND tm.user_id = auth.uid() AND tm.role = 'admin' AND tm.is_approved = true
          )
        )
      )
  )
);

-- ── 7. Storage 버킷 (첨부파일) ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "authenticated_upload_feedback_attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-attachments'
    AND EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.tenant_id::text = (storage.foldername(name))[1]
      AND tm.is_approved = true
    )
  );

CREATE POLICY "public_read_feedback_attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feedback-attachments');
