# 프로모 릴 HTML 제작 규칙

이 디렉터리(`src/promo/`)는 블로그 시리즈 연동 인스타그램 릴스용 단일 HTML을 만드는 공간이다.
아래 규칙은 모든 편(reel-blog1, reel-blog2, …)에 동일하게 적용한다.

---

## 1. 파일 구조 (편당 4+2 파일)

```
src/promo/reel-blogN/
  mockData.ts        # 시나리오 데이터 (실제 앱 타입 그대로 사용)
  App.tsx            # Phase 루프, 애니메이션, 오케스트레이션
  main.tsx           # React 진입점 (index.css + promo.css import)
  promo.css          # 릴 전용 마케팅 스타일 (편마다 독립)
  usePromoMusic.ts   # Web Audio API 음악 훅 (옵션, 필요시 포함)

promo-reel-blogN.html   # Vite 빌드 엔트리 (루트에 위치)
vite.promo N.config.ts  # 빌드 설정 (루트에 위치)
dist-promo/reel-blogN/promo-reel-blogN.html  # 빌드 결과물
```

**작명 규칙**: `N`은 블로그 편 번호. `reel-blog1`, `reel-blog2` 형식으로 일관성 유지.

---

## 2. 캔버스 크기 & 안전영역

- **목표 해상도**: 1080 × 1920 (인스타그램 릴스 9:16)
- **안전영역**: 위 150px, 아래 450px — 이 범위 안에 모든 UI 요소를 배치
- **CSS 비율 환산** (절대px → % of reel height):
  - 상단 안전선: `top: 7.81%`  (= 150 / 1920)
  - 하단 안전선: `bottom: 23.44%` (= 450 / 1920)

```css
/* 프로그레스바 & 브랜드마크 */
.progress  { top: 7.81%; }
.brandmark { top: calc(7.81% + 18px); }  /* 프로그레스바 아래 */

/* 캡션 영역 */
.content {
  top: 7.81%;
  bottom: 23.44%;
}
```

---

## 3. .reel 크기 설정

```css
.reel {
  width: min(96vw, calc((100vh - 32px) * 9 / 16));
  aspect-ratio: 9 / 16;
  overflow: hidden;
  transform: translateZ(0);  /* fixed 자식의 containing block 고정 */
}
```

---

## 4. ?record 고화질 모드

URL에 `?record`를 추가하면 릴이 뷰포트를 꽉 채워 Chrome 기기 에뮬레이터 1080×1920과 1:1 매핑된다.

```css
body:has(.record) { padding: 0; }
.record { gap: 0; }
.record .reel { width: 100vw; height: 100vh; border-radius: 0; box-shadow: none; }
```

```tsx
const IS_RECORD = new URLSearchParams(location.search).has('record')
// ...
<div className={`stage${IS_RECORD ? ' record' : ''}`}>
```

**녹화 절차**: HTML 열기 → URL에 `?record` 추가 → DevTools(F12) → 기기 에뮬레이션 → 1080×1920 → 화면 녹화

---

## 5. Phase 설계

```typescript
type Phase = 'intro' | /* 내용 phase들 */ | 'outro'
const PHASES: { key: Phase; ms: number }[] = [
  { key: 'intro',  ms: 2200 },
  // ... 중간 phase (2500~3500ms)
  { key: 'outro',  ms: 2500 },
]
```

- **intro**: 블러 + 다크 배경에 타이틀 카드
- **중간 phase**: 달력이 포커스되며 캡션 표시
- **outro**: DTS 브랜드마크 + CTA

### 프로그레스바 (선택 사항)

상단 phase 진행 바는 **기본적으로 포함하지 않는다.**  
달력 위 공간을 최대한 확보하고 불필요한 UI 노이즈를 줄이는 것이 목적이다.  
꼭 필요한 경우에만 아래 패턴으로 추가한다.

```tsx
// idx를 usePhaseLoop에서 함께 반환
return { phase: PHASES[idx].key, idx }

// 렌더
<div className="progress">
  {PHASES.map((p, i) => (
    <div className="seg" key={p.key}>
      <motion.div
        initial={{ width: '0%' }}
        animate={{ width: i <= idx ? '100%' : '0%' }}
        transition={i === idx ? { duration: p.ms / 1000, ease: 'linear' } : { duration: 0 }}
      />
    </div>
  ))}
</div>
```

