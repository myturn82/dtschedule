# 2026-08-19 변경사항 점검 체크리스트

테스트 환경: http://localhost:5173
테스트 계정: 슈퍼관리자 계정

---

## 1. 조직 유입 버티컬 출처 기록 (source_vertical)

배경: 슈퍼관리자가 조직 목록에서 어느 버티컬 앱을 통해 가입했는지 구분할 수 없어 `source_vertical` 컬럼을 추가했다.

### 신규 조직 생성 시 저장 확인

- [ ] **회원가입 플로우** (`AuthPage`) — 새 조직을 만들어 가입 완료 후 `tenants.source_vertical`에 현재 빌드의 버티컬 값이 저장됨
- [ ] **대기 화면** (`PendingPage`) — 대기 중 조직 생성 시 `source_vertical` 저장됨
- [ ] **서비스 시작 모달** (`StartServiceModal`) — 슈퍼관리자가 직접 조직 생성 시 `source_vertical` 저장됨
- [ ] **CustomerAdminPage** — 고객/어드민이 추가 조직 생성 시 `source_vertical` 저장됨
- [ ] **[DB 확인]** 생성된 조직의 `source_vertical` 값이 `VITE_VERTICAL` 환경변수 값(`lessonon`, `shifton` 등)과 일치함

### 슈퍼관리자 화면 표시 확인

- [ ] AdminPage 상단 헤더 — 조직 드롭다운의 각 option에 `[버티컬명]` 텍스트가 표시됨 (슈퍼관리자 계정으로 로그인 시)
- [ ] AdminPage 상단 헤더 — 선택된 조직 이름 아래 버티컬 뱃지가 표시됨 (슈퍼관리자만)
- [ ] `source_vertical`이 `null`인 조직(스킵한 조직)은 뱃지 없이 정상 표시됨
- [ ] 일반 관리자 계정으로 로그인 시 뱃지가 표시되지 않음

---

## 2. 기존 조직 source_vertical 수동 업데이트

- [ ] **[DB 확인]** 개발 DB — 아래 조직들의 `source_vertical` 값 확인
  - 자원봉사 → `shifton`
  - 다옴헤어 → `salonon`
  - 램프팩토리 → `lessonon`
  - 레슨온 → `lessonon`
  - lessonon1@lessonon.com → `lessonon`
  - 시프트온 → `shifton`
- [ ] **[운영 DB]** 아래 조직들의 `source_vertical` 값 확인
  - 도서관 자원봉사 → `shifton`
  - 램프팩토리 → `lessonon`
  - 하버라인피트니스 → `lessonon`
  - 다옴헤어 → `salonon`

---

## 3. DB / 마이그레이션 반영 상태

- [ ] 개발 DB(`mcuszdvophmqrwostcah`) — `088_source_vertical.sql` 마이그레이션 적용 확인
- [ ] **[운영 DB]** `bjnmaajhcmhxwonybnqc` — 동일 마이그레이션 적용 확인
- [ ] `tenants` 테이블에 `source_vertical text` 컬럼 존재 확인

---

## 4. 회귀 테스트

- [ ] 회원가입 플로우 정상 완료 (source_vertical 추가로 insert 실패 없음)
- [ ] 기존 조직 선택 및 AdminPage 탭 이동 정상 동작
- [ ] 슈퍼관리자 조직 드롭다운 전환 정상 동작

---

## 테스트 우선순위

1. **3번** DB 마이그레이션 적용 여부 — 컬럼이 없으면 insert 오류 발생
2. **1번** 신규 조직 생성 시 저장 — 핵심 기능
3. **2번** 기존 조직 수동 업데이트 값 확인
4. **1번** 슈퍼관리자 화면 뱃지 표시 확인
