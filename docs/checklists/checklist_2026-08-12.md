# 2026-08-12 버티컬 PWA 아이콘 분리 점검 체크리스트

배경: 7개 버티컬 앱(LESSON:ON 등)이 각각 독립 PWA로 설치될 수 있도록
`generate-icon.js`와 `vite.config.ts`를 수정했다.
빌드 타임에 title·favicon·theme-color·manifest icons가 버티컬별로 자동 교체된다.

---

## 1. 로컬 — generic(DTS) 빌드 확인

준비: `npm run dev` (파라미터 없음, `.env.local` 기준)

- [ ] 브라우저 탭 아이콘이 **DTS 코랄 아이콘**(DTS. 텍스트)으로 표시된다
- [ ] `<title>`이 **다이나믹팀스케줄**인지 확인 (브라우저 탭 텍스트)
- [ ] DevTools → Application → Manifest에서 아이콘 경로가 `/icons/dts/...`인지 확인
  - 단, 개발 서버에서는 SW·manifest가 비활성화되므로 빌드 결과물로 확인할 것

---

## 2. 로컬 — LESSON:ON 빌드 확인

준비:
```bash
npm run build:lesson-on
npx vite preview
```
브라우저에서 `http://localhost:4173` 접속

- [ ] 브라우저 탭 아이콘이 **LESSON:ON 오렌지 아이콘**으로 표시된다
- [ ] 탭 제목이 **LESSON:ON**이다
- [ ] DevTools → Elements → `<head>` 확인:
  - [ ] `<title>LESSON:ON</title>`
  - [ ] `<meta name="theme-color" content="#F2604E">`
  - [ ] `<meta name="apple-mobile-web-app-title" content="LESSON:ON">`
  - [ ] `<meta name="description" content="강사 혼자 다 챙기던...">`
  - [ ] `<link rel="icon" href="/favicons/lesson-on.svg">`
- [ ] DevTools → Application → Manifest 확인:
  - [ ] `name: LESSON:ON`
  - [ ] `theme_color: #F2604E`
  - [ ] 아이콘 경로가 `/icons/lesson-on/icon-192.png` 등으로 표시된다
  - [ ] 아이콘 미리보기 이미지가 DTS 아이콘이 아닌 LESSON:ON 아이콘이다

---

## 3. 로컬 — PWA 홈화면 설치 테스트

> ⚠️ **localhost PWA 설치 아이콘 테스트는 신뢰도가 낮다.**
> 이전 포트에서 설치한 PWA 이력·서비스워커·Windows 아이콘 캐시가 복합적으로 남아
> 아이콘이 구버전으로 나오는 경우가 많다. **실제 PWA 아이콘 검증은 6번(운영 배포)에서 한다.**

준비: `npm run build:lesson-on && npx vite preview`
Chrome에서 `http://localhost:4173` 접속

- [ ] Chrome 주소창 오른쪽에 **설치(+) 아이콘**이 나타난다
- [ ] 설치 팝업의 앱 이름이 **LESSON:ON**이다
- [ ] (아이콘은 운영에서 검증)

---

## 4. 로컬 — generic 빌드 아이콘 확인

준비:
```bash
npm run build
npx vite preview
```

- [ ] 탭 아이콘이 DTS 코랄 아이콘(`/favicon.svg`)이다
- [ ] DevTools → Application → Manifest 아이콘 경로가 `/icons/dts/...`이다
- [ ] Manifest의 `name`이 **다이나믹팀스케줄**이다
- [ ] Manifest의 `theme_color`가 **#14171C**이다

---

## 5. 아이콘 파일 존재 확인

```bash
ls public/icons/dts/
ls public/icons/lesson-on/
```

- [ ] `public/icons/dts/` 에 5개 파일 존재
  - `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`
  - `icon-maskable-192.png`, `icon-maskable-512.png`
- [ ] `public/icons/lesson-on/` 에 동일한 5개 파일 존재
- [ ] `public/favicons/lesson-on.svg` 파일 존재

---

