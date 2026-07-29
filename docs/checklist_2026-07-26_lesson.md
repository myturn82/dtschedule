# 2026-07-26 변경사항 점검 체크리스트 — 레슨권 패키지 관리

테스트 환경: http://localhost:5173
테스트 계정: 어드민 계정 (레슨 종류 설정·결제 기록은 어드민 전용)

---

## 1. DB 마이그레이션 적용 확인

- [ ] Migration 075 개발 DB 반영:
  ```
  npx supabase db push --project-ref mcuszdvophmqrwostcah
  ```
- [ ] **[DB 확인]** SQL Editor에서 테이블 존재 확인:
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('lesson_package_types', 'lesson_packages');
  ```
- [ ] **[DB 확인]** assignments 테이블에 `lesson_package_id` 컬럼 추가됨:
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'assignments' AND column_name = 'lesson_package_id';
  ```

---

## 2. 관리자콘솔 레슨권 탭

배경: AdminPage에 레슨권 탭이 추가되어 LessonManagementPanel을 렌더링한다.

- [ ] AdminPage에서 "레슨권" 탭이 탭 목록에 표시된다
- [ ] 탭 클릭 시 "레슨 종류 설정"과 "결제 기록" 섹션이 보인다
- [ ] 일반 회원 계정으로 접속 시 레슨권 탭이 표시되지 않는다 (어드민 전용)

---

## 3. 레슨 종류 설정

배경: `lesson_package_types` 테이블에 저장되는 레슨 종류 템플릿을 관리한다.

### 종류 추가
- [ ] 이름, 횟수, 유효기간(주) 입력 후 "+ 추가" 클릭 → 목록에 즉시 반영된다
- [ ] 유효기간 없이 추가 시 목록에 "무제한"으로 표시된다
- [ ] 이름·횟수 비워둔 채 추가 시 버튼이 비활성 상태다 (submit 방지)
- [ ] **[DB 확인]** `SELECT * FROM lesson_package_types ORDER BY created_at DESC LIMIT 5;`

### 종류 수정 (인라인 편집)
- [ ] "수정" 버튼 클릭 시 해당 행이 인라인 편집 모드로 전환된다
- [ ] 이름·횟수·유효기간 변경 후 "저장" → 목록에 반영된다
- [ ] "취소" 클릭 시 변경 없이 원래 값으로 복원된다

### 활성/비활성 토글
- [ ] "활성" 버튼 클릭 시 "비활성"으로 전환되고 스타일이 변경된다
- [ ] 비활성 종류는 결제 추가 모달의 드롭다운에 표시되지 않는다

### 종류 삭제
- [ ] "삭제" 클릭 → 확인 다이얼로그 표시 → 확인 시 목록에서 제거된다
- [ ] **[DB 확인]** 삭제 후 기존 `lesson_packages`의 `package_type_id`는 NULL로 유지된다 (ON DELETE SET NULL)

---

## 4. 결제 기록

배경: `lesson_packages` 테이블에 회원별 레슨권 구매 이력을 관리한다.

### 결제 추가
- [ ] 활성 레슨 종류가 1개 이상 있을 때만 "+ 결제 추가" 버튼이 보인다
- [ ] 모달에서 회원 선택 → 레슨 종류 선택 → 결제일 입력 후 "저장"
- [ ] 유효기간이 있는 종류 선택 시 결제일 기준으로 만료일이 자동 계산된다
  - 예: 8주 유효기간이면 결제일 + 56일 = 만료일
- [ ] 메모 입력은 선택 사항이며 비워도 저장된다
- [ ] 저장 후 목록 최상단에 추가된다
- [ ] **[DB 확인]** `SELECT * FROM lesson_packages ORDER BY created_at DESC LIMIT 5;`

### 결제 목록 표시
- [ ] 회원명, 레슨종류, 결제일, 만료일(없으면 "무제한"), 소진 현황이 표시된다
- [ ] 소진 현황에 프로그레스 바가 표시된다 (used_sessions / total_sessions)
- [ ] 상태 배지 표시 확인:
  - [ ] `진행중` — 소진 미완료, 만료 7일 초과
  - [ ] `만료임박` — 만료일이 7일 이내
  - [ ] `만료` — 만료일 초과
  - [ ] `소진완료` — used_sessions ≥ total_sessions

