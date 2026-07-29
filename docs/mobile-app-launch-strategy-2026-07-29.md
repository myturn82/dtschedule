# 모바일 앱 출시 전략 설계서 (2026-07-29)

> 대상: Android / iOS 앱스토어 출시 (앱 출시 경험 없는 팀 기준)
> 기반: 현재 DTS 웹앱 (React 18 + Vite + Supabase + PWA)

---

## 0. 핵심 결론 (먼저 읽기)

| 질문 | 답변 |
|------|------|
| 현재 코드를 다시 짜야 하나? | **아니오.** Capacitor로 감싸면 기존 React 코드 그대로 사용 |
| Mac이 없으면 iOS 못 만드나? | **클라우드 빌드 서비스**로 Mac 없이 가능 (Codemagic 등) |
| 버티컬 7개 앱을 개별 등록해야 하나? | **예.** 계정 1개로 여러 앱 등록 가능, 앱당 추가 비용 없음 |
| 총 초기 비용은? | **Android $25 (일회) + iOS $99/년** — 그 외 무료 도구로 가능 |
| 출시까지 기간은? | 기술 작업 2~4주 + 심사 대기 Android 3일·iOS 7일 |

---

## 1. 현재 웹앱 구조

```
┌─────────────────────────────────────────────────┐
│               브라우저 (웹앱)                     │
│                                                  │
│  React 18 + TypeScript + Vite                    │
│  Tailwind CSS + framer-motion                    │
│  react-i18next (한/영)                           │
│  VitePWA (Service Worker — 현재 빌드 시만 활성)   │
│                                                  │
│  ┌────────────┐  ┌──────────────┐               │
│  │  Supabase  │  │  Claude API  │               │
│  │  DB / Auth │  │  Edge Func   │               │
│  │  Storage   │  │  ai-parse    │               │
│  │  Realtime  │  │              │               │
│  └────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────┘
         ↑ 현재 여기까지만 존재
```

**강점:** Supabase Realtime·Auth·Storage가 웹 표준 API(WebSocket, Fetch)를 사용하므로
Capacitor 래핑 후에도 **수정 없이 그대로 동작**한다.

---

## 2. 모바일 앱 변환 방식 3가지 비교

### 방식 A — PWA (Progressive Web App)

```
웹앱 → Service Worker + manifest.json → 홈 화면 추가
                                      → Android TWA → Google Play ✅
                                      → iOS: App Store ❌ (불가)
```

- 장점: 추가 코드 거의 없음 (VitePWA 이미 설정됨)
- 단점: iOS App Store 출시 불가, 기기 카메라·알림 등 네이티브 API 제한
- 결론: Android 단독 + iOS 포기 시만 유효

### 방식 B — Capacitor (권장 ✅)

```
웹앱 (React/Vite 빌드) → Capacitor 래퍼 → Android Studio → Google Play ✅
                                         → Xcode (or 클라우드) → App Store ✅
```

- 장점: 기존 React 코드 100% 재사용, 네이티브 API(카메라·푸시 알림·파일) 플러그인으로 추가 가능
- 단점: 네이티브 앱 빌드 환경 세팅 필요 (iOS는 Mac 또는 클라우드)
- 결론: **DTS에 가장 적합. 이 문서의 권장 방식**

### 방식 C — React Native / Expo

```
React Native 코드 작성 → Expo → Android ✅ / iOS ✅
```

- 장점: 진정한 네이티브 성능
- 단점: 현재 React 코드를 **거의 전부 다시 작성**해야 함 (DOM 기반 → React Native 컴포넌트)
- 결론: 신규 앱이라면 고려, 기존 웹앱 변환에는 과도한 공수

---

## 3. 권장 아키텍처: Capacitor 기반 설계

### 3-1. 전체 구조

