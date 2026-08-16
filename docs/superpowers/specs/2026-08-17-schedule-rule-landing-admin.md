# 스케줄규칙+예외날짜설정 — 랜딩·관리자콘솔 개선 설계

## 목적

"반복 규칙 + 날짜 예외" 랜딩 카드를 인터랙티브하게 개선하고, 관리자콘솔에서 분산된 스케줄 관련 설정을 스케줄규칙 탭으로 통합한다.

---

## 1. 랜딩페이지 (LandingLessonOn.tsx)

### 변경 사항

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| 카드 제목 | `반복 규칙 + 날짜 예외` | `스케줄규칙 + 예외날짜설정` |
| 카드 설명 | "월·수·금 운영" 같은... | 빠른선택·시간대·요일숨김 언급으로 업데이트 |
| visual | 정적 달력 JSX | `<ScheduleRuleDemo />` 컴포넌트 |

### ScheduleRuleDemo 컴포넌트

위치: `LandingLessonOn.tsx` 상단 (다른 Demo 컴포넌트와 동일 위치)

**레이어 구성:**
1. **빠른선택** — 6개 버튼(평일만·평일+토·연중무휴·주말만·월수금·화목), 클릭 시 ACCENT 색으로 강조
2. **달력** — 2026년 8월, 선택된 openDays 기반으로 운영일(점)·미운영(dim)·숨김요일(opacity 0.15)을 `key` 변경 + `fadeUp` 애니메이션으로 전환
3. **시간대별 운영** — 5개 슬롯(09~15시), 운영/미운영 배지 표시 (정적)
4. **요일 숨김** — 미운영 요일에 취소선+dim 처리, 빠른선택 변경 시 즉시 반영

**애니메이션 전략:**
- `sel` + `calKey` 두 state
- 템플릿 클릭 → `setSel(i)` + `setCalKey(k => k+1)`
- 달력 div에 `key={calKey}` → React remount → `animation: 'fadeUp 0.25s ease forwards'`
- 빠른선택 버튼: `transition: 'background 0.2s, color 0.2s'`
- 요일숨김 span: `transition: 'all 0.3s'`

---

## 2. 관리자콘솔 (AdminPage.tsx)

### 변경 사항

| 위치 | 변경 |
|---|---|
| `rules` 탭 끝 | 요일숨김 UI 추가 (즉시 저장) |
| `settings` 탭 | 요일숨김 카드 제거 |

### 요일숨김 이동

- `settingsHiddenDays` state는 그대로 유지 (settings 저장 시 `hidden_days`에 포함)
- rules 탭에서 토글 시: `setSettingsHiddenDays(newDays)` + `updateTenantSettings(id, { hidden_days })` 즉시 호출
- settings 탭 save 함수는 변경 없음 (state를 이미 공유)

---

## 구현 순서

1. `LandingLessonOn.tsx` — `ScheduleRuleDemo` 컴포넌트 추가
2. `LandingLessonOn.tsx` — 기존 정적 카드 visual 교체 + title/desc 업데이트
3. `AdminPage.tsx` — rules 탭에 요일숨김 섹션 추가
4. `AdminPage.tsx` — settings 탭에서 요일숨김 카드 제거
