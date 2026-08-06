# DTS 버티컬 멀티앱 구현 상세 설계서 (2026-07-30)

> 선행 문서:
> - [`multi-app-portfolio-strategy-2026-07-29.md`](./multi-app-portfolio-strategy-2026-07-29.md)
> - [`mobile-app-launch-strategy-2026-07-29.md`](./mobile-app-launch-strategy-2026-07-29.md)
> - [`monetization-strategy-2026-07-30.md`](./monetization-strategy-2026-07-30.md)

---

## 0. 방향 권고 (Claude 의견)

**"웹 버티컬 먼저 → 앱 나중" 전략에 동의합니다.** 단, 아래 순서를 권고합니다.

### 왜 웹 먼저인가

| 이유 | 설명 |
|------|------|
| PMF 검증 속도 | 웹은 배포 즉시 반영. 앱스토어 심사(1~7일) 없이 빠르게 피벗 가능 |
| 기반 시스템이 선행 | `feature_flags`, 브랜드 레이어가 없으면 앱도 미완성 상태로 스토어에 올라감 |
| 어느 버티컬에 앱 투자? | 웹에서 어떤 버티컬이 실제로 쓰이는지 확인 후 결정해야 낭비 없음 |
| 비용 절감 | 앱 스토어 계정 가입($25 + $99/년) 전에 제품 검증 완료 가능 |

### 권고 순서 (전략 문서 수정)

```
Phase 1 (0~4주): 웹 기반 시스템 + LESSON:ON·SHIFT:ON·SERVE:ON 웹 출시
Phase 1.5 (3~5주, 병행): Capacitor Android LESSON:ON 빌드 착수 (Mac 불필요)
Phase 2 (4~10주): 웹 CLASS:ON·WORK:ON + Android LESSON:ON 정식 출시
Phase 3 (10~20주): iOS 착수 + 수익화 시스템 (광고 → 구독)
Phase 4 (20주~): SALON:ON·CARE:ON 대규모 신기능
```

**핵심 이유:** Android는 현재 Windows 환경에서 Mac 없이 가능하므로 Phase 1 완료 직후 병행해도 리스크 없음.
iOS는 Apple 심사가 까다롭고 비용($99/년)이 있으므로 웹 PMF 확인 후 착수.

---

## 1. 전체 구현 태스크 목록

| # | Task | Phase | 기간 | 우선순위 |
|---|------|-------|------|---------|
| T01 | `feature_flags` 스키마 + AdminPage 토글 | 1 | 3일 | ★★★ |
| T02 | `plan_limits` 테이블 + `usePlanLimits` 훅 | 1 | 3일 | ★★★ |
| T03 | `verticalPresets.ts` — 프리셋 맵 | 1 | 2일 | ★★★ |
| T04 | `brandConfig.ts` + 환경 변수 체계 | 1 | 1일 | ★★★ |
| T05 | 셋업 위자드 딥링크 파라미터 연결 | 1 | 2일 | ★★★ |
| T06 | LESSON:ON·SHIFT:ON·SERVE:ON 랜딩페이지 | 1 | 1주 | ★★☆ |
| T07 | Capacitor 초기화 + Android LESSON:ON | 1.5 | 1주 | ★★★ |
| T08 | 멀티앱 빌드 스크립트 (`build-vertical.sh`) | 1.5 | 1일 | ★★☆ |
| T09 | 출석 체크 기능 (CLASS:ON) | 2 | 3주 | ★★☆ |
| T10 | 근무 시간 집계 뷰 (SHIFT:ON) | 2 | 2주 | ★★☆ |
| T11 | WORK:ON 선 출시 (캘린더 연동 없이) | 2 | 1주 | ★★☆ |
| T12 | iOS 빌드 + App Store 출시 | 3 | 2주 | ★★☆ |
| T13 | AdSense 웹 광고 + `useAdDisplay` 훅 | 3 | 1주 | ★★☆ |
| T14 | AdMob 앱 광고 | 3 | 1주 | ★★☆ |
| T15 | Stripe 구독 결제 플로우 | 3 | 3주 | ★★★ |
| T16 | 업그레이드 유도 모달 + 한도 게이트 | 3 | 2주 | ★★★ |
| T17 | 고객용 예약 링크 (SALON:ON) | 4 | 6주 | ★☆☆ |
| T18 | Google Calendar 연동 (WORK:ON) | 4 | 6주 | ★☆☆ |
| T19 | 담당자-케어 대상 매핑 (CARE:ON) | 4 | 8주 | ★☆☆ |