```
┌───────────────────────────────────────────────────────────────────┐
│                    단일 소스코드 (dtschedule 레포)                  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  React 앱 코어 (현재 그대로)                                  │  │
│  │  src/ · supabase/ · public/                                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                          │                                         │
│           npm run build (vite build)                               │
│                          │                                         │
│                    dist/ (정적 빌드)                                │
│                          │                                         │
│          ┌───────────────┼───────────────┐                        │
│          ▼               ▼               ▼                        │
│   ┌─────────────┐  ┌───────────┐  ┌──────────────┐              │
│   │  웹 배포     │  │  Android  │  │    iOS       │              │
│   │  (Vercel)   │  │ Capacitor │  │  Capacitor   │              │
│   │             │  │           │  │              │              │
│   │ 브라우저로   │  │ WebView   │  │  WKWebView   │              │
│   │  접속       │  │  래핑     │  │    래핑      │              │
│   └─────────────┘  └─────┬─────┘  └──────┬───────┘              │
│                           │               │                        │
│                    ┌──────▼──────┐  ┌────▼────────┐             │
│                    │  Google     │  │   Apple     │             │
│                    │  Play Store │  │  App Store  │             │
│                    └─────────────┘  └─────────────┘             │
└───────────────────────────────────────────────────────────────────┘
```

### 3-2. 멀티앱(버티컬별) 빌드 구조

7개 버티컬 앱은 **하나의 Capacitor 프로젝트**에서 환경 변수만 바꿔 각각 빌드한다.

```
dtschedule/
├── src/                     ← 공통 React 코드 (수정 없음)
├── capacitor/
│   ├── android/             ← Android 네이티브 프로젝트 (공통)
│   └── ios/                 ← iOS 네이티브 프로젝트 (공통)
├── capacitor.config.ts      ← Capacitor 기본 설정
│
├── .env.lesson-on           ← LESSON:ON 빌드 설정
│   VITE_VERTICAL=lesson-sports
│   VITE_BRAND_NAME=LESSON:ON
│   VITE_APP_ID=com.dtschedule.lessonon
│   VITE_BRAND_COLOR=#FF6B35
│
├── .env.shift-on            ← SHIFT:ON 빌드 설정
│   VITE_VERTICAL=food-retail
│   VITE_BRAND_NAME=SHIFT:ON
│   VITE_APP_ID=com.dtschedule.shifton
│   VITE_BRAND_COLOR=#3B82F6
│
└── scripts/
    └── build-vertical.sh    ← 버티컬별 빌드 자동화 스크립트
```

**빌드 흐름:**
```
$ ./scripts/build-vertical.sh lesson-on
  1. .env.lesson-on 로드
  2. vite build → dist/
  3. npx cap sync android  (dist/ → android/app/src/main/assets/)
  4. Android Studio 또는 CI에서 AAB 생성
  5. Google Play Console에 업로드
```

### 3-3. App ID 설계 (버티컬별)

| 앱 이름 | Android App ID | iOS Bundle ID |
|---------|---------------|---------------|
| DTS (범용) | `com.dtschedule.app` | `com.dtschedule.app` |
| LESSON:ON | `com.dtschedule.lessonon` | `com.dtschedule.lessonon` |
| CLASS:ON | `com.dtschedule.classon` | `com.dtschedule.classon` |
| SHIFT:ON | `com.dtschedule.shifton` | `com.dtschedule.shifton` |
| SALON:ON | `com.dtschedule.salonon` | `com.dtschedule.salonon` |
| CARE:ON | `com.dtschedule.careon` | `com.dtschedule.careon` |
| SERVE:ON | `com.dtschedule.serveon` | `com.dtschedule.serveon` |
| WORK:ON | `com.dtschedule.workon` | `com.dtschedule.workon` |

> App ID는 한 번 정하면 변경 불가. 신중하게 결정.

---

## 4. 기술 구현 단계별 가이드

### Step 1. Capacitor 설치 및 초기화 (1~2일)

```bash
# 패키지 설치
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 초기화 (최초 1회)
npx cap init "LESSON:ON" "com.dtschedule.lessonon" --web-dir dist

# Android / iOS 프로젝트 생성
npx cap add android
npx cap add ios
```

**`capacitor.config.ts` 예시:**
```ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:    process.env.VITE_APP_ID ?? 'com.dtschedule.app',
  appName:  process.env.VITE_BRAND_NAME ?? 'Dynamic Team Schedule',
  webDir:   'dist',
  server: {
    // 개발 시 로컬 서버 연결 (선택)
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0b10',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}
export default config
```

### Step 2. 빌드 후 Capacitor에 반영 (매 배포마다)

