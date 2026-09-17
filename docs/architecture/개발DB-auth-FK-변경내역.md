# 개발 DB auth.users FK 변경 내역 및 원복 절차

> 작성일: 2026-09-10  
> 관련 스크립트: `scripts/copy_tenant_to_dev.mjs` → `dropDevAuthFKs()`

---

## 왜 변경했는가

운영 DB의 실 데이터를 개발 DB로 복사할 때, 운영 `auth.users` 테이블의 행들은  
개발 DB `auth.users`에 존재하지 않는다(로그인 계정은 복사하지 않음).  
따라서 `profiles.id → auth.users(id)` 같은 FK 제약이 살아 있으면  
운영 profiles 행을 개발 DB에 삽입하는 순간 참조 무결성 위반 오류가 발생한다.

이 문제를 해결하기 위해 **개발 DB에서만** auth.users를 직접 참조하는 FK를 제거하고,  
PostgREST 관계 추론에 필요한 일부 FK를 profiles 직참조로 대체한다.

> 이 변경은 마이그레이션 파일에 포함되지 않으므로 **운영 DB 구조와 무관**하다.

---

## 변경 전(운영 DB 상태) vs 변경 후(개발 DB 상태)

### 제거된 FK

| 제약명 | 테이블 | 컬럼 | 원래 참조 대상 | 원래 삭제 정책 |
|--------|--------|------|----------------|----------------|
| `profiles_id_fkey` | `profiles` | `id` | `auth.users(id)` | `ON DELETE CASCADE` |
| `assignments_user_id_fkey` | `assignments` | `user_id` | `profiles(id)` | `ON DELETE SET NULL` |
| `tenant_members_user_id_fkey` | `tenant_members` | `user_id` | `profiles(id)` | `ON DELETE CASCADE` |
| `lesson_packages_user_id_fkey` | `lesson_packages` | `user_id` | `profiles(id)` | `ON DELETE SET NULL` |
| `lesson_packages_created_by_fkey` | `lesson_packages` | `created_by` | `profiles(id)` | `ON DELETE SET NULL` |
| `assignment_snapshots_created_by_fkey` | `assignment_snapshots` | `created_by` | `auth.users(id)` | `ON DELETE SET NULL` |

### 추가된 FK (개발 DB 전용)

| 제약명 | 테이블 | 컬럼 | 참조 대상 | 삭제 정책 | 추가 이유 |
|--------|--------|------|-----------|-----------|-----------|
| `tenant_members_user_id_profiles_fkey` | `tenant_members` | `user_id` | `profiles(id)` | `ON DELETE SET NULL` | PostgREST 관계 인식 |
| `assignments_user_id_profiles_fkey` | `assignments` | `user_id` | `profiles(id)` | `ON DELETE SET NULL` | PostgREST 관계 인식 |

> **운영 vs 개발 차이 요약**
> - `profiles.id`는 개발에서 auth.users 없이도 존재할 수 있다.
> - `tenant_members.user_id`는 개발에서 `ON DELETE CASCADE → SET NULL`로 완화됐다.
> - `assignment_snapshots.created_by`는 개발에서 완전히 무결성 없이 존재한다.

---

## 마이그레이션 파일 기준 원래 정의

각 제약의 출처가 되는 마이그레이션 파일:

```sql
-- 001_schema.sql
-- profiles.id → auth.users (CASCADE)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  ...
);

-- 011_tenants.sql
-- tenant_members.user_id → profiles (CASCADE, NOT NULL)
CREATE TABLE tenant_members (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ...
);

-- 026_assignments_user_id_nullable.sql
-- assignments.user_id → profiles (SET NULL)
ALTER TABLE assignments ADD CONSTRAINT assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 049_assignment_snapshots.sql
-- assignment_snapshots.created_by → auth.users (SET NULL)
CREATE TABLE assignment_snapshots (
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ...
);

-- 075_lesson_packages.sql
-- lesson_packages.user_id → profiles (SET NULL)
-- lesson_packages.created_by → profiles (SET NULL)
CREATE TABLE lesson_packages (
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ...
);
```

---

