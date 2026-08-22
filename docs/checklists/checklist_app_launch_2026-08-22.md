# 앱 출시 최종 체크리스트

작성일: 2026-08-22  
대상: LESSON:ON Android (com.dtschedule.lessonon) + 웹 버티컬 전체

---

## PHASE 0 — 법적 의무 사항 (출시 전 필수)

### 0-1. 개인정보처리방침 공개 URL 확보 🔴 Critical

- [ ] `/privacy` 독립 페이지 라우트 생성 (legalTerms.ts 내용 활용)
- [ ] 법적 필수 기재사항 추가:
  - [ ] 개인정보 보호책임자 이름·직위·연락처(이메일)
  - [ ] 개인정보 국외 이전 고지 (Supabase/AWS ap-northeast-2, 미국 본사)
  - [ ] 열람·정정·삭제·처리정지 요청 연락처
  - [ ] 불만 처리 부서 및 담당자 연락처
  - [ ] 쿠키/자동 수집 장치 설치·운영 여부
- [ ] 공개 URL 확인: `https://lessonon.dtschedule.com/privacy`
- [ ] Footer 또는 설정 메뉴에서 항상 접근 가능한지 확인

### 0-2. CORS 허용 목록 업데이트 ✅ 완료 (2026-08-22)

- [x] `supabase/functions/_shared/cors.ts` 수정 (lessonon/shifton/serveon 추가)
- [x] 개발 DB Edge Functions 재배포 (5개 함수 전체)
- [x] 운영 DB Edge Functions 재배포 (5개 함수 전체)
- [ ] 실 도메인에서 SMS 발송 / 계정 삭제 / AI 파싱 기능 동작 확인

### 0-3. 테스트 계정 보안 조치 🟠 High

- [ ] 운영 DB에서 `@lib.com` 도메인 계정 19개 존재 여부 확인:
  ```sql
  SELECT email FROM auth.users WHERE email LIKE '%@lib.com';
  ```
- [ ] 존재하는 경우: 비밀번호 강제 재설정 또는 계정 비활성화

### 0-4. Storage 버킷 보안 확인 🟠 High

- [ ] Supabase 대시보드 → Storage → 버킷 정책 확인
- [ ] 이미지 버킷이 Public인 경우: RLS 정책 또는 Private 전환 검토
- [ ] 버킷 경로 `{tenantId}/{uuid}.webp` 테넌트 격리 동작 확인

### 0-5. 계정 삭제 시 이미지 파기 확인 🟠 High

- [ ] `delete-account` Edge Function 에서 Storage 파일 삭제 여부 확인
- [ ] `profiles` 삭제 CASCADE → Supabase Storage 파일 잔류 여부 테스트
- [ ] 필요 시 Storage 파일 삭제 로직 추가

---

## PHASE 1 — Android Play Store 제출

### 1-1. 키스토어 & 서명 보안

- [ ] **키스토어 비밀번호 암호 관리자(1Password 등)에 백업** ← 분실 시 업데이트 영구 불가
  - 파일: `android/app/keystores/lesson-on.keystore`
  - 비밀번호: 체크리스트 작성 시점 암호 관리자에 저장 확인
- [ ] `keystore.properties`가 Git에 없는지 확인: `git status android/app/keystore.properties`

### 1-2. 아이콘 & 스플래시

- [ ] **아이콘 디자인 최종 확정** (현재 코드 생성 임시 아이콘)
  - 512×512 고해상도 아이콘 (PNG, 알파 채널 없음) — Play Store 필수
  - `npm run icon:lesson-on` 재실행
- [ ] 스플래시 화면 배경색·로고 최종 확정
- [ ] 실기기에서 홈 화면 아이콘 표시 확인

### 1-3. 릴리즈 AAB 최종 빌드

```powershell
# 1. 아이콘 확인 후 재생성
npm run icon:lesson-on

# 2. 웹 빌드 + Capacitor 동기화
npm run build:lesson-on

# 3. 릴리즈 AAB 빌드
cd android
.\gradlew.bat bundleRelease

# 4. 결과물 확인
ls app\build\outputs\bundle\release\app-release.aab
```