```bash
npm run build           # vite build → dist/
npx cap sync            # dist/ → android/assets + ios/App/public
npx cap open android    # Android Studio 열기
npx cap open ios        # Xcode 열기 (Mac 필요 or 클라우드)
```

### Step 3. 필수 추가 플러그인 (선택적)

| 기능 | 플러그인 | 현재 웹 대응 여부 |
|------|---------|----------------|
| 푸시 알림 (FCM/APNs) | `@capacitor/push-notifications` | 미구현 (D-1 알림 강화에 필요) |
| 카메라 / 이미지 업로드 | `@capacitor/camera` | 현재 `<input type=file>`로 동작, 플러그인으로 UX 개선 가능 |
| 네이티브 공유 | `@capacitor/share` | 웹 Share API 폴백 가능 |
| 생체인증 (Face ID) | `@capacitor-community/biometric-auth` | 선택 사항 |
| 딥링크 | `@capacitor/app` | 버티컬 온보딩 딥링크에 필요 |
| 네트워크 상태 | `@capacitor/network` | 오프라인 감지 |

> 현재 Supabase Realtime·Auth·Storage는 **수정 없이 그대로 동작**한다.
> WebSocket(Realtime), Fetch API(Supabase 호출), Canvas API(이미지 압축) 모두 WKWebView/WebView에서 지원.

---

## 5. 개발 환경 요구사항

### Android 빌드 환경

| 항목 | 내용 | 비용 |
|------|------|------|
| 운영체제 | Windows / macOS / Linux 모두 가능 | - |
| Android Studio | Google 공식 IDE (필수) | 무료 |
| Java JDK 17+ | Android Studio 포함 | 무료 |
| Android SDK | Android Studio 내 설치 | 무료 |
| Gradle | 자동 설치 | 무료 |
| 코드 서명 키스토어 | keytool로 직접 생성 | 무료 |

```bash
# 키스토어 생성 (최초 1회, 절대 분실 금지)
keytool -genkey -v -keystore lesson-on.keystore \
  -alias lesson-on -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ 키스토어 파일은 절대 분실하면 안 됩니다. 앱 업데이트 시 반드시 동일 키스토어로 서명해야 하며,
> 분실 시 기존 앱을 업데이트할 수 없고 새 앱으로 재등록해야 합니다. **Git에 커밋하지 말고 안전한 곳에 백업.**

### iOS 빌드 환경

| 항목 | 내용 | 비용 |
|------|------|------|
| Mac 컴퓨터 | Xcode 실행 필수 — Mac이 없으면 클라우드 빌드 | Mac Mini M2: 약 89만원 |
| Xcode 15+ | Mac App Store 무료 | 무료 |
| Apple Developer Program | 연간 구독 필수 | **$99/년 (약 13.5만원)** |
| 코드 서명 인증서 | Apple Developer 계정에서 발급 | Developer Program에 포함 |

**Mac 없이 iOS 빌드하는 방법:**

```
옵션 1. Codemagic (권장)
  - 클라우드에서 macOS 빌드
  - 무료: 월 500분 macOS 빌드 포함
  - 유료: $35/월 (무제한)
  - DTS처럼 Capacitor 프로젝트 공식 지원

옵션 2. GitHub Actions (macOS runner)
  - 무료 플랜: 월 2,000분 (macOS는 10배 차감 → 실질 200분)
  - 유료: $0.08/분 (macOS)

옵션 3. EAS Build (Expo)
  - Capacitor가 아닌 Expo 사용 시
  - 무료: 월 30 빌드

옵션 4. Mac 렌탈
  - MacStadium, MacInCloud 등
  - 월 $30~50 (개발 기간만 사용)
```

---

## 6. 앱 출시 필수 과정

### 6-1. Google Play Store 출시 절차

```
① Google Play Console 개발자 계정 생성
   └─ play.google.com/console
   └─ 비용: $25 (일회성 등록비)
   └─ 개인 또는 조직 계정 선택

② 앱 생성
   └─ "앱 만들기" → 앱 이름, 기본 언어, 앱 유형(무료/유료) 설정
   └─ App ID: com.dtschedule.lessonon (한 번 정하면 변경 불가)