### Phase 루프 훅

```tsx
function usePhaseLoop() {
  const [idx, setIdx] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    timer.current = setTimeout(() => setIdx(i => (i + 1) % PHASES.length), PHASES[idx].ms)
    return () => clearTimeout(timer.current)
  }, [idx])
  return { phase: PHASES[idx].key, idx }
}
```

---

## 6. Phase별 달력 예시 표시 규칙

**달력은 캡션의 보조가 아니라, 그 자체가 스토리를 직접 보여줘야 한다.**
각 phase가 전환될 때 달력의 *내용*이 달라야 시청자가 맥락을 이해한다.

### 6-1. dateOverrides를 phase별로 주입

```typescript
// mockData.ts — phase별 오버라이드 배열을 미리 선언
export const OVERRIDE_HOLIDAY: DateOverride = { date: '2026-07-15', is_holiday: true, ... }
export const OVERRIDE_SPECIAL: DateOverride = { date: '2026-07-14', is_open: true, ... }

// App.tsx — phase에 따라 다른 배열을 MonthScheduleByDay에 전달
const OVERRIDES_BY_PHASE: Partial<Record<Phase, DateOverride[]>> = {
  rules:   [],                              // 순수 규칙만
  holiday: [OVERRIDE_HOLIDAY],              // 특정 날 휴관
  special: [OVERRIDE_HOLIDAY, OVERRIDE_SPECIAL], // 휴관 + 특별 운영
}
const dateOverrides = OVERRIDES_BY_PHASE[phase] ?? []
```

### 6-2. 달력에서 직접 눈에 보이도록 만들기

`MonthScheduleByDay`가 `dateOverrides`를 받아 `getCellState()`를 호출하지만,
휴관·특별운영 셀이 달력에서 시각적으로 충분히 드러나지 않을 수 있다.
이때 **하이라이트 오버레이(§8)**를 반드시 병행한다.

| 표현 수단 | 용도 |
|-----------|------|
| `dateOverrides` 주입 | 달력 내부 로직(openSlots 계산 등)이 실제로 바뀜 |
| 하이라이트 링 | 변경된 날짜 셀을 pulsing 링으로 시각 강조 |
| 캡션 `kicker` + `headline` | 달력 변화가 의미하는 바를 언어로 보완 |
| `override-badge` | 🔴 / 🟢 뱃지로 변경 유형 즉시 전달 |

### 6-3. Phase별 달력 내용 설계 원칙

- **intro**: 배경 블러 → 달력은 맥락용, 내용보다 분위기가 중요
- **중간 phase 첫 번째**: 규칙만 적용된 "기본 상태" 달력 — 비교 기준점
- **중간 phase 이후**: 기본 상태에서 **하나씩 변경**을 추가 → 변화가 명확히 보임
- **outro**: 배경 블러 → 달력은 브랜드 배경으로만 사용

### 6-4. 새 편 작성 시 체크

- [ ] 각 phase마다 `dateOverrides` / `assignments`가 실제로 다른가?
- [ ] 달력에서 변경된 내용을 하이라이트 링으로 짚어주는가?
- [ ] 기본 상태(비교 기준)를 먼저 보여주고, 그 다음 변경을 보여주는가?
- [ ] 캡션이 달력 변화를 언어로 설명하는가?

---

## 6.5 달력 컴포넌트 & 헤더 동기화 규칙

### 컴포넌트 선택 기준

| 표현하려는 개념 | 컴포넌트 | viewType | displayMode |
|---------------|---------|----------|-------------|
| 전체 월 · 시간슬롯 행 (기본 운영표) | `ScheduleGrid` | `month` | `time` |
| 주간 · 시간슬롯 행 (역할 구분, 3~4일 클로즈업) | `WeekGrid` | `week` | `time` |
| 전체 월 · 일자 셀 안에 이름 나열 | `MonthScheduleByDay` | `month` | `day` |
| 주간 · 일자 셀 안에 이름 나열 | `WeekScheduleByDay` | `week` | `day` |

### 선택 원칙

1. **시간슬롯(시간대별 구분)을 강조**할 때 → `ScheduleGrid`(월) 또는 `WeekGrid`(주)  
   - `indicator_bar` / `split_cell` 역할 구분은 시간슬롯 그리드에서만 시각적으로 명확하다.

