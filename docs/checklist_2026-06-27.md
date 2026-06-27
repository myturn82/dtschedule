# 2026-06-27 변경사항 점검 체크리스트

테스트 환경: http://localhost:5173  
테스트 계정: 슈퍼관리자 / 조직 관리자 / 일반 멤버 각각 필요

---

## 0. 사전 준비 (테스트 전 반드시 완료)

### 0-1. DB 마이그레이션 적용

- [ ] `npx supabase login --token <PAT>` (CLI 인증)
- [ ] `npx supabase db push --project-ref mcuszdvophmqrwostcah` (개발 DB)
- [ ] **[DB 확인]** Supabase 대시보드 → Table Editor에서 `notification_settings`, `notifications`, `push_subscriptions` 세 테이블이 생성됨

### 0-2. VAPID 키 설정

- [ ] `npx web-push generate-vapid-keys` 실행 → Public/Private 키 확인
- [ ] Supabase 대시보드 → Project Settings → Edge Functions → Secrets에 저장
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `VAPID_SUBJECT` (예: `mailto:admin@yourdomain.com`)
- [ ] `.env.local`에 `VITE_VAPID_PUBLIC_KEY=<Public Key>` 추가
- [ ] `npm run dev` 재시작

### 0-3. Edge Function 배포

- [ ] `npx supabase functions deploy send-reminders --project-ref mcuszdvophmqrwostcah`
- [ ] Supabase 대시보드 → Edge Functions 목록에 `send-reminders` 표시됨

---

## 1. 슈퍼관리자 로그인 리다이렉트

배경: 슈퍼관리자 계정으로 로그인하면 조직 선택 화면이 아닌 SuperAdminPage로 바로 이동해야 함.

- [ ] 슈퍼관리자 계정으로 로그인 → `/superadmin` 화면으로 바로 이동함 (조직 선택 화면 거치지 않음)
- [ ] SuperAdminPage에서 "조직선택" 버튼 클릭 → `TenantSelectPage`로 이동함
- [ ] SuperAdminPage에서 "로그아웃" 버튼 클릭 → 로그인 화면으로 이동함
- [ ] 일반 계정으로 로그인 → `/superadmin` 직접 접근 시 `/` 로 리다이렉트됨

---

## 2. 인앱 알림 벨 아이콘 (AppHeader)

배경: 상단 헤더에 벨 아이콘과 미읽음 뱃지를 추가, 클릭 시 NotificationPanel 드롭다운 표시.

- [ ] 로그인된 상태에서 헤더 오른쪽에 벨(🔔) 아이콘이 표시됨
- [ ] 비로그인 상태에서 벨 아이콘이 표시되지 않음
- [ ] 미읽음 알림이 없을 때 뱃지가 표시되지 않음
- [ ] 미읽음 알림이 있을 때 빨간 뱃지에 개수 표시됨 (1~9 숫자, 10개 이상은 "9+")
- [ ] 벨 아이콘 클릭 → NotificationPanel 드롭다운 열림
- [ ] 드롭다운 열린 상태에서 외부 클릭 → 드롭다운 닫힘
- [ ] 벨 아이콘 재클릭 → 드롭다운 닫힘

---

## 3. NotificationPanel (알림 드롭다운)

배경: 최근 알림 최대 20개, 읽음 처리, 모두 읽음 기능.

- [ ] 알림이 없을 때 "새 알림이 없습니다" 빈 상태 메시지 표시됨
- [ ] 알림 목록이 생성 역순으로 표시됨 (최신 상단)
- [ ] 미읽음 알림 항목에 파란 배경 + 파란 점 표시됨
- [ ] 읽은 알림 항목은 일반 배경으로 표시됨
- [ ] 각 알림에 제목, 본문 요약, 상대 시간("방금 전", "3분 전" 등) 표시됨
- [ ] 알림 항목 클릭 → 해당 알림이 읽음 처리됨 **[DB 확인: `is_read = true`]**
- [ ] "모두 읽음" 버튼 클릭 → 모든 알림 읽음 처리됨 **[DB 확인]**
- [ ] **[실시간]** 다른 세션/Edge Function에서 알림 INSERT 시 → 뱃지 및 목록이 새로고침 없이 즉시 업데이트됨

---

## 4. 웹 푸시 구독 (AppHeader 유저 메뉴)

배경: 헤더 유저 메뉴에 "푸시 알림" 토글, 브라우저 알림 권한 요청 및 구독 관리.

- [ ] 헤더 유저 메뉴에 "푸시 알림 켜기" 항목이 표시됨 (미구독 상태)
- [ ] "푸시 알림 켜기" 클릭 → 브라우저 알림 권한 요청 팝업 표시됨
- [ ] 권한 허용 후 → "푸시 알림 끄기"로 상태 변경됨 **[DB 확인: `push_subscriptions` 테이블에 행 추가]**
- [ ] "푸시 알림 끄기" 클릭 → 구독 해제됨 **[DB 확인: `push_subscriptions`에서 행 삭제]**
- [ ] 브라우저 알림 권한을 거부하면 → 안내 메시지 표시되고 구독 상태 변경 없음
- [ ] 웹 푸시 미지원 브라우저에서 → 푸시 알림 항목 자체가 숨겨짐
- [ ] VAPID 키 미설정 시(`VITE_VAPID_PUBLIC_KEY` 없음) → 구독 시도 없이 조용히 처리됨 (콘솔 경고만)

