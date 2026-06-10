# dtschedule 프로젝트 규칙

## 새 PC / 환경 최초 설정 체크리스트

새 PC에서 프로젝트를 처음 시작하거나 유사한 프로젝트를 구성할 때 반드시 아래를 순서대로 수행한다.

### 1. 저장소 클론 및 의존성 설치

```
git clone <repo-url>
cd <project-dir>
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 Supabase 대시보드에서 값을 복사한다.

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

- Supabase 대시보드 → Project Settings → API 에서 확인
- `.env.local`은 `.gitignore`에 포함되어 있으므로 직접 생성해야 한다

### 3. Supabase CLI 인증

터미널이 non-TTY 환경(Claude Code 등)일 경우 대화형 로그인이 안 되므로
Personal Access Token을 발급받아 사용한다.

**토큰 발급:** https://supabase.com/dashboard/account/tokens

```
npx supabase login --token <your-personal-access-token>
```

- 토큰은 PC마다 1개씩 발급하거나 동일 토큰을 여러 PC에서 공유해도 무방하다
- 로그인 후 토큰은 `%APPDATA%\supabase\access-token`에 저장되어 이후 자동 인증된다
- 토큰 분실 또는 PC 폐기 시 대시보드에서 해당 토큰만 revoke한다

### 4. 개발 서버 실행 확인

```
npm run dev
```

`http://localhost:5173` 에서 정상 동작 확인

### 5. (Supabase 프로젝트가 새로운 경우) DB 스키마 초기화

새 Supabase 프로젝트에 스키마를 처음 구성할 때:
- `supabase/reset_db.sql` 내용을 Supabase SQL Editor에서 실행
- 이후 슈퍼어드민 계정 지정: `UPDATE profiles SET is_super_admin = true WHERE email = '...';`

---

## DB 환경 구성

| 환경 | Supabase Project ID |
|------|---------------------|
| 개발 (dev) | `mcuszdvophmqrwostcah` |
| 운영 (prod) | `bjnmaajhcmhxwonybnqc` |

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
