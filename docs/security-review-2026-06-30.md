# 개인정보 보안 검토 보고서

검토일: 2026-06-30  
대상: dtschedule Supabase DB 스키마 및 Edge Functions

---

## 저장 중인 개인정보(PII) 목록

| 테이블 | 컬럼 | 내용 |
|--------|------|------|
| `profiles` | `name`, `email`, `avatar_url` | 회원 실명·이메일·프로필 이미지 |
| `customers` | `name`, `phone`, `owner_user_id` | 사업주 이름·전화번호 |
| `assignments` | `member_name`, `customer_name`, `customer_phone`, `extra_data` (JSONB) | 배정 멤버명·고객 연락처·커스텀 필드 |
| `push_subscriptions` | `p256dh`, `auth` | 웹푸시 인증 비밀키 |
| `notifications` | `body` | 이름 포함 알림 본문 |

---

## 🔴 Critical

### C-1. `send-reminders` Edge Function 호출자 인증 없음 — ✅ 조치 완료 (2026-07-01)

- **파일**: `supabase/functions/send-reminders/index.ts`
- **문제**: 다른 Edge Function과 달리 `auth.getUser()` 검증이 없음. Supabase `verify_jwt=true`이지만 공개 anon key가 유효 JWT이므로 인증 없이 통과 가능.
- **영향**: 외부인이 `{"force":true}` 바디로 전 조직 알림 강제 발송 + `notifications` 대량 삽입 + 조직명 노출 + 비용 폭증
- **조치 내용**:
  - cron 모드: 전용 헤더 `x-cron-secret` 검증 (`CRON_SECRET` 시크릿, dev/prod 각각 별도 값으로 설정)
  - 수동/강제 모드: 호출자 JWT 검증 + 본인 조직 admin 또는 super_admin 권한 확인
  - `.github/workflows/send-reminders.yml`에 `x-cron-secret` 헤더 전달 추가
  - dev(`mcuszdvophmqrwostcah`)·prod(`bjnmaajhcmhxwonybnqc`) 모두 배포 및 curl로 인증 거부/통과 시나리오 검증 완료

---

## 🟠 High

### H-1. `customers` 테이블 anon 전체 접근 허용 — ✅ 조치 완료 (2026-07-03)

- **파일**: `supabase/reset_db.sql` (RLS 정책 `customers_select_has_active_tenant`)
- **문제**: `auth.uid()` 없이 anon을 포함한 전체 접근 허용. RLS는 컬럼 단위 제한 불가 → `phone`, `owner_user_id`, `plan` 전부 노출.
- **영향**: 공개 anon key로 전 사업주 이름·전화번호 열람 가능
- **조치 내용** (마이그레이션 `059_customers_public_access_rpc.sql`):
  - `customers_select_has_active_tenant` 정책 삭제
  - `list_active_org_customers()` RPC 추가 — id/name/tenant_id만 반환, anon 포함 호출 가능 (가입/조직가입 화면용)
  - `get_customer_plan_for_tenant(tenant_id)` RPC 추가 — 호출자가 해당 테넌트 admin 또는 super_admin일 때만 plan 반환 (회원추가 플랜한도 체크용)
  - `AuthPage.tsx`/`PendingPage.tsx`/`useAdmin.ts`의 관련 쿼리를 RPC 호출로 교체
  - dev·prod 모두 적용 후 anon 직접 조회 차단(빈 배열)·RPC 정상 동작 curl 검증 완료

### H-2. 시드 파일에 실명 + 평문 비밀번호 git 커밋 — 🟡 부분 조치 (2026-07-03)

- **파일**: `supabase/seed_members_202606.sql` (git 이력 포함)
- **문제**: 실명 19명 + 평문 비밀번호(`crypt('qweqwe', ...)`, 문서 주석의 `Volunteer2026!`과는 별개로 실제 SQL에 박혀있던 값)가 git 이력에 영구 기록됨
- **영향**: git 이력 접근 시 실명·비밀번호 노출
- **조치 내용**:
  - ✅ `git filter-repo`로 해당 파일을 전체 git 이력에서 완전히 제거, `origin/master`에 force-push 완료 (저장소가 1인 단독 사용이라 협업자 영향 없음 확인 후 진행)
  - ⚠️ **미조치**: 시드로 생성된 19개 `@lib.com` 계정의 실제 비밀번호(`qweqwe`)는 사용자 요청에 따라 재설정하지 않음 — 해당 계정들이 여전히 이 비밀번호를 쓰고 있다면 이미 유출된 값이므로 별도로 재설정이 필요함

