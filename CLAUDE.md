# dtschedule 프로젝트 규칙

## 세션 시작 시 자동 점검 (Windows)

**Windows 환경에서 Claude Code를 시작할 때마다** 아래를 자동으로 점검한다.
이 점검을 건너뛰면 Claude의 한글 답변이 깨져 보일 수 있다.

### 터미널 인코딩 확인 및 자동 수정

```powershell
chcp
```

출력이 `65001`이 아니면 즉시 아래를 실행한다:

```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
```

### 영구 설정 (최초 1회)

PowerShell 프로필에 추가해두면 이후 매번 자동 적용된다:

```powershell
# 프로필 열기
notepad $PROFILE

# 아래 내용을 파일에 추가 후 저장
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding  = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```

폰트도 확인: 터미널 폰트가 한글을 지원해야 한다 (D2Coding, 맑은 고딕, Noto Sans CJK 권장).

---

> 새 PC/환경 최초 설정 절차는 `new-environment-setup` 스킬로 이동했다. 필요할 때 해당 스킬을 참고한다.

## Supabase CLI 인증 규칙

Supabase CLI 명령(`db push`, `functions deploy` 등)을 실행할 때 **`supabase login` 대화형 명령을 사용하지 않는다.**
토큰은 `%USERPROFILE%\.supabase\access-token`에 저장되어 있으며, PowerShell에서 아래와 같이 환경변수로 주입해 사용한다.

```powershell
$env:SUPABASE_ACCESS_TOKEN = (Get-Content "$env:USERPROFILE\.supabase\access-token" -Raw).Trim()
npx supabase db push --project-ref mcuszdvophmqrwostcah
```

명령 여러 개를 연속 실행할 때도 첫 줄에 환경변수 설정을 포함한다.

---

## DB 환경 구성

| 환경 | Supabase Project ID |
|------|---------------------|
| 개발 (dev) | `mcuszdvophmqrwostcah` |
| 운영 (prod) | `bjnmaajhcmhxwonybnqc` |

## 운영→개발 데이터 복사 규칙

`scripts/copy_tenant_to_dev.mjs` 등 운영 데이터를 개발로 복사하는 작업 시 반드시 아래를 지킨다.

1. **운영 DB는 절대 수정하지 않는다.**
   - 복사 스크립트에서 운영 DB(`bjnmaajhcmhxwonybnqc`)는 `SELECT`만 허용한다.
   - INSERT·UPDATE·DELETE·ALTER·DROP 등 일체의 쓰기 명령을 운영 DB에 실행하지 않는다.
   - 스크립트를 수정할 때도 `PROD_REF` 대상 쓰기 쿼리가 추가되지 않도록 반드시 확인한다.

2. **개발 DB auth.users FK는 제거 상태를 유지한다.**
   - 개발 DB에서만 `auth.users` FK를 제거해 실제 user_id를 그대로 보존한다.
   - 이 설정은 운영 DB에 절대 적용하지 않는다.
   - 개발 DB에 새 테이블을 추가할 때, auth.users FK가 포함된 경우 마이그레이션 직후 FK를 제거하는 SQL을 스크립트에 추가한다.

3. **auth.users FK 제거·대체는 마이그레이션 파일에 절대 포함하지 않는다.**
   - `supabase/migrations/*.sql` 파일은 운영 DB에도 그대로 적용되므로, 개발 전용 FK 변경(`DROP CONSTRAINT … profiles_id_fkey` 등)을 마이그레이션에 넣으면 운영 DB 구조가 파괴된다.
   - FK 변경은 오직 `scripts/copy_tenant_to_dev.mjs`의 `dropDevAuthFKs()` 함수 안에서만 처리한다.
   - 새 테이블에 `auth.users` FK가 추가되는 마이그레이션이 생기면, 마이그레이션 파일은 그대로 두고 `dropDevAuthFKs()` 함수에 해당 FK DROP과 profiles FK ADD만 추가한다.

   **현재 개발 DB 전용 FK 상태** (운영 DB와 다른 부분):

   | 구분 | 제약명 | 비고 |
   |------|--------|------|
   | 제거됨 | `profiles_id_fkey` | auth.users → profiles |
   | 제거됨 | `assignments_user_id_fkey` | auth.users → assignments |
   | 제거됨 | `tenant_members_user_id_fkey` | auth.users → tenant_members |
   | 제거됨 | `lesson_packages_user_id_fkey` | auth.users → lesson_packages |
   | 제거됨 | `lesson_packages_created_by_fkey` | auth.users → lesson_packages |
   | 제거됨 | `assignment_snapshots_created_by_fkey` | auth.users → assignment_snapshots |
   | 추가됨 | `tenant_members_user_id_profiles_fkey` | profiles → tenant_members (PostgREST용) |
   | 추가됨 | `assignments_user_id_profiles_fkey` | profiles → assignments (PostgREST용) |

