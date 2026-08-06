# 2026-07-25 변경사항 점검 체크리스트

테스트 환경: http://localhost:5173
테스트 계정: 슈퍼어드민 (yjsong82@gmail.com) + 일반 회원 계정

---

## 1. [065] 탈퇴 시 개인정보 익명화

배경: 개인정보 보호법 제21조 – 회원 탈퇴 시 배정 기록의 개인정보를 즉시 익명화해야 함

- [ ] 일반 회원 계정으로 배정이 있는 상태에서 탈퇴 처리 (슈퍼어드민 → 회원 삭제)
- [ ] **[DB 확인]** 해당 회원의 `assignments.member_name` → '탈퇴회원', `user_id` → NULL, `note` → NULL, `account_deleted` → true
- [ ] **[DB 확인]** `customers.owner_user_id` → NULL (고객 레코드 자체는 보존됨)
- [ ] 탈퇴 처리 후 스케줄 화면에서 '탈퇴회원' 표시로 정상 노출되는지 확인

---

## 2. [066] 전화번호 암호화 1단계 (병렬 컬럼)

배경: 전화번호를 AES-256으로 암호화한 사본(`_enc` 컬럼)을 추가. 기존 plain 컬럼은 유지 (Phase 2에서 제거 예정)

- [ ] 신규 회원가입 후 **[DB 확인]** `profiles.phone_enc`에 암호화된 값이 자동 입력됨
- [ ] 관리자가 회원 전화번호 수정 후 **[DB 확인]** `phone_enc`가 자동 갱신됨
- [N/A] `assignments.customer_phone_enc` 암호화 트리거 — **현재 앱에서 해당 없음**
  - `assignments.customer_phone` 컬럼은 UI 어떤 경로로도 저장되지 않음 (항상 null)
  - 동적 필드 ON: 전화번호 → `extra_data[필드ID]`, 동적 필드 OFF: 전화번호 입력 UI 없음
  - 트리거 자체는 정상이나 원본 데이터가 없어 실질적으로 동작하지 않음
  - `extra_data` 내 phone 필드 암호화는 **Phase 3** 별도 마이그레이션 예정
- [ ] 기존 사용자 화면에서 전화번호 표시 정상 (plain 컬럼 유지이므로 변화 없어야 함)
- [ ] **[DB 확인]** authenticated/anon 롤이 `phone_enc` 컬럼 직접 SELECT 불가 (REVOKE 확인)

---

## 3. [067] 동의 버전 관리 및 이력 기록

배경: 개인정보 보호법 제15조·제22조 – 동의 시점·버전을 이력으로 보관해야 함

- [ ] **[DB 확인]** `policy_versions` 테이블 생성 확인
- [ ] **[DB 확인]** `consent_logs` 테이블 생성, 기존 사용자 terms/privacy 동의 이력 백필 확인
- [ ] **[DB 확인]** `profiles.marketing_agreed_at`, `push_agreed_at`, `phone_agreed_at` 컬럼 존재 확인
- [ ] 본인 동의 이력만 조회 가능하고, 타인 이력은 조회 불가 (RLS 확인)

---

## 4. [068] 알림 보유기간 관리

배경: 개인정보 보호법 제21조 – 목적 달성 후 알림 파기. 읽은 알림 30일, 미읽은 알림 90일

- [ ] **[DB 확인]** `notifications.archived_at` 컬럼 존재 확인
- [ ] 알림 목록 화면에서 `archived_at IS NULL` 필터로 활성 알림만 표시되는지 확인
- [ ] **[DB 확인]** `cleanup_old_notifications()` 함수 호출 후 기준 초과 알림에 `archived_at` 설정됨
- [ ] 알림 수신 및 읽음 처리 기존 동작 정상 확인 (회귀)

---

## 5. [069] 휴면 계정 추적

배경: 개인정보 보호법 시행령 제48조의5 – 장기 미이용자 처리 근거 마련

- [ ] **[DB 확인]** `profiles.last_login_at` 컬럼 존재, 기존 사용자는 `created_at`으로 초기화됨
- [ ] 로그인 후 **[DB 확인]** `profiles.last_login_at`이 현재 시각으로 갱신됨
- [ ] 슈퍼어드민 계정으로 `SELECT * FROM get_dormant_accounts(3)` 실행 시 결과 반환
- [ ] 일반 계정으로 동일 함수 호출 시 빈 결과 또는 권한 오류 반환 (보안 확인)

---

## 6. 회귀 테스트 (기존 기능 영향 확인)

- [ ] 회원가입 → 조직 가입 → 승인 → 배정 전체 플로우 정상 동작
- [ ] 알림 전송 및 푸시 알림 수신 정상 동작
- [ ] 관리자콘솔에서 회원 목록 조회 및 전화번호 수정 정상 동작
- [ ] 스케줄 월간/주간/일간 뷰 정상 표시

---

## 7. DB / 마이그레이션 반영 상태

- [ ] 개발 DB(`mcuszdvophmqrwostcah`) — 마이그레이션 064~069 적용 확인
- [ ] **[운영 DB]** 사용자 승인 후 `npx supabase db push --project-ref bjnmaajhcmhxwonybnqc` 실행
- [ ] `supabase/reset_db.sql` 기준 마이그레이션 001~069로 갱신됨 ✅
- [ ] `supabase/reset_data.sql` `consent_logs`, `policy_versions` TRUNCATE 추가됨 ✅
- [ ] `npx tsc -b` 통과

---

## 테스트 우선순위

1. **7번** DB 마이그레이션 적용 상태 먼저 확인 — 나머지 테스트의 전제 조건
2. **1번** 탈퇴 익명화 — 개인정보 보호 핵심, 데이터 훼손 위험 있으므로 우선 검증
3. **4번** 알림 — 기존 기능과 가장 직접적으로 연관됨 (`archived_at` 필터 추가)
4. **5번** 휴면 계정 — 로그인 시 fire-and-forget 업데이트이므로 성능 영향 확인
5. **2번·3번** 암호화·동의 이력 — DB 확인 위주, 사용자 화면 변화 없음