2. **역할 구분 phase**는 `WeekGrid`를 우선 선택:  
   - 7일치 `weekDays`를 전달하되, 관련 데이터를 **앞쪽 3일(Mon~Wed)에 배치**해  
     스크롤 없이도 핵심 내용이 바로 보이도록 한다.  
   - split 모드에서는 `minWidth = 72 + 7 × (splitCount × 52)`px로 자동 스크롤 발생.  
   - **하이라이트 대상 날짜는 반드시 화면 중앙에 위치하는 열을 선택**한다.  
     9:16 릴 너비 기준 WeekGrid split 모드(2 역할)에서 가시 열은 약 2.5개이므로,  
     **2번째 열(weekDays[1])을 하이라이트 대상으로** 삼는다.  
     우측으로 잘리는 열(3번째 이후)은 하이라이트 대상으로 사용하지 않는다.

3. **역할 없는 기본 뷰**는 해당 편 주제에 따라 `ScheduleGrid`(월간 시간별) 또는  
   `MonthScheduleByDay`(월간 일자별) 중 선택한다.

4. **하나의 릴에서 phase마다 컴포넌트가 다를 때**:  
   - `isWeekly`, `isTimeBased` 등 boolean 플래그로 분기.  
   - `ScheduleHeader`의 `viewType` · `weekDays` · `displayMode`도 **동일 플래그로 반드시 동기화**.

### ScheduleHeader 동기화 규칙

```tsx
<ScheduleHeader
  viewType={isWeekly ? 'week' : 'month'}
  weekDays={isWeekly ? WEEK_DAYS : undefined}  // week 뷰일 때만 전달 (주차 타이틀용)
  displayMode={isTimeBased ? 'time' : 'day'}   // 달력이 시간슬롯 기반이면 'time'
  onDisplayModeChange={noop}                    // 버튼을 보이게만 하고 실제 전환은 막음
  onPrev={noop} onNext={noop}
/>
```

- `onDisplayModeChange`를 전달해야 시간별/일자별 토글 버튼이 헤더에 렌더된다.  
  전달하지 않으면 버튼 자체가 사라지므로, 프로모에서는 항상 `noop`으로 전달한다.
- **`ScheduleGrid` / `WeekGrid`** → `displayMode="time"` (시간별 버튼 활성화)
- **`MonthScheduleByDay` / `WeekScheduleByDay`** → `displayMode="day"` (일자별 버튼 활성화)

---

## 7. 달력 슬라이드 애니메이션 (페이지 넘기기)

달력 그리드는 phase 전환 시 x축 슬라이드로 교체한다. `.calslide-wrap`의 `display: grid`로 두 프레임이 동일 셀을 공유하며 동시에 애니메이션된다.

```css
.boardwindow { display: flex; flex-direction: column; }
.calslide-wrap { display: grid; overflow: hidden; flex: 1; min-height: 0; }
.calslide-wrap > * { grid-area: 1 / 1; }
.calslide { width: 100%; }
```

```tsx
const calVariants = {
  enter:  { x: '100%',  opacity: 0 },
  center: { x: '0%',    opacity: 1 },
  exit:   { x: '-100%', opacity: 0 },
}
const calTransition = {
  x:       { type: 'spring', stiffness: 280, damping: 30 },
  opacity: { duration: 0.12 },
}

<div className="calslide-wrap" ref={calRef}>
  <AnimatePresence mode="popLayout">
    <motion.div
      key={phase}
      variants={calVariants}
      initial="enter" animate="center" exit="exit"
      transition={calTransition}
      className="calslide"
    >
      <MonthScheduleByDay ... dateOverrides={dateOverrides} ... />
    </motion.div>
  </AnimatePresence>
</div>
```

---

## 8. 날짜 하이라이트 오버레이

특정 날짜 셀을 강조할 때 DOM 쿼리로 실제 `<td>` 좌표를 계산해 pulsing 링을 오버레이한다.

