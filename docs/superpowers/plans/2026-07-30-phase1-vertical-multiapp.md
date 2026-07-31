# Phase 1 버티컬 멀티앱 기반 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 코드베이스에서 7개 버티컬 앱(LESSON:ON 등)을 운영할 수 있는 기반 레이어(feature_flags, 플랜 게이트, 버티컬 프리셋, 브랜드 설정, 랜딩페이지)를 구현한다.

**Architecture:** `featureFlags.ts`·`verticalPresets.ts`·`brandConfig.ts` 3개 lib 파일이 핵심 데이터 레이어를 담당하며, 모든 버티컬별 차이는 이 파일들의 상수/함수로만 표현한다. DB는 기존 `tenants.settings` JSONB에 `feature_flags` 키를 추가하고, `plan_limits` 테이블에 멤버·레슨권·SMS 한도 컬럼을 ALTER로 추가한다.

**Tech Stack:** React 18, TypeScript, Supabase (PostgreSQL + RLS), Vite + vite-plugin-pwa, react-router-dom v6

## Global Constraints

- **하드코딩 금지:** 버티컬 식별자(`if vertical === 'lesson-sports'`)를 소스에 직접 쓰지 않는다. 모든 차이는 `VERTICAL_PRESETS` 맵에 데이터로 등록한다.
- **`getFF()` 필수:** feature_flags 확인은 반드시 `getFF(ff, key)` 함수를 통한다. `flags?.key` 직접 접근 금지.
- **`useTenantPlan` 명칭:** 설계서 초안의 `usePlanLimits`는 이미 `PlanLimitsContext.tsx`가 사용 중(고객 빌링 플랜 용). 테넌트 레벨 훅은 `useTenantPlan`으로 명명한다.
- **plan 값:** 기존 DB가 `'basic' | 'pro' | 'business'`를 사용 중. 이번 마이그레이션에서 'free'로 rename하지 않고 'basic'을 무료 티어로 유지한다.
- **마이그레이션 번호:** 다음 번호는 `084`. 순서: 084(feature_flags 코멘트) → 085(plan_limits ALTER).
- **타입 체크:** `npm run build` (= `tsc -b && vite build`)로 확인. `npx tsc --noEmit`은 검사를 수행하지 않으므로 사용 금지.
- **DB 적용 순서:** 개발 DB → 검증 → 사용자 승인 후 운영 DB. 운영 DB 직접 수정 절대 금지.
- **개발 DB project-ref:** `mcuszdvophmqrwostcah`
- **supabase/reset_db.sql, reset_data.sql:** 마이그레이션 완료 후 반드시 갱신.

---

## 파일 구조

### 신규 생성
```
src/lib/featureFlags.ts          ← FeatureFlags 인터페이스 + getFF() 함수
src/lib/verticalPresets.ts       ← VERTICAL_PRESETS 맵 + getPresetFromParam()
src/lib/brandConfig.ts           ← BRAND 상수 (env var 래퍼)
src/hooks/useTenantPlan.ts       ← useTenantPlan() + isAtLimit() + isNearLimit()
src/pages/landing/LandingLayout.tsx   ← 공통 랜딩 레이아웃
src/pages/landing/LandingLessonOn.tsx ← LESSON:ON 랜딩
src/pages/landing/LandingShiftOn.tsx  ← SHIFT:ON 랜딩
src/pages/landing/LandingServeOn.tsx  ← SERVE:ON 랜딩
supabase/migrations/084_feature_flags.sql
supabase/migrations/085_plan_limits.sql
.env.lesson-on
.env.shift-on
.env.serve-on
```

### 수정
```
src/types/index.ts               ← TenantSettings에 feature_flags 추가, PlanType·PlanLimits 확장
src/contexts/TenantContext.tsx   ← tenantPlan 노출 (이미 있음, 확인 필요)
src/pages/AdminPage.tsx          ← OrgDrawer에 feature_flags 토글 UI 추가
src/pages/SetupWizardPage.tsx    ← vertical URL 파라미터 읽어 프리셋 자동 적용
src/App.tsx                      ← BRAND.vertical 기반 랜딩 라우팅
vite.config.ts                   ← PWA manifest env var 연동
package.json                     ← build:lesson-on / build:shift-on / build:serve-on 스크립트 추가
supabase/reset_db.sql            ← 마이그레이션 반영
supabase/reset_data.sql          ← 마이그레이션 반영
```

---

## Task 1: featureFlags.ts + 타입 확장

**Files:**
- Create: `src/lib/featureFlags.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces:
  - `FeatureFlags` 인터페이스 (다른 모든 태스크가 import)
  - `getFF(flags, key): boolean` 함수

- [ ] **Step 1: featureFlags.ts 파일 작성**

```ts
// src/lib/featureFlags.ts
export interface FeatureFlags {
  lesson_packages?:  boolean  // 레슨권/수강권 기능 (기본 true)
  autoassign?:       boolean  // 자동 배정 (기본 true)
  notifications?:    boolean  // D-1 알림 (기본 true)
  attendance?:       boolean  // 출석 체크 (기본 false)
  volunteer_hours?:  boolean  // 봉사/근무 시간 집계 (기본 false)
  care_mapping?:     boolean  // 담당자-케어 대상 매핑 (기본 false)
  public_booking?:   boolean  // 고객용 예약 링크 (기본 false)
  calendar_sync?:    boolean  // Google Calendar 연동 (기본 false)
}

const DEFAULT_FLAGS: Record<keyof FeatureFlags, boolean> = {
  lesson_packages: true,
  autoassign:      true,
  notifications:   true,
  attendance:      false,
  volunteer_hours: false,
  care_mapping:    false,
  public_booking:  false,
  calendar_sync:   false,
}