- [ ] AAB 빌드 성공 확인
- [ ] `versionCode 1`, `versionName "1.0"` 확인 (android/app/build.gradle)

### 1-4. 실기기 동작 검증

- [ ] AAB → APK 변환 후 실기기 설치:
  ```
  npx bundletool build-apks --bundle=app-release.aab --output=app.apks --mode=universal
  npx bundletool install-apks --apks=app.apks
  ```
- [ ] 스플래시 화면 정상 표시
- [ ] 로그인 / 회원가입 동작 확인
- [ ] 스케줄 화면 로드 확인
- [ ] SMS 발송 기능 동작 확인 (CORS 수정 후)
- [ ] Android 뒤로가기 버튼: 홈에서 앱 종료, 이전 화면에서 뒤로 이동
- [ ] 네트워크 끊김 후 재연결 시 동작 확인

### 1-5. Google Play Console 계정 설정

- [ ] Google Play Console 개발자 계정 등록 ($25 일회성)
  - URL: https://play.google.com/console
- [ ] 개발자 이름·연락처 정보 설정
- [ ] 결제 프로필 설정 (향후 유료 앱/인앱결제 대비)

### 1-6. Play Store 앱 등록 정보

- [ ] 새 앱 만들기 → 패키지명: `com.dtschedule.lessonon`
- [ ] **앱 이름**: `LESSON:ON`
- [ ] **짧은 설명** (80자 이내): 강사·회원 스케줄 관리, 레슨권 소진 추적, SMS 알림
- [ ] **전체 설명** (4000자 이내): 주요 기능 중심으로 작성
- [ ] **스크린샷** 최소 2장 (폰 기준 1080×1920 이상)
  - 스케줄 화면, 회원관리 화면, 레슨권 화면 권장
- [ ] **512×512 아이콘** 업로드 (PNG, 알파 채널 없음)
- [ ] **피처 그래픽** (1024×500) 업로드
- [ ] **앱 카테고리**: 비즈니스 / 생산성

### 1-7. 법적 필수 항목

- [ ] **개인정보처리방침 URL** 등록 (0-1에서 확보한 URL)
- [ ] **데이터 안전 섹션** 작성:
  - 수집 데이터: 이름, 이메일, 전화번호
  - 공유 여부: 카카오·Google (소셜 로그인)
  - 암호화 여부: ✅ (전화번호 AES-256)
  - 삭제 요청 가능 여부: ✅ (계정 삭제 기능)
- [ ] **콘텐츠 등급 설문** 작성 (폭력·성인물 없음 → 전체이용가 예상)
- [ ] **대상 연령** 설정 (만 14세 이상 권장)

### 1-8. 출시 트랙 전략

- [ ] **내부 테스트** 트랙에 AAB 업로드 → 팀 내부 검증 (최대 100명)
- [ ] 내부 테스트 통과 후 **비공개 테스트** 트랙 → 베타 사용자 10~20명 초대
- [ ] 2주 이상 비공개 테스트 후 **프로덕션** 출시 (단계적 출시 10% → 50% → 100%)

---

## PHASE 2 — 웹 버티컬 출시 (SHIFT:ON / SERVE:ON)

> vertical-web-deploy-checklist.md 참조. 아래는 추가 점검 항목.

### 2-1. SHIFT:ON 출시 전 확인

- [ ] `shifton.dtschedule.com` DNS CNAME 전파 확인
- [ ] Vercel 프로젝트 `dtschedule-shifton` 환경변수 설정 확인
- [ ] Supabase Auth Redirect URLs에 `https://shifton.dtschedule.com/**` 추가
- [ ] CORS 수정 후 Edge Functions 정상 동작 확인 (SMS 발송 등)
- [ ] 랜딩 페이지 → 회원가입 → 셋업 위자드 → 스케줄 전 플로우 테스트