③ 앱 준비물 제출
   ┌─ 앱 아이콘: 512×512px PNG (투명 배경 가능)
   ├─ 기능 그래픽: 1024×500px (스토어 상단 배너)
   ├─ 스크린샷: 최소 2장 (폰: 16:9 또는 9:16, 1080px 이상)
   ├─ 앱 설명: 짧은 설명 80자, 긴 설명 4000자 이내
   ├─ 개인정보처리방침 URL (필수 — 외부 링크)
   └─ 콘텐츠 등급 설문 (IARC 등급)

④ 앱 서명 설정
   └─ Google Play 앱 서명 사용 권장 (키 분실 대비)
   └─ 업로드 키(Upload Key)와 앱 서명 키(App Signing Key) 분리 관리

⑤ AAB (Android App Bundle) 빌드 및 업로드
   └─ Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle
   └─ AAB 파일 업로드

⑥ 출시 트랙 선택
   ├─ 내부 테스트 (즉시 배포, 최대 100명)
   ├─ 비공개 테스트 (알파 — 소규모 그룹)
   ├─ 공개 테스트 (베타 — 누구나 참여)
   └─ 프로덕션 (정식 출시)

⑦ 심사 및 승인
   └─ 평균 1~3일 소요 (첫 등록은 최대 7일)
   └─ 거절 시 이메일로 사유 통보 → 수정 후 재제출
```

### 6-2. Apple App Store 출시 절차

```
① Apple Developer Program 가입
   └─ developer.apple.com
   └─ 비용: $99/년 (개인) / $299/년 (기업)
   └─ 개인(Individual) vs 조직(Organization) 선택
      - 개인: 본인 이름으로 앱 등록, 팀 협업 제한적
      - 조직: 회사명으로 등록, D-U-N-S 번호 필요 (무료 발급, 1~2주 소요)

② Xcode에서 코드 서명 설정
   └─ Apple Developer 계정 연결
   └─ 배포용 인증서(Distribution Certificate) 생성
   └─ 프로비저닝 프로파일(Provisioning Profile) 생성
   └─ App ID: com.dtschedule.lessonon

③ App Store Connect에서 앱 생성
   └─ appstoreconnect.apple.com
   └─ 앱 이름, 번들 ID, SKU (내부 고유 식별자) 설정

④ 앱 준비물 제출
   ┌─ 앱 아이콘: 1024×1024px PNG (투명 배경 불가, 모서리 직각)
   ├─ 스크린샷: iPhone 6.9인치 (1320×2868px) 필수 + iPad (선택)
   │   ※ iPhone 시뮬레이터나 실제 기기 스크린샷 필요
   ├─ 앱 설명: 170자 미리보기 + 본문 4000자
   ├─ 키워드: 100자 이내 (SEO에 중요)
   ├─ 지원 URL: 고객 지원 페이지
   ├─ 개인정보처리방침 URL (필수)
   └─ 심사 메모: 테스트 계정 정보 등 심사자 안내

⑤ IPA 빌드
   └─ Xcode: Product → Archive → Distribute App
   └─ 또는 Codemagic CI/CD로 자동 빌드 & 업로드

⑥ TestFlight (선택 권장)
   └─ 내부 테스트: 25명까지 즉시
   └─ 외부 테스트: 최대 10,000명 (간단한 베타 심사 1~2일)

⑦ 심사 제출
   └─ 평균 1~7일 (첫 등록은 더 엄격, 주요 거절 사유 아래 참고)
   └─ 거절 사유 상위: 개인정보 미고지, 결제 정책 위반, UI 버그, 테스트 불가

⑧ 앱 승인 후 출시 시점 선택
   └─ 즉시 출시 / 날짜 지정 출시 / 수동 출시 선택 가능