---

## 2. Phase 1 — 기반 시스템 (0~4주)

### T01: `feature_flags` 스키마 + AdminPage 토글

**마이그레이션 파일:** `supabase/migrations/084_feature_flags.sql`

```sql
-- 기존 tenants.settings JSONB 안에 feature_flags 키를 사용.
-- 테이블 구조 변경 없이 코드 레이어에서만 처리한다.
-- 하위 호환: feature_flags 키 없는 기존 조직은 아래 기본값으로 동작.

COMMENT ON COLUMN tenants.settings IS
  'JSONB 설정. feature_flags 키: { lesson_packages, autoassign, notifications, attendance, volunteer_hours, care_mapping, public_booking, calendar_sync }';
```

**`src/lib/featureFlags.ts` (신규):**

```ts
export interface FeatureFlags {
  lesson_packages?:  boolean  // 레슨권/수강권 기능 (기본 true)
  autoassign?:       boolean  // 자동 배정 (기본 true)
  notifications?:    boolean  // D-1 알림 (기본 true)
  attendance?:       boolean  // 출석 체크 (기본 false)
  volunteer_hours?:  boolean  // 봉사 시간 집계 (기본 false)
  care_mapping?:     boolean  // 담당자-케어 대상 매핑 (기본 false)
  public_booking?:   boolean  // 고객용 예약 링크 (기본 false)
  calendar_sync?:    boolean  // Google Calendar 연동 (기본 false)
}

// 기존 조직과의 하위 호환을 위해 undefined는 true(기본 활성) 처리
export function getFF(flags: FeatureFlags | undefined | null, key: keyof FeatureFlags): boolean {
  if (!flags) return DEFAULT_FLAGS[key]
  const val = flags[key]
  return val === undefined ? DEFAULT_FLAGS[key] : val
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
```

**`AdminPage.tsx` 확장:**

- `OrgDrawer` 내에 `feature_flags` 토글 섹션 추가
- 슈퍼관리자가 조직별로 기능 on/off 오버라이드 가능
- `adminTenant.settings.feature_flags` 를 읽고 쓰는 UI

**기존 코드 마이그레이션:**

```ts
// Before (기존)
const showLessons = !adminIsFreeform

// After
import { getFF } from '@/lib/featureFlags'
const ff = adminTenant?.settings?.feature_flags as FeatureFlags | undefined
const showLessons = !adminIsFreeform && getFF(ff, 'lesson_packages')
```

---

### T02: `plan_limits` 테이블 + `usePlanLimits` 훅

**마이그레이션 파일:** `supabase/migrations/085_plan_limits.sql`

```sql
CREATE TABLE plan_limits (
  plan        TEXT PRIMARY KEY,           -- 'free' | 'pro' | 'business'
  max_members INT  NOT NULL DEFAULT 10,
  max_orgs    INT  NOT NULL DEFAULT 1,
  max_lesson_types INT NOT NULL DEFAULT 3,
  sms_monthly INT  NOT NULL DEFAULT 10,
  has_ads     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plan_limits VALUES
  ('free',     10,  1, 3,   10,  true),
  ('pro',      50,  3, -1,  100, false),  -- -1 = 무제한
  ('business', -1, -1, -1,  500, false);

-- tenants 테이블에 plan 컬럼 추가
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  REFERENCES plan_limits(plan);

ALTER TABLE tenants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE plan_limits;
```

**`src/hooks/usePlanLimits.ts` (신규):**