// undefined는 기본값(DEFAULT_FLAGS)으로 처리 — 기존 조직 하위 호환
export function getFF(
  flags: FeatureFlags | undefined | null,
  key: keyof FeatureFlags,
): boolean {
  if (!flags) return DEFAULT_FLAGS[key]
  const val = flags[key]
  return val === undefined ? DEFAULT_FLAGS[key] : val
}
```

- [ ] **Step 2: TenantSettings에 feature_flags 필드 추가**

`src/types/index.ts`의 `TenantSettings` 인터페이스 마지막에 추가:

```ts
// src/types/index.ts — TenantSettings 인터페이스 내부 끝에 추가
import type { FeatureFlags } from '../lib/featureFlags'

// TenantSettings 내부:
  feature_flags?: FeatureFlags;
```

> **주의:** `import type { FeatureFlags }` 구문을 파일 상단 import 블록에 추가하고, `TenantSettings` 인터페이스 본문 끝(`hidden_days` 다음 줄)에 `feature_flags?: FeatureFlags;`를 넣는다.

- [ ] **Step 3: 타입 체크 통과 확인**

```powershell
cd D:\claudePrj\dtschedule
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

빌드 에러 없으면 통과.

- [ ] **Step 4: 마이그레이션 084 작성 (코멘트 전용)**

```sql
-- supabase/migrations/084_feature_flags.sql
-- feature_flags는 tenants.settings JSONB 안의 키로 관리한다.
-- 별도 테이블 변경 없이 코드 레이어에서만 처리.
-- 하위 호환: feature_flags 키가 없는 기존 조직은 featureFlags.ts의 DEFAULT_FLAGS 값으로 동작.

COMMENT ON COLUMN tenants.settings IS
  'JSONB 설정. feature_flags 키 포함: { lesson_packages, autoassign, notifications, attendance, volunteer_hours, care_mapping, public_booking, calendar_sync }';
```

- [ ] **Step 5: 마이그레이션 개발 DB 반영**

```powershell
npx supabase db push --project-ref mcuszdvophmqrwostcah
```

성공 메시지 확인.

- [ ] **Step 6: 커밋**

```powershell
git add src/lib/featureFlags.ts src/types/index.ts supabase/migrations/084_feature_flags.sql
git commit -m "feat: add FeatureFlags interface, getFF() helper, and migration 084"
```

---

## Task 2: plan_limits ALTER + useTenantPlan 훅 + migration 085

**Files:**
- Create: `supabase/migrations/085_plan_limits.sql`
- Create: `src/hooks/useTenantPlan.ts`

**Interfaces:**
- Consumes: `PlanType` from `src/types/index.ts`
- Produces:
  - `useTenantPlan(): TenantPlanInfo` — `{ plan, maxMembers, maxLessonTypes, smsMonthly, hasAds }`
  - `isAtLimit(current: number, max: number): boolean`
  - `isNearLimit(current: number, max: number): boolean`

> **배경:** 기존 `plan_limits` 테이블(migration 037)은 고객 빌링 플랜용(`max_orgs`, `max_users`)이다. 이번 마이그레이션에서 테넌트별 기능 게이팅 컬럼(`max_members`, `max_lesson_types`, `sms_monthly`, `has_ads`)을 추가하고, `tenants` 테이블에 `plan` 컬럼을 붙인다. 플랜 이름('basic' | 'pro' | 'business')은 기존 값을 유지한다.

- [ ] **Step 1: 마이그레이션 085 작성**

```sql
-- supabase/migrations/085_plan_limits.sql
-- plan_limits 테이블에 테넌트 기능 게이팅 컬럼 추가
-- 기존 plan 값('basic'|'pro'|'business') 및 max_orgs/max_users 유지

ALTER TABLE plan_limits
  ADD COLUMN IF NOT EXISTS max_members      INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_lesson_types INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS sms_monthly      INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS has_ads          BOOLEAN NOT NULL DEFAULT true;

-- 기존 플랜 데이터 업데이트
UPDATE plan_limits SET
  max_members      = 10,
  max_lesson_types = 3,
  sms_monthly      = 10,
  has_ads          = true
WHERE plan = 'basic';

UPDATE plan_limits SET
  max_members      = 50,
  max_lesson_types = -1,
  sms_monthly      = 100,
  has_ads          = false
WHERE plan = 'pro';

UPDATE plan_limits SET
  max_members      = -1,
  max_lesson_types = -1,
  sms_monthly      = 500,
  has_ads          = false
WHERE plan = 'business';

-- tenants 테이블에 plan 컬럼 추가 (기본값 'basic')
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic'
  REFERENCES plan_limits(plan);

-- Realtime 등록 (tenants는 이미 FULL이면 스킵되지만 명시)
ALTER TABLE plan_limits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_limits;
```

- [ ] **Step 2: 마이그레이션 개발 DB 반영**

```powershell
npx supabase db push --project-ref mcuszdvophmqrwostcah
```

- [ ] **Step 3: Tenant 타입에 plan 필드 추가**

`src/types/index.ts`의 `Tenant` 인터페이스에 한 줄 추가:

```ts
// src/types/index.ts — Tenant 인터페이스 (updated_at 줄 위에 추가)
  plan: PlanType;
```

