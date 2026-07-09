# 임베드 위젯 (`/embed`) 설계

## 배경 / 목적

비회원(프리폼) 모드 조직(미용실, 카페, 공방 등)이 자기 홈페이지·네이버 스마트플레이스에
스케줄을 `<iframe>`으로 박아 넣을 수 있는 공개 위젯을 추가한다. `docs/blog_series_1.md`
시나리오 D("미용실 직원 스케줄 + 고객 예약 안내")가 실제로 가능해지는 기능이다.

기존 `/share`(읽기 전용 공유 뷰)는 자체 헤더/라벨/여백이 있는 "페이지"이고, `X-Frame-Options: DENY`
때문에 애초에 iframe 삽입 자체가 막혀 있다. 위젯은 크롬 없이 최소한으로, 그리고 실제로
임베드 가능해야 하므로 별도 라우트로 분리한다.

## 범위

- 대상: 비회원(프리폼) 모드 테넌트만. 회원공유/회원개별 모드는 프라이버시가 존재 이유이므로
  위젯으로 노출하지 않는다(마이그레이션 060의 `is_freeform_tenant()` RLS를 그대로 재사용 —
  새 RLS 정책 불필요).
- `/embed`는 항상 익명 방문자 전용이라고 가정한다(로그인 CTA 없음). 잘못된 `tid`나
  freeform이 아닌 테넌트는 조용히 "지원하지 않는 위젯입니다" 같은 짧은 안내만 보여준다.

## 데이터 흐름 / 공통 로직 추출

`SharePage.tsx`가 이미 하고 있는 "URL의 `tid`로 테넌트 설정을 직접 조회해 `time_slots`/
`legend_items`/`slot_labels`/`tenant_mode`/`custom_fields`를 얻는" 로직을
`src/hooks/useShareTenantSettings.ts`로 추출해 `SharePage.tsx`와 신규 `EmbedPage.tsx`가
공유한다. (기존 `SharePage.tsx` 동작은 리팩터링만 하고 변경하지 않는다.)

```ts
// src/hooks/useShareTenantSettings.ts
interface ShareTenantSettings {
  timeSlots: TimeSlot[] | null
  legendItems: LegendItem[] | null
  slotLabels: Record<string, string> | null
  tenantMode: string | undefined
  customFields: CustomFieldDef[] | null
  ready: boolean   // tid !== contextTenant.id 인 경우 fetch 완료 여부
}

export function useShareTenantSettings(tidFromUrl: string, contextTenant: Tenant | null): ShareTenantSettings
```

내부 구현은 현재 `SharePage.tsx`의 `useEffect`(라인 37~61) 로직을 그대로 옮긴 것이며,
`tidFromUrl === contextTenant?.id`일 때는 fetch를 건너뛰고 컨텍스트 값을 그대로 쓰는 기존
최적화도 유지한다.

## `EmbedPage.tsx`

**라우트**: `/embed?tid=<uuid>&view=month|week&year=&month=&day=`

- `view` 쿼리 파라미터로 월/주 뷰 전환(기본값 `month`). 전환 버튼 2개만 있는 아주 작은
  세그먼트 컨트롤을 상단에 둔다. `ScheduleHeader`의 무거운 크롬(타이틀 클릭 날짜피커,
  역할표시 슬롯 등)은 쓰지 않고, 최소한의 자체 헤더(이전/다음 화살표 + "7월" 텍스트 + 월/주 토글)만 그린다.
- 데이터 조회: `useShareTenantSettings` + `useTenantRoles` + `useSchedule`(모두 기존 훅 재사용,
  `SharePage.tsx`와 동일 패턴).
- 게이트: `tenantMode`가 아직 없으면(로딩) 빈 화면, `displayMode(tenantMode) !== '비회원'`이면
  작은 안내 문구만 렌더링하고 끝. 로그인 관련 UI는 전혀 없음(`/share`와의 핵심 차이).
- 클릭 시 상세 모달: `SharePage.tsx`에 이번에 추가한 커스텀 필드 표시 로직과 동일하게
  이름 + 등록된 커스텀 필드 값을 보여준다(코드 중복은 허용 — 두 페이지의 모달은 여백/톤이
  달라 컴포넌트화하면 오히려 옵션이 늘어난다. 이번 스코프에서는 로직만 각자 페이지 안에 둔다).
- 여백: 바깥 패딩 없이(`p-0`) 위젯 콘텐츠가 iframe 크기에 꽉 차도록 한다.

### 자동 높이 조절 (postMessage)