## 원복 절차 (개발 DB → 운영과 동일한 구조로 복원)

> **전제 조건**: 원복 전에 개발 DB의 데이터가 auth.users 행과 일치해야 한다.  
> 일치하지 않으면 FK 추가 시 참조 무결성 오류가 발생한다.  
> 데이터를 삭제하거나 NULL 처리 후 진행한다.

### Step 1 — 개발 전용 FK 제거

```sql
-- 개발에서만 추가한 profiles 직참조 FK 제거
ALTER TABLE tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_user_id_profiles_fkey;

ALTER TABLE assignments
  DROP CONSTRAINT IF EXISTS assignments_user_id_profiles_fkey;
```

### Step 2 — 원래 FK 복원

```sql
-- profiles.id → auth.users (CASCADE)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- assignments.user_id → profiles (SET NULL)
ALTER TABLE assignments
  ADD CONSTRAINT assignments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- tenant_members.user_id → profiles (CASCADE, NOT NULL은 컬럼 제약으로 별도 확인)
ALTER TABLE tenant_members
  ADD CONSTRAINT tenant_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- lesson_packages.user_id → profiles (SET NULL)
ALTER TABLE lesson_packages
  ADD CONSTRAINT lesson_packages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- lesson_packages.created_by → profiles (SET NULL)
ALTER TABLE lesson_packages
  ADD CONSTRAINT lesson_packages_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- assignment_snapshots.created_by → auth.users (SET NULL)
ALTER TABLE assignment_snapshots
  ADD CONSTRAINT assignment_snapshots_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

### Step 3 — 복원 확인

아래 쿼리로 제약 목록을 확인한다:

```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.table_name  AS foreign_table,
  ccu.column_name AS foreign_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'profiles', 'assignments', 'tenant_members',
    'lesson_packages', 'assignment_snapshots'
  )
ORDER BY tc.table_name, tc.constraint_name;
```

**기대 결과** (운영 DB 구조):

| table_name | constraint_name | foreign_table | delete_rule |
|------------|-----------------|---------------|-------------|
| `assignment_snapshots` | `assignment_snapshots_created_by_fkey` | `users` | `SET NULL` |
| `assignments` | `assignments_user_id_fkey` | `profiles` | `SET NULL` |
| `lesson_packages` | `lesson_packages_created_by_fkey` | `profiles` | `SET NULL` |
| `lesson_packages` | `lesson_packages_user_id_fkey` | `profiles` | `SET NULL` |
| `profiles` | `profiles_id_fkey` | `users` | `CASCADE` |
| `tenant_members` | `tenant_members_user_id_fkey` | `profiles` | `CASCADE` |

---

## 데이터 정리가 필요한 경우

원복 전에 auth.users에 없는 user_id를 가진 행이 있으면 FK 추가가 실패한다.  
다음 SQL로 고아(orphan) 행을 사전 정리한다:

```sql
-- profiles 중 auth.users에 없는 행 확인
SELECT id FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- assignment_snapshots.created_by 중 auth.users에 없는 값 NULL 처리
UPDATE assignment_snapshots
SET created_by = NULL
WHERE created_by IS NOT NULL
  AND created_by NOT IN (SELECT id FROM auth.users);

-- profiles 고아 행 삭제 (cascade로 연결된 하위 행도 함께 삭제됨)
-- ⚠️ 실제 데이터 삭제 전 반드시 확인
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);
```

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `scripts/copy_tenant_to_dev.mjs` | 운영→개발 복사 + FK 변경 자동 실행 (`dropDevAuthFKs`) |
| `supabase/migrations/001_schema.sql` | `profiles_id_fkey` 원래 정의 |
| `supabase/migrations/011_tenants.sql` | `tenant_members_user_id_fkey` 원래 정의 |
| `supabase/migrations/026_assignments_user_id_nullable.sql` | `assignments_user_id_fkey` 원래 정의 |
| `supabase/migrations/049_assignment_snapshots.sql` | `assignment_snapshots_created_by_fkey` 원래 정의 |
| `supabase/migrations/075_lesson_packages.sql` | `lesson_packages_*_fkey` 원래 정의 |