```ts
export interface PlanLimits {
  plan:            'free' | 'pro' | 'business'
  maxMembers:      number   // -1 = 무제한
  maxOrgs:         number
  maxLessonTypes:  number
  smsMonthly:      number
  hasAds:          boolean
}

export function usePlanLimits(): PlanLimits {
  const { adminTenant } = useTenantContext()
  // plan_limits는 정적 테이블 — 앱 초기화 시 한 번 fetch 후 캐싱
  const plan = adminTenant?.plan ?? 'free'
  return PLAN_LIMITS_MAP[plan]
}

// 하드코딩하지 않고 DB에서 읽어야 하지만, 초기엔 로컬 맵으로 시작
const PLAN_LIMITS_MAP: Record<string, PlanLimits> = {
  free:     { plan: 'free',     maxMembers: 10, maxOrgs: 1, maxLessonTypes: 3,  smsMonthly: 10,  hasAds: true  },
  pro:      { plan: 'pro',      maxMembers: 50, maxOrgs: 3, maxLessonTypes: -1, smsMonthly: 100, hasAds: false },
  business: { plan: 'business', maxMembers: -1, maxOrgs: -1, maxLessonTypes: -1, smsMonthly: 500, hasAds: false },
}

// 한도 도달 여부 체크 헬퍼
export function isAtLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max
}
export function isNearLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max * 0.9
}
```

---

### T03: `verticalPresets.ts` — 프리셋 맵

**`src/lib/verticalPresets.ts` (신규):**

기존 `wizardModeRecommendation.ts`를 확장하는 방식으로 구현.
`wizardModeRecommendation.ts`는 **건드리지 않고** 새 파일에서 임포트한다.

```ts
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
  id:            VerticalId
  appName:       string            // 버티컬 앱 이름
  tagline:       string            // 온보딩 서브카피
  tenant_mode:   TenantMode
  feature_flags: FeatureFlags
  default_roles: string[]          // 기본 역할 이름 (조직 생성 시 자동 생성)
  custom_field_presets: string[]   // 커스텀 필드 기본 프리셋 키
  theme_preset:  string            // 기본 테마 (themePresets.ts 키)
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

// URL 파라미터 ?vertical=xxx 에서 프리셋 로드
export function getPresetFromParam(param: string | null): VerticalPreset | null {
  if (!param) return null
  return VERTICAL_PRESETS[param as VerticalId] ?? null
}
```

**셋업 위자드 연결:** `wizardModeRecommendation.ts`와 연동

```ts
// 위자드 진입 시 vertical 파라미터가 있으면 프리셋 자동 적용
// src/pages/SetupWizardPage.tsx (기존 파일 수정)
const verticalParam = new URLSearchParams(location.search).get('vertical')
const preset = getPresetFromParam(verticalParam)
if (preset) {
  setMode(preset.tenant_mode)          // Step 2 (모드 선택) 자동 설정
  applyFeatureFlags(preset.feature_flags)  // feature_flags 자동 적용
}
```

---

### T04: `brandConfig.ts` + 환경 변수 체계

**`src/lib/brandConfig.ts` (신규):**

```ts
export const BRAND = {
  name:     import.meta.env.VITE_BRAND_NAME    ?? 'Dynamic Team Schedule',
  tagline:  import.meta.env.VITE_BRAND_TAGLINE ?? '다중 조직 스케줄 관리',
  color:    import.meta.env.VITE_BRAND_COLOR   ?? '#E05A3A',
  vertical: (import.meta.env.VITE_VERTICAL     ?? 'generic') as VerticalId | 'generic',
  appId:    import.meta.env.VITE_APP_ID        ?? 'com.dtschedule.app',
} as const
```

**환경 변수 파일 목록 (프로젝트 루트):**

```
.env                    ← 공통 기본값 (VITE_SUPABASE_URL 등)
.env.local              ← 로컬 시크릿 (Git 제외)
.env.lesson-on          ← LESSON:ON 빌드용
.env.shift-on           ← SHIFT:ON 빌드용
.env.serve-on           ← SERVE:ON 빌드용
.env.class-on           ← CLASS:ON 빌드용 (Phase 2)
.env.work-on            ← WORK:ON 빌드용 (Phase 2)
.env.salon-on           ← SALON:ON 빌드용 (Phase 4)
```

**`.env.lesson-on` 예시:**

```
VITE_VERTICAL=lesson-sports
VITE_BRAND_NAME=LESSON:ON
VITE_BRAND_TAGLINE=강사 혼자 다 챙기던 회원권 관리, 이제 문자 한 통이 대신합니다
VITE_BRAND_COLOR=#F2604E
VITE_APP_ID=com.dtschedule.lessonon
```

**`vite.config.ts`에 PWA manifest 연동:**

