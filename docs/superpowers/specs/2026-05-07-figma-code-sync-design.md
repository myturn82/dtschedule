# Figma ↔ 코드 연동 설계 문서

**날짜:** 2026-05-07  
**상태:** 승인됨

---

## 1. 개요

Figma에서 디자인을 수정하면 코드에 자동 반영되는 워크플로우 구축.  
두 레이어로 구성: 디자인 토큰 동기화 + 컴포넌트 코드 생성.

---

## 2. 레이어 1: 디자인 토큰 동기화

### 도구
- **Figma 플러그인:** Tokens Studio (무료)
- **변환 도구:** Style Dictionary (`style-dictionary` npm 패키지)
- **자동화:** GitHub Actions

### 파이프라인

```
Figma (Tokens Studio)
    ↓ tokens.json (수동 내보내기 or GitHub 직접 Push)
GitHub: tokens.json
    ↓ GitHub Actions (tokens.json 변경 감지)
Style Dictionary
    ↓
src/styles/tokens.css (CSS 변수 자동 생성)
    ↓
src/index.css (@theme 블록에서 참조)
    ↓
Tailwind v4 클래스로 사용 가능
```

### 토큰 구조

```json
{
  "color": {
    "primary": { "value": "#3b82f6" },
    "background": { "value": "#f9fafb" },
    "surface": { "value": "#ffffff" },
    "night-shift": { "value": "#fdf2f8" },
    "saturday-shift": { "value": "#fefce8" },
    "close": { "value": "#e5e7eb" },
    "text-primary": { "value": "#1f2937" },
    "text-secondary": { "value": "#6b7280" }
  },
  "spacing": {
    "card-padding": { "value": "16" },
    "cell-min-height": { "value": "40" }
  },
  "borderRadius": {
    "card": { "value": "8" },
    "button": { "value": "4" }
  }
}
```

### 생성되는 tokens.css 예시

```css
:root {
  --color-primary: #3b82f6;
  --color-background: #f9fafb;
  --color-surface: #ffffff;
  --color-night-shift: #fdf2f8;
  --color-saturday-shift: #fefce8;
  --color-close: #e5e7eb;
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --spacing-card-padding: 16px;
  --spacing-cell-min-height: 40px;
  --border-radius-card: 8px;
  --border-radius-button: 4px;
}
```

### index.css 수정

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: var(--color-primary);
  --color-schedule-night: var(--color-night-shift);
  --color-schedule-saturday: var(--color-saturday-shift);
  --color-schedule-close: var(--color-close);
}
```

---

## 3. 레이어 2: 컴포넌트 코드 생성

### 도구
- **Figma 플러그인:** Locofy.ai (무료 티어)

### 워크플로우
1. Figma에서 새 화면/컴포넌트 디자인
2. Locofy.ai 플러그인 → "Export to Code" → React + Tailwind 코드 생성
3. 생성된 코드 검토 후 기존 프로젝트 구조에 수동 통합
4. Supabase 훅, TypeScript 타입 연결은 수동 작업

### 주의사항
- Locofy 생성 코드는 참고용 — 기존 컴포넌트 구조(`getCellState`, Supabase 훅 등)와 수동 병합 필요
- CSS 클래스명이 다를 수 있으므로 Tailwind 클래스로 변환 필요

---

## 4. 생성/수정 파일

| 파일 | 역할 |
|------|------|
| `tokens.json` | Tokens Studio가 관리하는 디자인 토큰 원본 |
| `style-dictionary.config.js` | CSS 변수 변환 규칙 |
| `src/styles/tokens.css` | 자동 생성 CSS 변수 (커밋 포함) |
| `src/index.css` | tokens.css import + @theme 참조 수정 |
| `.github/workflows/tokens.yml` | tokens.json 변경 시 tokens.css 자동 재생성 |
| `package.json` | `style-dictionary` devDependency 추가 |

---

## 5. 설치 필요 도구

- Figma 플러그인: **Tokens Studio** (figma.com/community)
- Figma 플러그인: **Locofy.ai** (figma.com/community)
- npm: `style-dictionary`

---

## 6. 검증

1. `tokens.json` 수정 → `npm run build:tokens` 실행 → `tokens.css` 업데이트 확인
2. `npm run dev` → 브라우저에서 색상 변경 반영 확인
3. GitHub에 `tokens.json` 푸시 → GitHub Actions 실행 → `tokens.css` 자동 커밋 확인