```tsx
// 슬라이드 완료(600ms) 후 td 검색
const timer = setTimeout(() => {
  for (const td of calRef.current.querySelectorAll('td')) {
    const dayNum = parseInt(td.querySelector('div')?.childNodes[0]?.textContent?.trim() ?? '', 10)
    if (dayNum === targetDay) {
      const tr = td.getBoundingClientRect()
      const rr = reelRef.current.getBoundingClientRect()
      setHlPos({ x: tr.left - rr.left, y: tr.top - rr.top, w: tr.width, h: tr.height, kind })
      break
    }
  }
}, 600)
```

```css
@keyframes hlPulseRed {
  0%, 100% { box-shadow: 0 0 0 2px rgba(239,68,68,0.8), 0 0 14px 4px rgba(239,68,68,0.35); }
  50%       { box-shadow: 0 0 0 4px rgba(239,68,68,0.3), 0 0 22px 8px rgba(239,68,68,0.15); }
}
/* green 버전도 동일 패턴 */
.day-highlight { position: absolute; z-index: 8; pointer-events: none; border-radius: 3px; border: 2px solid; }
.day-highlight.holiday { border-color: #ef4444; animation: hlPulseRed 1.3s ease-in-out infinite; }
.day-highlight.special  { border-color: #22c55e; animation: hlPulseGreen 1.3s ease-in-out infinite; }
```

하이라이트 div는 `.reel` 안에 절대위치로 렌더링하고 `.reel { overflow: hidden }`이 자동으로 클리핑한다.

### 하이라이트 높이 계산 — 컴포넌트별 필수 규칙

하이라이트 하단을 `calEl.getBoundingClientRect().bottom`으로 단순히 설정하면 캘린더 하단 여백까지 포함되어 세로로 너무 길어진다. **컴포넌트 구조에 맞게 마지막 데이터 행의 bottom을 직접 구해야 한다.**

#### `WeekGrid` (CSS grid 기반)

날짜 헤더는 `<button>` → 부모 `.grid`(headerRow) → 부모 minWidth div(innerContainer) 구조.  
innerContainer의 마지막 children이 마지막 시간슬롯 row다.

```tsx
function findWeekGridDayRect(calEl, reelEl, day) {
  const rr = reelEl.getBoundingClientRect()
  const dayBtn = /* button whose inner div textContent === String(day) */

  const headerRow = dayBtn.parentElement           // .grid 헤더
  const innerContainer = headerRow?.parentElement  // minWidth div
  const kids = innerContainer ? Array.from(innerContainer.children) : []
  const lastRow = kids.length > 1 ? kids[kids.length - 1] : null
  const bottomY = lastRow
    ? lastRow.getBoundingClientRect().bottom - rr.top
    : calEl.getBoundingClientRect().bottom   - rr.top  // fallback

  const btnR = dayBtn.getBoundingClientRect()
  return { x: btnR.left - rr.left, y: btnR.top - rr.top,
           w: btnR.width, h: bottomY - (btnR.top - rr.top) }
}
```

#### `ScheduleGrid` (table 기반)

날짜 번호는 `<tbody><td>`(주차 헤더 row)에 있고, split 모드에서는 `colSpan`으로 열 전체를 커버.  
table 자체 하단(`calEl.bottom`)을 사용해도 무방하다.

```tsx
function findScheduleGridDayRect(calEl, reelEl, day) {
  const rr = reelEl.getBoundingClientRect()
  const dayTd = Array.from(calEl.querySelectorAll('tbody td')).find(td => {
    const first = td.childNodes[0]
    const text = first?.nodeType === Node.TEXT_NODE
      ? first.textContent?.trim()
      : first?.textContent?.trim()
    return text === String(day)
  })
  const calR = calEl.getBoundingClientRect()
  const tdR  = dayTd.getBoundingClientRect()
  return { x: tdR.left - rr.left, y: tdR.top - rr.top,
           w: tdR.width, h: calR.bottom - tdR.top }
}

---

## 9. 음악 (Web Audio API) — 선택 사항

> **현재 기본값: 음악 없음.** 필요할 때만 아래 방식으로 추가한다.
> Web Audio API는 브라우저 자동재생 정책과 OS 오디오 캡처 설정에 따라 동작이 달라 불안정할 수 있다.
> 화면 녹화 시 시스템 오디오 캡처가 가능한 환경인지 먼저 확인한 뒤 사용한다.

`usePromoMusic.ts` 훅으로 브라우저 내 합성음악을 재생한다. 외부 파일 불필요.

- **구성**: 4-bar loop, BPM 96, pad(sawtooth+LPF) + kick(sine sweep) + hi-hat(noise+HPF)
- **자동재생 정책**: AudioContext가 `suspended`이면 첫 `pointerdown` 이벤트에 resume
- **반환값**: `{ musicReady: boolean }` → UI에 🔇/♪ 표시

```tsx
const { musicReady } = usePromoMusic()
// ...
<div className={`music-indicator${musicReady ? ' playing' : ''}`}>
  {musicReady ? '♪' : '🔇 클릭'}