결과:
```ts
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  business_type: string | null;
  settings: TenantSettings;
  is_active: boolean;
  customer_id: string;
  plan: PlanType;           // ← 추가
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 4: PlanLimits 타입 확장**

`src/types/index.ts`의 `PlanLimits` 인터페이스에 새 필드 추가:

```ts
// src/types/index.ts — PlanLimits 인터페이스 교체
export interface PlanLimits {
  maxOrgs:         number   // 기존 유지
  maxUsers:        number   // 기존 유지
  maxMembers:      number   // -1 = 무제한
  maxLessonTypes:  number   // -1 = 무제한
  smsMonthly:      number
  hasAds:          boolean
}
```

`PLAN_LIMITS` 상수도 새 필드로 업데이트:

```ts
// src/types/index.ts — PLAN_LIMITS 상수 교체
export const PLAN_LIMITS: PlanLimitsMap = {
  basic:    { maxOrgs: 1,        maxUsers: 20,       maxMembers: 10,  maxLessonTypes: 3,   smsMonthly: 10,  hasAds: true  },
  pro:      { maxOrgs: 5,        maxUsers: 100,      maxMembers: 50,  maxLessonTypes: -1,  smsMonthly: 100, hasAds: false },
  business: { maxOrgs: Infinity, maxUsers: Infinity, maxMembers: -1,  maxLessonTypes: -1,  smsMonthly: 500, hasAds: false },
}
```

- [ ] **Step 5: PlanLimitsContext.tsx refreshPlanLimits 업데이트**

새 컬럼을 읽도록 `src/contexts/PlanLimitsContext.tsx`의 `refreshPlanLimits` 함수 내 매핑 업데이트:

```ts
// PlanLimitsContext.tsx — setPlanLimits 내부 next[row.plan] 매핑 교체
next[row.plan as PlanType] = {
  maxOrgs:         row.max_orgs  ?? Infinity,
  maxUsers:        row.max_users ?? Infinity,
  maxMembers:      row.max_members      ?? 10,
  maxLessonTypes:  row.max_lesson_types ?? 3,
  smsMonthly:      row.sms_monthly      ?? 10,
  hasAds:          row.has_ads          ?? true,
}
```

- [ ] **Step 6: useTenantPlan.ts 훅 작성**

```ts
// src/hooks/useTenantPlan.ts
import { useTenant } from '../contexts/TenantContext'
import { usePlanLimits } from '../contexts/PlanLimitsContext'
import type { PlanType, PlanLimits } from '../types'

export interface TenantPlanInfo extends PlanLimits {
  plan: PlanType
}

export function useTenantPlan(): TenantPlanInfo {
  const { tenant } = useTenant()
  const { planLimits } = usePlanLimits()
  const plan: PlanType = (tenant?.plan ?? 'basic') as PlanType
  return { plan, ...planLimits[plan] }
}

// -1 = 무제한. current >= max 이면 한도 도달.
export function isAtLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max
}

// 한도의 90% 이상이면 경고
export function isNearLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max * 0.9
}
```

- [ ] **Step 7: 타입 체크**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

- [ ] **Step 8: reset_db.sql 갱신**

`supabase/reset_db.sql`에서:
1. `plan_limits` 테이블 생성부분에 새 컬럼 추가
2. `tenants` 테이블 생성부분에 `plan TEXT NOT NULL DEFAULT 'basic' REFERENCES plan_limits(plan)` 추가
3. INSERT INTO plan_limits 데이터에 새 컬럼값 추가
4. 파일 상단 "기준 마이그레이션" 주석을 `085`로 업데이트

`supabase/reset_data.sql`에서:
1. plan_limits INSERT 데이터에 새 컬럼값 추가

- [ ] **Step 9: 커밋**

```powershell
git add supabase/migrations/085_plan_limits.sql src/types/index.ts src/hooks/useTenantPlan.ts src/contexts/PlanLimitsContext.tsx supabase/reset_db.sql supabase/reset_data.sql
git commit -m "feat: extend plan_limits schema and add useTenantPlan hook (migration 085)"
```

---

## Task 3: verticalPresets.ts

**Files:**
- Create: `src/lib/verticalPresets.ts`

**Interfaces:**
- Consumes: `TenantMode` from `src/types/index.ts`, `FeatureFlags` from `src/lib/featureFlags.ts`
- Produces:
  - `VerticalId` 타입
  - `VerticalPreset` 인터페이스
  - `VERTICAL_PRESETS: Record<VerticalId, VerticalPreset>` 상수
  - `getPresetFromParam(param: string | null): VerticalPreset | null`

- [ ] **Step 1: verticalPresets.ts 작성**

```ts
// src/lib/verticalPresets.ts
import type { TenantMode } from '../types'
import type { FeatureFlags } from './featureFlags'

export type VerticalId =
  | 'lesson-sports'
  | 'education-academy'
  | 'food-retail'
  | 'beauty-salon'
  | 'medical-care'
  | 'public-welfare'
  | 'professional-office'

export interface VerticalPreset {
  id:                   VerticalId
  appName:              string
  tagline:              string
  tenant_mode:          TenantMode
  feature_flags:        FeatureFlags
  default_roles:        string[]
  custom_field_presets: string[]
  theme_preset:         string
}

