# LESSON:ON Android 출시 체크리스트

작성일: 2026-07-30
대상 앱: LESSON:ON (`com.dtschedule.lessonon`)
AAB 경로: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 1. 기반 설정

- [x] `capacitor.config.ts` 작성 (appId, appName 환경 변수에서 읽기)
- [x] `npx cap add android` — android/ 디렉터리 생성
- [x] `android/gradle.properties` — JDK 21 경로 설정 (`org.gradle.java.home`)
- [x] `android/app/build.gradle` — `namespace`, `applicationId` → `com.dtschedule.lessonon`
- [x] `src/hooks/useAndroidBackButton.ts` — 뒤로가기 버튼 처리
- [x] `build:lesson-on` npm 스크립트 — dotenv를 cap sync에도 적용

---

## 2. 아이콘

- [x] `scripts/generate-icon.js` 작성 (Playwright 기반, 버티컬별 색상/텍스트)
- [x] `npm run icon:lesson-on` 실행 — `assets/icon-only.png` (1024×1024) 생성
- [x] `@capacitor/assets generate --android` — Android 전체 사이즈(12개) 자동 생성
- [ ] 아이콘 디자인 최종 확정 (현재: 코드 생성 임시 아이콘 `L:ON`)

---

## 3. 키스토어 & 서명

- [x] `android/app/keystores/lesson-on.keystore` 생성
- [x] `android/app/keystore.properties` 작성 (Git 제외)
- [x] `android/app/keystore.properties.example` 작성 (Git 포함, 비밀번호 없음)
- [x] `.gitignore` — 키스토어 파일 제외 항목 추가
- [x] `android/app/build.gradle` — `signingConfigs.release` 설정
- [ ] **키스토어 비밀번호 암호 관리자에 백업** (`pX3vor458d1LkHxEeVTg`)

---

## 4. 릴리즈 빌드

- [x] `npm run build:lesson-on` — 웹 빌드 + Capacitor 동기화 성공
- [x] `.\gradlew.bat bundleRelease` — 서명된 AAB 빌드 성공 (4MB)
- [x] `app-release.aab` 파일 존재 확인

---

## 5. Play Store 제출 (미완료)

- [ ] Google Play Console 개발자 계정 등록 ($25 일회성)
- [ ] 새 앱 만들기 — 패키지: `com.dtschedule.lessonon`
- [ ] AAB 내부 테스트 트랙에 업로드
- [ ] 스토어 등록 정보 작성
  - [ ] 앱 이름: `LESSON:ON`
  - [ ] 짧은 설명 (80자 이내)
  - [ ] 전체 설명 (4000자 이내)
  - [ ] 스크린샷 최소 2장 (폰 기준 1080×1920 이상)
  - [ ] 512×512 고해상도 아이콘
  - [ ] 피처 그래픽 (1024×500)
- [ ] 개인정보처리방침 URL 등록
- [ ] 데이터 안전 섹션 작성 (수집 데이터 항목)
- [ ] 콘텐츠 등급 설문 작성
- [ ] 내부 테스트 → 비공개 테스트 → 프로덕션 단계적 출시

---

## 6. 출시 후

- [ ] 실기기 설치 후 동작 확인 (스플래시, 로그인, 스케줄 화면)
- [ ] Android 뒤로가기 버튼 동작 확인
- [ ] 첫 업데이트 시 `versionCode` +1 확인

---

## 테스트 우선순위

1. **3번 — 키스토어 비밀번호 백업** (분실 시 업데이트 영구 불가)
2. **2번 — 아이콘 디자인 확정** (스토어 등록 전 필수)
3. **5번 — Play Console 제출** (순서대로 진행)
