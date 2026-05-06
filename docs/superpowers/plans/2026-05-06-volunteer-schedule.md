# 도서관 자원봉사 스케줄 관리 앱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 도서관 자원봉사자들이 월간 스케줄을 입력·조회·공유할 수 있는 Full-stack 웹 애플리케이션 구축

**Architecture:** React (Vite) SPA가 Supabase JS 클라이언트를 직접 호출. Row Level Security(RLS)로 DB 레벨 권한 제어. `getCellState` 유틸리티가 셀 상태를 계산하고, Supabase Realtime이 다중 사용자 동기화를 담당. 별도 API 서버 없이 Vercel 단일 배포.

**Tech Stack:** React 19 + Vite + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Supabase JS v2, html2canvas, react-router-dom v6, Vitest + @testing-library/react + jsdom

---

## 파일 구조

```
d:/claudePrj/volunteer-schedule/
├── src/
│   ├── types/index.ts               # 전체 TypeScript 타입 정의
│   ├── lib/
│   │   └── supabase.ts              # Supabase 클라이언트
│   ├── utils/
│   │   └── cellState.ts             # getCellState 순수 함수
│   ├── hooks/
│   │   ├── useAuth.ts               # 인증 상태 (로그인/로그아웃/프로필)
│   │   ├── useSchedule.ts           # 스케줄 데이터 CRUD
│   │   └── useRealtime.ts           # Supabase Realtime 구독
│   ├── components/
│   │   ├── auth/LoginModal.tsx      # 로그인 모달
│   │   ├── schedule/
│   │   │   ├── ScheduleHeader.tsx   # 제목 + 연/월 이동
│   │   │   ├── Legend.tsx           # 범례
│   │   │   ├── TimeSlotCell.tsx     # 개별 셀 (색상 + 이름 표시)
│   │   │   └── ScheduleGrid.tsx     # 월간 그리드 조합
│   │   ├── modals/
│   │   │   ├── SlotEditModal.tsx    # 봉사자 이름 입력/수정
│   │   │   └── CapacityModal.tsx    # 관리자용 인원 설정
│   │   └── shared/
│   │       ├── FilterBar.tsx        # 이름 필터 검색
│   │       └── ExportButton.tsx     # 이미지 저장 + URL 공유
│   ├── pages/
│   │   ├── SchedulePage.tsx         # 메인 페이지
│   │   └── SharePage.tsx            # 읽기 전용 공유 뷰
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql           # 테이블 생성
│   │   ├── 002_rls.sql              # RLS 정책
│   │   └── 003_seed.sql             # 기본 규칙 + 2026년 4월 Mock 데이터
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── .env.local                       # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── vercel.json
```

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `d:/claudePrj/volunteer-schedule/` (전체 프로젝트)

- [ ] **Step 1: Vite + React + TypeScript 프로젝트 생성**

```bash
cd d:/claudePrj
npm create vite@latest volunteer-schedule -- --template react-ts
cd volunteer-schedule
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @supabase/supabase-js react-router-dom html2canvas
npm install -D @tailwindcss/vite tailwindcss vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: `vite.config.ts` 설정**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 4: `vitest.config.ts` 설정**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 5: 테스트 setup 파일 생성**

```typescript
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: `src/index.css` 설정 (Tailwind v4)**

```css
/* src/index.css */
@import "tailwindcss";
```

- [ ] **Step 7: 기존 App.css 및 불필요한 파일 삭제**

```bash
rm src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 8: `.env.local` 파일 생성 (플레이스홀더)**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 9: `package.json`의 scripts에 test 추가 확인**

`package.json`에 다음이 있는지 확인, 없으면 추가:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "test": "vitest"
}
```

- [ ] **Step 10: 빌드 확인**

```bash
npm run build
```
Expected: `dist/` 생성, 오류 없음

- [ ] **Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite + React + TS + Tailwind v4 project"
```

---

## Task 2: TypeScript 타입 정의

**Files:**
- Create: `src/types/index.ts`
- Create: `src/types/index.test.ts`

- [ ] **Step 1: 타입 파일 작성**

```typescript
// src/types/index.ts
export type TimeSlot =
  | '10-12'
  | '12-13'
  | '13-14'
  | '14-16'
  | '16-18'
  | '18-20'
  | '20-22';

export const TIME_SLOTS: TimeSlot[] = [
  '10-12', '12-13', '13-14', '14-16', '16-18', '18-20', '20-22',
];

export type UserRole = 'admin' | 'volunteer';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Assignment {
  id: string;
  year: number;
  month: number;
  day: number;
  time_slot: TimeSlot;
  volunteer_name: string;
  note: string | null;
  user_id: string;
  created_at: string;
}

export interface SlotSetting {
  id: string;
  time_slot: TimeSlot;
  max_capacity: number;
  updated_by: string | null;
}

export interface ScheduleRule {
  id: string;
  day_of_week: number; // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  time_slot: TimeSlot;
  is_open: boolean;
}

export interface DateOverride {
  id: string;
  date: string; // 'YYYY-MM-DD'
  is_open: boolean;
  is_holiday: boolean;
  label: string | null;
}

export interface CellState {
  isBreaktime: boolean;
  isClosed: boolean;
  isHoliday: boolean;
  isNightShift: boolean;
  isSaturdayShift: boolean;
  assignments: Assignment[];
  maxCapacity: number;
  isFull: boolean;
}

export interface ModalTarget {
  year: number;
  month: number;
  day: number;
  timeSlot: TimeSlot;
}
```

- [ ] **Step 2: 타입 임포트 스모크 테스트 작성**

```typescript
// src/types/index.test.ts
import { describe, it, expect } from 'vitest'
import { TIME_SLOTS } from './index'

describe('TIME_SLOTS', () => {
  it('contains 7 slots in correct order', () => {
    expect(TIME_SLOTS).toHaveLength(7)
    expect(TIME_SLOTS[0]).toBe('10-12')
    expect(TIME_SLOTS[6]).toBe('20-22')
  })
})
```

- [ ] **Step 3: 테스트 실행**

```bash
npm test
```
Expected: `PASS src/types/index.test.ts`

- [ ] **Step 4: Commit**

```bash
git add src/types/ src/test-setup.ts vitest.config.ts
git commit -m "feat: define TypeScript types and configure Vitest"
```

---

## Task 3: Supabase 클라이언트

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Supabase 클라이언트 파일 작성**

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.ts .env.local
git commit -m "feat: add Supabase client"
```