export const VERTICAL_PRESETS: Record<VerticalId, VerticalPreset> = {
  'lesson-sports': {
    id:           'lesson-sports',
    appName:      'LESSON:ON',
    tagline:      '강사 혼자 다 챙기던 회원권 관리, 이제 문자 한 통이 대신합니다',
    tenant_mode:  '회원개별',
    feature_flags: { lesson_packages: true, autoassign: true, notifications: true },
    default_roles: ['강사', '회원'],
    custom_field_presets: ['lesson_type', 'injury_history', 'goal'],
    theme_preset: 'salmon',
  },
  'education-academy': {
    id:           'education-academy',
    appName:      'CLASS:ON',
    tagline:      '수강권 소진부터 출석까지, 학원 원장님의 잔업을 줄여드립니다',
    tenant_mode:  '회원개별',
    feature_flags: { lesson_packages: true, autoassign: true, attendance: true },
    default_roles: ['강사', '학생'],
    custom_field_presets: ['school', 'grade', 'subject', 'parent_contact'],
    theme_preset: 'midnight',
  },
  'food-retail': {
    id:           'food-retail',
    appName:      'SHIFT:ON',
    tagline:      '알바 스케줄 짜는 데 30분? 이제 5분이면 됩니다',
    tenant_mode:  '회원공유',
    feature_flags: { lesson_packages: false, autoassign: true, notifications: true },
    default_roles: ['홀', '주방', '카운터'],
    custom_field_presets: ['hourly_wage', 'employment_type', 'bank_account'],
    theme_preset: 'forest',
  },
  'beauty-salon': {
    id:           'beauty-salon',
    appName:      'SALON:ON',
    tagline:      '고객이 직접 시술사를 고르고 예약합니다. 전화 없이',
    tenant_mode:  '비회원',
    feature_flags: { lesson_packages: false, autoassign: false, public_booking: true },
    default_roles: ['디자이너', '인턴'],
    custom_field_presets: ['service_type', 'request', 'allergy'],
    theme_preset: 'dusty_lavender',
  },
  'medical-care': {
    id:           'medical-care',
    appName:      'CARE:ON',
    tagline:      '의료진 교대표, 빠짐 없이 채워지고 담당자는 하루 전 받습니다',
    tenant_mode:  '회원공유',
    feature_flags: { lesson_packages: false, autoassign: true, notifications: true, care_mapping: true },
    default_roles: ['의사', '간호사', '간병인'],
    custom_field_presets: ['license', 'ward', 'shift_type'],
    theme_preset: 'pistachio',
  },
  'public-welfare': {
    id:           'public-welfare',
    appName:      'SERVE:ON',
    tagline:      '봉사자 모집부터 배정·확인까지, 엑셀 없이 한 화면에',
    tenant_mode:  '비회원',
    feature_flags: { lesson_packages: false, autoassign: true, volunteer_hours: true },
    default_roles: ['봉사자', '담당자'],
    custom_field_presets: ['available_days', 'qualification', 'has_car'],
    theme_preset: 'sage',
  },
  'professional-office': {
    id:           'professional-office',
    appName:      'WORK:ON',
    tagline:      '팀 업무 스케줄, 구글 캘린더와 함께 한 곳에서',
    tenant_mode:  '회원공유',
    feature_flags: { lesson_packages: false, autoassign: true, calendar_sync: true },
    default_roles: ['팀원', '팀장'],
    custom_field_presets: ['project', 'client', 'priority'],
    theme_preset: 'deep_midnight',
  },
}

// URL ?vertical=xxx 파라미터에서 프리셋 반환. 없거나 알 수 없는 값이면 null.
export function getPresetFromParam(param: string | null): VerticalPreset | null {
  if (!param) return null
  return VERTICAL_PRESETS[param as VerticalId] ?? null
}
```

- [ ] **Step 2: 타입 체크**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

- [ ] **Step 3: 커밋**

```powershell
git add src/lib/verticalPresets.ts
git commit -m "feat: add verticalPresets.ts with VERTICAL_PRESETS map and getPresetFromParam"
```

---

## Task 4: brandConfig.ts + 환경 변수 + 빌드 스크립트

**Files:**
- Create: `src/lib/brandConfig.ts`
- Create: `.env.lesson-on`, `.env.shift-on`, `.env.serve-on`
- Modify: `vite.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `VerticalId` from `src/lib/verticalPresets.ts`
- Produces: `BRAND` 상수 (`{ name, tagline, color, vertical, appId }`)

- [ ] **Step 1: brandConfig.ts 작성**

```ts
// src/lib/brandConfig.ts
import type { VerticalId } from './verticalPresets'

export const BRAND = {
  name:     import.meta.env.VITE_BRAND_NAME    ?? 'Dynamic Team Schedule',
  tagline:  import.meta.env.VITE_BRAND_TAGLINE ?? '다중 조직 스케줄 관리',
  color:    import.meta.env.VITE_BRAND_COLOR   ?? '#E05A3A',
  vertical: (import.meta.env.VITE_VERTICAL     ?? 'generic') as VerticalId | 'generic',
  appId:    import.meta.env.VITE_APP_ID        ?? 'com.dtschedule.app',
} as const
```

- [ ] **Step 2: .env.lesson-on 작성**

```
# .env.lesson-on
VITE_VERTICAL=lesson-sports
VITE_BRAND_NAME=LESSON:ON
VITE_BRAND_TAGLINE=강사 혼자 다 챙기던 회원권 관리, 이제 문자 한 통이 대신합니다
VITE_BRAND_COLOR=#F2604E
VITE_APP_ID=com.dtschedule.lessonon
```

- [ ] **Step 3: .env.shift-on 작성**

```
# .env.shift-on
VITE_VERTICAL=food-retail
VITE_BRAND_NAME=SHIFT:ON
VITE_BRAND_TAGLINE=알바 스케줄 짜는 데 30분? 이제 5분이면 됩니다
VITE_BRAND_COLOR=#2E7D32
VITE_APP_ID=com.dtschedule.shifton
```

- [ ] **Step 4: .env.serve-on 작성**

```
# .env.serve-on
VITE_VERTICAL=public-welfare
VITE_BRAND_NAME=SERVE:ON
VITE_BRAND_TAGLINE=봉사자 모집부터 배정·확인까지, 엑셀 없이 한 화면에
VITE_BRAND_COLOR=#4CAF50
VITE_APP_ID=com.dtschedule.serveon
```

