# D-1 배정 알림 시스템 설계

## 개요

멤버의 다음날 배정을 전날 지정 시각에 알리는 시스템.
인앱 알림(벨 아이콘 + 드롭다운)과 웹 푸시(서비스 워커 기반)를 함께 제공하며,
조직별로 수신 대상·발송 시간·메시지 템플릿을 독립적으로 설정한다.

---

## DB 스키마 (마이그레이션 058)

### notification_settings

조직별 알림 설정.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | UNIQUE |
| is_enabled | boolean | 기본 false |
| send_time | text | 'HH:MM' 형식 (예: '18:00') |
| recipients | jsonb | `{ assigned_members: true, admins: false }` |
| msg_template | text | `{{date}}` `{{slot}}` `{{org}}` 변수 사용 가능 |
| updated_at | timestamptz | |

### notifications

인앱 알림 기록. Realtime 구독으로 실시간 뱃지 갱신.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| tenant_id | uuid FK→tenants | |
| user_id | uuid FK→profiles | |
| title | text | |
| body | text | |
| type | text | `'d1_reminder'` \| `'system'` |
| is_read | boolean | 기본 false |
| metadata | jsonb | `{ date, slot, assignment_id }` |
| created_at | timestamptz | |

RLS: 본인 알림만 SELECT. 서비스 롤만 INSERT.

### push_subscriptions

웹 푸시 브라우저 구독 정보. 브라우저별 복수 구독 허용.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| tenant_id | uuid FK→tenants | |
| endpoint | text | |
| p256dh | text | |
| auth | text | |
| created_at | timestamptz | |

RLS: 본인 구독만 SELECT/INSERT/DELETE. 서비스 롤 INSERT/DELETE 가능.

---

## 컴포넌트 설계

### AppHeader — 벨 아이콘

- 위치: 피드백 버튼 왼쪽, 로그인된 유저에게만 표시
- 미읽음 알림 수 뱃지 (1~9, 9+ 표시)
- 클릭 → NotificationPanel 드롭다운 토글
- Supabase Realtime으로 `notifications` 테이블 구독 (`user_id = eq.{userId}`, `is_read = eq.false`)

### NotificationPanel

- 최근 알림 최대 20개 (생성 역순)
- 미읽음 항목: 배경 강조
- 각 항목: 제목 + 본문 요약 + 상대 시간("3분 전")
- 항목 클릭: 읽음 처리 + `/schedule?date=YYYY-MM-DD` 이동
- "모두 읽음" 버튼
- 새 파일: `src/components/notifications/NotificationPanel.tsx`

### 웹 푸시 구독 UI

- 위치: AppHeader 유저 메뉴 안 ("푸시 알림" 항목)
- 상태: 미구독 → "알림 켜기" / 구독 중 → "알림 끄기"
- 권한 거부 시 안내 메시지 표시
- 새 훅: `src/hooks/usePushSubscription.ts`

### AdminPage — 알림 설정 패널

- 기존 AdminPage에 "알림" 섹션 추가
- 알림 활성화 토글
- 발송 시간 (시/분 드롭다운, 30분 단위)
- 수신 대상 체크박스: [배정된 멤버] [관리자]
- 메시지 템플릿 텍스트에어리어 + 변수 안내 (`{{date}}`, `{{slot}}`, `{{org}}`)
- 저장 버튼 → `notification_settings` upsert

### SuperAdminPage — 수동 발송 버튼

- 기존 탭 영역에 "D-1 알림 수동 발송" 버튼 추가
- 클릭 → Edge Function 호출 (전체 조직 대상)
- 결과 표시: "OO개 조직, OO명에게 발송 완료 / OO건 실패"

---

## Edge Function: send-reminders

### 엔드포인트

```
POST /functions/v1/send-reminders
Authorization: Bearer <service_role_key>
Content-Type: application/json

Body: {
  tenant_id?: string,  // 생략 시 전체 enabled 조직
  dry_run?: boolean    // true면 DB 저장·푸시 없이 대상만 반환
}
```

### 처리 흐름

1. `notification_settings` 조회 (`is_enabled = true`, 크론 호출 시 `send_time` 필터 추가)
2. 내일 날짜(`Asia/Seoul` 기준) 각 조직 `assignments` 조회
3. `recipients` 설정에 따라 대상 user_id 결정
4. `msg_template` 변수 치환: `{{date}}` → `6월 28일(토)`, `{{slot}}` → `14:00~16:00`, `{{org}}` → 조직명
5. `notifications` INSERT (인앱)
6. `push_subscriptions`에서 대상 구독 조회 → Web Push API 발송
7. `{ sent, failed, orgs }` 반환

### VAPID 환경변수

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
```
Supabase Dashboard → Project Settings → Edge Functions → Secrets에 저장.

---

## 서비스 워커 (public/sw.js)

- `push` 이벤트: `event.data.json()` → `self.registration.showNotification(title, options)`
- `notificationclick` 이벤트: `clients.openWindow('/schedule?date=YYYY-MM-DD')` 또는 포커스
- vite-plugin-pwa 또는 수동 등록 (`src/main.tsx`에서 `navigator.serviceWorker.register('/sw.js')`)

---

## 스케줄링

### 현재 (수동)
SuperAdminPage에서 버튼 클릭 → Edge Function 직접 호출

### 추후 (자동)
```yaml
# .github/workflows/send-reminders.yml
on:
  schedule:
    - cron: '0 * * * *'  # 매시 정각 UTC
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/send-reminders \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```
Edge Function 내부에서 `send_time`이 현재 시각(`Asia/Seoul`)과 일치하는 조직만 필터링.

---

## 파일 목록

| 파일 | 용도 |
|------|------|
| `supabase/migrations/058_notifications.sql` | 3개 테이블 + RLS |
| `supabase/functions/send-reminders/index.ts` | D-1 발송 Edge Function |
| `public/sw.js` | 서비스 워커 |
| `src/hooks/usePushSubscription.ts` | 구독 관리 훅 |
| `src/hooks/useNotifications.ts` | 인앱 알림 + Realtime 훅 |
| `src/components/notifications/NotificationPanel.tsx` | 알림 드롭다운 |
| `src/components/AppHeader.tsx` | 벨 아이콘 추가 |
| `src/pages/AdminPage.tsx` | 알림 설정 섹션 추가 |
| `src/pages/SuperAdminPage.tsx` | 수동 발송 버튼 추가 |
| `.github/workflows/send-reminders.yml` | 크론 워크플로 (추후) |