```

---

## 7. 비용 전체 정리

### 7-1. 필수 비용

| 항목 | 금액 | 주기 | 비고 |
|------|------|------|------|
| Google Play 개발자 계정 | **$25** (약 34,000원) | 일회성 | 무제한 앱 등록 가능 |
| Apple Developer Program | **$99/년** (약 135,000원) | 연간 갱신 | 갱신 안 하면 앱 비공개로 전환 |
| **합계 첫 해** | **약 169,000원** | | |
| **합계 이후 매년** | **약 135,000원** | | |

### 7-2. 선택 비용 (권장)

| 항목 | 금액 | 주기 | 비고 |
|------|------|------|------|
| Codemagic (iOS 클라우드 빌드) | **$0 ~ $35/월** | 월간 | Mac 없을 때 필수, 무료 플랜으로 시작 가능 |
| 스크린샷/아이콘 디자인 | $0 ~ 50만원 | 일회성 | Figma 직접 작업 or 프리랜서 의뢰 |
| 개인정보처리방침 페이지 | $0 | 일회성 | 무료 생성기 사용 가능 (Termly, PrivacyPolicies.com) |

### 7-3. 버티컬 7개 앱 등록 시 추가 비용

| 항목 | 내용 |
|------|------|
| Google Play | **추가 비용 없음** — 계정 1개로 여러 앱 무료 등록 |
| Apple App Store | **추가 비용 없음** — $99/년 계정으로 여러 앱 무료 등록 |
| 각 앱 아이콘/스크린샷 | 앱마다 별도 제작 필요 (공수만 발생) |

---

## 8. 앱 심사 필수 준비물 체크리스트

### 공통 (Android + iOS)

- [ ] **개인정보처리방침** — 수집 데이터(이메일, 전화번호, 이미지)를 명시한 외부 URL
  - 무료 생성: [Termly.io](https://termly.io), [PrivacyPolicies.com](https://privacypolicies.com)
  - DTS의 경우: 이름, 이메일, 전화번호(암호화), 이미지(Storage) 수집 명시 필수
- [ ] **앱 아이콘** — Android 512×512, iOS 1024×1024 (PNG, 투명 없음)
- [ ] **스크린샷** — 실제 앱 화면 (에뮬레이터/시뮬레이터 허용)
- [ ] **앱 설명 (한국어)** — 핵심 기능 위주 간결하게
- [ ] **테스트 계정** — 심사자가 로그인해서 확인할 수 있는 계정 정보

### Apple 심사 주요 거절 사유 및 대응

| 거절 사유 | 대응 방법 |
|-----------|----------|
| 개인정보 고지 누락 | 앱 내 개인정보처리방침 링크 + App Store Connect URL 모두 등록 |
| 결제 관련 (레슨권 결제 포함) | 앱 내 결제 시 Apple In-App Purchase 연동 필요 (외부 결제 링크 불가) |
| 기능이 완성되지 않은 앱 | 더미 데이터로라도 모든 기능이 동작하도록 준비 |
| 테스트 계정 미제공 | 심사 메모에 ID/PW 반드시 기재 |
| 메타데이터 미스매치 | 스크린샷이 실제 앱과 다르면 거절 |

> ⚠️ **레슨권 결제 중요:** 현재 앱 내에서 직접 결제(카드 결제)를 처리한다면
> Apple은 In-App Purchase(수수료 30%) 적용을 요구합니다.
> 현재처럼 관리자가 오프라인에서 수납하고 앱에서는 "기록만" 하는 구조라면 해당 없음.

---

## 9. CI/CD 자동화 설계 (권장)

매 버전 업데이트마다 Android Studio + Xcode를 수동으로 열지 않고 자동화한다.

```
GitHub Push (master)
        │
        ▼
GitHub Actions / Codemagic
        │
   ┌────┴────┐
   ▼         ▼
Android     iOS
 빌드       빌드
(AAB)      (IPA)
   │         │
   ▼         ▼
Google     App Store
 Play      Connect