- [ ] **Step 5: .gitignore에 env 파일 추가 확인**

`.gitignore`을 열어 `.env.*.local`은 제외되는지 확인. `.env.lesson-on` 등 버티컬 env 파일은 시크릿이 없으므로 Git에 포함해도 무방하다(Supabase URL/Key는 `.env.local`에).

- [ ] **Step 6: vite.config.ts PWA manifest 환경 변수 연동**

`vite.config.ts`에서 `VitePWA` 플러그인의 `manifest` 항목을 찾아 아래처럼 env var를 참조하도록 수정:

```ts
// vite.config.ts — VitePWA manifest 섹션 내부 수정
manifest: {
  name:        process.env.VITE_BRAND_NAME    ?? 'Dynamic Team Schedule',
  short_name:  process.env.VITE_BRAND_NAME    ?? 'DTS',
  theme_color: process.env.VITE_BRAND_COLOR   ?? '#E05A3A',
  background_color: '#0a0b10',
  // 기존 나머지 필드는 유지
}
```

> **주의:** vite.config.ts는 Node.js 환경이므로 `import.meta.env` 대신 `process.env`를 사용한다.

- [ ] **Step 7: package.json 빌드 스크립트 추가**

`package.json`의 `"scripts"` 블록에 추가:

```json
"build:lesson-on":  "dotenv -e .env.lesson-on -- vite build",
"build:shift-on":   "dotenv -e .env.shift-on  -- vite build",
"build:serve-on":   "dotenv -e .env.serve-on  -- vite build"
```

> `dotenv-cli`가 없으면 먼저 설치: `npm install -D dotenv-cli`

- [ ] **Step 8: dotenv-cli 설치**

```powershell
npm install -D dotenv-cli
```

- [ ] **Step 9: 빌드 스크립트 동작 확인**

```powershell
npm run build:lesson-on 2>&1 | Select-String -Pattern "error|built in" | Select-Object -First 10
```

`dist` 폴더가 생성되고 에러 없으면 통과.

- [ ] **Step 10: 커밋**

```powershell
git add src/lib/brandConfig.ts .env.lesson-on .env.shift-on .env.serve-on vite.config.ts package.json package-lock.json
git commit -m "feat: add brandConfig.ts, vertical env files, and build:vertical npm scripts"
```

---

## Task 5: AdminPage feature_flags 토글 UI

**Files:**
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: `FeatureFlags`, `getFF()` from `src/lib/featureFlags.ts`

> **배경:** AdminPage에는 OrgDrawer(조직별 설정 드로어)가 있으며, `adminTenant.settings` JSONB를 읽어 표시한다. `adminTenant`는 line 226의 로컬 state. feature_flags 토글 섹션을 추가해 슈퍼관리자가 조직별로 기능을 on/off 할 수 있게 한다.

- [ ] **Step 1: AdminPage.tsx 상단에 import 추가**

파일 상단 import 블록에:
```ts
import { getFF } from '../lib/featureFlags'
import type { FeatureFlags } from '../lib/featureFlags'
```

- [ ] **Step 2: feature_flags 저장 핸들러 추가**

AdminPage 내 `adminTenant` 관련 핸들러들 근처(예: 설정 저장 함수들 아래)에 추가:

```ts
// AdminPage.tsx — feature_flags 토글 핸들러
async function handleFeatureFlagToggle(key: keyof FeatureFlags, value: boolean) {
  if (!adminTenant) return
  const currentFlags: FeatureFlags = adminTenant.settings?.feature_flags ?? {}
  const nextFlags: FeatureFlags = { ...currentFlags, [key]: value }
  const { error } = await supabase
    .from('tenants')
    .update({ settings: { ...adminTenant.settings, feature_flags: nextFlags } })
    .eq('id', adminTenant.id)
  if (!error) {
    setAdminTenant(prev => prev
      ? { ...prev, settings: { ...prev.settings, feature_flags: nextFlags } }
      : prev
    )
  }
}
```

- [ ] **Step 3: OrgDrawer 내 feature_flags 토글 UI 추가**

AdminPage의 OrgDrawer 섹션 내에서 설정 폼이 표시되는 위치(설정 저장 버튼 위쪽)에 아래 JSX를 추가:

```tsx
{/* Feature Flags — 슈퍼관리자 전용 */}
<div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
    기능 플래그 (슈퍼관리자 전용)
  </div>
  {(
    [
      { key: 'lesson_packages' as const,  label: '레슨권/수강권' },
      { key: 'autoassign'      as const,  label: '자동 배정' },
      { key: 'notifications'   as const,  label: 'D-1 알림' },
      { key: 'attendance'      as const,  label: '출석 체크' },
      { key: 'volunteer_hours' as const,  label: '봉사/근무 시간 집계' },
      { key: 'care_mapping'    as const,  label: '담당자-케어 대상 매핑' },
      { key: 'public_booking'  as const,  label: '고객용 예약 링크' },
      { key: 'calendar_sync'   as const,  label: 'Google Calendar 연동' },
    ] as { key: keyof FeatureFlags; label: string }[]
  ).map(({ key, label }) => {
    const ff = adminTenant?.settings?.feature_flags
    const isOn = getFF(ff, key)
    return (
      <label
        key={key}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}
      >
        <input
          type="checkbox"
          checked={isOn}
          onChange={e => handleFeatureFlagToggle(key, e.target.checked)}
        />
        {label}
      </label>
    )
  })}
</div>
```

- [ ] **Step 4: 타입 체크**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