```ts
VitePWA({
  manifest: {
    name:        process.env.VITE_BRAND_NAME ?? 'Dynamic Team Schedule',
    short_name:  process.env.VITE_BRAND_NAME ?? 'DTS',
    theme_color: process.env.VITE_BRAND_COLOR ?? '#E05A3A',
    // ...
  }
})
```

---

### T05: 셋업 위자드 딥링크 파라미터 연결

**변경 파일:** 셋업 위자드 관련 컴포넌트 (위자드 엔트리 포인트)

온보딩 흐름:
1. 사용자가 `https://app.lessonon.com?vertical=lesson-sports` 접속
2. `getPresetFromParam('lesson-sports')` → `VERTICAL_PRESETS['lesson-sports']` 반환
3. Step 1 (조직명 입력) 이전에 브랜드 카피("LESSON:ON에 오신 것을 환영합니다") 표시
4. Step 2 (모드 선택) 자동 설정 → 사용자는 확인만
5. Step 7 (커스텀 필드) 프리셋 기본값 자동 적용

---

### T06: 랜딩페이지 3개 (LESSON:ON · SHIFT:ON · SERVE:ON)

**`src/pages/landing/` 신규 디렉터리:**

```
src/pages/landing/
├── LandingLessonOn.tsx    ← LESSON:ON 전용 랜딩
├── LandingShiftOn.tsx     ← SHIFT:ON 전용 랜딩
├── LandingServeOn.tsx     ← SERVE:ON 전용 랜딩
└── LandingLayout.tsx      ← 공통 랜딩 레이아웃
```

**라우팅 분기 (환경 변수 기반):**

```ts
// App.tsx
const vertical = BRAND.vertical
if (vertical !== 'generic' && !isLoggedIn) {
  // 비로그인 + 버티컬 앱 → 전용 랜딩 표시
  return <LandingPage vertical={vertical} />
}
```

**각 랜딩페이지 필수 섹션:**

1. Hero — 태그라인 + CTA ("무료로 시작하기" → `?vertical=xxx` 딥링크)
2. 앵커 기능 3가지 스크린샷
3. 사용 업종 배지 (PT·요가·필라테스·골프·무술 등)
4. 가격 (무료 플랜 강조)
5. CTA 재반복

---

## 3. Phase 1.5 — Capacitor Android (병행, 3~5주차)

### T07: Capacitor 초기화

**설치 명령:**

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/app @capacitor/network
npx cap add android
```

**`capacitor.config.ts` (신규):**

```ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   process.env.VITE_APP_ID   ?? 'com.dtschedule.app',
  appName: process.env.VITE_BRAND_NAME ?? 'Dynamic Team Schedule',
  webDir:  'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor:    '#0a0b10',
      showSpinner:        false,
    },
  },
}
export default config
```

**Android 필수 수정 (`src/hooks/useAndroidBackButton.ts` 신규):**

```ts
import { App } from '@capacitor/app'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export function useAndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = App.addListener('backButton', () => {
      if (location.pathname === '/') {
        App.exitApp()
      } else {
        navigate(-1)
      }
    })
    return () => { handler.remove() }
  }, [location.pathname])
}
```

---

### T08: 멀티앱 빌드 스크립트

**`scripts/build-vertical.sh` (신규):**

```bash
#!/bin/bash
set -e
VERTICAL=${1:-lesson-on}