## DB 변경 워크플로우

테이블·컬럼 추가/삭제/수정 등 스키마 변경이 필요한 경우 반드시 아래 순서를 따른다.

### 1단계 — 개발 DB에 먼저 반영

- 마이그레이션 파일을 `supabase/migrations/`에 작성한다.
- 개발 DB(`mcuszdvophmqrwostcah`)에 적용하고 기능을 검증한다.
  ```
  npx supabase db push --project-ref mcuszdvophmqrwostcah
  ```

### 2단계 — 사용자 승인 후 운영 반영

- 개발 DB에서 테스트가 완료되면 사용자에게 운영 반영 여부를 확인한다.
- **명시적인 승인 없이는 운영 DB(`bjnmaajhcmhxwonybnqc`)에 절대 적용하지 않는다.**
- 승인이 확인되면 운영 DB에 적용한다.
  ```
  npx supabase db push --project-ref bjnmaajhcmhxwonybnqc
  ```

### 3단계 — 초기화 파일 갱신

운영 DB 반영 완료 후 `supabase/CLAUDE.md`의 규칙에 따라
`supabase/reset_db.sql`과 `supabase/reset_data.sql`을 최신 상태로 갱신한다.

## 요약 원칙

- 개발 → 검증 → 사용자 승인 → 운영 순서를 반드시 지킨다.
- 운영 DB 직접 수정은 금지한다. 항상 마이그레이션 파일을 통해 변경한다.
- 승인 없는 운영 배포는 커밋·배포와 동일하게 금지된다.

## Edge Functions 배포 워크플로우

`supabase/functions/`의 코드는 로컬 파일을 수정해도 자동으로 서버에 반영되지 않는다.
**반드시 `supabase functions deploy`로 별도 배포해야 실제 동작에 반영된다.**

이 불일치를 놓치면 로컬 소스는 최신인데 서버는 구버전 코드로 동작해
(예: DB 스키마 변경에 맞춰 코드는 고쳤지만 미배포 상태) 500 에러 등 원인 파악이 어려운 장애로 이어진다.
실제로 `admin-create-user` 함수가 `profiles.phone` 컬럼 삭제 마이그레이션 이후에도 구버전으로 남아 있어
회원 직접등록 시 500 에러가 발생한 사례가 있었다.

### 반드시 지켜야 할 규칙

1. **`supabase/functions/**/*.ts` 파일을 수정하면 커밋 전후로 개발 DB에 배포한다.**
   ```
   npx supabase functions deploy <function-name> --project-ref mcuszdvophmqrwostcah
   ```
2. **`git pull` 직후에는 변경된 함수가 있는지 확인한다.** 원격 커밋에 `supabase/functions/` 변경이 포함되어 있으면,
   로컬에서 수정한 적이 없어도(다른 사람이 수정) 개발 DB에 배포가 안 되어 있을 수 있으므로 아래로 배포 여부를 점검한다.
   ```
   npx supabase functions list --project-ref mcuszdvophmqrwostcah
   ```
   각 함수의 `updated_at`이 관련 마이그레이션/코드 변경 시점보다 오래됐으면 재배포한다.
3. **운영 반영은 DB 마이그레이션과 동일하게 사용자 승인 후에만 진행한다.**
   ```
   npx supabase functions deploy <function-name> --project-ref bjnmaajhcmhxwonybnqc
   ```
4. 여러 함수를 한 번에 배포해야 하면 함수명을 생략해 전체 배포할 수도 있지만,
   의도치 않은 함수까지 재배포되지 않도록 가급적 변경된 함수명을 명시해서 배포한다.

## 변경사항 점검 체크리스트

기능 추가/수정 작업을 완료하면 `docs/checklists/CHANGE_TEST_CHECKLIST_TEMPLATE.md`를 기준으로
`docs/checklists/checklist_YYYY-MM-DD.md` 파일을 작성하여 사용자가 직접 동작을 점검할 수 있도록 한다.

## README.md 최신화 규칙

기능 추가·수정·버그 수정 작업을 완료할 때마다 `README.md`를 반드시 갱신한다.

### 갱신 대상