</div>
```

```css
.music-indicator { position: absolute; top: calc(7.81% + 18px); right: 14px; z-index: 30; font-size: 9px; }
.music-indicator.playing { color: #5b8aff; }  /* 편마다 포인트 컬러 맞춤 */
```

---

## 10. Supabase 더미 주입 (빌드 필수)

프로모 컴포넌트가 실제 앱 컴포넌트를 그대로 import하면 `supabase.ts`가 env 없이 throw한다. 빌드 config에 반드시 더미값을 주입한다.

```ts
// vite.promoN.config.ts
define: {
  'import.meta.env.VITE_SUPABASE_URL':      JSON.stringify('https://promo-placeholder.supabase.co'),
  'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('promo-placeholder-anon-key'),
},
```

---

## 11. 빌드 & 결과물

```bash
# 개별 편 빌드
npx vite build --config vite.promoN.config.ts

# 결과물: dist-promo/reel-blogN/promo-reel-blogN.html (단일 파일, JS+CSS 인라인)
```

- `vite-plugin-singlefile`로 JS·CSS를 HTML에 인라인 → 파일 하나로 공유 가능
- 빌드 결과물은 `dist-promo/`에만 저장, 실제 앱 빌드(`dist/`)와 완전 분리

---

## 11.5 달력 레이아웃 & 시각적 완성도 규칙

### boardwindow 포지셔닝

```css
.boardwindow {
  position: absolute;
  top: 7.81%;      /* 상단 safe zone 유지 — 브랜드마크 보호 */
  left: 0; right: 0; bottom: 0;   /* 하단은 릴 바닥까지 확장 */
  padding: 0;
  overflow: hidden;
  display: flex; flex-direction: column;
  /* 하단 페이드: 달력→어둠 자연스럽게 */
  -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 90%);
  mask-image: linear-gradient(to bottom, black 50%, transparent 90%);
}
```

- `inset: 0` 대신 `top: 7.81%`로 설정해야 브랜드마크가 흰 달력 위에 묻히지 않는다.
- `bottom: 0`으로 하단까지 확장 후 mask-image로 페이드 → 달력과 caption이 자연스럽게 어우러짐.

### WeekGrid 외곽 제거 & 시간 행 확장

```css
/* WeekGrid 외곽 border·margin 제거 */
.calslide .overflow-x-auto {
  margin-left: 0 !important; margin-right: 0 !important;
  border: none !important; border-radius: 0 !important;
}

/* 시간 행이 가용 높이를 꽉 채우도록 확장 */
.calslide > div, .calslide .overflow-x-auto, .calslide .overflow-x-auto > div { height: 100%; }
.calslide .overflow-x-auto > div { display: flex !important; flex-direction: column !important; }
.calslide .overflow-x-auto > div > .sticky { flex-shrink: 0; }
.calslide .overflow-x-auto > div > .grid:not(.sticky) { flex: 1 !important; min-height: 0 !important; }
```

### WeekGrid 열 수 동적화 (공유 컴포넌트 수정)

`WeekGrid.tsx`의 `repeat(7, 1fr)` → `repeat(${weekDays.length}, 1fr)`, `7 * dayColMinW` → `weekDays.length * dayColMinW`로 변경.  
3일·4일 뷰를 전달하면 그만큼의 열만 렌더되어 여백 없이 꽉 찬다.

### 시간슬롯 밀도 — 꽉 찬 느낌 만들기

3개 블록 슬롯(`09-12`, `13-18`) 대신 **1시간 단위 슬롯**을 사용한다.  
8~10개 행이 생겨 달력이 꽉 찬 느낌을 주고, 하이라이트 열의 배정 데이터도 풍성해진다.

```typescript
// 예: 복지관 8슬롯
const SLOTS: TimeSlot[] = ['09-10','10-11','11-12','13-14','14-15','15-16','16-17','17-18']
// 예: 미용실 8슬롯 (점심 포함)
const SLOTS: TimeSlot[] = ['10-11','11-12','12-13','13-14','14-15','15-16','16-17','17-18']
```

### CSS 폰트 크기 — container query 단위 (`cqw`)

`.reel`에 `container-type: inline-size`를 설정하고, 모든 텍스트 크기를 `cqw`로 지정한다.  
`?record` + 1080×1920 녹화 시 자동으로 3배 확대되어 별도 미디어 쿼리 불필요.

```css
.reel { container-type: inline-size; container-name: reel; }
.headline { font-size: 6cqw; }   /* 420px 미리보기 ≈ 25px, 1080px 녹화 ≈ 65px */
.kicker   { font-size: 2.8cqw; }
.sub      { font-size: 3.2cqw; }
```

### 브랜드마크 스타일

LandingPage 배경과 동일한 워드마크 스타일을 사용한다:

```tsx
<div className="brandmark">
  Dynamic <span className="brandmark-team">Team</span> Schedule
