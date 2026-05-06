# 도서관 자원봉사 스케줄 관리 앱 — 설계 문서

**날짜:** 2026-05-06  
**프로젝트 경로:** `d:\claudePrj\volunteer-schedule`  
**상태:** 승인됨

---

## 1. 개요

도서관 자원봉사자들이 직접 접속하여 월간 스케줄을 입력·조회·공유할 수 있는 Full-stack 웹 애플리케이션.

---

## 2. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React 19 + Vite + TypeScript |
| 스타일 | Tailwind CSS v4 |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Realtime) |
| 이미지 저장 | html2canvas |
| 배포 | Vercel |

---

## 3. 아키텍처

React SPA에서 Supabase JS 클라이언트를 직접 호출. Row Level Security(RLS) 정책으로 DB 레벨에서 권한 제어. 별도 API 서버 없이 Vercel 단일 배포.

### 프로젝트 구조

```
src/
├── components/
│   ├── schedule/
│   │   ├── ScheduleGrid.tsx       # 월간 그리드 메인
│   │   ├── TimeSlotCell.tsx       # 개별 슬롯 셀
│   │   ├── ScheduleHeader.tsx     # 제목 + 연/월 이동 버튼
│   │   └── Legend.tsx             # 범례 (밤타임, 토요 등)
│   ├── modals/
│   │   ├── SlotEditModal.tsx      # 봉사자 이름 입력/수정
│   │   └── CapacityModal.tsx      # 관리자용 슬롯 인원 설정
│   ├── auth/
│   │   └── LoginModal.tsx         # 로그인 UI
│   └── shared/
│       ├── FilterBar.tsx          # 이름으로 찾기
│       └── ExportButton.tsx       # 이미지 저장 / URL 공유
├── hooks/
│   ├── useSchedule.ts             # 스케줄 데이터 CRUD
│   ├── useAuth.ts                 # 인증 상태 관리
│   └── useRealtime.ts             # Supabase 실시간 구독
├── lib/
│   └── supabase.ts                # Supabase 클라이언트 초기화
├── pages/
│   ├── SchedulePage.tsx           # 메인 페이지
│   └── SharePage.tsx              # 읽기 전용 공유 뷰
└── types/
    └── index.ts                   # TypeScript 타입 정의
```

---

## 4. 데이터 모델 (Supabase 테이블)

### `profiles`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | auth.users.id 연동 |
| name | text | 표시 이름 |
| role | text | `'admin'` \| `'volunteer'` |
| created_at | timestamptz | |

### `assignments`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| year | int | 연도 (예: 2026) |
| month | int | 월 (1~12) |
| day | int | 일 (1~31) |
| time_slot | text | `'10-12'`, `'12-13'`, `'13-14'`, `'14-16'`, `'16-18'`, `'18-20'`, `'20-22'` |
| volunteer_name | text | 표시용 봉사자 이름 |
| note | text | 부가 메모 (예: `'(2-6)'`) |
| user_id | uuid FK | profiles.id |
| created_at | timestamptz | |

### `slot_settings`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| time_slot | text | 대상 시간 슬롯 |
| max_capacity | int | 최대 인원 (기본 2) |
| updated_by | uuid FK | profiles.id |

### `schedule_rules`
요일별 기본 OPEN/CLOSE 규칙을 저장. 앱 초기화 시 seed 데이터로 설정됨.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| day_of_week | int | 0=일, 1=월 … 6=토 |
| time_slot | text | 대상 시간 슬롯 |
| is_open | bool | 기본 오픈 여부 |

**기본 규칙 (이미지 기준):**
- 월/수/금: `20-22` CLOSE (밤타임은 화/목만 오픈)
- 토: `10-12`, `12-13`, `13-14` 오픈, 나머지 CLOSE (토요일 운영 10~14시)
- 일: 전체 CLOSE (휴관)
- `date_overrides.is_holiday=true`인 날은 `schedule_rules` 무시하고 전체 휴관 처리

### `date_overrides`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| date | date | 특정 날짜 |
| is_open | bool | 주말이지만 오픈 여부 |
| is_holiday | bool | 휴관 여부 |
| label | text | 특이사항 라벨 (예: `'자원봉사 워크숍'`) |

### RLS 정책
- `assignments`: 자신의 `user_id` 행만 INSERT/UPDATE/DELETE 가능
- `slot_settings`, `date_overrides`: `admin` 역할만 수정 가능
- 전체 SELECT는 인증 없이도 허용 (공유 URL 읽기 전용 지원)

---

## 5. 인증 흐름

- **비로그인**: 전체 스케줄 읽기만 가능
- **봉사자 로그인**: 본인이 입력한 슬롯만 추가/수정/삭제
- **관리자 로그인**: 모든 슬롯 편집 + 슬롯 인원 제한 설정 + 날짜 특이사항 설정
- Supabase Auth 이메일/비밀번호 방식 사용

---

## 6. UI 규칙

### 스케줄 그리드
- 열: 날짜 (월~일), 행: 시간 슬롯 7개
- 헤더: `2026년 04월 자원봉사활동 스케줄` + 연/월 이동 버튼

### 시간대별 색상 규칙
| 슬롯 | 색상 | 비고 |
|------|------|------|
| 10-18시 (낮타임) | 흰 배경 | |
| 12-13시 BREAKTIME | 연회색 배경 | 편집 불가 |
| 18-22시 (밤타임) | 핑크 배경 | ★ 아이콘 |
| 토요일 운영 슬롯 | 노란 배경 | ★ 아이콘 |
| CLOSE 슬롯 | 회색 배경 | 편집 불가 |
| 휴관일 | "휴관" 텍스트 | 전체 열 비활성 |

### 편집 모달
- 슬롯 클릭 시 오픈
- 봉사자 이름 입력 + 메모(선택)
- 슬롯 인원 제한 초과 시 경고 표시

---

## 7. 핵심 기능

### 필터/검색
- 상단 검색창에 이름 입력 → 해당 봉사자 슬롯 하이라이트

### 공유 기능
- **이미지 저장**: `html2canvas`로 그리드 캡처 후 PNG 다운로드
- **공유 URL**: `/share?year=2026&month=4` → 읽기 전용 뷰 (로그인 불필요)

### 실시간 동기화
- Supabase Realtime 구독 → 다른 봉사자 수정 시 화면 자동 갱신

### 반응형
- **데스크탑**: 가로 그리드 (이미지와 동일한 레이아웃)
- **모바일**: 날짜별 카드 리스트 (날짜 탭 선택 → 해당 날 슬롯 목록 표시)

---

## 8. 초기 Mock 데이터

2026년 4월 이미지 기준 봉사자 배정 데이터를 seed 스크립트로 삽입:
- 이연화, 최희선, 최민화, 안유민, 이지연, 조명주, 이향주, 전윤희, 정은선, 김은진, 나경선, 정순주, 이정애, 나경선, 송지현, 김시연, 이민주, 김보연, 백주옥, 김미현, 김아영 등

---

## 9. 배포

- Vercel에 연결, `main` 브랜치 자동 배포
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