```ts
// EmbedPage.tsx 내부
const rootRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const el = rootRef.current
  if (!el) return
  const ro = new ResizeObserver(entries => {
    const height = Math.ceil(entries[0].contentRect.height)
    window.parent.postMessage({ source: 'dts-embed', type: 'resize', height }, '*')
  })
  ro.observe(el)
  return () => ro.disconnect()
}, [])
```

`source: 'dts-embed'`로 네임스페이스를 둬서 호스트 페이지에 이미 있는 다른 `postMessage`
트래픽과 섞이지 않게 한다. `targetOrigin`은 `'*'`로 둔다(임베드하는 사이트 도메인을
미리 알 수 없으므로) — 이 메시지는 높이 숫자만 담고 있어 민감정보 유출 우려는 없다.

## 임베드 코드 제공 UI

**중요(설계 수정)**: 브레인스토밍 1차 제안에서는 `ExportButton.tsx`(모든 유저에게 보이는 "공유"
pill 버튼)에 임베드 옵션을 추가하는 안이었으나, 자체 검토 결과 위치가 맞지 않는다.
"공유 링크"는 조직 구성원 누구나 쓸 수 있는 반면, "임베드 코드"는 조직 홈페이지에 박아 넣는
설정성 행위라 **관리자 전용**이 맞다. 그래서 `SchedulePage.tsx`의 햄버거 메뉴
(`funcMenuItems`, 기존 "문서 다운로드"·"화면" 섹션이 있는 곳)에 새 항목으로 추가한다.

- 조건: `isPrivileged && tenantMode === '비회원'`일 때만 표시.
- 클릭 시 클립보드에 아래 형태의 코드를 복사(alert으로 복사 완료 안내 — `ExportButton`의
  기존 `handleShareUrl`과 동일한 UX 패턴):

```html
<iframe id="dts-widget-<tenantId8자>" src="https://<origin>/embed?tid=<tenantId>"
  style="width:100%;border:0;" scrolling="no"></iframe>
<script>
(function () {
  window.addEventListener('message', function (e) {
    if (e.data && e.data.source === 'dts-embed' && e.data.type === 'resize') {
      var el = document.getElementById('dts-widget-<tenantId8자>');
      if (el) el.style.height = e.data.height + 'px';
    }
  });
})();
</script>
```

## `vercel.json` 변경

전체 경로의 `X-Frame-Options: DENY`를 제거한다(CSP `frame-ancestors 'none'`이 최신 브라우저에서
동일한 보호를 이미 제공하므로 중복이며, 두 헤더가 라우트별로 다른 값을 가지려 할 때 충돌 소지가
있다 — CSP3 `frame-ancestors`가 표준이고 X-Frame-Options는 레거시). 이후 `/embed` 전용 블록을
추가해 그 경로에서만 `frame-ancestors *`로 오버라이드한다. 나머지 모든 경로는 기존
`frame-ancestors 'none'`로 그대로 보호된다.

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; worker-src 'self' blob:; frame-ancestors 'none';" }
      ]
    },
    {
      "source": "/embed",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net; img-src 'self' data: blob: https:; worker-src 'self' blob:; frame-ancestors *;" }
      ]
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## `App.tsx` 라우팅

`/embed`를 `/share`와 동일하게 모든 인증 상태 분기(`AppRoutes`의 5개 `Routes` 블록)에
공개 라우트로 추가한다 — 로그인 여부와 무관하게 항상 렌더링되어야 하기 때문.

## 비범위 (하지 않는 것)

- 회원공유/회원개별 모드 위젯 지원 (프라이버시상 의도적으로 제외)
- 위젯 내 슬롯 클릭으로 직접 등록/수정 (읽기 전용만, `/share`와 동일)
- 임베드 코드에 테마 커스터마이징 옵션(색상 등) — 필요해지면 추후 쿼리 파라미터로 확장

## 테스트 계획

- `useShareTenantSettings` 훅: `tid === contextTenant.id`일 때 fetch를 건너뛰는지, 다를 때
  올바르게 파싱하는지 유닛 테스트.
- `EmbedPage`: freeform 테넌트일 때 정상 렌더, non-freeform일 때 안내 문구만 렌더되는지
  컴포넌트 테스트.
- `postMessage` 발신은 jsdom에서 `ResizeObserver`가 없어 폴리필/모킹이 필요 — 발신 로직을
  순수 함수로 뽑을 수 있으면 그 부분만 유닛 테스트, 아니면 수동 브라우저 검증으로 대체.
- 실제 iframe 임베드 동작(높이 자동 조절 포함)은 로컬에 테스트용 정적 HTML 파일을 만들어
  브라우저로 직접 확인한다.