</div>
```

```css
.brandmark {
  font-size: 3cqw; font-weight: 300; letter-spacing: -0.2px;
  white-space: nowrap; color: #eef0f8;
  font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif;
}
.brandmark-team { color: oklch(0.66 0.16 28); }  /* 코랄 오렌지 */
```

---

## 12. 시리즈 디자인 일관성

| 항목 | blog1 | blog2 | 신규 편 |
|------|-------|-------|---------|
| 포인트 컬러 | `#ff7a66` (coral) | `#5b8aff` (blue) | 편마다 다른 색 |
| glow 색상 | coral | blue | 포인트 컬러와 일치 |
| 배경 | `#0a0b10` | 동일 | 동일 |
| 브랜드마크 | `DTS` | 동일 | 동일 |
| hint 텍스트 | 하단 | 동일 | 동일 |

---

## 13. 새 편 체크리스트

- [ ] `src/promo/reel-blogN/` 디렉터리 생성
- [ ] `mockData.ts`: 실제 앱 타입(`Assignment`, `ScheduleRule`, `DateOverride` 등) 그대로 사용
- [ ] `App.tsx`: Phase 설계 → `usePhaseLoop` → 슬라이드 애니메이션 → 하이라이트 오버레이
- [ ] 각 phase에 맞는 달력 컴포넌트 선택 (§6.5 표 참고): `ScheduleGrid` / `WeekGrid` / `MonthScheduleByDay` / `WeekScheduleByDay`
- [ ] `ScheduleHeader`의 `viewType` · `weekDays` · `displayMode` · `onDisplayModeChange`를 달력과 동기화
- [ ] 하이라이트 높이를 `calEl.bottom` 아닌 마지막 시간슬롯 row bottom으로 계산 (§8 컴포넌트별 코드 참고)
- [ ] `.reel`에 `container-type: inline-size` 추가, 모든 폰트 크기를 `cqw`로 지정 (§11.5)
- [ ] 시간슬롯을 1시간 단위로 세분화해 달력이 꽉 찬 느낌 (§11.5)
- [ ] `boardwindow`: `top: 7.81%; bottom: 0` + `mask-image` 하단 페이드 (§11.5)
- [ ] WeekGrid 외곽 border·margin 제거 CSS 추가 (§11.5)
- [ ] 브랜드마크: `Dynamic <Team> Schedule` 워드마크 스타일 적용 (§11.5)
- [ ] `main.tsx`: `../../index.css` + `./promo.css` 순서로 import
- [ ] `promo.css`: 안전영역 % 적용, record 모드, 포인트 컬러, 하이라이트 keyframes
- [ ] `usePromoMusic.ts`: 음악이 필요하면 포함 (코드 blog2에서 복사 후 BPM/코드 조정 가능)
- [ ] `promo-reel-blogN.html`: 루트에 생성, `src/promo/reel-blogN/main.tsx` 진입점 연결
- [ ] `vite.promoN.config.ts`: `outDir`, `input` 경로만 수정, `define` 더미값 유지
- [ ] `npx vite build --config vite.promoN.config.ts` 빌드 확인
- [ ] 브라우저에서 열어 `?record` 모드 동작 확인
