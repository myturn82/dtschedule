# Phase 1.5 — Capacitor Android 구현 체크리스트

> 설계 문서: [`implementation-design-2026-07-30.md`](./implementation-design-2026-07-30.md) §3
> 대상 태스크: T07 (Capacitor 초기화 + Android LESSON:ON), T08 (멀티앱 빌드 스크립트)
> 선행 조건: Phase 1의 T04 (`brandConfig.ts` + `.env.lesson-on`) 완료 후 착수

---

## 전제 확인 (착수 전)

- [ ] **[Phase 1 선행]** `src/lib/brandConfig.ts` 파일이 존재한다
- [ ] **[Phase 1 선행]** `.env.lesson-on` 파일이 프로젝트 루트에 존재한다
- [ ] `npm run build` (웹 빌드) 가 에러 없이 완료된다
- [ ] Android Studio가 설치되어 있다 (또는 설치 경로를 확인했다)
- [ ] JDK 17 이상이 설치되어 있다 (`java -version` 확인)

---

## 1. Capacitor 패키지 설치 (T07)

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/app @capacitor/network
```

- [ ] 위 명령어 실행 후 에러 없이 완료된다
- [ ] `package.json`의 `dependencies`에 `@capacitor/core`, `@capacitor/android` 등이 추가됐다
- [ ] `npx cap --version` 이 버전을 출력한다

---

## 2. `capacitor.config.ts` 작성 (T07)

파일 위치: 프로젝트 루트 `capacitor.config.ts`

- [ ] 파일이 생성됐다
- [ ] `appId`: `process.env.VITE_APP_ID ?? 'com.dtschedule.app'` 사용 (하드코딩 금지)
- [ ] `appName`: `process.env.VITE_BRAND_NAME ?? 'Dynamic Team Schedule'` 사용 (하드코딩 금지)
- [ ] `webDir`: `'dist'` 로 설정됐다
- [ ] `SplashScreen` 플러그인 설정이 포함됐다 (`launchShowDuration: 1500`, `backgroundColor: '#0a0b10'`)

---

## 3. Android 플랫폼 추가 (T07)

```bash
npx cap add android
```

- [ ] `android/` 디렉터리가 생성됐다
- [ ] `android/app/src/main/AndroidManifest.xml` 이 존재한다
- [ ] `android/app/build.gradle` 이 존재한다

---

## 4. `useAndroidBackButton` 훅 작성 (T07)

파일 위치: `src/hooks/useAndroidBackButton.ts`

- [ ] 파일이 생성됐다
- [ ] `App.addListener('backButton', ...)` 로 뒤로가기 이벤트를 처리한다
- [ ] `location.pathname === '/'` 일 때 `App.exitApp()` 를 호출한다
- [ ] 그 외 경로에서는 `navigate(-1)` 을 호출한다
- [ ] `useEffect` cleanup에서 `handler.remove()` 를 호출한다 (메모리 누수 방지)

---

## 5. `useAndroidBackButton` 앱 연결 (T07)

파일 위치: `src/App.tsx` (또는 최상위 라우터 컴포넌트)

- [ ] `useAndroidBackButton()` 훅을 임포트하고 호출하는 코드가 추가됐다
- [ ] **[타입 체크]** `npx tsc -b` 에러 없이 통과한다

---

## 6. 멀티앱 빌드 스크립트 작성 (T08)

### 6-1. `scripts/build-vertical.sh`

- [ ] `scripts/` 디렉터리가 생성됐다
- [ ] `scripts/build-vertical.sh` 파일이 생성됐다
- [ ] `set -e` 가 포함됐다 (에러 시 즉시 중단)
- [ ] 인수 없을 때 기본값 `lesson-on` 이 적용된다 (`${1:-lesson-on}`)
- [ ] `.env.$VERTICAL` 파일을 `.env.production.local` 로 복사한다
- [ ] `npm run build` 실행 후 `npx cap sync android` 를 실행한다

### 6-2. `package.json` scripts 추가

- [ ] `"build:lesson-on"` 스크립트가 추가됐다
- [ ] `"build:shift-on"` 스크립트가 추가됐다
- [ ] `"build:serve-on"` 스크립트가 추가됐다

---

## 7. 빌드 검증 (T07 + T08 통합)

### 7-1. 웹 빌드 + Capacitor 동기화

```bash
npm run build:lesson-on
```

- [ ] `.env.lesson-on` 의 환경 변수가 빌드에 반영됐다
  - `VITE_BRAND_NAME=LESSON:ON` → `dist/` 내 HTML/JS에서 확인
- [ ] `dist/` 디렉터리가 생성됐다
- [ ] `npx cap sync android` 가 에러 없이 완료됐다
- [ ] `android/app/src/main/assets/public/` 에 웹 빌드 결과물이 복사됐다

### 7-2. Android 빌드

```bash
npx cap open android
```

- [ ] Android Studio가 열린다
- [ ] Gradle sync 에러가 없다
- [ ] 에뮬레이터(또는 실기기)에서 앱이 실행된다
- [ ] 앱 이름이 `LESSON:ON` 으로 표시된다 (Generic 'Dynamic Team Schedule' 이 아닌)
- [ ] 스플래시 스크린이 표시된다
- [ ] 웹 콘텐츠(스케줄 화면 등)가 렌더링된다

### 7-3. Android 뒤로가기 버튼 동작 확인

- [ ] 앱 내 화면 이동 후 뒤로가기 → 이전 화면으로 돌아간다
- [ ] 홈(루트) 화면에서 뒤로가기 → 앱이 종료된다 (크래시가 아닌 정상 종료)

---

## 8. 회귀 테스트 (기존 웹 기능 영향 확인)

- [ ] `npm run dev` (일반 개발 서버) 가 정상 실행된다
- [ ] 기존 웹 빌드 (`npm run build`) 가 Capacitor 추가 후에도 정상 동작한다
- [ ] **[타입 체크]** `npx tsc -b` 에러 없이 통과한다
- [ ] Capacitor 관련 import가 웹 환경에서 사이드 이펙트를 일으키지 않는다
  - `useAndroidBackButton` 내부에서 `Capacitor.isNativePlatform()` 로 분기 확인 (필요 시)

---

## 9. 구조 최종 확인

아래 파일/디렉터리가 모두 존재하는지 확인한다.

- [ ] `capacitor.config.ts` (프로젝트 루트)
- [ ] `android/` (프로젝트 루트)
- [ ] `src/hooks/useAndroidBackButton.ts`
- [ ] `scripts/build-vertical.sh`
- [ ] `.env.lesson-on`
- [ ] `.env.shift-on`
- [ ] `.env.serve-on`

---

## 테스트 우선순위

1. **7-1** `npm run build:lesson-on` 빌드 성공 여부 — 이후 모든 검증의 전제
2. **7-2** Android 에뮬레이터에서 앱 실행 + 앱 이름 `LESSON:ON` 확인 — Phase 1.5 완료 기준
3. **7-3** 뒤로가기 버튼 동작 — Android UX 필수 요소
4. **8** 기존 웹 빌드 회귀 확인 — Capacitor 추가로 인한 파손 여부
