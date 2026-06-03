-- 조직 소프트 삭제 지원: is_active 컬럼 추가
alter table tenants add column if not exists is_active boolean not null default true;

-- 기존 SELECT 정책 제거 후 is_active 필터 적용
-- 슈퍼어드민은 비활성 조직도 조회 가능, 일반 사용자는 활성 조직만 조회
drop policy if exists "tenants_read_all" on tenants;
drop policy if exists "tenants_select" on tenants;

create policy "tenants_select" on tenants for select
  using (is_active = true or is_super_admin_caller());

-- 슈퍼어드민만 is_active 변경 가능 (기존 update 정책은 유지)