- **새 기능 추가** → `✨ 핵심 기능` 섹션에 항목 추가 또는 수정
- **버그 수정** → 해당 없음 (버그 픽스는 README 갱신 불필요)
- **기술 스택 변경** → `🛠 기술 스택` 테이블 갱신
- **폴더 구조 변경** (새 파일/디렉터리 추가) → `📁 폴더 구조` 트리 갱신
- **로드맵 항목 완료** → `🗺 로드맵` 체크박스를 `[x]`로 변경

### 규칙

1. README 갱신은 기능 커밋과 **동일 커밋 또는 바로 다음 커밋**에 포함한다.
2. 단순 리팩터링·스타일 수정은 README 갱신 대상이 아니다.
3. README에 추가할 내용이 없더라도, 로드맵 항목과 대조하여 완료된 항목은 체크한다.

## 스케줄 화면(월/주/일 뷰) 동일 적용 규칙

스케줄 표시·동작에 영향을 주는 변경(셀 상태 표시, 잠금/휴관 등 뱃지·아이콘, 클릭 동작, 권한별 노출 등)을
작업할 때는 월간 뷰(`ScheduleGrid`/`TimeSlotCell`), 주간 뷰(`WeekGrid`), 일간 뷰(`DayView`),
모바일 뷰(`MobileScheduleView`) 중 어디서 시작했든 **나머지 뷰에도 동일하게 적용되었는지 반드시 함께 확인**한다.

- 각 뷰는 렌더링 코드가 별도로 분리되어 있어(`WeekGrid`/`DayView`는 `TimeSlotCell`을 사용하지 않고 자체 렌더링),
  한 곳만 수정하면 다른 뷰에서는 누락되기 쉽다.
- `getCellState()`가 반환하는 `CellState`의 필드(예: `isLocked`)를 활용하는 변경이라면,
  주간 뷰처럼 인접 월의 데이터를 함께 보여주는 화면에서는 해당 월의 `dateOverrides`/`assignments`가
  올바르게 병합되어 전달되는지도 확인한다.
- 작업 완료 후 점검 체크리스트(`docs/checklists/checklist_YYYY-MM-DD.md`)에도 월/주/일 뷰 각각에 대한 확인 항목을 포함한다.

## 다이나믹 구현 원칙 (하드코딩 금지)

이 시스템의 핵심은 **조직(tenant)마다 설정이 다른 멀티테넌트 구조**다.
역할 이름, 타입 라벨, 슬롯 설정, 테마 색상 등 모든 표시 값은 조직 설정에서 읽어야 하며,
특정 조직의 값을 소스코드에 하드코딩해서는 절대 안 된다.

### 반드시 지켜야 할 규칙

1. **라벨·명칭 하드코딩 금지**
   - `member_label`, `plus_label`, `role.name` 등 표시 문자열은 반드시 DB/설정에서 읽는다.
   - 폴백(fallback) 기본값도 특정 조직의 명칭이 아닌, 빈 문자열(`''`) 또는 완전히 중립적인 값만 허용.
   - 폴백이 빈 문자열이면 해당 기능/탭/버튼을 **숨기거나 비활성화**한다(미설정 조직에서 불필요한 UI 노출 방지).

2. **역할(role) 기반 로직은 항상 동적으로**
   - `splitRoles`, `tenantRoles`, `ROLE_TINTS` 등은 조직 설정에서 주입된 값을 사용한다.
   - 역할 개수·이름·색상을 코드에 고정하지 않는다.

3. **조직 설정 경로**
   - 조직 설정: `tenant.settings` (JSONB) — `volunteer_label`, `plus_label`, `theme_color`, `open_from`, `open_to` 등
   - 역할 목록: `tenantRoles` (`tenant_roles` 테이블)
   - 슬롯 설정: `slotSettings`, `scheduleRules`, `dateOverrides`
   - 이 값들은 `TenantContext`를 통해 컴포넌트에 주입한다.

4. **신규 기능 구현 시 체크리스트**
   - [ ] 표시 문자열이 조직 설정에서 오는가?
   - [ ] 역할/타입 목록이 DB에서 동적으로 로드되는가?
   - [ ] 특정 조직 이름·값이 소스코드 어디에도 없는가?
   - [ ] 미설정 조직에서도 UI가 깨지지 않는가?

---

## 아이콘 사용 원칙 (흑백 SVG 아이콘 기준)