- [ ] **Step 5: 로컬에서 동작 확인**

1. `npm run dev` 실행
2. 슈퍼관리자 계정으로 `/superadmin` 접속
3. 조직 드로어 열기 → "기능 플래그" 섹션이 표시되는지 확인
4. 체크박스 토글 → DB 반영 확인 (Supabase 대시보드 또는 페이지 새로고침 후 상태 유지)

- [ ] **Step 6: 커밋**

```powershell
git add src/pages/AdminPage.tsx
git commit -m "feat: add feature_flags toggle UI in AdminPage OrgDrawer (T01)"
```

---

## Task 6: 셋업 위자드 딥링크 자동 적용

**Files:**
- Modify: `src/pages/SetupWizardPage.tsx`

**Interfaces:**
- Consumes: `getPresetFromParam`, `VerticalPreset` from `src/lib/verticalPresets.ts`

> **배경:** `SetupWizardPage.tsx`는 line 35에서 `useSearchParams()`로 `org` 파라미터를 이미 읽는다. `vertical` 파라미터를 추가로 읽어 프리셋을 자동 적용한다. `mode` state는 line 92에 있어 `setMode(preset.tenant_mode)`로 바로 주입 가능.

- [ ] **Step 1: import 추가**

`SetupWizardPage.tsx` 상단 import에 추가:
```ts
import { getPresetFromParam } from '../lib/verticalPresets'
import type { VerticalPreset } from '../lib/verticalPresets'
```

- [ ] **Step 2: vertical 파라미터 읽기 + 프리셋 state 추가**

`orgId` 선언 바로 아래(line 36~37 근처)에 추가:

```ts
// SetupWizardPage.tsx — orgId 선언 바로 아래
const verticalParam = params.get('vertical')
const [activePreset] = useState<VerticalPreset | null>(() => getPresetFromParam(verticalParam))
```

- [ ] **Step 3: 프리셋 자동 적용 useEffect 추가**

기존 tenant 로드 useEffect (line 128~136) 바로 아래에 추가:

```ts
// SetupWizardPage.tsx — 버티컬 프리셋 자동 적용
useEffect(() => {
  if (!activePreset) return
  // 위자드 신규 진입 시(orgId 없음)에만 자동 적용 — 기존 조직 편집 시 덮어쓰기 방지
  if (orgId) return
  setMode(activePreset.tenant_mode)
}, [activePreset, orgId])
```

- [ ] **Step 4: Step 2 (모드 선택) 화면에 프리셋 안내 배너 추가**

`Step2Mode` 컴포넌트를 렌더링하는 JSX 위에 조건부 배너 삽입:

```tsx
{/* SetupWizardPage.tsx — step === 2 렌더링 블록 안, Step2Mode 위에 삽입 */}
{step === 2 && activePreset && (
  <div style={{
    background: 'rgba(var(--color-accent-rgb), 0.08)',
    border: '1px solid rgba(var(--color-accent-rgb), 0.2)',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 12,
    fontSize: 13,
    color: 'var(--color-text-secondary)',
  }}>
    <strong>{activePreset.appName}</strong> 추천 설정이 자동으로 적용되었습니다.
    원하는 경우 아래에서 직접 변경할 수 있습니다.
  </div>
)}
```

> **주의:** `step === 2` 렌더링 블록을 찾아 그 안에 삽입한다. 파일에서 `step === 2` 또는 `step === 2 &&` 패턴 검색으로 위치를 찾아라.

- [ ] **Step 5: 타입 체크**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

- [ ] **Step 6: 로컬 동작 확인**

1. `npm run dev` 후 `http://localhost:5173/setup?vertical=lesson-sports` 접속
2. 위자드 Step 1 진행 후 Step 2에서 모드가 '회원개별'로 자동 선택되는지 확인
3. 배너("LESSON:ON 추천 설정이 자동으로 적용되었습니다") 표시 확인

- [ ] **Step 7: 커밋**

```powershell
git add src/pages/SetupWizardPage.tsx
git commit -m "feat: apply vertical preset auto-config on setup wizard deeplink (T05)"
```

---

## Task 7: 랜딩페이지 3개 + App.tsx 라우팅

**Files:**
- Create: `src/pages/landing/LandingLayout.tsx`
- Create: `src/pages/landing/LandingLessonOn.tsx`
- Create: `src/pages/landing/LandingShiftOn.tsx`
- Create: `src/pages/landing/LandingServeOn.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `BRAND` from `src/lib/brandConfig.ts`, `VerticalPreset` from `src/lib/verticalPresets.ts`

- [ ] **Step 1: LandingLayout.tsx 작성 (공통 레이아웃)**

```tsx
// src/pages/landing/LandingLayout.tsx
import { useNavigate } from 'react-router-dom'

interface LandingLayoutProps {
  appName: string
  tagline: string
  accentColor: string
  verticalId: string
  children?: React.ReactNode
}