echo "▶ Building $VERTICAL..."
cp .env.$VERTICAL .env.production.local
npm run build
npx cap sync android
echo "✅ Sync complete. Open Android Studio: npx cap open android"
```

**`package.json` scripts 추가:**

```json
{
  "scripts": {
    "build:lesson-on":  "bash scripts/build-vertical.sh lesson-on",
    "build:shift-on":   "bash scripts/build-vertical.sh shift-on",
    "build:serve-on":   "bash scripts/build-vertical.sh serve-on"
  }
}
```

---

## 4. Phase 2 — 버티컬 추가 기능 (4~10주)

### T09: 출석 체크 (CLASS:ON)

**신규 테이블:** `supabase/migrations/086_attendance.sql`

```sql
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slot_id     UUID NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES profiles(id),
  status      TEXT NOT NULL DEFAULT 'absent'
              CHECK (status IN ('present', 'absent', 'late', 'excused')),
  checked_at  TIMESTAMPTZ,
  checked_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (slot_id, member_id)
);
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
```

**UI 변경:**
- `feature_flags.attendance === true` 인 조직에서만 표시
- 스케줄 셀 상세 모달에 "출석 확인" 버튼 추가
- 통계 탭에 출석률 요약 뷰 추가

---

### T10: 근무 시간 집계 뷰 (SHIFT:ON)

`feature_flags.volunteer_hours` (SERVE:ON) 와 동일한 집계 로직 공유 가능.

**신규 뷰 컴포넌트:** `src/components/WorkHoursSummary.tsx`

```ts
// 월별 직원별 총 근무 슬롯 수 × 슬롯 시간 = 총 근무 시간
// schedule_slots 테이블 JOIN assignments JOIN profiles
```

- `feature_flags.volunteer_hours === true` (SERVE:ON) 또는 별도 플래그로 제어
- SHIFT:ON: "근무 시간 집계" 탭, SERVE:ON: "봉사 시간 집계" 탭 — 동일 컴포넌트, 라벨만 다름

---

### T11: WORK:ON 선 출시

Google Calendar 연동 없이 기존 기능(팀 스케줄 + 자동 배정 + AI 파싱)만으로 출시.

- `?vertical=professional-office` 딥링크 활성화
- 랜딩페이지 ("Google Calendar 연동 — 곧 출시" 배너 포함)
- `feature_flags.calendar_sync` 플래그 준비만 해둠 (실제 구현은 Phase 4)

---

## 5. Phase 3 — 수익화 시스템 (10~20주)

### T12: iOS 빌드 + App Store

Phase 2 완료 후 LESSON:ON Android 지표가 긍정적이면 착수.

```bash
npx cap add ios
# Codemagic 계정 설정 (Mac 없는 경우)
```

---

### T13: AdSense 웹 광고 + `useAdDisplay` 훅

**`src/hooks/useAdDisplay.ts` (신규):**

```ts
export function useAdDisplay() {
  const { plan } = usePlanLimits()
  const showAds = plan === 'free'
  return { showAds }
}
```

**`src/components/ads/WebAdBanner.tsx` (신규):**

```tsx
export function WebAdBanner({ slot }: { slot: string }) {
  const { showAds } = useAdDisplay()
  if (!showAds) return null
  return (
    <ins
      className="adsbygoogle block"
      data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT}
      data-ad-slot={slot}
    />
  )
}
```

---

### T14: AdMob 앱 광고

```bash
npm install @capacitor-community/admob
```

**`src/components/ads/AppAdBanner.tsx` (신규):**

```tsx
import { AdMob, BannerAdPosition } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'

export function AppAdBanner() {
  const { showAds } = useAdDisplay()
  useEffect(() => {
    if (!showAds || !Capacitor.isNativePlatform()) return
    AdMob.showBanner({
      adId: import.meta.env.VITE_ADMOB_BANNER_ID,
      position: BannerAdPosition.BOTTOM_CENTER,
    })
    return () => { AdMob.removeBanner() }
  }, [showAds])
  return null
}
```

---

### T15: Stripe 구독 결제

**신규 Edge Function:** `supabase/functions/create-checkout/index.ts`

```ts
// POST { plan: 'pro' | 'business', tenantId }
// → Stripe Checkout Session URL 반환
// → 클라이언트가 window.open(url) 으로 결제 페이지 이동
```

**Stripe Webhook:** `supabase/functions/stripe-webhook/index.ts`

```ts
// checkout.session.completed 이벤트 수신
// → tenants.plan 업데이트
```

---

### T16: 업그레이드 유도 모달 + 한도 게이트

**`src/components/modals/UpgradePromptModal.tsx` (신규):**

한도 도달 시 표시하는 업그레이드 유도 모달.

```tsx
// 사용 예시 (멤버 등록 시)
const { maxMembers } = usePlanLimits()
const { memberCount } = useMembers()