## 6. 운영 배포 및 PWA 아이콘 최종 검증

> PWA 아이콘의 실제 검증은 HTTPS 운영 URL에서만 신뢰할 수 있다.

### 6-1. 배포

```bash
# LESSON:ON 빌드 (dist/ 생성)
npm run build:lesson-on

# Vercel CLI로 배포 (preview 또는 production)
vercel --prod          # 운영 배포
# 또는
vercel                 # 프리뷰 배포 (먼저 아이콘 확인용)
```

또는 GitHub push → Vercel 자동 배포 트리거 후 배포 URL 확인.

### 6-2. 배포 URL에서 메타태그 확인

배포 URL: (Vercel 배포 URL 기입)

- [ ] 브라우저 탭 아이콘이 **LESSON:ON 오렌지 아이콘**이다
- [ ] 탭 제목이 **LESSON:ON**이다
- [ ] DevTools → Application → Manifest 확인:
  - [ ] `name: LESSON:ON`
  - [ ] `theme_color: #F2604E`
  - [ ] 아이콘 경로가 `/icons/lesson-on/icon-192.png`이며 미리보기가 오렌지 아이콘이다
  - [ ] manifest가 `manifest.webmanifest` 하나만 존재한다 (`manifest.json` 없음)

### 6-3. PWA 홈화면 설치 — Android Chrome

1. Android Chrome에서 배포 URL 접속
2. 주소창 우측 메뉴(⋮) → **홈 화면에 추가** 또는 **앱 설치**
3. 확인:
   - [ ] 설치 팝업 앱 이름이 **LESSON:ON**이다
   - [ ] 설치 팝업 아이콘이 **오렌지 그리드 아이콘**이다
   - [ ] 설치 후 홈화면 아이콘이 올바르게 표시된다
   - [ ] 앱 실행 시 상단 툴바 색상이 **오렌지(#F2604E)**이다

### 6-4. PWA 홈화면 설치 — iOS Safari

1. Safari에서 배포 URL 접속
2. 공유(□↑) → **홈 화면에 추가**
3. 확인:
   - [ ] 홈 화면 아이콘이 **오렌지 그리드 아이콘**이다
   - [ ] 앱 이름이 **LESSON:ON**이다

### 6-5. PWA 홈화면 설치 — Desktop Chrome

1. Chrome에서 배포 URL 접속
2. 주소창 우측 **설치(+) 버튼** 클릭
3. 확인:
   - [ ] 설치 다이얼로그 아이콘이 **오렌지 그리드 아이콘**이다
   - [ ] 설치 후 시작메뉴/바탕화면 아이콘이 올바르게 표시된다

---

## 7. 회귀 테스트 — 기존 기능 영향 확인

- [ ] `npm run dev` (generic) 에서 앱 로그인·스케줄 화면 정상 동작
- [ ] `npm run dev:lesson-on` 에서 앱 로그인·스케줄 화면 정상 동작
- [ ] 랜딩페이지(`/`) 정상 표시 (generic: DTS 랜딩, `?vertical=lesson-sports`: LESSON:ON 랜딩)
- [ ] `npm run build` (generic) 빌드 오류 없음
- [ ] `npm run build:lesson-on` 빌드 오류 없음

---

## 새 버티컬 아이콘 추가 절차 (참고)

```bash
# 1. 아이콘 생성
npm run icon:shift-on   # → public/icons/shift-on/ 생성

# 2. 빌드
npm run build:shift-on  # → dist/ 에 SHIFT:ON 전용 빌드

# 3. 확인
npx vite preview        # → localhost:4173 에서 SHIFT:ON 아이콘 확인
```

---

## 테스트 우선순위

1. **2번** LESSON:ON 빌드 Manifest 확인 — 핵심 변경사항이며 PWA 설치의 근거
2. **3번** PWA 홈화면 설치 — 실사용자 경험 직접 확인
3. **4번** generic 빌드 — 기존 DTS 빌드가 깨지지 않았는지 회귀 확인
4. **6번** 운영 배포 — 로컬 통과 후 진행
