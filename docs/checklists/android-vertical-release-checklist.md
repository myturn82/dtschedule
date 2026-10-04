# 버티컬 앱 Android 출시 체크리스트

> **범위:** LESSON:ON → SHIFT:ON → SERVE:ON → CLASS:ON → WORK:ON → SALON:ON → CARE:ON  
> **최종 수정:** 2026-10-04 (자동 빌드 시스템 반영)

---

## 역할 구분

| 담당 | 작업 유형 |
|------|-----------|
| 👤 **사용자 직접** | Supabase 대시보드, Firebase 콘솔, Play Console, 키스토어 비밀번호 백업 |
| 🤖 **Claude 자동** | 코드 수정, 키스토어 생성, APK 빌드, ADB 설치 |

> 아래 체크리스트에서 항목 앞에 👤 / 🤖 표시로 담당자를 구분함.

---

## ⚠️ 시행착오 정리 (반드시 먼저 읽기)

| 문제 | 원인 | 해결책 |
|------|------|--------|
| `npm run build:<버티컬>` 실패 | PowerShell 5.1은 `&&` 미지원 | `npm run build:tokens; if ($?) { npx vite build --mode <버티컬> }` 로 분리 실행 |
| `adb install` 실패 (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`) | 기존 앱과 서명이 다름 | 설치 전 `adb uninstall <applicationId>` 먼저 실행 |
| `adb` 명령어 미인식 | PATH 미등록 | `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe` 전체 경로 사용 |
| OAuth 후 vercel.app으로 이동 | Supabase redirect URL 미등록 | 운영 Supabase 대시보드에 `<appId>://login-callback` 추가 |
| 로그인 화면 Dynamic·Schedule 글씨 안 보임 | PNG 이미지를 다크모드/WebView force-dark가 반전 | PNG 제거 → `LogoStack` 코드 컴포넌트로 교체 (완료) |
| 웹 빌드 후 앱에 미반영 | `cap sync` 누락 | vite build 후 반드시 `npx cap sync android` 실행 후 APK 빌드 |
| Android에서 PWA 설치 배너 표시 | `beforeinstallprompt` 이벤트가 Android 브라우저에서도 발생 | `InstallBanner.tsx` Android 감지 로직 추가 (완료) |
| `cap sync` 후 applicationId가 바뀌지 않음 | `VITE_APP_ID` 환경 변수 미주입 | `build:android:<vertical>` 스크립트가 자동 주입 — 직접 빌드 시 `$env:VITE_APP_ID` 설정 |

---

## 1단계 — 공통 코드 작업 (전체 버티컬 공유, 1회만 적용)

> LESSON:ON 작업 중 전체 버티컬에 일괄 적용된 코드 변경 사항.  
> 이미 완료됐으므로 새 버티컬 작업 시 재작업 불필요.

- [x] 🤖 `AndroidManifest.xml` — 딥링크 intent-filter 추가 (`${applicationId}://login-callback`)
- [x] 🤖 `AuthContext.tsx` — `Capacitor.isNativePlatform()` 감지, OAuth redirectTo를 앱스킴으로 설정
- [x] 🤖 `AuthContext.tsx` — `appUrlOpen` 리스너로 PKCE/Implicit 딥링크 세션 복구
- [x] 🤖 `InstallBanner.tsx` — Android 감지 시 PWA 설치 배너 숨김
- [x] 🤖 `Logo.tsx` — `LogoStack` 컴포넌트 추가 (다크모드·WebView force-dark 대응)
- [x] 🤖 `Logo.tsx` — `LogoWordmark`에 `color` prop 추가 (CSS 변수 우회)
- [x] 🤖 `AuthPage.tsx` — 카드 상단 PNG 로고 → `LogoStack` 컴포넌트 교체
- [x] 🤖 `ScheduleBackground.tsx` — `LogoWordmark`에 `color="#14171C"` 직접 주입
- [x] 🤖 `useAndroidBackButton.ts` — 뒤로가기 버튼 처리

---

## 2단계 — 버티컬별 준비 (최초 1회)

> 각 버티컬을 처음 Android 앱으로 만들 때 한 번만 수행.

### 👤 Supabase 운영 대시보드 작업 (사용자 직접)

**접속 경로:**
```
https://supabase.com/dashboard/project/bjnmaajhcmhxwonybnqc
→ Authentication → URL Configuration → Redirect URLs
```

**추가할 URL (미완료 6개 한꺼번에 추가 가능):**
```
com.dtschedule.shifton://login-callback
com.dtschedule.serveon://login-callback
com.dtschedule.classon://login-callback
com.dtschedule.workon://login-callback
com.dtschedule.salonon://login-callback
com.dtschedule.careon://login-callback
```

- [x] 👤 `com.dtschedule.lessonon://login-callback` 추가 (완료)
- [x] 👤 위 6개 URL 추가

---

### 👤 Firebase 콘솔 작업 (사용자 직접, 버티컬당 1회)

> FCM 푸시 알림 때문에 필요. 새 버티컬을 추가할 때마다 Firebase에 Android 앱을 등록하고  
> `google-services.json`을 교체해야 빌드에서 FCM이 올바르게 동작함.

**작업 순서 (버티컬마다 반복):**
```
Firebase Console → 프로젝트 선택
→ 프로젝트 설정(⚙️) → 내 앱 → 앱 추가 → Android 아이콘
→ Android 패키지명 입력 (예: com.dtschedule.shifton)
→ 앱 닉네임 입력 (예: SHIFT:ON)
→ google-services.json 다운로드
→ android/app/google-services.json 파일 덮어쓰기
→ Claude에게 "google-services.json 교체했어" 알림 → 빌드 진행
```

> ℹ️ 앱을 추가할 때마다 전체 앱 목록이 포함된 새 `google-services.json`이 생성됨.  
> 한 Firebase 프로젝트에 7개 버티컬 앱을 모두 등록해도 무방함.

| 버티컬 | 패키지명 | Firebase 등록 | json 교체 |
|--------|----------|--------------|-----------|
| LESSON:ON | `com.dtschedule.lessonon` | ✅ | ✅ |
| SHIFT:ON  | `com.dtschedule.shifton`  | ✅ | ✅ |
| SERVE:ON  | `com.dtschedule.serveon`  | ✅ | ✅ |
| CLASS:ON  | `com.dtschedule.classon`  | ✅ | ✅ |
| WORK:ON   | `com.dtschedule.workon`   | ✅ | ✅ |
| SALON:ON  | `com.dtschedule.salonon`  | ✅ | ✅ |
| CARE:ON   | `com.dtschedule.careon`   | ✅ | ✅ |

---

### 버티컬별 나머지 준비 항목

#### LESSON:ON (`com.dtschedule.lessonon`)
- [x] 🤖 `.env.lesson-on` 파일 작성
- [x] 🤖 `package.json` — `build:lesson-on`, `icon:lesson-on` 스크립트 추가
- [x] 🤖 `scripts/generate-icon.js` — `VERTICAL_ICONS`에 `lesson-on` 추가
- [x] 🤖 `android/app/keystores/lesson-on.keystore` 생성
- [x] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [x] 🤖 `android/app/build.gradle` — `namespace`, `applicationId` → `com.dtschedule.lessonon`
- [x] 🤖 `android/app/build.gradle` — `signingConfigs.release` 설정

#### SHIFT:ON (`com.dtschedule.shifton`)
- [x] 🤖 `.env.shift-on` 파일 작성
- [x] 🤖 `package.json` — `build:shift-on`, `icon:shift-on` 스크립트 추가
- [ ] 🤖 `android/app/keystores/shift-on.keystore` 생성
- [ ] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [ ] 🤖 아이콘 생성 + AAB 빌드 (`npm run build:android:shift-on`)
- [ ] 👤 Play Console 앱 등록 + 제출

#### SERVE:ON (`com.dtschedule.serveon`)
- [x] 🤖 `.env.serve-on` 파일 작성
- [x] 🤖 `package.json` — `build:serve-on`, `icon:serve-on` 스크립트 추가
- [x] 🤖 `scripts/generate-icon.js` — `VERTICAL_ICONS`에 `serve-on` 추가
- [x] 🤖 `android/app/keystores/serve-on.keystore` 생성
- [x] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [x] 👤 Firebase 콘솔 `com.dtschedule.serveon` 앱 등록 + google-services.json 교체
- [x] 👤 Supabase `com.dtschedule.serveon://login-callback` 추가
- [x] 🤖 아이콘 생성 (`npm run icon:serve-on`)
- [x] 🤖 AAB 빌드 완료 (`builds/serve-on.aab`)
- [ ] 👤 Play Console 앱 등록 + 제출

#### CLASS:ON (`com.dtschedule.classon`)
- [x] 🤖 `.env.class-on` 파일 작성
- [x] 🤖 `package.json` — `build:class-on`, `icon:class-on` 스크립트 추가
- [ ] 🤖 `android/app/keystores/class-on.keystore` 생성
- [ ] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [ ] 🤖 아이콘 생성 + AAB 빌드 (`npm run build:android:class-on`)
- [ ] 👤 Play Console 앱 등록 + 제출

#### WORK:ON (`com.dtschedule.workon`)
- [x] 🤖 `.env.work-on` 파일 작성
- [x] 🤖 `package.json` — `build:work-on`, `icon:work-on` 스크립트 추가
- [ ] 🤖 `android/app/keystores/work-on.keystore` 생성
- [ ] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [ ] 🤖 아이콘 생성 + AAB 빌드 (`npm run build:android:work-on`)
- [ ] 👤 Play Console 앱 등록 + 제출

#### SALON:ON (`com.dtschedule.salonon`)
- [x] 🤖 `.env.salon-on` 파일 작성
- [x] 🤖 `package.json` — `build:salon-on`, `icon:salon-on` 스크립트 추가
- [ ] 🤖 `android/app/keystores/salon-on.keystore` 생성
- [ ] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [ ] 🤖 아이콘 생성 + AAB 빌드 (`npm run build:android:salon-on`)
- [ ] 👤 Play Console 앱 등록 + 제출

#### CARE:ON (`com.dtschedule.careon`)
- [x] 🤖 `.env.care-on` 파일 작성
- [x] 🤖 `package.json` — `build:care-on`, `icon:care-on` 스크립트 추가
- [ ] 🤖 `android/app/keystores/care-on.keystore` 생성
- [ ] 👤 키스토어 비밀번호 암호 관리자 백업 (**분실 시 업데이트 영구 불가**)
- [ ] 🤖 아이콘 생성 + AAB 빌드 (`npm run build:android:care-on`)
- [ ] 👤 Play Console 앱 등록 + 제출

---

## 3단계 — 빌드 & 설치 절차 (배포마다 반복)

> **모두 🤖 Claude가 실행.** `keystore.*.properties`는 자동 선택되므로 수동 교체 불필요.

### 3-1. 아이콘 생성 🤖 (최초 1회 또는 아이콘 변경 시)

```powershell
npm run icon:lesson-on
# → assets/icon-only.png (1024×1024) + Android 전체 사이즈 + PWA 아이콘 생성
```

### 3-2. AAB 빌드 🤖 (웹빌드 + cap sync + Gradle 자동 포함)

```powershell
# 단일 버티컬
npm run build:android:lesson-on

# 전체 버티컬 일괄 빌드 (키스토어 없는 버티컬은 자동 건너뜀)
npm run build:android:all
```

> 출력 경로: `builds/<vertical>.aab`  
> (예: `builds/lesson-on.aab`, `builds/serve-on.aab`)

### 3-3. 기기 설치 🤖 (선택 — 기기 테스트 시)

```powershell
# Debug APK가 필요한 경우 별도 빌드
Set-Location android; .\gradlew.bat assembleDebug; Set-Location ..

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb uninstall com.dtschedule.lessonon   # 서명 충돌 방지
& $adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### 3-4. 동작 검증 👤

- [ ] 앱 실행 → 로그인 화면 진입
- [ ] 로그인 화면 상단 로고 (DYNAMIC / TEAM / SCHEDULE) 모두 정상 표시
- [ ] 다크모드에서 로고 정상 표시
- [ ] 카카오 OAuth → 앱 내 완료 (외부 브라우저/vercel.app으로 이탈 없음)
- [ ] 구글 OAuth → 앱 내 완료
- [ ] 로그인 후 스케줄 화면 정상 진입
- [ ] 푸시 알림 수신 확인 (FCM)
- [ ] Android 뒤로가기 버튼 동작 확인
- [ ] PWA 설치 배너 미표시 확인

---

## 4단계 — Play Store 제출 (버티컬별 최초 1회) 👤

- [ ] 👤 Google Play Console — 새 앱 생성 (패키지명 `com.dtschedule.<버티컬>`)
- [ ] 🤖 Release AAB 빌드 (`.\gradlew.bat bundleRelease`)
- [ ] 👤 AAB 내부 테스트 트랙 업로드
- [ ] 👤 스토어 등록 정보 작성
  - [ ] 앱 이름 (예: `LESSON:ON`)
  - [ ] 짧은 설명 (80자 이내)
  - [ ] 전체 설명 (4000자 이내)
  - [ ] 스크린샷 최소 2장 (1080×1920 이상)
  - [ ] 512×512 아이콘
  - [ ] 피처 그래픽 (1024×500)
- [ ] 👤 개인정보처리방침 URL 등록
- [ ] 👤 데이터 안전 섹션 작성
- [ ] 👤 콘텐츠 등급 설문 작성
- [ ] 👤 내부 테스트 → 비공개 테스트 → 프로덕션 단계적 출시

---

## 진행 현황

| 버티컬 | 준비 | Supabase | Firebase | 빌드·설치 | 검증 | Play Store |
|--------|------|----------|----------|-----------|------|------------|
| LESSON:ON | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SHIFT:ON  | 🔵 | ✅ | ✅ | 🔲 | 🔲 | 🔲 |
| SERVE:ON  | 🔵 | ✅ | ✅ | 🔵 | 🔲 | 🔲 |
| CLASS:ON  | 🔵 | ✅ | ✅ | 🔲 | 🔲 | 🔲 |
| WORK:ON   | 🔵 | ✅ | ✅ | 🔲 | 🔲 | 🔲 |
| SALON:ON  | 🔵 | ✅ | ✅ | 🔲 | 🔲 | 🔲 |
| CARE:ON   | 🔵 | ✅ | ✅ | 🔲 | 🔲 | 🔲 |