이 사이트의 아이콘 표준은 **흑백 SVG 아이콘**이다.
`src/components/setup/WizardIcons.tsx`의 `WizardIcon` 컴포넌트를 우선 사용한다.
필요한 아이콘이 없으면 동일 파일의 `mk()` 패턴으로 추가한다.

### 반드시 지켜야 할 규칙

1. **아이콘은 무조건 SVG** — 버튼·셀·뱃지·목록 등 UI 요소의 아이콘은 컬러 이모지 대신 SVG를 사용한다.
   이모지는 시스템이 색상을 고정하므로 CSS `color` 제어가 불가능하고 작은 크기에서 뭉개진다.

2. **`stroke="currentColor"` 활용** — SVG 아이콘은 `stroke="currentColor"`를 유지해 부모의 `color` CSS로 색상을 제어한다.

3. **크기는 `size` prop으로** — `WizardIcon.xxx` 사용 시 `size={n}`으로 픽셀을 지정한다. 기본값 16px.

4. **이모지 예외** — 사용자가 직접 입력한 데이터(이름·메모 등)에 포함된 이모지, 또는 텍스트 콘텐츠의 일부인 이모지는 이 규칙의 적용 대상이 아니다.

---

## Supabase Realtime 구독 원칙

실시간 구독을 잘못 설계하면 메시지 수가 폭발해 비용이 급증한다.
새 테이블에 구독을 추가하거나 기존 구독을 수정할 때 반드시 아래 기준을 따른다.

> 상세 현황: `docs/architecture/realtime-subscription-status.md`

### 필수 규칙

1. **언마운트 시 구독 해제** — `useEffect` cleanup에서 반드시 `supabase.removeChannel(channel)` 호출.

2. **tenant_id 필터 필수** — 테이블 전체를 구독하면 다른 조직 이벤트까지 수신해 메시지 비용이 폭발한다.
   INSERT·UPDATE·DELETE 모두 `filter: \`tenant_id=eq.${tenantId}\`` 를 설정한다.

3. **DELETE 필터를 쓰려면 REPLICA IDENTITY FULL 필수**
   - DEFAULT replica identity에서 DELETE `payload.old`에는 PK(`id`)만 포함된다.
   - `tenant_id` 등 비PK 컬럼으로 필터를 걸면 서버가 이벤트 자체를 전달하지 않는다.
   - DELETE에도 filter를 걸어야 하는 테이블은 반드시 아래 SQL을 마이그레이션에 포함한다:
     ```sql
     ALTER TABLE <table_name> REPLICA IDENTITY FULL;
     ```

4. **새 테이블 추가 시 두 SQL 모두 필요**
   ```sql
   ALTER TABLE <table_name> REPLICA IDENTITY FULL;          -- DELETE 필터 지원
   ALTER PUBLICATION supabase_realtime ADD TABLE <table_name>;
   ```

5. **고빈도 데이터는 Broadcast 사용** — 1초에 수십 번 변경되는 데이터(커서, 센서 등)는
   `postgres_changes`(CDC) 대신 Supabase Broadcast를 사용한다. DB 부하와 메시지 비용이 모두 절감된다.

### 구독 패턴 (표준 코드)