### 회원 필터
- [ ] "전체 회원" 선택 시 전체 결제 기록이 표시된다
- [ ] 특정 회원 선택 시 해당 회원의 기록만 필터링된다

### 결제 기록 삭제
- [ ] "삭제" 클릭 → 확인 다이얼로그 → 확인 시 목록에서 제거된다
- [ ] **[DB 확인]** 삭제 후 해당 `assignments.lesson_package_id`는 NULL로 유지된다 (ON DELETE SET NULL)

---

## 5. 배정 모달 — 레슨 패키지 연결

배경: SlotEditModal에서 배정 시 기존 레슨권과 연결할 수 있는 드롭다운이 추가됐다.

- [ ] 회원(useProfiles 모드)을 선택하면 "레슨 패키지 연결" 드롭다운이 나타난다
- [ ] 드롭다운에 해당 회원의 유효한(소진·만료되지 않은) 레슨권 목록이 표시된다
- [ ] 레슨권 선택 후 배정 저장 시 DB에 `lesson_package_id` FK가 저장된다
  - **[DB 확인]** `SELECT lesson_package_id FROM assignments ORDER BY created_at DESC LIMIT 5;`
- [ ] 레슨권 미선택 상태로 저장해도 정상 저장된다 (`lesson_package_id = NULL`)
- [ ] 기존 배정 수정 시 연결된 레슨권이 드롭다운에 미리 선택된 상태다
- [ ] 비회원(walk-in) 모드에서는 레슨 패키지 드롭다운이 표시되지 않는다

---

## 6. used_sessions 자동 반영

배경: `used_sessions`는 `assignments.lesson_package_id`로 연결된 배정 수를 카운트한다.

- [ ] 배정에 레슨권을 연결하면 해당 레슨권의 소진 횟수(used_sessions)가 증가한다
- [ ] 해당 배정을 삭제하면 소진 횟수가 감소한다 (결제 목록에서 새로고침 시 반영)
- [ ] 소진 횟수가 total_sessions에 도달하면 상태가 "소진완료"로 표시된다

---

## 7. 대시보드 — 사용자별 레슨권 현황

배경: DashboardPage의 사용자 탭에서 각 회원의 레슨권 현황을 확인할 수 있다.

- [ ] 사용자 탭(각 회원 이름 탭)에 "레슨권 현황" 섹션이 표시된다
- [ ] 연결된 레슨권이 없는 회원의 탭에는 레슨권 현황 섹션이 표시되지 않는다
- [ ] 소진 진행률 바와 만료일이 표시된다
- [ ] 상태(진행중/만료임박/만료/소진완료)가 올바르게 표시된다

---

## 8. RLS 권한 확인

- [ ] 일반 회원 계정으로 로그인 시 본인의 레슨권만 조회된다
- [ ] 다른 회원의 레슨권이 노출되지 않는다
- [ ] 일반 회원은 레슨권 추가·삭제가 불가능하다 (어드민 전용)

---

## 9. 회귀 테스트

- [ ] 기존 배정 추가/수정 (레슨권 미연결) 정상 동작 확인
- [ ] SlotEditModal — 비회원 walk-in 배정 정상 동작
- [ ] AdminPage 기존 탭(회원관리, 스케줄 설정 등) 정상 동작
- [ ] DashboardPage 기존 위젯(차트, 배정 통계) 정상 표시
- [ ] `npx tsc -b` 타입 오류 없음

---

## 테스트 우선순위

1. **1번** — DB 마이그레이션 먼저 적용해야 나머지 기능이 동작함
2. **3번** — 레슨 종류를 먼저 만들어야 결제 기록·배정 연결을 테스트할 수 있음
3. **4번** — 결제 기록 추가·목록·삭제 핵심 흐름
4. **5번** — 배정 시 레슨권 연결 → 6번 used_sessions 자동 반영과 연계
5. **7번** — 대시보드 표시 최종 확인
6. **8·9번** — RLS 및 회귀 테스트