Console    (TestFlight)
```

**Codemagic 설정 예시 (`codemagic.yaml`):**

```yaml
workflows:
  lesson-on-android:
    name: LESSON:ON Android
    environment:
      vars:
        VITE_VERTICAL: lesson-sports
        VITE_BRAND_NAME: LESSON:ON
        VITE_APP_ID: com.dtschedule.lessonon
    scripts:
      - npm install
      - npm run build
      - npx cap sync android
      - cd android && ./gradlew bundleRelease
    artifacts:
      - android/app/build/outputs/bundle/release/*.aab
    publishing:
      google_play:
        credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
        track: internal

  lesson-on-ios:
    name: LESSON:ON iOS
    environment:
      vars:
        VITE_VERTICAL: lesson-sports
    scripts:
      - npm install
      - npm run build
      - npx cap sync ios
      - xcode-project build-ipa ...
    artifacts:
      - build/ios/ipa/*.ipa
    publishing:
      app_store_connect:
        api_key: $APP_STORE_CONNECT_PRIVATE_KEY
        submit_to_testflight: true
```

---

## 10. 단계별 실행 로드맵

```
Week 1 — 환경 세팅
  ├─ Google Play Console 개발자 계정 가입 ($25)
  ├─ Apple Developer Program 가입 ($99/년)
  ├─ Capacitor 설치 및 초기화
  ├─ npm run build → npx cap sync 동작 확인
  └─ Android Studio에서 디버그 빌드 실행 확인

Week 2 — 첫 앱 준비 (LESSON:ON Android 우선)
  ├─ .env.lesson-on 환경 변수 파일 작성
  ├─ 앱 아이콘 512×512 디자인
  ├─ 스크린샷 5~8장 준비 (에뮬레이터 캡처)
  ├─ 개인정보처리방침 페이지 생성 및 URL 확보
  └─ 키스토어 생성 및 안전한 백업

Week 3 — Android 출시
  ├─ AAB 서명 빌드
  ├─ Google Play Console 앱 생성 및 정보 입력
  ├─ 내부 테스트 트랙 제출 → 팀 내부 검증
  ├─ 심사 제출 → 평균 1~3일
  └─ ✅ Google Play 정식 출시

Week 4 — iOS 출시 준비
  ├─ Codemagic 계정 설정 (Mac 없을 경우)
  ├─ iOS 코드 서명 인증서 + 프로비저닝 프로파일 설정
  ├─ App Store Connect 앱 생성
  ├─ iPhone 스크린샷 (1320×2868) 준비
  └─ TestFlight 내부 테스트

Week 5 — iOS 심사 제출
  ├─ 심사 메모 작성 (테스트 계정, 기능 설명)
  ├─ App Store 심사 제출 → 평균 1~7일
  └─ ✅ App Store 정식 출시

Week 6+ — 나머지 버티컬 앱 순차 출시
  ├─ SHIFT:ON (환경 변수만 바꿔 빌드 → 2~3일)
  ├─ SERVE:ON
  └─ ...이후 앱은 첫 앱 대비 1/5 공수
```

---

## 11. 웹앱 코드 수정이 필요한 부분

현재 코드 대부분은 수정 없이 동작하나, 아래 항목은 Capacitor 환경에 맞게 조정 필요.

| 항목 | 현재 상태 | 수정 내용 |
|------|----------|----------|
| 딥링크 (`?vertical=lesson-sports`) | 웹 URL 파라미터 | `@capacitor/app` 플러그인으로 앱 딥링크 처리 추가 |
| 이미지 업로드 | `<input type=file>` | 동작은 하나, `@capacitor/camera`로 네이티브 카메라 UX 추가 가능 |
| 스플래시 화면 | 없음 | `@capacitor/splash-screen` 추가 |
| 앱 아이콘 | 없음 | `android/res/mipmap-*/` + `ios/App/Assets.xcassets/` 에 크기별 아이콘 추가 |
| 뒤로가기 버튼 (Android) | 브라우저 기본 | `@capacitor/app`의 `backButton` 이벤트 처리 |
| 인앱 브라우저 (외부 링크) | `window.open()` | `@capacitor/browser` 플러그인 사용 권장 |
| 오프라인 감지 | 없음 | `@capacitor/network`로 오프라인 시 안내 UI 추가 |

---

## 12. 요약: 지금 당장 할 일

```
1. Google Play Console 계정 생성  ← $25, 10분
2. Apple Developer 계정 가입      ← $99/년, 1~3일 (신원 확인 시간)
3. npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
4. npx cap init 실행
5. npm run build && npx cap sync android
6. Android Studio에서 앱 실행 확인
7. 아이콘·스크린샷 제작
8. Google Play 내부 테스트 제출
```

**첫 앱(LESSON:ON Android)을 출시하는 데 드는 비용:**
- 현금: $25 (Play Console)
- 시간: 약 2~3주 (풀타임 아닌 경우)
- 추가 개발: 최소 (기존 코드 재사용)

**iOS까지 추가하면:**
- 현금: $99/년 (Apple) + Codemagic $0~35/월
- 시간: 추가 1~2주