```typescript
useEffect(() => {
  if (!tenantId) return
  const channel = supabase
    .channel(`<table>-${tenantId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: '<table>', filter: `tenant_id=eq.${tenantId}` }, handler)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: '<table>', filter: `tenant_id=eq.${tenantId}` }, handler)
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: '<table>', filter: `tenant_id=eq.${tenantId}` }, handler)
    .subscribe()
  return () => { supabase.removeChannel(channel) }   // ← 언마운트 해제 필수
}, [tenantId])
```

---

## 타입 체크 명령어

루트에서 실행하는 `npx tsc --noEmit`은 루트 `tsconfig.json`(`files: []`, project reference만 있음) 기준으로 동작해
실제로는 아무 파일도 검사하지 않고 항상 통과한다. **타입 체크는 반드시 `npx tsc -b`
(또는 `npm run build`)로 확인**한다. 실제 빌드(`tsc -b && vite build`)와 동일한 결과를 보장한다.

---

## 개발환경 파일명 표시 규칙

로컬 개발 환경에서 현재 화면이 어느 파일인지 바로 알 수 있도록,
새로운 페이지 또는 모달을 만들 때 반드시 `DevFileLabel`을 추가한다.

### 동작 방식

- `src/components/DevFileLabel.tsx`의 `DevFileLabel` 컴포넌트를 사용한다.
- `import.meta.env.DEV`가 `true`일 때만 동작하므로 프로덕션 빌드에는 영향 없다.
- `DevFileLabelDisplay`는 `App.tsx`에 전역으로 한 번만 등록되어 있으며, 모달이 열리면 자동으로 해당 파일명으로 전환된다.

### 규칙

1. **새 페이지(`src/pages/*.tsx`)** — 최상위 반환 div의 닫는 태그 바로 앞에 추가한다.
2. **새 모달(`src/components/modals/*.tsx`)** — 백드롭 div의 닫는 태그 바로 앞에 추가한다.
3. **파일명은 실제 파일명과 정확히 일치**시킨다 (`file="MyModal.tsx"`).
4. `pointer-events`, `z-index` 등 스타일은 컴포넌트 내부에서 처리하므로 별도 지정 불필요.

---

## 데이터 표시 포맷팅 규칙

모든 데이터 **표시** 포맷팅은 `src/lib/format.ts`의 함수를 사용한다.

| 대상 | 함수 | 출력 예시 |
|------|------|-----------|
| 전화번호 표시 | `fmtPhone(value)` | `010-1234-5678` |
| 숫자 천단위 | `fmtNumber(value)` | `1,234,567` |
| 전화번호 마스킹 | `maskPhone(value)` | 현재: 전체 노출 |
| 이메일 마스킹 | `maskEmail(value)` | 현재: 전체 노출 |
| 이름 마스킹 | `maskName(value)` | 현재: 전체 노출 |

### 반드시 지켜야 할 규칙

1. **`toLocaleString('ko-KR')` 인라인 사용 금지** — 항상 `fmtNumber()`를 사용한다.
2. **`formatPhone()` 직접 import 금지** — 표시 목적이라면 `fmtPhone()` from `src/lib/format.ts`를 사용한다.
   - 예외: 실시간 입력 onChange 핸들러 내부에서는 `formatPhone()` 직접 사용 허용.
3. **마스킹 정책 변경 시** — `format.ts`의 `mask*` 함수 내부만 수정하면 전체 적용된다.
4. **`null` / `undefined` 안전** — `fmtPhone`, `fmtNumber` 모두 null/undefined를 빈 문자열로 처리한다.

---

## 표·그리드 UI 열 정렬 규칙

`<table>`(thead/tbody) 또는 그리드 형태로 표시하는 UI를 새로 만들거나 수정할 때는 열(column) 성격에 따라 아래 정렬을 기본으로 적용한다.

| 열 성격 | 정렬 | 예시 |
|---------|------|------|
| 헤더(`<th>`) | 중앙 정렬 (`text-center`) | 모든 헤더 셀 |
| 비고·메모 등 문장 단위의 긴 자유 텍스트 | 좌측 정렬 (`text-left`) | 비고, 메모, 특이사항 등 서술형 텍스트 |
| 그 외 전부 (이름·이메일·숫자·뱃지·버튼·상태 등) | 중앙 정렬 (`text-center`) | 이름, 이메일, 횟수, 유효기간, 소진, 상태, 액션 버튼 등 |

- 기본값은 중앙 정렬이다. 좌측 정렬은 비고·메모처럼 문장 길이가 들쭉날쭉한 서술형 텍스트 열에만 예외적으로 적용한다.
- 이름·이메일처럼 짧아도 문자열인 열도 예외가 아니라 중앙 정렬 대상이다.
- 새 표를 만들 때뿐 아니라, 기존 표를 수정하는 김에 발견한 정렬 위반도 함께 고친다.

---

## MemberSearchSelect 트리거 폭 규칙

`src/components/shared/MemberSearchSelect.tsx`는 드롭다운을 펼칠 때 가독성을 위해
최소 폭을 `MAX_DROPDOWN_WIDTH`(280px)로 강제한다 (`Math.max(trigger 폭, 280)`).

**트리거(입력창) 컨테이너 폭을 280px보다 좁게 주면, 드롭다운이 트리거보다 오른쪽으로
튀어나와 보이는 시각적 버그가 생긴다.** 실제로 회원관리 화면 필터를 `w-40 sm:w-48`
(160~192px)로 좁게 잡았다가 이 문제가 발생한 사례가 있었다.

### 반드시 지켜야 할 규칙

- `MemberSearchSelect`를 좁은 공간(필터 바 등)에 배치할 때는 트리거 컨테이너 폭을
  **최소 `280px` 이상**으로 준다 (예: `sm:w-[280px]`).
- 화면 폭이 280px보다 좁을 수 있는 모바일 레이아웃에서는 `w-full`로 주어 트리거가
  드롭다운 폭과 항상 일치하도록 한다.
- 모달처럼 이미 폭이 넉넉한 곳(`className="w-full"` + 모달 자체가 `max-w-sm` 이상)은
  별도 조치 없이 안전하다.

---

## 관리자콘솔 ↔ 조직 위자드 동기화 규칙

커스텀 필드 타입, 역할 설정, 슬롯 규칙 등 **조직 위자드(Setup Wizard)의 각 단계와 관리자콘솔(AdminPage)은 동일한 기능을 독립적으로 구현하고 있다.**
어느 한쪽을 수정할 때는 반드시 다른 쪽도 함께 확인하고 동기화해야 한다.

### 동기화 대상 파일

| 위자드 단계 | 관리자콘솔 대응 위치 |
|------------|---------------------|
| `Step7CustomFields.tsx` — 커스텀 필드 타입·미리보기 | `AdminPage.tsx` — `FIELD_TYPE_DEFS`, `CfTypeIcon`, `FieldPreview` |

### 반드시 지켜야 할 규칙

1. **`CustomFieldType` union에 새 타입 추가 시** — `Step7CustomFields.tsx`의 `FIELD_TYPE_DEFS`와 `FieldPreview` 수정 후, `AdminPage.tsx`의 `FIELD_TYPE_DEFS`, `CfTypeIcon`, `FieldPreview`도 반드시 같이 수정한다.
2. **관리자콘솔에서 먼저 수정한 경우** — 위자드 동일 단계도 확인하여 누락 여부를 검증한다.
3. **image_upload 등 파일 관련 필드** — `show_in_dashboard`, `FIELD_TYPES_WITH_OPTIONS`, `PLACEHOLDER_TYPES` 배열에서 제외되어야 하므로, 양쪽 파일 모두에서 이 배열에 추가하지 않는다.

---

## 버티컬 멀티앱 시스템 규칙

DTS는 단일 코드베이스에서 7개 버티컬 앱(LESSON:ON, CLASS:ON, SHIFT:ON 등)을 운영한다.
모든 차이는 `feature_flags`, `verticalPresets`, `brandConfig`로만 표현한다.

> 상세 설계: `docs/architecture/implementation-design-2026-07-30.md`
> 포트폴리오 전략: `docs/strategy/multi-app-portfolio-strategy-2026-07-29.md`

### 반드시 지켜야 할 규칙

1. **버티컬 식별자 하드코딩 금지**
   - `if (vertical === 'lesson-sports')` 같은 분기를 소스코드에 쓰지 않는다.
   - 버티컬별 차이는 `src/lib/verticalPresets.ts`의 `VERTICAL_PRESETS` 맵에 데이터로 등록한다.
   - 기능 on/off는 반드시 `feature_flags` 키로 처리한다.

2. **기능 표시 여부는 `getFF()` 로만 판단**
   ```ts
   // ✅ 올바른 방법
   import { getFF } from '@/lib/featureFlags'
   const ff = tenant?.settings?.feature_flags
   if (getFF(ff, 'lesson_packages')) { ... }

   // ❌ 금지
   if (tenant?.settings?.feature_flags?.lesson_packages) { ... }  // undefined 처리 누락
   if (vertical === 'lesson-sports') { ... }                       // 버티컬 하드코딩
   ```

3. **앱 이름·브랜드 색상은 `BRAND` 상수에서만 읽기**
   - `src/lib/brandConfig.ts`의 `BRAND` 상수를 통해서만 접근한다.
   - `"LESSON:ON"`, `"#FF6B35"` 같은 앱 이름·색상을 소스에 직접 쓰지 않는다.
   - 버티컬별 환경 변수 파일(`.env.lesson-on` 등)이 빌드 시 주입한다.

4. **플랜 한도 체크는 `usePlanLimits` 훅으로만**
   - 멤버 수·레슨권 종류·SMS 건수 한도는 반드시 `usePlanLimits()`의 값과 `isAtLimit()` 헬퍼를 사용한다.
   - 숫자 10, 3, 100 등 한도값을 컴포넌트에 직접 쓰지 않는다.

5. **광고 표시 여부는 `useAdDisplay` 훅으로만**
   - `plan === 'free'` 조건을 컴포넌트에 직접 쓰지 않는다.
   - `const { showAds } = useAdDisplay()` 를 통해서만 제어한다.

6. **신규 버티컬 추가 시 체크리스트**
   - [ ] `VERTICAL_PRESETS`에 새 항목 등록 (`verticalPresets.ts`)
   - [ ] `.env.<vertical-name>` 환경 변수 파일 작성
   - [ ] `package.json`에 `build:<vertical-name>` 스크립트 추가
   - [ ] 필요한 `feature_flags` 키가 `FeatureFlags` 인터페이스에 있는지 확인
   - [ ] 슈퍼관리자 `AdminPage`의 `feature_flags` 토글 UI에 새 키 반영

### 버티컬 앱 빌드 방법

```bash
# 특정 버티컬 빌드 (환경 변수 자동 적용)
npm run build:lesson-on    # LESSON:ON
npm run build:shift-on     # SHIFT:ON
npm run build:serve-on     # SERVE:ON

# Capacitor Android 동기화
npx cap sync android
```

### 수익화 게이트 구현 원칙

- 무료 플랜 한도 도달 시 `UpgradePromptModal`을 표시한다.
- 광고는 무료 플랜 사용자에게만 표시하고, `useAdDisplay` 훅으로 제어한다.
- 앱 내 결제 링크는 Apple 정책상 직접 노출이 불가하므로, "웹사이트에서 구독 관리" 방식으로 안내한다.

---

## Android 앱 출시 워크플로우

새 버티컬 앱을 Android Play Store에 출시할 때마다 아래 순서를 따른다.

> 최초 설정 사례: LESSON:ON (2026-07-30)

### 1. applicationId 설정 규칙

- `android/app/build.gradle`의 `namespace`와 `applicationId`를 버티컬별로 고유하게 설정한다.
- **Play Store 제출 후 applicationId는 절대 변경할 수 없다.** 신중하게 결정한다.
- 명명 규칙: `com.dtschedule.<vertical>` (예: `com.dtschedule.lessonon`)

| 버티컬 | applicationId |
|--------|---------------|
| LESSON:ON | `com.dtschedule.lessonon` |
| SHIFT:ON  | `com.dtschedule.shifton` |
| SERVE:ON  | `com.dtschedule.serveon` |
| CLASS:ON  | `com.dtschedule.classon` |
| WORK:ON   | `com.dtschedule.workon` |
| SALON:ON  | `com.dtschedule.salonon` |
| CARE:ON   | `com.dtschedule.careon` |

### 2. 키스토어 관리 규칙

- 버티컬마다 키스토어를 **별도로** 생성한다. 하나를 공유하지 않는다.
- 키스토어 파일: `android/app/keystores/<vertical>.keystore` (`.gitignore`로 Git 제외)
- 서명 설정: `android/app/keystore.properties` (`.gitignore`로 Git 제외)
- 템플릿: `android/app/keystore.properties.example` (Git 포함, 비밀번호 없음)
- **키스토어 + 비밀번호를 분실하면 Play Store 업데이트가 영구적으로 불가능하다.**
  반드시 암호 관리자(1Password, Bitwarden 등)에 백업한다.

**신규 버티컬 키스토어 생성 명령:**
```powershell
mkdir android\app\keystores
keytool -genkey -v `
  -keystore android\app\keystores\<vertical>.keystore `
  -alias <vertical> -keyalg RSA -keysize 2048 -validity 10000 `
  -dname "CN=<AppName>, OU=Mobile, O=DTS, L=Seoul, ST=Seoul, C=KR" `
  -storepass <PASSWORD> -keypass <PASSWORD>
```

### 3. 앱 아이콘 생성 규칙

- 소스: `scripts/generate-icon.js` (Playwright 기반, 1024×1024 PNG 자동 생성)
- 출력: `assets/icon-only.png` → `@capacitor/assets`가 Android 전체 사이즈로 변환
- 버티컬별 색상/텍스트는 `scripts/generate-icon.js`의 `VERTICAL_ICONS` 맵에서 관리한다.
- 아이콘 변경 시 반드시 `npm run icon:<vertical>` 후 `npm run build:<vertical>` 재실행.

```bash
npm run icon:lesson-on   # 아이콘 생성 + Android 전체 사이즈 자동 배포
npm run build:lesson-on  # 웹 빌드 + cap sync
```

### 4. 릴리즈 AAB 빌드 절차

```powershell
# 1. 아이콘 최신 상태 확인
npm run icon:lesson-on

# 2. 웹 빌드 + Capacitor 동기화
npm run build:lesson-on

# 3. 릴리즈 AAB 빌드 (Android Studio 없이 터미널에서)
cd android
.\gradlew.bat bundleRelease

# 4. 결과물 위치
# android/app/build/outputs/bundle/release/app-release.aab
```

### 5. Play Store 제출 체크리스트

- [ ] `applicationId` 확정 (제출 후 변경 불가)
- [ ] 키스토어 생성 + 비밀번호 암호 관리자에 백업
- [ ] `android/app/build.gradle` 서명 설정 완료
- [ ] `versionCode` / `versionName` 업데이트 (업데이트마다 versionCode +1)
- [ ] AAB 빌드 성공 확인
- [ ] Google Play Console 계정 (개발자 등록 $25 일회성)
- [ ] 스토어 등록 정보: 앱 이름, 설명(한/영), 스크린샷 최소 2장, 아이콘 512×512
- [ ] 개인정보처리방침 URL (필수)
- [ ] 데이터 안전 섹션 작성 (수집 데이터 항목)
- [ ] 내부 테스트 트랙 → 비공개 테스트 → 프로덕션 순으로 단계적 출시

### 6. 버전 관리 규칙

- `versionCode`: Play Store 업데이트마다 정수 +1 (절대 감소 불가)
- `versionName`: 사용자 표시용 문자열 (예: `"1.0.1"`)
- 두 값 모두 `android/app/build.gradle`의 `defaultConfig`에서 관리한다.

```groovy
versionCode 1       // 업데이트마다 +1
versionName "1.0"   // 사용자에게 보이는 버전
```

---

## Supabase 대시보드 SQL 작성 규칙

Supabase 대시보드 SQL 에디터에서 직접 실행할 SQL을 제공할 때 반드시 아래를 지킨다.

### Dollar-quote delimiter

`$$` 대신 **`$func$`** 를 사용한다.

```sql
-- ❌ 금지 — 대시보드가 $$ 파싱 시 오류를 낼 수 있음
AS $$
...
$$;

-- ✅ 올바른 방법
AS $func$
...
$func$;
```

Supabase 대시보드는 쿼리 메타데이터 주석(`-- source: dashboard` 등)을 SQL에 삽입하는데,
이 주석이 `$$...$$` 블록과 충돌해 "unterminated dollar-quoted string" 오류를 유발한다.

### RAISE EXCEPTION 메시지

PL/pgSQL 함수 내 `RAISE EXCEPTION` 메시지는 **영문**으로 작성한다.

```sql
-- ❌ 금지 — 한글 문자열이 대시보드 인코딩 오류를 유발할 수 있음
RAISE EXCEPTION '이름을 입력해 주세요.';

-- ✅ 올바른 방법
RAISE EXCEPTION 'name required';
```

마이그레이션 파일(`.sql`) 내부 주석은 한글을 사용해도 무방하다.
이 규칙은 **대시보드에서 직접 실행하도록 안내하는 SQL 스니펫**에만 적용된다.

---

## 랜딩페이지 문체 규칙

`src/pages/landing/` 하위의 모든 랜딩페이지 컴포넌트(LandingLessonOn, LandingShiftOn, LandingServeOn 등)를 작성하거나 수정할 때 반드시 아래 규칙을 따른다.

### 1. 문체 — 하십시오체 통일

모든 문장의 종결어미는 **하십시오체**로 통일한다.

| 금지 | 대체 |
|------|------|
| `~해요`, `~있어요`, `~드려요` | `~합니다`, `~있습니다`, `~드립니다` |
| `~하세요`, `~보세요` | `~하십시오` |
| `~알려드려요` | `~알립니다` |
| `~보여줍니다` | `~표시합니다` |

### 2. 톤 — 객관적·전문적

- 과장·감탄·친근체 표현을 배제하고 사실 중심으로 서술한다.
- `마음껏`, `우리 스튜디오만의` 같은 비공식 표현은 `자유롭게`, `고유` 등 중립 표현으로 대체한다.

### 3. 군더더기 문구 금지

아래 유형의 문구는 삭제하거나 핵심 정보로 대체한다.

- `지금 바로 확인해보세요` → 삭제 또는 구체적 설명으로 대체
- `~걱정이 없습니다` → 기능 효과로 구체화 (예: `저장 효율을 높입니다`)
- `이런 곳에서 쓰고 있어요` → `주요 활용 업종`

### 4. 섹션 레이블·버튼 예외

네비게이션 버튼(`로그인`, `무료로 시작하기`), 섹션 번호 레이블(`01 — 강사의 하루`), 목업 UI 내부 텍스트는 이 규칙의 적용 대상이 아니다.