---

## 5. AdminPage — 알림 설정 섹션

배경: 조직 관리자가 조직별 알림 활성화 여부, 발송 시간, 수신 대상, 메시지 템플릿을 설정.

- [ ] AdminPage 하단에 "알림 설정" 섹션이 표시됨
- [ ] 초기 상태: 알림 비활성화(토글 OFF), 발송 시간 18:00, 수신 대상 "배정된 멤버" 체크됨
- [ ] 알림 활성화 토글(ON/OFF) 정상 동작
- [ ] 발송 시간 드롭다운: 00:00~23:30 (30분 단위) 선택 가능
- [ ] 수신 대상 체크박스: "배정된 멤버", "관리자" 각각 독립 체크 가능
- [ ] 메시지 템플릿 텍스트에어리어 수정 가능, `{{date}}` `{{slot}}` `{{org}}` 변수 안내 표시됨
- [ ] "저장" 버튼 클릭 → 성공 메시지 표시됨 **[DB 확인: `notification_settings` 테이블에 upsert]**
- [ ] 페이지 재방문 시 저장된 설정값이 그대로 불러와짐
- [ ] 다른 조직의 관리자가 각자의 설정을 독립적으로 저장할 수 있음 (테넌트 격리)

---

## 6. SuperAdminPage — D-1 알림 수동 발송

배경: 슈퍼관리자가 버튼 클릭으로 전체 조직에 D-1 알림을 즉시 발송(send_time 무시).

- [ ] SuperAdminPage에 "D-1 알림 수동 발송" 패널이 표시됨
- [ ] "지금 발송" 버튼 클릭 → 로딩 상태(비활성화)로 전환됨
- [ ] 발송 완료 후 결과 메시지 표시됨 (예: "2개 조직, 5명에게 발송 완료 / 0건 실패")
- [ ] **[DB 확인]** 알림이 활성화된 조직의 내일 배정 멤버의 `notifications` 테이블에 행이 추가됨
- [ ] 배정이 없는 조직은 알림이 발송되지 않음 (sent 카운트에 포함되지 않음)
- [ ] `is_enabled = false`인 조직은 발송 대상에서 제외됨
- [ ] **[웹 푸시 확인]** 구독 중인 브라우저에 푸시 알림이 수신됨 (브라우저 알림 팝업)
- [ ] 웹 푸시 알림 클릭 → `/schedule?date=YYYY-MM-DD` 화면으로 이동함

---

## 7. 서비스 워커 (PWA)

배경: `public/sw.js` 등록, push 이벤트 수신 및 알림 클릭 처리.

- [ ] 브라우저 DevTools → Application → Service Workers에 `sw.js`가 등록됨
- [ ] 상태가 "activated and running"으로 표시됨
- [ ] 앱이 백그라운드(탭 비활성) 상태에서도 푸시 알림 수신됨
- [ ] 알림 클릭 시 올바른 URL(`/schedule?date=YYYY-MM-DD`)로 이동함

---

## 8. 회귀 테스트 (기존 기능 영향 확인)

- [ ] 헤더 레이아웃 정상: 벨 아이콘 추가 후에도 피드백 버튼·사용자 메뉴 레이아웃 깨지지 않음
- [ ] 모바일 헤더(`sm` 미만): 벨 아이콘이 적절한 크기로 표시됨
- [ ] 슈퍼관리자 외 일반 사용자 로그인 플로우 정상 (슈퍼관리자 redirect 로직 영향 없음)
- [ ] AdminPage 기존 섹션(슬롯 설정, 역할 설정 등) 정상 동작
- [ ] SchedulePage 정상 로딩
- [ ] Supabase Realtime 기존 구독 (assignments, dateOverrides 등) 정상 동작

---

## 9. DB / 마이그레이션 반영 상태

- [ ] 개발 DB(`mcuszdvophmqrwostcah`) 마이그레이션 `058_notifications.sql` 적용됨
- [ ] `notification_settings` 테이블에 `tenant_id UNIQUE` 제약 확인
- [ ] `notifications` 테이블 Realtime 구독 활성화 확인 (`supabase_realtime` publication)
- [ ] `push_subscriptions` 테이블 `endpoint UNIQUE` 제약 확인
- [ ] RLS: 다른 유저의 알림이 SELECT되지 않음 (익명 쿼리 차단)
- [ ] `supabase/reset_db.sql` — 3개 테이블 DROP/CREATE 포함 확인
- [ ] `supabase/reset_data.sql` — 3개 테이블 TRUNCATE 포함 확인
- [ ] `npx tsc -b` 통과 (빌드 오류 없음)

---

## 테스트 우선순위

1. **섹션 0** — 사전 준비가 완료되지 않으면 이후 항목 대부분 확인 불가
2. **섹션 1** — 슈퍼관리자 로그인 리다이렉트 (가장 눈에 띄는 UX 변경)
3. **섹션 5** — AdminPage 알림 설정 저장 (Edge Function 발송의 전제 조건)
4. **섹션 6** — SuperAdminPage 수동 발송 (E2E 핵심 시나리오)
5. **섹션 2~3** — 인앱 벨 아이콘 + NotificationPanel (발송 후 실시간 수신 확인)
6. **섹션 4, 7** — 웹 푸시 구독 + 서비스 워커 (VAPID 설정 완료 후)
7. **섹션 8** — 회귀 테스트
8. **섹션 9** — DB 마이그레이션 최종 확인
