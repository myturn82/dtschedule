-- 075_lesson_packages.sql
-- 레슨권 패키지 관리 기능
-- 1. lesson_package_types: 레슨 종류 템플릿 (테넌트별)
-- 2. lesson_packages: 결제 기록
-- 3. assignments.lesson_package_id FK 추가

-- ── 1. 레슨 종류 템플릿 ────────────────────────────────────────────────────────
CREATE TABLE public.lesson_package_types (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  session_count int  NOT NULL CHECK (session_count > 0),
  validity_days int  CHECK (validity_days IS NULL OR validity_days > 0),
  is_active     boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. 결제 기록 ──────────────────────────────────────────────────────────────
CREATE TABLE public.lesson_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  package_type_id uuid REFERENCES public.lesson_package_types(id) ON DELETE SET NULL,
  package_name    text NOT NULL,
  total_sessions  int  NOT NULL CHECK (total_sessions > 0),
  payment_date    date NOT NULL,
  expires_at      date,
  notes           text,
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 3. assignments에 FK 추가 ──────────────────────────────────────────────────
ALTER TABLE public.assignments
  ADD COLUMN lesson_package_id uuid REFERENCES public.lesson_packages(id) ON DELETE SET NULL;

-- ── 인덱스 ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_lesson_package_types_tenant ON public.lesson_package_types(tenant_id);
CREATE INDEX idx_lesson_packages_tenant      ON public.lesson_packages(tenant_id);
CREATE INDEX idx_lesson_packages_user        ON public.lesson_packages(user_id);
CREATE INDEX idx_assignments_lesson_pkg      ON public.assignments(lesson_package_id)
  WHERE lesson_package_id IS NOT NULL;

-- ── Realtime ─────────────────────────────────────────────────────────────────
ALTER TABLE public.lesson_package_types REPLICA IDENTITY FULL;
ALTER TABLE public.lesson_packages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_package_types;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lesson_packages;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.lesson_package_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_packages ENABLE ROW LEVEL SECURITY;

-- lesson_package_types: 테넌트 멤버는 읽기, 어드민은 쓰기
CREATE POLICY "lesson_package_types_select"
  ON public.lesson_package_types FOR SELECT
  USING (is_tenant_member(tenant_id));

CREATE POLICY "lesson_package_types_insert"
  ON public.lesson_package_types FOR INSERT
  WITH CHECK (is_tenant_admin(tenant_id));

CREATE POLICY "lesson_package_types_update"
  ON public.lesson_package_types FOR UPDATE
  USING (is_tenant_admin(tenant_id))
  WITH CHECK (is_tenant_admin(tenant_id));

CREATE POLICY "lesson_package_types_delete"
  ON public.lesson_package_types FOR DELETE
  USING (is_tenant_admin(tenant_id));

-- lesson_packages: 어드민 전체, 멤버 본인 것만 읽기 / 어드민 쓰기
CREATE POLICY "lesson_packages_select"
  ON public.lesson_packages FOR SELECT
  USING (
    is_tenant_admin(tenant_id) OR
    (is_tenant_member(tenant_id) AND user_id = auth.uid())
  );

CREATE POLICY "lesson_packages_insert"
  ON public.lesson_packages FOR INSERT
  WITH CHECK (is_tenant_admin(tenant_id));

CREATE POLICY "lesson_packages_update"
  ON public.lesson_packages FOR UPDATE
  USING (is_tenant_admin(tenant_id))
  WITH CHECK (is_tenant_admin(tenant_id));

CREATE POLICY "lesson_packages_delete"
  ON public.lesson_packages FOR DELETE
  USING (is_tenant_admin(tenant_id));