export function LandingLayout({ appName, tagline, accentColor, verticalId, children }: LandingLayoutProps) {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: accentColor }}>{appName}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/auth?tab=login')}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            로그인
          </button>
          <button
            onClick={() => navigate(`/consent?vertical=${verticalId}`)}
            style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            무료로 시작하기
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{ display: 'inline-block', background: `${accentColor}22`, color: accentColor, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
          {appName}
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', margin: '0 auto 20px', maxWidth: 640 }}>
          {tagline}
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          지금 바로 무료로 시작하세요. 신용카드 없이, 30초 안에.
        </p>
        <button
          onClick={() => navigate(`/consent?vertical=${verticalId}`)}
          style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 32px ${accentColor}44` }}
        >
          무료로 시작하기 →
        </button>
      </section>

      {/* 버티컬별 커스텀 섹션 */}
      {children}

      {/* 가격 */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>무료로 시작하세요</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>멤버 10명까지 영구 무료. 언제든 업그레이드.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { name: '무료', price: '₩0', features: ['멤버 10명', '기본 기능 전체', '이메일 지원'] },
            { name: 'Pro', price: '₩29,000/월', features: ['멤버 50명', 'SMS 알림 100건/월', '광고 없음'] },
          ].map(tier => (
            <div key={tier.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px', minWidth: 220, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{tier.name}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{tier.price}</div>
              {tier.features.map(f => (
                <div key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>✓ {f}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ textAlign: 'center', padding: '40px 24px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => navigate(`/consent?vertical=${verticalId}`)}
          style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          지금 무료로 시작하기 →
        </button>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: LandingLessonOn.tsx 작성**

```tsx
// src/pages/landing/LandingLessonOn.tsx
import { LandingLayout } from './LandingLayout'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#F2604E'

export function LandingLessonOn() {
  return (
    <>
      <LandingLayout
        appName="LESSON:ON"
        tagline="강사 혼자 다 챙기던 회원권 관리, 이제 문자 한 통이 대신합니다"
        accentColor={ACCENT}
        verticalId="lesson-sports"
      >
        {/* 앵커 기능 */}
        <section style={{ padding: '0 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '📋', title: '수강권 자동 소진', desc: '출석할 때마다 남은 횟수 자동 차감. 강사가 일일이 기록할 필요 없음.' },
              { icon: '📱', title: 'D-1 자동 문자', desc: '수업 하루 전 회원에게 자동으로 알림 문자. 노쇼를 줄여드립니다.' },
              { icon: '📊', title: '회원별 통계', desc: '회원별 출석률, 수강권 소진 추이를 한눈에. 엑셀 다운로드 지원.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '0 24px 60px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>이런 곳에서 쓰고 있어요</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['PT·헬스', '요가', '필라테스', '골프 레슨', '무술·격투기', '수영', '발레', '댄스'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </section>
      </LandingLayout>
      <DevFileLabel file="LandingLessonOn.tsx" />
    </>
  )
}
```

- [ ] **Step 3: LandingShiftOn.tsx 작성**

```tsx
// src/pages/landing/LandingShiftOn.tsx
import { LandingLayout } from './LandingLayout'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#2E7D32'

export function LandingShiftOn() {
  return (
    <>
      <LandingLayout
        appName="SHIFT:ON"
        tagline="알바 스케줄 짜는 데 30분? 이제 5분이면 됩니다"
        accentColor={ACCENT}
        verticalId="food-retail"
      >
        <section style={{ padding: '0 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '🗓️', title: '드래그로 시프트 배정', desc: '이름 칸에 직원을 드래그해 떨어뜨리면 즉시 배정. 역할별 색상으로 한눈에.' },
              { icon: '🔔', title: '알바 자동 알림', desc: '출근 하루 전에 해당 직원에게 자동 문자 발송. 연락 잊어도 걱정 없음.' },
              { icon: '🕐', title: '근무 시간 집계', desc: '월별 직원별 총 근무 시간 자동 계산. 급여 정산 자료로 바로 사용.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: 'center', padding: '0 24px 60px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>이런 곳에서 쓰고 있어요</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['카페', '음식점', '편의점', '베이커리', '마트', '소매점', '호텔', '주점'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </section>
      </LandingLayout>
      <DevFileLabel file="LandingShiftOn.tsx" />
    </>
  )
}
```

- [ ] **Step 4: LandingServeOn.tsx 작성**

```tsx
// src/pages/landing/LandingServeOn.tsx
import { LandingLayout } from './LandingLayout'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#4CAF50'

export function LandingServeOn() {
  return (
    <>
      <LandingLayout
        appName="SERVE:ON"
        tagline="봉사자 모집부터 배정·확인까지, 엑셀 없이 한 화면에"
        accentColor={ACCENT}
        verticalId="public-welfare"
      >
        <section style={{ padding: '0 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { icon: '🤝', title: '봉사자 명단 관리', desc: '가능 요일·자격·보유 차량 등 커스텀 필드로 봉사자 정보를 체계적으로 관리.' },
              { icon: '📆', title: '자동 배정', desc: '역할별 필요 인원을 설정하면 봉사자를 자동으로 배정. 수동 조정도 자유롭게.' },
              { icon: '🕐', title: '봉사 시간 집계', desc: '봉사자별 누적 시간 자동 계산. 인증서·수료증 발급 자료로 바로 활용.' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: 'center', padding: '0 24px 60px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>이런 곳에서 쓰고 있어요</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['복지관', '사회복지시설', '시민단체', '종교단체', '지자체', '도서관', '문화시설', '자원봉사센터'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '5px 12px', fontSize: 13 }}>{tag}</span>
            ))}
          </div>
        </section>
      </LandingLayout>
      <DevFileLabel file="LandingServeOn.tsx" />
    </>
  )
}
```

- [ ] **Step 5: App.tsx 라우팅 수정**

`src/App.tsx`에서 import 추가:
```ts
import { BRAND } from './lib/brandConfig'
import { LandingLessonOn } from './pages/landing/LandingLessonOn'
import { LandingShiftOn  } from './pages/landing/LandingShiftOn'
import { LandingServeOn  } from './pages/landing/LandingServeOn'
```

`!profile` 조건 블록 내 `<Route path="/" element={<LandingPage />} />` 를 아래로 교체:

```tsx
// App.tsx — !profile Routes 블록 내
<Route path="/" element={
  BRAND.vertical === 'lesson-sports'   ? <LandingLessonOn /> :
  BRAND.vertical === 'food-retail'     ? <LandingShiftOn  /> :
  BRAND.vertical === 'public-welfare'  ? <LandingServeOn  /> :
  <LandingPage />
} />
```

- [ ] **Step 6: 타입 체크**

```powershell
npm run build 2>&1 | Select-String -Pattern "error|Error" | Select-Object -First 20
```

- [ ] **Step 7: 일반 빌드 (generic) 로컬 확인**

```powershell
npm run dev
```

브라우저에서 `http://localhost:5173` → 기존 `LandingPage` 표시 확인 (`BRAND.vertical === 'generic'`이므로).

- [ ] **Step 8: LESSON:ON 빌드 확인**

```powershell
npm run build:lesson-on 2>&1 | Select-String -Pattern "error|built in" | Select-Object -First 10
```

- [ ] **Step 9: 커밋**

```powershell
git add src/pages/landing/ src/App.tsx src/lib/brandConfig.ts
git commit -m "feat: add vertical landing pages (LESSON:ON, SHIFT:ON, SERVE:ON) and brand-based routing (T06)"
```

---

## Task 8: README.md 갱신 + 완료 체크리스트

**Files:**
- Modify: `README.md`
- Create: `docs/checklist_2026-07-30.md`

- [ ] **Step 1: README.md 갱신**

`README.md`의 `✨ 핵심 기능` 섹션에 아래 항목 추가:
```
- **버티컬 멀티앱 지원** — 단일 코드베이스에서 LESSON:ON·SHIFT:ON·SERVE:ON 등 7개 버티컬 앱 빌드 (`npm run build:lesson-on` 등)
- **feature_flags** — 슈퍼관리자가 조직별로 기능 on/off 가능 (레슨권, 자동배정, 출석 등)
- **플랜 게이팅** — 무료/Pro/Business 플랜별 멤버·레슨권·SMS 한도 관리 (`useTenantPlan` 훅)
```

`🛠 기술 스택` 및 `📁 폴더 구조`에 새 파일 반영.

- [ ] **Step 2: 체크리스트 작성**

`docs/checklist_2026-07-30.md` 파일을 생성하여 Phase 1 검증 항목 기록:

```markdown
# Phase 1 동작 점검 체크리스트 (2026-07-30)

## T01 feature_flags
- [ ] 슈퍼관리자 → 조직 드로어 → "기능 플래그" 섹션 표시 확인
- [ ] "레슨권/수강권" 체크박스 해제 → 해당 조직에서 레슨권 탭 숨김 확인 (AdminPage 탭 필터)
- [ ] DB에 `settings.feature_flags` 반영 확인 (Supabase 대시보드)

## T02 plan_limits + useTenantPlan
- [ ] plan_limits 테이블에 새 컬럼(max_members, max_lesson_types, sms_monthly, has_ads) 존재 확인
- [ ] tenants 테이블에 plan 컬럼('basic' 기본값) 존재 확인
- [ ] useTenantPlan() 훅이 에러 없이 import 가능 확인

## T03 verticalPresets
- [ ] verticalPresets.ts import → getPresetFromParam('lesson-sports') 반환값 확인

## T04 brandConfig + 빌드 스크립트
- [ ] npm run build:lesson-on 빌드 성공 (에러 없음)
- [ ] npm run build:shift-on 빌드 성공
- [ ] npm run build:serve-on 빌드 성공

## T05 셋업 위자드 딥링크
- [ ] /setup?vertical=lesson-sports 접속 → Step 2에서 '회원 개별' 자동 선택 확인
- [ ] /setup?vertical=food-retail 접속 → Step 2에서 '회원 공유' 자동 선택 확인
- [ ] /setup?vertical=public-welfare 접속 → Step 2에서 '비회원' 자동 선택 확인
- [ ] 배너 "LESSON:ON 추천 설정이 자동으로 적용되었습니다" 표시 확인

## T06 랜딩페이지
- [ ] npm run dev → http://localhost:5173 → 기존 DTS 랜딩 표시 (BRAND.vertical = generic)
- [ ] VITE_VERTICAL=lesson-sports 환경에서 LandingLessonOn 표시 확인
- [ ] 랜딩 "무료로 시작하기" 버튼 → /consent?vertical=lesson-sports 이동 확인
- [ ] /consent → 위자드 진입 → ?vertical 파라미터 전파 확인 (ConsentPage → SetupWizardPage)
```

- [ ] **Step 3: ConsentPage에서 vertical 파라미터 위자드로 전파 확인**

`src/pages/ConsentPage.tsx`를 열어 `/setup` 이동 시 `vertical` 파라미터를 함께 넘기는지 확인:
- 파라미터가 전파되지 않으면 `navigate('/setup?...' + (verticalParam ? `&vertical=${verticalParam}` : ''))` 방식으로 수정.

- [ ] **Step 4: 커밋**

```powershell
git add README.md docs/checklist_2026-07-30.md
git commit -m "docs: update README and add Phase 1 checklist"
```

---

## Phase 1 완료 기준

| 검증 항목 | 통과 조건 |
|-----------|-----------|
| `?vertical=lesson-sports` 접속 | LESSON:ON 랜딩페이지 표시 |
| 랜딩 CTA 클릭 | 위자드 진입 + Step 2 모드 자동 설정 |
| 슈퍼관리자 feature_flags 토글 | DB 반영 + UI 즉시 반응 |
| `npm run build:lesson-on` | 에러 없이 dist/ 빌드 |
| `npm run build` (기본) | 기존 기능 회귀 없음 |