---

## Task 4: Supabase 스키마 마이그레이션 (SQL)

**Files:**
- Create: `supabase/migrations/001_schema.sql`

> **수동 단계:** Supabase 대시보드(https://supabase.com) → 새 프로젝트 생성 → SQL Editor에서 아래 SQL 실행

- [ ] **Step 1: 스키마 SQL 파일 작성**

```sql
-- supabase/migrations/001_schema.sql

-- profiles 테이블
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'volunteer' check (role in ('admin', 'volunteer')),
  created_at timestamptz default now()
);

-- assignments 테이블
create table if not exists assignments (
  id uuid default gen_random_uuid() primary key,
  year int not null,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  time_slot text not null check (time_slot in ('10-12','12-13','13-14','14-16','16-18','18-20','20-22')),
  volunteer_name text not null,
  note text,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- slot_settings 테이블
create table if not exists slot_settings (
  id uuid default gen_random_uuid() primary key,
  time_slot text not null unique check (time_slot in ('10-12','12-13','13-14','14-16','16-18','18-20','20-22')),
  max_capacity int not null default 2,
  updated_by uuid references profiles(id)
);

-- schedule_rules 테이블 (요일별 기본 오픈/클로즈)
create table if not exists schedule_rules (
  id uuid default gen_random_uuid() primary key,
  day_of_week int not null check (day_of_week between 0 and 6),
  time_slot text not null check (time_slot in ('10-12','12-13','13-14','14-16','16-18','18-20','20-22')),
  is_open boolean not null default true,
  unique (day_of_week, time_slot)
);

-- date_overrides 테이블 (특정 날짜 예외 설정)
create table if not exists date_overrides (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  is_open boolean not null default true,
  is_holiday boolean not null default false,
  label text
);

-- Realtime 활성화
alter publication supabase_realtime add table assignments;
```

- [ ] **Step 2: Supabase SQL Editor에서 실행하여 테이블 생성 확인**

대시보드 → Table Editor에서 5개 테이블 존재 확인: `profiles`, `assignments`, `slot_settings`, `schedule_rules`, `date_overrides`

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migration SQL"
```

---

## Task 5: RLS 정책 + Seed 데이터

**Files:**
- Create: `supabase/migrations/002_rls.sql`
- Create: `supabase/migrations/003_seed.sql`

- [ ] **Step 1: RLS 정책 SQL 작성**

```sql
-- supabase/migrations/002_rls.sql

-- profiles RLS
alter table profiles enable row level security;
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- assignments RLS
alter table assignments enable row level security;
create policy "assignments_select_all" on assignments for select using (true);
create policy "assignments_insert_own" on assignments for insert with check (auth.uid() = user_id);
create policy "assignments_update_own" on assignments for update using (auth.uid() = user_id);
create policy "assignments_delete_own" on assignments for delete using (auth.uid() = user_id);
create policy "assignments_admin_all" on assignments for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- slot_settings RLS
alter table slot_settings enable row level security;
create policy "slot_settings_select_all" on slot_settings for select using (true);
create policy "slot_settings_admin_all" on slot_settings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- schedule_rules RLS
alter table schedule_rules enable row level security;
create policy "schedule_rules_select_all" on schedule_rules for select using (true);
create policy "schedule_rules_admin_all" on schedule_rules for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- date_overrides RLS
alter table date_overrides enable row level security;
create policy "date_overrides_select_all" on date_overrides for select using (true);
create policy "date_overrides_admin_all" on date_overrides for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

- [ ] **Step 2: Seed 데이터 SQL 작성 (schedule_rules)**

```sql
-- supabase/migrations/003_seed.sql
-- 요일별 기본 규칙 삽입 (0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토)
-- 일요일 전체 CLOSE
insert into schedule_rules (day_of_week, time_slot, is_open) values
(0, '10-12', false), (0, '12-13', false), (0, '13-14', false),
(0, '14-16', false), (0, '16-18', false), (0, '18-20', false), (0, '20-22', false),
-- 월/수/금: 낮타임 오픈, 18시 이후 CLOSE
(1, '10-12', true),  (1, '12-13', false), (1, '13-14', true),
(1, '14-16', true),  (1, '16-18', true),  (1, '18-20', false), (1, '20-22', false),
(3, '10-12', true),  (3, '12-13', false), (3, '13-14', true),
(3, '14-16', true),  (3, '16-18', true),  (3, '18-20', false), (3, '20-22', false),
(5, '10-12', true),  (5, '12-13', false), (5, '13-14', true),
(5, '14-16', true),  (5, '16-18', true),  (5, '18-20', false), (5, '20-22', false),
-- 화/목: 낮타임 + 밤타임(18-22) 오픈
(2, '10-12', true),  (2, '12-13', false), (2, '13-14', true),
(2, '14-16', true),  (2, '16-18', true),  (2, '18-20', true),  (2, '20-22', true),
(4, '10-12', true),  (4, '12-13', false), (4, '13-14', true),
(4, '14-16', true),  (4, '16-18', true),  (4, '18-20', true),  (4, '20-22', true),
-- 토요일: 10-14시만 오픈
(6, '10-12', true),  (6, '12-13', false), (6, '13-14', true),
(6, '14-16', false), (6, '16-18', false), (6, '18-20', false), (6, '20-22', false);

-- 슬롯별 기본 인원 설정
insert into slot_settings (time_slot, max_capacity) values
('10-12', 2), ('12-13', 0), ('13-14', 2),
('14-16', 3), ('16-18', 2), ('18-20', 2), ('20-22', 2);
```

> **Note:** assignments Mock 데이터(이연화, 최민화 등 2026년 4월 데이터)는 Supabase Auth 사용자 계정이 먼저 생성되어야 삽입 가능하므로 앱 완성 후 관리자 계정으로 직접 입력하거나 별도 seed 스크립트로 처리.

- [ ] **Step 3: Supabase SQL Editor에서 002_rls.sql, 003_seed.sql 순서대로 실행**

```
대시보드 → SQL Editor → 002_rls.sql 내용 붙여넣기 → Run
대시보드 → SQL Editor → 003_seed.sql 내용 붙여넣기 → Run
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add RLS policies and seed schedule rules"
```

---

## Task 6: getCellState 유틸리티

**Files:**
- Create: `src/utils/cellState.ts`
- Create: `src/utils/cellState.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// src/utils/cellState.test.ts
import { describe, it, expect } from 'vitest'
import { getCellState } from './cellState'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride } from '../types'

const baseRules: ScheduleRule[] = [
  { id: '1', day_of_week: 1, time_slot: '10-12', is_open: true },   // 월요일 10-12 오픈
  { id: '2', day_of_week: 1, time_slot: '20-22', is_open: false },  // 월요일 20-22 CLOSE
  { id: '3', day_of_week: 2, time_slot: '20-22', is_open: true },   // 화요일 20-22 오픈
]
const baseSettings: SlotSetting[] = [
  { id: '1', time_slot: '10-12', max_capacity: 2, updated_by: null },
]
const noOverrides: DateOverride[] = []
const noAssignments: Assignment[] = []

describe('getCellState', () => {
  it('returns isBreaktime=true for 12-13 slot', () => {
    // 2026-04-06은 월요일
    const state = getCellState(6, '12-13', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isBreaktime).toBe(true)
    expect(state.isClosed).toBe(true)
  })

  it('returns isClosed=true for Sunday', () => {
    // 2026-04-05는 일요일
    const state = getCellState(5, '10-12', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isHoliday).toBe(true)
    expect(state.isClosed).toBe(true)
  })

  it('returns isClosed=true for 월요일 20-22', () => {
    const state = getCellState(6, '20-22', 2026, 4, baseRules, baseSettings, noOverrides, noAssignments)
    expect(state.isClosed).toBe(true)
    expect(state.isHoliday).toBe(false)
  })

  it('returns isNightShift=true for 18-20 slot on 화요일', () => {
    const rules = [...baseRules, { id: '4', day_of_week: 2, time_slot: '18-20' as const, is_open: true }]
    const state = getCellState(7, '18-20', 2026, 4, rules, baseSettings, noOverrides, noAssignments)
    expect(state.isNightShift).toBe(true)
    expect(state.isClosed).toBe(false)
  })

  it('returns isFull=true when assignments >= maxCapacity', () => {
    const assignments: Assignment[] = [
      { id: 'a1', year: 2026, month: 4, day: 6, time_slot: '10-12', volunteer_name: '홍길동', note: null, user_id: 'u1', created_at: '' },
      { id: 'a2', year: 2026, month: 4, day: 6, time_slot: '10-12', volunteer_name: '김철수', note: null, user_id: 'u2', created_at: '' },
    ]
    const state = getCellState(6, '10-12', 2026, 4, baseRules, baseSettings, noOverrides, assignments)
    expect(state.isFull).toBe(true)
    expect(state.assignments).toHaveLength(2)
  })

  it('respects date_override holiday', () => {
    const overrides: DateOverride[] = [
      { id: 'o1', date: '2026-04-06', is_open: false, is_holiday: true, label: '휴관일' }
    ]
    const state = getCellState(6, '10-12', 2026, 4, baseRules, baseSettings, overrides, noAssignments)
    expect(state.isHoliday).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npm test -- cellState
```
Expected: FAIL - `getCellState` not found

- [ ] **Step 3: getCellState 구현**

```typescript
// src/utils/cellState.ts
import type { TimeSlot, Assignment, SlotSetting, ScheduleRule, DateOverride, CellState } from '../types'

export function getCellState(
  day: number,
  timeSlot: TimeSlot,
  year: number,
  month: number,
  scheduleRules: ScheduleRule[],
  slotSettings: SlotSetting[],
  dateOverrides: DateOverride[],
  allAssignments: Assignment[]
): CellState {
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay() // 0=일, 6=토
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const isBreaktime = timeSlot === '12-13'
  const override = dateOverrides.find(d => d.date === dateStr)
  const isHoliday = override?.is_holiday === true || dayOfWeek === 0

  if (isHoliday || isBreaktime) {
    return { isBreaktime, isClosed: true, isHoliday, isNightShift: false, isSaturdayShift: false, assignments: [], maxCapacity: 0, isFull: false }
  }

  const rule = scheduleRules.find(r => r.day_of_week === dayOfWeek && r.time_slot === timeSlot)
  const isClosed = rule ? !rule.is_open : true

  const isNightShift = timeSlot === '18-20' || timeSlot === '20-22'
  const isSaturdayShift = dayOfWeek === 6

  const dayAssignments = allAssignments.filter(
    a => a.year === year && a.month === month && a.day === day && a.time_slot === timeSlot
  )

  const setting = slotSettings.find(s => s.time_slot === timeSlot)
  const maxCapacity = setting?.max_capacity ?? 2

  return {
    isBreaktime: false,
    isClosed,
    isHoliday: false,
    isNightShift,
    isSaturdayShift,
    assignments: dayAssignments,
    maxCapacity,
    isFull: dayAssignments.length >= maxCapacity,
  }
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

```bash
npm test -- cellState
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add getCellState utility with tests"
```

---

## Task 7: useAuth 훅

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: useAuth 훅 작성**

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { profile, loading, signIn, signOut }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook"
```

---

## Task 8: useSchedule 훅

**Files:**
- Create: `src/hooks/useSchedule.ts`

- [ ] **Step 1: useSchedule 훅 작성 (Realtime 구독 내장)**

```typescript
// src/hooks/useSchedule.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot } from '../types'

interface ScheduleData {
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  loading: boolean
  addAssignment: (params: AddParams) => Promise<string | null>
  updateAssignment: (id: string, params: UpdateParams) => Promise<string | null>
  deleteAssignment: (id: string) => Promise<string | null>
  updateSlotCapacity: (timeSlot: TimeSlot, maxCapacity: number) => Promise<string | null>
}

interface AddParams {
  year: number; month: number; day: number
  time_slot: TimeSlot; volunteer_name: string
  note?: string; user_id: string
}

interface UpdateParams {
  volunteer_name?: string; note?: string
}

export function useSchedule(year: number, month: number): ScheduleData {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([])
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([])
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('assignments').select('*').eq('year', year).eq('month', month),
      supabase.from('slot_settings').select('*'),
      supabase.from('schedule_rules').select('*'),
      supabase.from('date_overrides').select('*')
        .gte('date', `${year}-${String(month).padStart(2,'0')}-01`)
        .lte('date', `${year}-${String(month).padStart(2,'0')}-31`),
    ]).then(([a, ss, sr, do_]) => {
      if (a.data) setAssignments(a.data)
      if (ss.data) setSlotSettings(ss.data)
      if (sr.data) setScheduleRules(sr.data)
      if (do_.data) setDateOverrides(do_.data)
      setLoading(false)
    })

    // Realtime 구독: 다른 사용자의 변경사항을 실시간으로 반영
    const channel = supabase
      .channel(`assignments-${year}-${month}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assignments', filter: `year=eq.${year}` },
        payload => setAssignments(prev => {
          const incoming = payload.new as Assignment
          if (incoming.month !== month) return prev
          return prev.some(a => a.id === incoming.id) ? prev : [...prev, incoming]
        })
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `year=eq.${year}` },
        payload => {
          const updated = payload.new as Assignment
          if (updated.month === month) {
            setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a))
          }
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'assignments' },
        payload => setAssignments(prev => prev.filter(a => a.id !== payload.old.id))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [year, month])

  const addAssignment = useCallback(async (params: AddParams): Promise<string | null> => {
    const { error } = await supabase.from('assignments').insert(params)
    if (error) return error.message
    // Realtime INSERT 이벤트가 setAssignments를 처리하므로 별도 re-fetch 불필요
    return null
  }, [])

  const updateAssignment = useCallback(async (id: string, params: UpdateParams): Promise<string | null> => {
    const { error } = await supabase.from('assignments').update(params).eq('id', id)
    if (error) return error.message
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...params } : a))
    return null
  }, [])

  const deleteAssignment = useCallback(async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) return error.message
    setAssignments(prev => prev.filter(a => a.id !== id))
    return null
  }, [])

  const updateSlotCapacity = useCallback(async (timeSlot: TimeSlot, maxCapacity: number): Promise<string | null> => {
    const { error } = await supabase.from('slot_settings').update({ max_capacity: maxCapacity }).eq('time_slot', timeSlot)
    if (error) return error.message
    setSlotSettings(prev => prev.map(s => s.time_slot === timeSlot ? { ...s, max_capacity: maxCapacity } : s))
    return null
  }, [])

  return { assignments, slotSettings, scheduleRules, dateOverrides, loading, addAssignment, updateAssignment, deleteAssignment, updateSlotCapacity }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSchedule.ts