if (isAtLimit(memberCount, maxMembers)) {
  return <UpgradePromptModal trigger="멤버 한도" />
}
```

**한도 도달 트리거 목록:**

| 트리거 | 설명 |
|--------|------|
| 멤버 10명 도달 | "멤버를 더 초대하려면 Pro로 업그레이드하세요" |
| 레슨권 3종 도달 | "레슨권 종류를 더 추가하려면 Pro로 업그레이드하세요" |
| SMS 10건 초과 | "이번 달 SMS 한도를 초과했습니다. Pro에서는 100건 제공됩니다" |

---

## 6. Phase 4 — 대규모 신기능 (20주~)

### T17: 고객용 예약 링크 (SALON:ON)

가장 복잡한 신기능. 별도 설계서 필요.

**핵심 설계 방향:**
- `/book/:tenantSlug` — 퍼블릭 예약 페이지 (인증 없이 접근 가능)
- Supabase RLS: anon 권한으로 `schedule_slots` 빈 슬롯만 조회
- 예약 확정 → 비회원 슬롯 등록 + SMS 자동 발송
- `feature_flags.public_booking === true` 인 조직만 활성화

---

### T18: Google Calendar 연동 (WORK:ON)

- Google OAuth → 캘린더 API 액세스 토큰 저장
- DTS 배정 → Google Calendar 이벤트 생성/업데이트/삭제 동기화
- Edge Function으로 토큰 갱신 처리

---

### T19: 담당자-케어 대상 매핑 (CARE:ON)

- `care_assignments` 테이블: 케어 담당자 ↔ 입소자 매핑
- 입소자별 담당 변경 이력 기록
- 주야간 교대 전환 시 담당자 자동 승계 옵션

---

## 7. 파일/디렉터리 구조 변경 계획

```
src/
├── lib/
│   ├── featureFlags.ts        ← T01 신규
│   ├── verticalPresets.ts     ← T03 신규
│   └── brandConfig.ts         ← T04 신규
├── hooks/
│   ├── usePlanLimits.ts       ← T02 신규
│   ├── useAdDisplay.ts        ← T13 신규
│   └── useAndroidBackButton.ts ← T07 신규
├── components/
│   ├── ads/
│   │   ├── WebAdBanner.tsx    ← T13 신규
│   │   └── AppAdBanner.tsx    ← T14 신규
│   └── modals/
│       └── UpgradePromptModal.tsx ← T16 신규
└── pages/
    └── landing/
        ├── LandingLayout.tsx  ← T06 신규
        ├── LandingLessonOn.tsx ← T06 신규
        ├── LandingShiftOn.tsx  ← T06 신규
        └── LandingServeOn.tsx  ← T06 신규

scripts/
└── build-vertical.sh          ← T08 신규

.env.lesson-on                 ← T04 신규
.env.shift-on                  ← T04 신규
.env.serve-on                  ← T04 신규

capacitor/
├── android/                   ← T07 신규
└── ios/                       ← T12 신규 (Phase 3)

supabase/migrations/
├── 084_feature_flags.sql      ← T01
├── 085_plan_limits.sql        ← T02
└── 086_attendance.sql         ← T09 (Phase 2)
```

---

## 8. 구현 시작 순서 (1~2주차 구체적 태스크)

```
Day 1~2:  084_feature_flags.sql 마이그레이션 작성 + 개발 DB 반영
          featureFlags.ts 작성 + 기존 코드 점진적 교체 (showLessons 등)

Day 3~4:  085_plan_limits.sql 마이그레이션
          usePlanLimits.ts 훅 구현

Day 5~7:  verticalPresets.ts 작성
          brandConfig.ts 작성
          .env.lesson-on 파일 작성

Week 2:   셋업 위자드 딥링크 연결 (T05)
          AdminPage feature_flags 토글 UI (T01 후반)
          LESSON:ON 랜딩페이지 초안 (T06)

Week 2 후반 병행: Capacitor 설치 + Android 빌드 확인 (T07)
```

---

## 9. 검증 기준 (Phase 1 완료 조건)

- [ ] `?vertical=lesson-sports` 접속 시 LESSON:ON 랜딩페이지 표시
- [ ] 랜딩 CTA 클릭 → 셋업 위자드 진입 → 모드 자동 설정 확인
- [ ] 슈퍼관리자에서 `feature_flags.lesson_packages = false` 토글 → 레슨권 탭 숨김
- [ ] 무료 플랜 조직 멤버 10명 도달 → 업그레이드 유도 UI 표시
- [ ] `npm run build:lesson-on` → dist/ 빌드 + `npx cap sync android` 성공
- [ ] Android 에뮬레이터에서 앱 실행 확인