---

## 🟡 Medium

### M-1. 마스킹 함수가 실제로 전체 노출 — ✅ 조치 완료 (2026-07-03)

- **파일**: `src/lib/format.ts` (`maskPhone`, `maskEmail`, `maskName`)
- **문제**: 현재 모든 mask* 함수가 pass-through(전체 노출) 상태. `customer_phone`이 전 멤버에게 그대로 노출.
- **조치 내용**:
  - `format.ts`: `maskPhone`/`maskEmail`/`maskName` 실제 마스킹 로직 구현 (`010-****-5678` 등)
  - 관리자만 `customer_phone` 전체 번호를 보고 나머지는 마스킹되도록 월간(`TimeSlotCell`)/일간(`DayView`)/모달(`SlotEditModal`)/엑셀·CSV·Word·PDF 내보내기(`exportSchedule`) 전체에 동일 규칙 적용

### M-2. `tenant_roles` / `tenants` 교차 테넌트 정보 노출

- **문제**: `tenant_roles_select_all`이 `USING(true)`로 전 조직 역할 열람 허용. `tenants_select`가 anon에게 `settings` JSONB 전체 노출.
- **권장 조치**: 본인 소속 조직 데이터만 반환하도록 정책 조건 추가

### M-3. Edge Function에서 PII 대량 로깅

- **파일**: `supabase/functions/send-reminders/index.ts`, `supabase/functions/admin-create-user/index.ts`
- **문제**: `console.log`에 userId, 조직명 등 PII 기록. `admin-create-user`가 내부 에러 메시지를 클라이언트에 그대로 반환하며 모든 오류를 HTTP 200으로 응답.
- **권장 조치**: 로그에서 PII 제거 또는 마스킹, 에러 응답 상태코드 정상화

### M-4. CORS 와일드카드 + 무인증 함수 결합

- **문제**: `Access-Control-Allow-Origin: *` + 인증 없는 함수 조합으로 외부 사이트에서 직접 호출 가능
- **권장 조치**: 운영 환경에서는 허용 오리진을 서비스 도메인으로 제한

---

## 🟢 Low

- `profiles_select_same_tenant` 정책이 같은 조직 내 이메일 상호 노출
- 전화번호 평문 저장 (앱 레벨 암호화 없음)
- 비회원 배정 시 `user_id = NULL` 허용 (의도된 설계이나 식별 불가)

---

## 양호한 항목 ✅

- 전 테이블 RLS 활성화
- 서비스 롤 키 하드코딩 없음 (환경변수로만 관리)
- 헬퍼 함수 `SECURITY DEFINER` + `search_path` 고정
- super_admin 전용 기능 RPC 게이팅 적절
- `admin-create-user` / `delete-account` 함수 호출자·권한 검증 수행
- 잠금 트리거 견고하게 구성

---

## 조치 우선순위 요약

| 순위 | 항목 | 긴급도 | 작업 유형 |
|------|------|--------|-----------|
| 1 | C-1 send-reminders 인증 추가 | 즉시 | ✅ 완료 (2026-07-01) |
| 2 | H-2 시드 파일 비밀번호 재설정 | 즉시 | 🟡 부분 완료 — git 이력 제거는 완료, 계정 비밀번호 재설정은 보류 |
| 3 | H-1 customers RLS 정책 교체 | 단기 | ✅ 완료 (2026-07-03) |
| 4 | M-1 마스킹 함수 실제 구현 | 단기 | ✅ 완료 (2026-07-03) |
| 5 | M-2 tenant_roles/tenants 정책 강화 | 중기 | 마이그레이션 |
| 6 | M-3 로깅 PII 제거 | 중기 | 코드 수정 |
| 7 | M-4 CORS 오리진 제한 | 중기 | 설정 변경 |