git commit -m "feat: add useSchedule hook with CRUD operations"
```

---

## Task 9: useRealtime 훅

**Files:**
- Create: `src/hooks/useRealtime.ts`

- [ ] **Step 1: useRealtime 훅 작성**

```typescript
// src/hooks/useRealtime.ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Assignment } from '../types'

interface RealtimeOptions {
  year: number
  month: number
  onInsert: (assignment: Assignment) => void
  onUpdate: (assignment: Assignment) => void
  onDelete: (id: string) => void
}

export function useRealtime({ year, month, onInsert, onUpdate, onDelete }: RealtimeOptions) {
  useEffect(() => {
    const channel = supabase
      .channel(`assignments-${year}-${month}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assignments', filter: `year=eq.${year}` },
        payload => onInsert(payload.new as Assignment)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `year=eq.${year}` },
        payload => onUpdate(payload.new as Assignment)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'assignments' },
        payload => onDelete(payload.old.id as string)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [year, month, onInsert, onUpdate, onDelete])
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useRealtime.ts
git commit -m "feat: add useRealtime hook for live updates"
```

---

## Task 10: ScheduleHeader 컴포넌트

**Files:**
- Create: `src/components/schedule/ScheduleHeader.tsx`
- Create: `src/components/schedule/ScheduleHeader.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// src/components/schedule/ScheduleHeader.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScheduleHeader } from './ScheduleHeader'

describe('ScheduleHeader', () => {
  it('displays year and month', () => {
    render(<ScheduleHeader year={2026} month={4} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('2026년 04월 자원봉사활동 스케줄')).toBeInTheDocument()
  })

  it('calls onPrev when < button clicked', () => {
    const onPrev = vi.fn()
    render(<ScheduleHeader year={2026} month={4} onPrev={onPrev} onNext={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /이전/ }))
    expect(onPrev).toHaveBeenCalledOnce()
  })

  it('calls onNext when > button clicked', () => {
    const onNext = vi.fn()
    render(<ScheduleHeader year={2026} month={4} onPrev={vi.fn()} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /다음/ }))
    expect(onNext).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npm test -- ScheduleHeader
```
Expected: FAIL

- [ ] **Step 3: 컴포넌트 구현**

```tsx
// src/components/schedule/ScheduleHeader.tsx
interface Props {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function ScheduleHeader({ year, month, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrev}
        aria-label="이전 달"
        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm"
      >
        &lt; 이전
      </button>
      <h1 className="text-xl font-bold text-gray-800">
        {year}년 {String(month).padStart(2, '0')}월 자원봉사활동 스케줄
      </h1>
      <button
        onClick={onNext}
        aria-label="다음 달"
        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm"
      >
        다음 &gt;
      </button>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

```bash
npm test -- ScheduleHeader
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/ScheduleHeader.tsx src/components/schedule/ScheduleHeader.test.tsx
git commit -m "feat: add ScheduleHeader component"
```

---

## Task 11: Legend 컴포넌트

**Files:**
- Create: `src/components/schedule/Legend.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// src/components/schedule/Legend.tsx
export function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-700 mt-3 mb-1 px-1">
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 rounded bg-pink-100 border border-pink-300" />
        <span>★ 밤타임 (18~22시)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
        <span>★ 토요일 운영 (10~14시)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 rounded bg-gray-200 border border-gray-300" />
        <span>BREAKTIME (12~13시)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-10 h-4 rounded bg-pink-50 border border-pink-200 text-center leading-4">50+</span>
        <span>50플러스 활동가 (4/1~10/31)</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/schedule/Legend.tsx
git commit -m "feat: add Legend component"
```

---

## Task 12: TimeSlotCell 컴포넌트

**Files:**
- Create: `src/components/schedule/TimeSlotCell.tsx`
- Create: `src/components/schedule/TimeSlotCell.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// src/components/schedule/TimeSlotCell.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimeSlotCell } from './TimeSlotCell'
import type { CellState } from '../../types'

const baseCellState: CellState = {
  isBreaktime: false, isClosed: false, isHoliday: false,
  isNightShift: false, isSaturdayShift: false,
  assignments: [], maxCapacity: 2, isFull: false,
}

describe('TimeSlotCell', () => {
  it('shows BREAKTIME text when isBreaktime', () => {
    render(<TimeSlotCell cellState={{ ...baseCellState, isBreaktime: true }} onClick={vi.fn()} highlightName={null} />)
    expect(screen.getByText('BREAKTIME')).toBeInTheDocument()
  })

  it('shows CLOSE text when isClosed', () => {
    render(<TimeSlotCell cellState={{ ...baseCellState, isClosed: true }} onClick={vi.fn()} highlightName={null} />)
    expect(screen.getByText('CLOSE')).toBeInTheDocument()
  })

  it('shows volunteer names from assignments', () => {
    const state: CellState = {
      ...baseCellState,
      assignments: [{ id: '1', year: 2026, month: 4, day: 1, time_slot: '10-12', volunteer_name: '이연화', note: null, user_id: 'u1', created_at: '' }],
    }
    render(<TimeSlotCell cellState={state} onClick={vi.fn()} highlightName={null} />)
    expect(screen.getByText('이연화')).toBeInTheDocument()
  })

  it('calls onClick when editable cell clicked', () => {
    const onClick = vi.fn()
    render(<TimeSlotCell cellState={baseCellState} onClick={onClick} highlightName={null} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies pink background for night shift', () => {
    const { container } = render(
      <TimeSlotCell cellState={{ ...baseCellState, isNightShift: true }} onClick={vi.fn()} highlightName={null} />
    )
    expect(container.firstChild).toHaveClass('bg-pink-50')
  })
})
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npm test -- TimeSlotCell
```
Expected: FAIL

- [ ] **Step 3: 컴포넌트 구현**

```tsx
// src/components/schedule/TimeSlotCell.tsx
import type { CellState } from '../../types'

interface Props {
  cellState: CellState
  onClick: () => void
  highlightName: string | null
}

export function TimeSlotCell({ cellState, onClick, highlightName }: Props) {
  const { isBreaktime, isClosed, isHoliday, isNightShift, isSaturdayShift, assignments, isFull } = cellState

  if (isBreaktime) {
    return (
      <div className="min-h-[2.5rem] bg-gray-100 flex items-center justify-center text-xs text-gray-500 border border-gray-200">
        BREAKTIME
      </div>
    )
  }

  if (isHoliday || isClosed) {
    return (
      <div className="min-h-[2.5rem] bg-gray-200 flex items-center justify-center text-xs text-gray-500 border border-gray-200">
        {isHoliday ? '휴관' : 'CLOSE'}
      </div>
    )
  }

  const bgClass = isNightShift
    ? 'bg-pink-50 hover:bg-pink-100'
    : isSaturdayShift
    ? 'bg-yellow-50 hover:bg-yellow-100'
    : 'bg-white hover:bg-blue-50'

  return (
    <button
      onClick={onClick}
      className={`min-h-[2.5rem] w-full text-left px-1 py-0.5 border border-gray-200 ${bgClass} transition-colors`}
    >
      {isNightShift && <span className="text-pink-400 mr-0.5">★</span>}
      {isSaturdayShift && !isNightShift && <span className="text-yellow-400 mr-0.5">★</span>}
      <div className="flex flex-col gap-0.5">
        {assignments.map(a => (
          <span
            key={a.id}
            className={`text-xs truncate ${highlightName && a.volunteer_name.includes(highlightName) ? 'bg-yellow-200 font-bold rounded px-0.5' : ''}`}
          >
            {a.volunteer_name}{a.note ? `(${a.note})` : ''}
          </span>
        ))}
        {isFull && <span className="text-xs text-red-400">(정원 마감)</span>}
      </div>
    </button>
  )
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

```bash
npm test -- TimeSlotCell
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/TimeSlotCell.tsx src/components/schedule/TimeSlotCell.test.tsx
git commit -m "feat: add TimeSlotCell component with color rules"
```

---

## Task 13: ScheduleGrid 컴포넌트

**Files:**
- Create: `src/components/schedule/ScheduleGrid.tsx`
- Create: `src/components/schedule/ScheduleGrid.test.tsx`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// src/components/schedule/ScheduleGrid.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScheduleGrid } from './ScheduleGrid'

const mockProps = {
  year: 2026,
  month: 4,
  assignments: [],
  slotSettings: [],
  scheduleRules: [],
  dateOverrides: [],
  highlightName: null,
  onCellClick: vi.fn(),
}

describe('ScheduleGrid', () => {
  it('renders day headers for April 2026', () => {
    render(<ScheduleGrid {...mockProps} />)
    // 2026년 4월은 1일~30일
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('renders time slot labels', () => {
    render(<ScheduleGrid {...mockProps} />)
    expect(screen.getByText('10-12')).toBeInTheDocument()
    expect(screen.getByText('20-22')).toBeInTheDocument()
  })

  it('renders BREAKTIME cells for 12-13 row', () => {
    render(<ScheduleGrid {...mockProps} />)
    const breaktimeCells = screen.getAllByText('BREAKTIME')
    expect(breaktimeCells.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
npm test -- ScheduleGrid
```
Expected: FAIL

- [ ] **Step 3: 컴포넌트 구현**

```tsx
// src/components/schedule/ScheduleGrid.tsx
import { getCellState } from '../../utils/cellState'
import { TIME_SLOTS } from '../../types'
import { TimeSlotCell } from './TimeSlotCell'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget } from '../../types'

interface Props {
  year: number
  month: number
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  onCellClick: (target: ModalTarget) => void
}

function getDaysInMonth(year: number, month: number): number[] {
  const count = new Date(year, month, 0).getDate()
  return Array.from({ length: count }, (_, i) => i + 1)
}

function getDayLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  const labels = ['일', '월', '화', '수', '목', '금', '토']
  return labels[date.getDay()]
}

export function ScheduleGrid({ year, month, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, onCellClick }: Props) {
  const days = getDaysInMonth(year, month)

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full min-w-max">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs sticky left-0 z-10">시간/일자</th>
            {days.map(day => {
              const label = getDayLabel(year, month, day)
              const isSat = label === '토'
              const isSun = label === '일'
              return (
                <th
                  key={day}
                  className={`border border-gray-300 px-1 py-1 text-xs font-medium min-w-[4.5rem]
                    ${isSun ? 'text-red-500 bg-red-50' : isSat ? 'text-blue-600 bg-blue-50' : 'bg-gray-50'}`}
                >
                  {day}<br />{label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map(slot => (
            <tr key={slot}>
              <td className="border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-center sticky left-0 z-10 whitespace-nowrap">
                {slot}
              </td>
              {days.map(day => {
                const cellState = getCellState(day, slot as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
                return (
                  <td key={day} className="border border-gray-200 p-0">
                    <TimeSlotCell
                      cellState={cellState}
                      highlightName={highlightName}
                      onClick={() => onCellClick({ year, month, day, timeSlot: slot as TimeSlot })}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

```bash
npm test -- ScheduleGrid
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/ScheduleGrid.tsx src/components/schedule/ScheduleGrid.test.tsx
git commit -m "feat: add ScheduleGrid component"
```

---

## Task 14: LoginModal 컴포넌트

**Files:**
- Create: `src/components/auth/LoginModal.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// src/components/auth/LoginModal.tsx
import { useState } from 'react'

interface Props {
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<string | null>
}

export function LoginModal({ onClose, onSignIn }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const err = await onSignIn(email, password)
    setLoading(false)
    if (err) setError(err)
    else onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? '로그인 중...' : '로그인'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded py-2 text-sm hover:bg-gray-50">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/LoginModal.tsx
git commit -m "feat: add LoginModal component"
```

---

## Task 15: SlotEditModal 컴포넌트

**Files:**
- Create: `src/components/modals/SlotEditModal.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// src/components/modals/SlotEditModal.tsx
import { useState } from 'react'
import type { Assignment, CellState, ModalTarget, Profile } from '../../types'

interface Props {
  target: ModalTarget
  cellState: CellState
  profile: Profile | null
  onClose: () => void
  onAdd: (volunteerName: string, note: string) => Promise<string | null>
  onUpdate: (id: string, volunteerName: string, note: string) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
}

export function SlotEditModal({ target, cellState, profile, onClose, onAdd, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const { day, month, year, timeSlot } = target

  function startEdit(a: Assignment) {
    setEditingId(a.id)
    setName(a.volunteer_name)
    setNote(a.note ?? '')
  }

  async function handleAdd() {
    if (!name.trim()) return
    if (!isAdmin && cellState.isFull) { setError('정원이 마감되었습니다'); return }
    setLoading(true)
    const err = await onAdd(name.trim(), note.trim())
    setLoading(false)
    if (err) setError(err)
    else { setName(''); setNote('') }
  }

  async function handleUpdate() {
    if (!editingId || !name.trim()) return
    setLoading(true)
    const err = await onUpdate(editingId, name.trim(), note.trim())
    setLoading(false)
    if (err) setError(err)
    else { setEditingId(null); setName(''); setNote('') }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const err = await onDelete(id)
    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {year}년 {month}월 {day}일 {timeSlot}시
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* 기존 배정 목록 */}
        {cellState.assignments.length > 0 && (
          <div className="mb-4 space-y-2">
            {cellState.assignments.map(a => {
              const canEdit = isAdmin || a.user_id === profile?.id
              return (
                <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                  <span className="text-sm">{a.volunteer_name}{a.note ? ` (${a.note})` : ''}</span>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(a)} className="text-xs text-blue-500 hover:underline">수정</button>
                      <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:underline">삭제</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 편집 폼 (로그인한 경우만) */}
        {profile && (
          <div className="space-y-2">
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="봉사자 이름"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="메모 (선택, 예: 2-6)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={loading || !name.trim()}
                className="flex-1 bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '저장 중...' : editingId ? '수정' : '추가'}
              </button>
              <button onClick={onClose} className="flex-1 border border-gray-300 rounded py-2 text-sm hover:bg-gray-50">
                닫기
              </button>
            </div>
          </div>
        )}

        {!profile && (
          <p className="text-sm text-gray-500 text-center">로그인 후 스케줄을 입력할 수 있습니다.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/SlotEditModal.tsx
git commit -m "feat: add SlotEditModal component"
```

---

## Task 16: CapacityModal 컴포넌트 (관리자용)

**Files:**
- Create: `src/components/modals/CapacityModal.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
// src/components/modals/CapacityModal.tsx
import { useState } from 'react'
import { TIME_SLOTS } from '../../types'
import type { SlotSetting, TimeSlot } from '../../types'

interface Props {
  slotSettings: SlotSetting[]
  onClose: () => void
  onUpdate: (timeSlot: TimeSlot, maxCapacity: number) => Promise<string | null>
}

export function CapacityModal({ slotSettings, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(timeSlot: TimeSlot, value: string) {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 0) return
    setLoading(timeSlot)
    const err = await onUpdate(timeSlot, n)
    setLoading(null)
    if (err) setError(err)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">슬롯별 최대 인원 설정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <div className="space-y-2">
          {TIME_SLOTS.filter(s => s !== '12-13').map(slot => {
            const setting = slotSettings.find(s => s.time_slot === slot)
            return (
              <div key={slot} className="flex items-center justify-between">
                <span className="text-sm font-medium w-20">{slot}시</span>
                <input
                  type="number" min={0} max={10}
                  defaultValue={setting?.max_capacity ?? 2}
                  disabled={loading === slot}
                  onBlur={e => handleChange(slot as TimeSlot, e.target.value)}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <span className="text-xs text-gray-400">명</span>
              </div>
            )
          })}
        </div>
        <button onClick={onClose} className="mt-4 w-full border border-gray-300 rounded py-2 text-sm hover:bg-gray-50">
          닫기
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/modals/CapacityModal.tsx
git commit -m "feat: add CapacityModal for admin slot capacity management"
```

---

## Task 17: FilterBar + ExportButton 컴포넌트

**Files:**
- Create: `src/components/shared/FilterBar.tsx`
- Create: `src/components/shared/ExportButton.tsx`

- [ ] **Step 1: FilterBar 구현**

```tsx
// src/components/shared/FilterBar.tsx
interface Props {
  value: string
  onChange: (value: string) => void
}

export function FilterBar({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">이름으로 찾기:</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder="봉사자 이름 입력"
        className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
      />
      {value && (
        <button onClick={() => onChange('')} className="text-gray-400 hover:text-gray-600 text-sm">
          ✕ 초기화
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: ExportButton 구현**

```tsx
// src/components/shared/ExportButton.tsx
import html2canvas from 'html2canvas'

interface Props {
  targetId: string   // 캡처할 요소의 id
  year: number
  month: number
}

export function ExportButton({ targetId, year, month }: Props) {
  async function handleImageSave() {
    const el = document.getElementById(targetId)
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2 })
    const link = document.createElement('a')
    link.download = `volunteer-schedule-${year}-${String(month).padStart(2, '0')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handleShareUrl() {
    const url = `${window.location.origin}/share?year=${year}&month=${month}`
    navigator.clipboard.writeText(url).then(() => alert('공유 URL이 클립보드에 복사되었습니다.\n' + url))
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleImageSave}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
      >
        📷 이미지 저장
      </button>
      <button
        onClick={handleShareUrl}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
      >
        🔗 공유 URL
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add FilterBar and ExportButton components"
```

---

## Task 18: SchedulePage (메인 페이지)

**Files:**
- Create: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: SchedulePage 구현**

```tsx
// src/pages/SchedulePage.tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSchedule } from '../hooks/useSchedule'
import { getCellState } from '../utils/cellState'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { MobileScheduleView } from '../components/schedule/MobileScheduleView'
import { Legend } from '../components/schedule/Legend'
import { FilterBar } from '../components/shared/FilterBar'
import { ExportButton } from '../components/shared/ExportButton'
import { LoginModal } from '../components/auth/LoginModal'
import { SlotEditModal } from '../components/modals/SlotEditModal'
import { CapacityModal } from '../components/modals/CapacityModal'
import type { ModalTarget } from '../types'

export function SchedulePage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [highlightName, setHighlightName] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showCapacity, setShowCapacity] = useState(false)
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)

  const { profile, signIn, signOut } = useAuth()
  // useSchedule에 Realtime 구독이 내장되어 있어 별도 useRealtime 불필요
  const { assignments, slotSettings, scheduleRules, dateOverrides, loading, addAssignment, updateAssignment, deleteAssignment, updateSlotCapacity } = useSchedule(year, month)

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const selectedCellState = modalTarget
    ? getCellState(modalTarget.day, modalTarget.timeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* 상단 툴바 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <FilterBar value={highlightName} onChange={setHighlightName} />
          <div className="flex items-center gap-2">
            <ExportButton targetId="schedule-grid-container" year={year} month={month} />
            {profile ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{profile.name} ({profile.role === 'admin' ? '관리자' : '봉사자'})</span>
                {profile.role === 'admin' && (
                  <button onClick={() => setShowCapacity(true)} className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                    인원 설정
                  </button>
                )}
                <button onClick={signOut} className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                로그인
              </button>
            )}
          </div>
        </div>

        {/* 스케줄 영역 */}
        <div id="schedule-grid-container" className="bg-white rounded-lg shadow p-4">
          <ScheduleHeader year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
          <Legend />
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>
          ) : (
            <>
              {/* 데스크탑: 가로 그리드 */}
              <div className="hidden md:block">
                <ScheduleGrid
                  year={year} month={month}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                  highlightName={highlightName || null}
                  onCellClick={setModalTarget}
                />
              </div>
              {/* 모바일: 날짜별 카드 리스트 */}
              <div className="block md:hidden">
                <MobileScheduleView
                  year={year} month={month}
                  assignments={assignments} slotSettings={slotSettings}
                  scheduleRules={scheduleRules} dateOverrides={dateOverrides}
                  highlightName={highlightName || null}
                  onCellClick={setModalTarget}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모달 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSignIn={signIn} />}

      {modalTarget && selectedCellState && (
        <SlotEditModal
          target={modalTarget}
          cellState={selectedCellState}
          profile={profile}
          onClose={() => setModalTarget(null)}
          onAdd={(name, note) => addAssignment({ ...modalTarget, time_slot: modalTarget.timeSlot, volunteer_name: name, note: note || undefined, user_id: profile!.id })}
          onUpdate={(id, name, note) => updateAssignment(id, { volunteer_name: name, note })}
          onDelete={deleteAssignment}
        />
      )}

      {showCapacity && profile?.role === 'admin' && (
        <CapacityModal slotSettings={slotSettings} onClose={() => setShowCapacity(false)} onUpdate={updateSlotCapacity} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SchedulePage.tsx
git commit -m "feat: add SchedulePage with full feature integration"
```

---

## Task 19: SharePage (읽기 전용)

**Files:**
- Create: `src/pages/SharePage.tsx`

- [ ] **Step 1: SharePage 구현**

```tsx
// src/pages/SharePage.tsx
import { useSearchParams } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import { ScheduleHeader } from '../components/schedule/ScheduleHeader'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { Legend } from '../components/schedule/Legend'

export function SharePage() {
  const [params] = useSearchParams()
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(params.get('month') ?? String(new Date().getMonth() + 1))

  const { assignments, slotSettings, scheduleRules, dateOverrides, loading } = useSchedule(year, month)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow p-4 max-w-full">
        <div className="mb-2 text-xs text-gray-400 text-right">읽기 전용 공유 뷰</div>
        <ScheduleHeader year={year} month={month} onPrev={() => {}} onNext={() => {}} />
        <Legend />
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>
        ) : (
          <ScheduleGrid
            year={year} month={month}
            assignments={assignments} slotSettings={slotSettings}
            scheduleRules={scheduleRules} dateOverrides={dateOverrides}
            highlightName={null}
            onCellClick={() => {}} // 읽기 전용 - 클릭 비활성
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SharePage.tsx
git commit -m "feat: add SharePage read-only view"
```

---

## Task 20: App.tsx 라우팅 + main.tsx 연결

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: App.tsx 작성**

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SchedulePage } from './pages/SchedulePage'
import { SharePage } from './pages/SharePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SchedulePage />} />
        <Route path="/share" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: main.tsx 확인/수정**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: 빌드 확인**

```bash
npm run build
```
Expected: 오류 없이 `dist/` 생성

- [ ] **Step 4: 개발 서버 실행 및 브라우저 확인**

```bash
npm run dev
```
Expected: `http://localhost:5173` 에서 스케줄 그리드 렌더링 확인

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire up routing in App.tsx"
```

---

## Task 21: 반응형 모바일 레이아웃

**Files:**
- Create: `src/components/schedule/MobileScheduleView.tsx`
- Modify: `src/pages/SchedulePage.tsx`

- [ ] **Step 1: MobileScheduleView 구현 (날짜별 카드)**

```tsx
// src/components/schedule/MobileScheduleView.tsx
import { useState } from 'react'
import { getCellState } from '../../utils/cellState'
import { TIME_SLOTS } from '../../types'
import { TimeSlotCell } from './TimeSlotCell'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, ModalTarget } from '../../types'

interface Props {
  year: number; month: number
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  onCellClick: (target: ModalTarget) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function MobileScheduleView({ year, month, assignments, slotSettings, scheduleRules, dateOverrides, highlightName, onCellClick }: Props) {
  const daysCount = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysCount }, (_, i) => i + 1)
  const [selectedDay, setSelectedDay] = useState(1)
  const dayLabel = DAY_LABELS[new Date(year, month - 1, selectedDay).getDay()]
  const isSun = dayLabel === '일'
  const isSat = dayLabel === '토'

  return (
    <div>
      {/* 날짜 탭 스크롤 */}
      <div className="flex overflow-x-auto gap-1 pb-2 mb-3">
        {days.map(d => {
          const dl = DAY_LABELS[new Date(year, month - 1, d).getDay()]
          const isSunDay = dl === '일'
          const isSatDay = dl === '토'
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`flex-shrink-0 w-10 h-12 rounded text-xs font-medium border
                ${selectedDay === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}
                ${isSunDay && selectedDay !== d ? 'text-red-500' : ''}
                ${isSatDay && selectedDay !== d ? 'text-blue-600' : ''}`}
            >
              <div>{d}</div>
              <div>{dl}</div>
            </button>
          )
        })}
      </div>

      {/* 선택된 날짜의 슬롯 */}
      <div className="text-sm font-bold mb-2 text-gray-700">
        {month}월 {selectedDay}일 ({dayLabel})
        {(isSun || isSat) && <span className={`ml-2 text-xs ${isSun ? 'text-red-500' : 'text-blue-500'}`}>{isSun ? '일요일' : '토요일'}</span>}
      </div>
      <div className="space-y-1">
        {TIME_SLOTS.map(slot => {
          const cellState = getCellState(selectedDay, slot as TimeSlot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
          return (
            <div key={slot} className="flex items-stretch gap-2">
              <div className="w-16 text-xs font-medium text-gray-600 flex items-center justify-center bg-gray-100 rounded px-1">{slot}</div>
              <div className="flex-1">
                <TimeSlotCell cellState={cellState} highlightName={highlightName} onClick={() => onCellClick({ year, month, day: selectedDay, timeSlot: slot as TimeSlot })} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 모바일 브라우저 너비로 확인**

브라우저 개발자 도구 → 모바일 뷰 전환 → 날짜 탭 스크롤 및 슬롯 목록 확인

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/MobileScheduleView.tsx
git commit -m "feat: add responsive mobile list view"
```

---

## Task 22: Vercel 배포 설정

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: vercel.json 작성 (SPA 라우팅)**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: Vercel에 배포**

```bash
npm install -g vercel
vercel --prod
```

프롬프트 응답:
- Project name: `volunteer-schedule`
- Framework: `Vite`
- Build Command: `npm run build`
- Output directory: `dist`
- Environment variables 설정:
  - `VITE_SUPABASE_URL`: Supabase 대시보드 → Project Settings → API → Project URL
  - `VITE_SUPABASE_ANON_KEY`: Supabase 대시보드 → Project Settings → API → anon/public key

- [ ] **Step 3: 배포 URL에서 전체 기능 확인**

- 월간 그리드 로딩 확인
- 로그인 후 슬롯 입력 테스트
- 이름 필터 동작 확인
- 이미지 저장 / 공유 URL 확인
- `/share?year=2026&month=4` 읽기 전용 뷰 확인
- 모바일 뷰 전환 확인

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel SPA routing config"
```

---

## Task 23: 전체 테스트 실행 및 정리

- [ ] **Step 1: 전체 테스트 실행**

```bash
npm test -- --run
```
Expected: 전체 PASS (cellState 6개, ScheduleHeader 3개, TimeSlotCell 5개, ScheduleGrid 3개)

- [ ] **Step 2: TypeScript 타입 체크**

```bash
npm run build
```
Expected: 0 errors

- [ ] **Step 3: 최종 Commit**

```bash
git add -A
git commit -m "feat: complete volunteer schedule app implementation"
```

---

## 빠른 참조

| 역할 | 이메일 형식 | Supabase Auth에서 설정 |
|------|------------|------------------------|
| 관리자 | admin@library.kr | `profiles.role = 'admin'` |
| 봉사자 | name@example.com | `profiles.role = 'volunteer'` |

> Supabase Auth에서 사용자 등록 후, `profiles` 테이블에 `id`, `name`, `role` 행을 수동으로 INSERT하거나 Auth 트리거를 설정해야 합니다.

**Supabase Auth 트리거 (선택):**
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'volunteer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