### 2-2. SERVE:ON 출시 전 확인

- [ ] `serveon.dtschedule.com` DNS CNAME 전파 확인
- [ ] Vercel 프로젝트 `dtschedule-serveon` 환경변수 설정 확인
- [ ] Supabase Auth Redirect URLs에 `https://serveon.dtschedule.com/**` 추가
- [ ] 봉사시간 집계 기능 (`volunteer_hours` feature flag) 동작 확인
- [ ] 랜딩 → 가입 → 운영 전 플로우 테스트

### 2-3. 공통 웹 점검

- [ ] 각 서브도메인에서 개인정보처리방침 URL 접근 가능 확인
- [ ] 모바일 브라우저(Android Chrome, iOS Safari)에서 반응형 UI 확인
- [ ] PWA 홈 화면 추가 동작 확인 (버티컬별 아이콘·이름)
- [ ] 카카오/구글 소셜 로그인 Redirect URL 정상 동작 확인

---

## PHASE 3 — 출시 후 모니터링

### 3-1. 출시 직후 (D+1)

- [ ] Supabase 대시보드에서 실사용자 가입 확인
- [ ] Supabase Realtime 메시지 수 모니터링 (비정상 급증 여부)
- [ ] Edge Function 에러 로그 확인 (특히 CORS 관련)
- [ ] Play Console → Android Vitals → ANR·크래시 없는지 확인

### 3-2. 출시 후 1주 (D+7)

- [ ] 사용자 피드백 게시판 내용 확인 및 대응
- [ ] SMS 발송량 모니터링 (무료 플랜 한도 초과 여부)
- [ ] Storage 용량 모니터링
- [ ] 개인정보 열람·삭제 요청 처리 절차 실제 동작 확인

### 3-3. 출시 후 1개월 (D+30)

- [ ] Play Store 리뷰 및 평점 모니터링
- [ ] 무료 플랜 한도 게이팅 실제 동작 확인 (멤버 10명 도달 시 업그레이드 유도)
- [ ] 개인정보처리방침 최신 상태 유지 여부 확인
- [ ] 보안 취약점 패치 여부 재점검

---

## 긴급 연락처 & 참고 링크

| 항목 | 주소 |
|------|------|
| Google Play Console | https://play.google.com/console |
| Supabase 개발 대시보드 | https://supabase.com/dashboard/project/mcuszdvophmqrwostcah |
| Supabase 운영 대시보드 | https://supabase.com/dashboard/project/bjnmaajhcmhxwonybnqc |
| Vercel 대시보드 | https://vercel.com/dashboard |
| LESSON:ON 웹 | https://lessonon.dtschedule.com |
| 보안 검토 보고서 | docs/architecture/security-review-2026-06-30.md |
| Android 출시 체크리스트 | docs/checklists/checklist_android_launch_lesson-on.md |

---

## 우선순위 요약

| 순위 | 항목 | 긴급도 | 예상 소요 |
|------|------|--------|-----------|
| 1 | CORS 허용 목록 수정 + Edge Functions 재배포 | 🔴 즉시 | 30분 |
| 2 | 개인정보처리방침 공개 URL 및 법적 기재사항 보완 | 🔴 출시 전 | 2~4시간 |
| 3 | 키스토어 비밀번호 암호 관리자 백업 | 🟠 즉시 | 10분 |
| 4 | 아이콘 디자인 최종 확정 | 🟠 출시 전 | 별도 결정 필요 |
| 5 | 테스트 계정 비밀번호 재설정 확인 | 🟠 즉시 | 15분 |
| 6 | Storage 버킷 보안 정책 확인 | 🟠 출시 전 | 30분 |
| 7 | Play Console 개발자 계정 등록 + 앱 등록 | 🟡 출시 전 | 2~3시간 |
| 8 | 실기기 최종 동작 검증 | 🟡 출시 전 | 1~2시간 |
| 9 | 내부 테스트 → 비공개 테스트 → 프로덕션 단계 출시 | 🟡 순서대로 | 2주+ |
