<div align="center">

<!-- 로고 플레이스홀더 — 실제 로고 이미지로 교체하세요 -->
<img src="https://placehold.co/120x120/1E293B/FFFFFF?text=DTS" alt="Dynamic Team Schedule Logo" width="120" />

# Dynamic Team Schedule

**다중 조직과 스케줄을 한 곳에서. 진짜 실무에 맞는 SaaS 팀 스케줄러.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![i18n](https://img.shields.io/badge/i18n-react--i18next-26A69A?logo=i18next&logoColor=white)](https://react.i18next.com)

</div>

---

## 📌 프로젝트 소개

**Dynamic Team Schedule(DTS)** 은 하나의 플랫폼에서 복수의 고객 계정과 그 하위 조직들의 멤버·스케줄을 통합 관리할 수 있는 **멀티테넌트 SaaS 팀 스케줄러**입니다.

> *"우리 조직의 역할·슬롯·커스텀 필드 설정 방식이 옆 팀과 달라도 괜찮아요.  
> 각 조직이 자신만의 규칙으로 돌아가도록 설계됐으니까요."*

단순한 일정 공유 도구를 넘어, **슈퍼관리자 → 고객 계정 → 조직 → 멤버**의 계층 구조를 갖춘 진짜 실무용 스케줄 플랫폼입니다.

---

## ✨ 핵심 기능

### 🏢 슈퍼관리자 (Super Admin)

- 🗂 **고객 계정 허브** — Basic · Pro · Business 요금제별 고객 목록을 직관적인 레일 UI로 관리
- 🏗 **다중 조직 관리** — 고객 계정 하위에 복수의 조직(팀)을 생성·수정·삭제, 업종 카테고리 설정
- 👁 **3가지 시각화 뷰** — 조직 구조를 트리(Tree) · 다이어그램(Diagram) · 카드(Card) 형태로 확인
- 🎨 **포인트 컬러 프리셋** — 미드나잇·포레스트·살몬·베이지·버터 옐로우·피스타치오 등 14종 테마 내장
- 🔒 **안전한 계정 제어** — 비활성화(데이터 보존)와 영구 삭제 액션 분리 제공
- 🗑 **사용자 멀티 삭제** — `auth.users`까지 완전 삭제하는 SECURITY DEFINER RPC 방식

### ⚙️ 조직 관리자 (Admin)

- 📋 **커스텀 필드 빌더** — 텍스트·숫자·드롭다운·라디오·체크박스·전화번호·이미지첨부 등 8가지 타입, 드롭다운 옵션 유형에 금액(원)·수량(개)·인원(명)·회차(회) 단위 지원
- 🧩 **조직 셋업 위자드** — 단계별 가이드로 역할·슬롯·커스텀 필드·테마 등 초기 설정 완료
- 👥 **역할(Role) 기반 배정** — 조직별 역할 정의와 자동 배정 비율을 동적으로 구성
- 📅 **날짜 오버라이드 & 잠금** — 특정 날짜 휴관·특별 운영 규칙 설정

### 📆 스케줄 & 멤버

- 🗓 **월·주·일 뷰** — 동일 비즈니스 로직을 모든 뷰에 일관 적용 (ScheduleGrid · WeekGrid · DayView)
- ⏳ **시간별/일자별 보기 모드** — 월간·주간 뷰에서 시간축 표 대신 날짜별 배정 요약 목록으로 전환하는 토글 제공
- 📆 **날짜 선택 모달** — 헤더 타이틀 클릭 시 연/월/일을 스크롤 휠로 골라 바로 이동
- 📸 **이미지 첨부** — Canvas API 기반 WebP 자동 압축(최대 3장, 500KB 이하), Supabase Storage 저장
- 💡 **라이트박스 갤러리** — 등록된 이미지를 전체화면 뷰어에서 키보드 탐색 가능
- 🔔 **Realtime 동기화** — Supabase CDC 구독으로 멀티 유저 동시 편집 즉시 반영
- 📱 **모바일 최적화** — 터치 친화적 모바일 뷰 별도 제공

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | React 18, TypeScript 5, Tailwind CSS, Vite |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **DB 관리** | Supabase Migrations (SQL 파일 60개+) |
| **상태 관리** | React Context (TenantContext, AuthContext, PlanLimitsContext) |
| **이미지 처리** | HTML5 Canvas API — WebP 압축, Supabase Storage 업로드 |
| **다국어 (i18n)** | react-i18next, i18next-browser-languagedetector — 한국어/영어, 브라우저 자동 감지 |
| **보안** | Row Level Security (RLS), SECURITY DEFINER Functions |

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- [Supabase](https://supabase.com) 계정 및 프로젝트

### 1. 저장소 클론

```bash
git clone https://github.com/myturn82/dtschedule.git
cd dtschedule
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다.  
값은 Supabase 대시보드 → **Project Settings → API** 에서 확인합니다.

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. DB 스키마 초기화

새 Supabase 프로젝트라면 SQL Editor에서 아래 파일을 실행합니다.

```
supabase/reset_db.sql
```

이후 슈퍼관리자 계정 지정:

```sql
UPDATE profiles SET is_super_admin = true WHERE email = 'your@email.com';
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후 확인합니다.

---

## 📁 폴더 구조

```
dtschedule/
├── public/
├── src/
│   ├── components/
│   │   ├── modals/              # SlotEditModal 등 스케줄 등록·수정 모달
│   │   ├── schedule/            # ScheduleGrid, WeekGrid, DayView, DatePickerModal, ImageUploadField
│   │   ├── setup/               # 조직 셋업 위자드 단계별 컴포넌트 (Step1~7)
│   │   ├── superadmin/          # AccountRail, HubMain, OrgDrawer, UserManagementPanel
│   │   └── shared/              # LanguageSwitcher, AutoResizeTextarea 등 공통 UI 컴포넌트
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── TenantContext.tsx    # 조직 설정 전역 주입
│   │   └── PlanLimitsContext.tsx
│   ├── hooks/                   # useAdmin, useTenantRoles 등 커스텀 훅
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── themePresets.ts      # 포인트 컬러 프리셋 14종
│   │   ├── imageCompress.ts     # Canvas API WebP 압축
│   │   ├── datePicker.ts        # 날짜 선택 모달용 연도/일수/스크롤 인덱스 계산
│   │   └── uploadScheduleImage.ts
│   ├── pages/
│   │   ├── SuperAdminPage.tsx   # 슈퍼관리자 허브
│   │   ├── AdminPage.tsx        # 조직 관리자 콘솔
│   │   ├── SchedulePage.tsx     # 스케줄 메인 화면
│   │   ├── CustomerAdminPage.tsx
│   │   ├── SetupWizardPage.tsx  # 조직 셋업 위자드
│   │   └── ...
│   ├── types/
│   │   └── index.ts             # CustomFieldDef, Tenant, Assignment 등 공통 타입
│   └── utils/
│       ├── customFieldTemplates.ts
│       └── timeSlots.ts
├── supabase/
│   ├── migrations/              # 001 ~ 060+ 순차 마이그레이션 SQL
│   ├── reset_db.sql             # 전체 스키마 초기화용 통합 SQL
│   └── reset_data.sql
├── docs/                        # 체크리스트, 설계 문서
├── .env.local                   # ⚠️ Git 제외 — 직접 생성 필요
├── CLAUDE.md                    # AI 협업 규칙 및 개발 가이드
└── package.json
```

---

## 🔐 멀티테넌트 보안 구조

- 모든 테이블에 **`tenant_id` 컬럼** + Row Level Security 적용
- Supabase Realtime 구독 시 **`tenant_id` 필터** 필수 (비용·보안 모두)
- Storage 버킷 경로: `{tenantId}/{uuid}.webp` — 테넌트 격리
- 슈퍼관리자 권한 함수는 **`SECURITY DEFINER`** + `is_super_admin_caller()` 게이트

---

## 🗺 로드맵

- [ ] 조직 간 멤버 이동 기능
- [ ] 스케줄 통계 대시보드 고도화
- [ ] 알림(Notification) 시스템
- [ ] 모바일 앱 (PWA 완성도 향상)
- [x] 다국어 지원 (한국어/영어, react-i18next)
- [ ] 추가 언어 확장 (일본어, 중국어 등)
- [ ] 외부 캘린더(Google Calendar) 연동

---

## 📜 라이선스

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for details.

---

<div align="center">

Made with ❤️ using React + Supabase  
© 2026 Dynamic Team Schedule

</div>
