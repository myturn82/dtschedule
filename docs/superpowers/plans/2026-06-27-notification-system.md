# D-1 배정 알림 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 멤버의 내일 배정을 전날 지정 시각에 인앱 알림(벨 아이콘)과 웹 푸시로 발송하는 시스템 구축

**Architecture:** DB에 3개 테이블(notification_settings, notifications, push_subscriptions)을 추가하고, Supabase Edge Function이 D-1 배정을 조회해 인앱 알림 레코드 INSERT + Web Push API 발송을 담당한다. 프론트엔드는 Realtime 구독으로 벨 뱃지를 실시간 갱신하고, 서비스 워커가 백그라운드 푸시를 수신한다.

**Tech Stack:** Supabase (PostgreSQL, Realtime, Edge Functions), Deno (Edge Function 런타임), Web Push API, Service Worker API, React, TypeScript

## Global Constraints

- 타입 체크는 반드시 `npx tsc -b`로 실행 (루트 `npx tsc --noEmit` 아님)
- 신규 페이지/모달에는 `DevFileLabel` 추가 (컴포넌트는 해당 없음)
- DB 변경은 개발 DB(`mcuszdvophmqrwostcah`)에 먼저 적용 후 사용자 승인 후 운영 반영
- 마이그레이션 완료 후 `supabase/reset_db.sql`, `supabase/reset_data.sql` 반드시 갱신
- 하드코딩 금지 — 조직 이름·레이블은 항상 DB에서 읽음
- 이모지 아이콘 사용 시 `select-none` 추가, CSS `color` 적용 금지
- RLS: tenant_id 필터 필수, DELETE 필터 사용 테이블은 REPLICA IDENTITY FULL 설정

---

## 파일 목록

| 파일 | 생성/수정 | 역할 |
|------|-----------|------|
| `supabase/migrations/058_notifications.sql` | 생성 | 3개 테이블 + 인덱스 + RLS |
| `supabase/reset_db.sql` | 수정 | 새 테이블 반영 |
| `supabase/reset_data.sql` | 수정 | TRUNCATE 목록에 추가 |
| `supabase/functions/send-reminders/index.ts` | 생성 | D-1 발송 Edge Function |
| `public/sw.js` | 생성 | 웹 푸시 수신 서비스 워커 |
| `src/main.tsx` | 수정 | 서비스 워커 등록 |
| `src/hooks/useNotifications.ts` | 생성 | 인앱 알림 fetch + Realtime 훅 |
| `src/hooks/usePushSubscription.ts` | 생성 | 웹 푸시 구독 관리 훅 |
| `src/components/notifications/NotificationPanel.tsx` | 생성 | 알림 드롭다운 패널 |
| `src/components/AppHeader.tsx` | 수정 | 벨 아이콘 + 알림 패널 + 푸시 구독 UI 추가 |
| `src/pages/AdminPage.tsx` | 수정 | 알림 설정 섹션 추가 |
| `src/pages/SuperAdminPage.tsx` | 수정 | 수동 발송 버튼 추가 |
| `.github/workflows/send-reminders.yml` | 생성 | 향후 자동 크론 워크플로 |

---

## Task 1: DB 마이그레이션 (058_notifications)

**Files:**
- Create: `supabase/migrations/058_notifications.sql`
- Modify: `supabase/reset_db.sql`
- Modify: `supabase/reset_data.sql`

**Interfaces:**
- Produces: `notification_settings(id, tenant_id, is_enabled, send_time, recipients, msg_template, updated_at)`, `notifications(id, tenant_id, user_id, title, body, type, is_read, metadata, created_at)`, `push_subscriptions(id, user_id, tenant_id, endpoint, p256dh, auth, created_at)`

- [ ] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/058_notifications.sql` 전체 내용:

```sql
-- 조직별 알림 설정
CREATE TABLE IF NOT EXISTS notification_settings (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_enabled boolean DEFAULT false NOT NULL,
  send_time  text DEFAULT '18:00' NOT NULL,
  recipients jsonb DEFAULT '{"assigned_members": true, "admins": false}'::jsonb NOT NULL,
  msg_template text DEFAULT '안녕하세요! 내일 {{date}} {{slot}} 배정이 있습니다. ({{org}})' NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 인앱 알림 기록
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  type       text DEFAULT 'd1_reminder' NOT NULL,
  is_read    boolean DEFAULT false NOT NULL,
  metadata   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 웹 푸시 구독 정보
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id  uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);

-- RLS 활성화
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;

-- notification_settings: 조직 admin이 조회/수정
CREATE POLICY "ns_tenant_admin" ON notification_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = notification_settings.tenant_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
  );

CREATE POLICY "ns_super_admin" ON notification_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true));

-- notifications: 본인 알림만 조회/수정
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- push_subscriptions: 본인 구독만 관리
CREATE POLICY "push_sub_own" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

-- Realtime (INSERT 이벤트만 사용하므로 REPLICA IDENTITY FULL 불필요)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- [ ] **Step 2: 개발 DB에 적용**

```powershell
npx supabase db push --project-ref mcuszdvophmqrwostcah
```

Expected: "Applying migration 058_notifications.sql... done"

- [ ] **Step 3: Supabase 대시보드에서 테이블 생성 확인**

Dashboard → Table Editor에서 `notification_settings`, `notifications`, `push_subscriptions` 3개 테이블 확인.

- [ ] **Step 4: reset_db.sql 갱신**

`supabase/reset_db.sql` 파일을 열어:

STEP 1 DROP 섹션 상단에 추가:
```sql
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
```

STEP 2 테이블 생성 섹션에 058_notifications.sql의 CREATE TABLE 3개 블록 추가.

STEP 3 인덱스 섹션에 4개 인덱스 추가.

STEP 6 RLS 섹션에 3개 테이블의 정책 추가.

파일 상단 "기준 마이그레이션" 주석을 `-- 기준: 058_notifications` 으로 갱신.

- [ ] **Step 5: reset_data.sql 갱신**

STEP 2 TRUNCATE 목록에 FK 자식→부모 순서로 추가:
```sql
TRUNCATE TABLE push_subscriptions CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE notification_settings CASCADE;
```

- [ ] **Step 6: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음 (오류 없음)

- [ ] **Step 7: 커밋**

```powershell
git add supabase/migrations/058_notifications.sql supabase/reset_db.sql supabase/reset_data.sql
git commit -m "feat: 알림 시스템 DB 마이그레이션 (notification_settings, notifications, push_subscriptions)"
```

---

## Task 2: Edge Function (send-reminders)

**Files:**
- Create: `supabase/functions/send-reminders/index.ts`
- Create: `.github/workflows/send-reminders.yml`

**Interfaces:**
- Consumes: `notification_settings`, `assignments`, `tenant_members`, `push_subscriptions`, `tenants` 테이블
- Produces: `POST /functions/v1/send-reminders` — Body: `{ tenant_id?: string, dry_run?: boolean }` → Response: `{ sent: number, failed: number, orgs: Array<{ org: string, sent: number, failed: number }> }`

- [ ] **Step 1: VAPID 키 생성**

로컬에서 실행:
```powershell
npx web-push generate-vapid-keys
```

출력된 `Public Key`와 `Private Key`를 메모해둔다.

Supabase Dashboard → Project Settings → Edge Functions → Secrets에 3개 추가:
- `VAPID_PUBLIC_KEY` = 위에서 생성한 Public Key
- `VAPID_PRIVATE_KEY` = 위에서 생성한 Private Key
- `VAPID_SUBJECT` = `mailto:admin@yourdomain.com`

`.env.local`에도 프론트엔드용으로 추가:
```
VITE_VAPID_PUBLIC_KEY=<위에서 생성한 Public Key>
```

- [ ] **Step 2: Edge Function 파일 작성**

`supabase/functions/send-reminders/index.ts` 전체 내용:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getTomorrowSeoul(): { year: number; month: number; day: number; dateStr: string } {
  const now = new Date()
  const seoulFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const seoulNow = new Date(seoulFormatter.format(now))
  seoulNow.setDate(seoulNow.getDate() + 1)
  const year = seoulNow.getFullYear()
  const month = seoulNow.getMonth() + 1
  const day = seoulNow.getDate()
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { year, month, day, dateStr }
}

function formatDateLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일(${dayNames[date.getDay()]})`
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{{${k}}}`, v), template)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')!

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let body: { tenant_id?: string; dry_run?: boolean } = {}
  try { body = await req.json() } catch { /* empty body ok */ }
  const { tenant_id, dry_run = false } = body

  // 크론 호출 시: send_time이 현재 시각(Asia/Seoul, HH:MM)과 일치하는 조직만
  const seoulHourMin = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()).replace('시 ', ':').replace('분', '').trim()

  let settingsQuery = supabase
    .from('notification_settings')
    .select('*, tenant:tenants(id, name)')
    .eq('is_enabled', true)

  if (tenant_id) {
    // 수동 트리거: 특정 조직
    settingsQuery = settingsQuery.eq('tenant_id', tenant_id)
  } else {
    // 크론 트리거: send_time이 현재 시각과 일치하는 조직만
    settingsQuery = settingsQuery.eq('send_time', seoulHourMin)
  }

  const { data: settings, error: settingsErr } = await settingsQuery
  if (settingsErr) {
    return new Response(JSON.stringify({ error: settingsErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { year, month, day, dateStr } = getTomorrowSeoul()
  const dateLabel = formatDateLabel(year, month, day)

  let totalSent = 0
  let totalFailed = 0
  const orgs: Array<{ org: string; sent: number; failed: number }> = []

  for (const setting of settings ?? []) {
    const tenantName = (setting.tenant as { id: string; name: string }).name

    // 내일 배정 조회
    const { data: assignments } = await supabase
      .from('assignments')
      .select('user_id, time_slot')
      .eq('tenant_id', setting.tenant_id)
      .eq('year', year)
      .eq('month', month)
      .eq('day', day)
      .not('user_id', 'is', null)

    if (!assignments?.length) {
      orgs.push({ org: tenantName, sent: 0, failed: 0 })
      continue
    }

    // 수신 대상 결정
    const userIds = new Set<string>()
    if (setting.recipients?.assigned_members) {
      for (const a of assignments) if (a.user_id) userIds.add(a.user_id)
    }
    if (setting.recipients?.admins) {
      const { data: admins } = await supabase
        .from('tenant_members')
        .select('user_id')
        .eq('tenant_id', setting.tenant_id)
        .eq('role', 'admin')
        .eq('is_approved', true)
      for (const a of admins ?? []) userIds.add(a.user_id)
    }

    let orgSent = 0
    let orgFailed = 0

    for (const userId of userIds) {
      const userSlots = assignments
        .filter(a => a.user_id === userId)
        .map(a => a.time_slot)
        .join(', ')
      const slotLabel = userSlots || '미정'

      const title = '📅 내일 배정 알림'
      const bodyText = renderTemplate(setting.msg_template, {
        date: dateLabel, slot: slotLabel, org: tenantName,
      })
      const url = `/schedule?date=${dateStr}`

      if (!dry_run) {
        // 인앱 알림 INSERT
        await supabase.from('notifications').insert({
          tenant_id: setting.tenant_id,
          user_id: userId,
          title,
          body: bodyText,
          type: 'd1_reminder',
          metadata: { date: dateStr, slot: slotLabel },
        })

        // 웹 푸시 발송
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', userId)

        for (const sub of subs ?? []) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({ title, body: bodyText, url }),
            )
            orgSent++
          } catch {
            orgFailed++
            // 만료된 구독 삭제
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          }
        }
      }
    }

    orgs.push({ org: tenantName, sent: orgSent, failed: orgFailed })
    totalSent += orgSent
    totalFailed += orgFailed
  }

  return new Response(JSON.stringify({ sent: totalSent, failed: totalFailed, orgs }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 3: GitHub Actions 워크플로 파일 작성**

`.github/workflows/send-reminders.yml` 전체 내용:

```yaml
name: Send D-1 Reminders

on:
  schedule:
    - cron: '0 * * * *'  # 매시 정각 UTC (Asia/Seoul은 UTC+9)
  workflow_dispatch:       # 수동 실행 허용

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -s -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/send-reminders" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
        timeout-minutes: 2
```

GitHub Repository → Settings → Secrets and variables → Actions에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 추가 필요 (실제 운영 배포 시).

- [ ] **Step 4: Edge Function 배포**

```powershell
npx supabase functions deploy send-reminders --project-ref mcuszdvophmqrwostcah
```

Expected: "Deployed Function send-reminders"

- [ ] **Step 5: 수동 호출 테스트 (dry_run)**

```powershell
$url = "https://mcuszdvophmqrwostcah.supabase.co/functions/v1/send-reminders"
$headers = @{ "Authorization" = "Bearer <SERVICE_ROLE_KEY>"; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body '{"dry_run": true}'
```

Expected: `{ sent: 0, failed: 0, orgs: [...] }` (dry_run이므로 실제 발송 없음)

- [ ] **Step 6: 커밋**

```powershell
git add supabase/functions/send-reminders/index.ts .github/workflows/send-reminders.yml
git commit -m "feat: D-1 배정 알림 Edge Function 및 GitHub Actions 크론 워크플로 추가"
```

---

## Task 3: 서비스 워커 + 등록

**Files:**
- Create: `public/sw.js`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: 웹 푸시 이벤트 페이로드: `{ title: string, body: string, url: string }`
- Produces: 브라우저 시스템 알림 팝업 + 클릭 시 앱 URL 이동

- [ ] **Step 1: 서비스 워커 파일 작성**

`public/sw.js` 전체 내용:

```javascript
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { return }
  event.waitUntil(
    self.registration.showNotification(data.title ?? '알림', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
```

- [ ] **Step 2: main.tsx에 서비스 워커 등록 추가**

`src/main.tsx`를 열어 파일 맨 아래, `ReactDOM.createRoot(...)` 블록 이후에 추가:

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // 서비스 워커 등록 실패는 앱 동작에 영향 없음
  })
}
```

- [ ] **Step 3: 브라우저에서 서비스 워커 등록 확인**

`http://localhost:5173` 접속 → 브라우저 DevTools → Application → Service Workers → `/sw.js` 상태가 "activated and is running" 인지 확인.

- [ ] **Step 4: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 5: 커밋**

```powershell
git add public/sw.js src/main.tsx
git commit -m "feat: 웹 푸시 서비스 워커 추가 및 등록"
```

---

## Task 4: useNotifications 훅

**Files:**
- Create: `src/hooks/useNotifications.ts`

**Interfaces:**
- Consumes: `supabase` (from `../lib/supabase`), `useAuth` (from `./useAuth`)
- Produces:
  ```typescript
  export interface AppNotification {
    id: string
    tenant_id: string
    user_id: string
    title: string
    body: string
    type: string
    is_read: boolean
    metadata: { date?: string; slot?: string }
    created_at: string
  }
  export function useNotifications(): {
    notifications: AppNotification[]
    unreadCount: number
    loading: boolean
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
  }
  ```

- [ ] **Step 1: 훅 파일 작성**

`src/hooks/useNotifications.ts` 전체 내용:

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface AppNotification {
  id: string
  tenant_id: string
  user_id: string
  title: string
  body: string
  type: string
  is_read: boolean
  metadata: { date?: string; slot?: string }
  created_at: string
}

export function useNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (!profile?.id) return

    setLoading(true)
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setNotifications((data ?? []) as AppNotification[])
        setLoading(false)
      })

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as AppNotification, ...prev.slice(0, 19)])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === (payload.new as AppNotification).id ? payload.new as AppNotification : n)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  async function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllAsRead() {
    if (!profile?.id) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
```

- [ ] **Step 2: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```powershell
git add src/hooks/useNotifications.ts
git commit -m "feat: useNotifications 훅 추가 (인앱 알림 fetch + Realtime)"
```

---

## Task 5: NotificationPanel 컴포넌트

**Files:**
- Create: `src/components/notifications/NotificationPanel.tsx`

**Interfaces:**
- Consumes: `AppNotification` (from `../../hooks/useNotifications`), `useNavigate` (from `react-router-dom`)
- Produces:
  ```typescript
  interface NotificationPanelProps {
    notifications: AppNotification[]
    onMarkAsRead: (id: string) => Promise<void>
    onMarkAllAsRead: () => Promise<void>
    onClose: () => void
  }
  export function NotificationPanel(props: NotificationPanelProps): JSX.Element
  ```

- [ ] **Step 1: 컴포넌트 파일 작성**

`src/components/notifications/NotificationPanel.tsx` 전체 내용:

```typescript
import { useNavigate } from 'react-router-dom'
import type { AppNotification } from '../../hooks/useNotifications'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

interface NotificationPanelProps {
  notifications: AppNotification[]
  onMarkAsRead: (id: string) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onClose: () => void
}

export function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }: NotificationPanelProps) {
  const navigate = useNavigate()

  async function handleClick(n: AppNotification) {
    await onMarkAsRead(n.id)
    if (n.metadata?.date) navigate(`/schedule?date=${n.metadata.date}`)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-1 w-80 max-h-[480px] flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl z-50 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">알림</span>
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            모두 읽음
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              새 알림이 없습니다
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors flex items-start gap-2.5 ${
                  !n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''
                }`}
              >
                {!n.is_read && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--color-brand-primary)] flex-shrink-0" />
                )}
                <div className={!n.is_read ? '' : 'ml-[18px]'}>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{n.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```powershell
git add src/components/notifications/NotificationPanel.tsx
git commit -m "feat: NotificationPanel 드롭다운 컴포넌트 추가"
```

---

## Task 6: usePushSubscription 훅

**Files:**
- Create: `src/hooks/usePushSubscription.ts`

**Interfaces:**
- Consumes: `supabase`, `useAuth`, `useTenant`, `VITE_VAPID_PUBLIC_KEY` 환경변수
- Produces:
  ```typescript
  export function usePushSubscription(): {
    isSubscribed: boolean
    isLoading: boolean
    isSupported: boolean
    subscribe: () => Promise<void>
    unsubscribe: () => Promise<void>
  }
  ```

- [ ] **Step 1: 훅 파일 작성**

`src/hooks/usePushSubscription.ts` 전체 내용:

```typescript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useTenant } from '../contexts/TenantContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function usePushSubscription() {
  const { profile } = useAuth()
  const { tenant } = useTenant()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isSupported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window

  useEffect(() => {
    if (!isSupported || !profile?.id) return
    navigator.serviceWorker.ready.then(async reg => {
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    }).catch(() => {})
  }, [profile?.id, isSupported])

  async function subscribe() {
    if (!profile?.id || !tenant?.id || !VAPID_PUBLIC_KEY || !isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const keyBuffer = sub.getKey('p256dh')
      const authBuffer = sub.getKey('auth')
      const p256dh = keyBuffer
        ? btoa(String.fromCharCode(...new Uint8Array(keyBuffer)))
        : ''
      const auth = authBuffer
        ? btoa(String.fromCharCode(...new Uint8Array(authBuffer)))
        : ''
      await supabase.from('push_subscriptions').upsert(
        { user_id: profile.id, tenant_id: tenant.id, endpoint: sub.endpoint, p256dh, auth },
        { onConflict: 'endpoint' }
      )
      setIsSubscribed(true)
    } catch (err) {
      console.error('Push subscription failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    if (!isSupported) return
    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}
```

- [ ] **Step 2: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 3: 커밋**

```powershell
git add src/hooks/usePushSubscription.ts
git commit -m "feat: usePushSubscription 훅 추가 (웹 푸시 구독 관리)"
```

---

## Task 7: AppHeader 벨 아이콘 + 푸시 토글

**Files:**
- Modify: `src/components/AppHeader.tsx`

**Interfaces:**
- Consumes: `useNotifications()`, `usePushSubscription()`, `NotificationPanel`
- Produces: 벨 아이콘(미읽음 뱃지), 알림 드롭다운, 유저 메뉴에 푸시 알림 토글

- [ ] **Step 1: import 추가**

`src/components/AppHeader.tsx` 상단 import 블록에 추가:

```typescript
import { useNotifications } from '../hooks/useNotifications'
import { usePushSubscription } from '../hooks/usePushSubscription'
import { NotificationPanel } from './notifications/NotificationPanel'
```

- [ ] **Step 2: 훅 호출 추가**

`AppHeader` 함수 내부, 기존 `useState` 선언들 아래에 추가:

```typescript
const [showNotifications, setShowNotifications] = useState(false)
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
const { isSubscribed, isLoading: pushLoading, isSupported: pushSupported, subscribe, unsubscribe } = usePushSubscription()
```

- [ ] **Step 3: 벨 아이콘 버튼 추가**

`AppHeader` JSX에서 피드백 링크(`feedbackUrl && profile && (...)`) 블록 **바로 앞**에 삽입:

```tsx
{profile && (
  <div className="relative">
    <button
      onClick={() => setShowNotifications(v => !v)}
      aria-label="알림"
      className="relative w-8 h-8 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all shrink-0"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6z"/>
        <path d="M8 16a2 2 0 0 0 4 0"/>
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none select-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
    {showNotifications && (
      <NotificationPanel
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClose={() => setShowNotifications(false)}
      />
    )}
  </div>
)}
```

- [ ] **Step 4: 유저 메뉴에 푸시 알림 토글 추가**

유저 메뉴 드롭다운의 `{sep}` (로그아웃 바로 위 구분선) 앞에 추가:

```tsx
{pushSupported && (
  <button
    onClick={async () => { isSubscribed ? await unsubscribe() : await subscribe(); setShowUserMenu(false) }}
    disabled={pushLoading}
    className={menuBtn}
  >
    <span className="flex items-center gap-2.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {pushLoading ? '처리 중...' : isSubscribed ? '푸시 알림 끄기' : '푸시 알림 켜기'}
    </span>
  </button>
)}
```

- [ ] **Step 5: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 6: 브라우저에서 확인**

1. `http://localhost:5173` 접속, 로그인
2. 헤더 우측에 벨 아이콘 확인
3. 클릭하면 "새 알림이 없습니다" 패널 표시 확인
4. 유저 아이콘 클릭 → "푸시 알림 켜기" 메뉴 확인
5. 클릭 시 브라우저 알림 권한 요청 팝업 확인

- [ ] **Step 7: 커밋**

```powershell
git add src/components/AppHeader.tsx
git commit -m "feat: AppHeader에 알림 벨 아이콘 및 웹 푸시 구독 UI 추가"
```

---

## Task 8: AdminPage 알림 설정 섹션

**Files:**
- Modify: `src/pages/AdminPage.tsx`

**Interfaces:**
- Consumes: `supabase`, `useTenant()`, `notification_settings` 테이블 (SELECT/UPSERT)
- Produces: 알림 설정 UI (활성화 토글, 발송 시간, 수신 대상, 메시지 템플릿)

- [ ] **Step 1: 알림 설정 state 및 로드 로직 추가**

`AdminPage.tsx` 내 기존 useState 선언 블록 아래에 추가:

```typescript
// 알림 설정
const [notifSettings, setNotifSettings] = useState<{
  is_enabled: boolean
  send_time: string
  recipients: { assigned_members: boolean; admins: boolean }
  msg_template: string
} | null>(null)
const [notifSaving, setNotifSaving] = useState(false)
```

기존 `useEffect`(데이터 로드) 안에 알림 설정 로드 추가. AdminPage에서 tenant가 로드될 때:

```typescript
// 알림 설정 로드 (tenant가 있을 때)
if (tenant?.id) {
  supabase
    .from('notification_settings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle()
    .then(({ data }) => {
      setNotifSettings(data ? {
        is_enabled: data.is_enabled,
        send_time: data.send_time,
        recipients: data.recipients as { assigned_members: boolean; admins: boolean },
        msg_template: data.msg_template,
      } : {
        is_enabled: false,
        send_time: '18:00',
        recipients: { assigned_members: true, admins: false },
        msg_template: '안녕하세요! 내일 {{date}} {{slot}} 배정이 있습니다. ({{org}})',
      })
    })
}
```

- [ ] **Step 2: 저장 함수 추가**

AdminPage 컴포넌트 내 기존 함수들 아래에 추가:

```typescript
async function saveNotifSettings() {
  if (!tenant?.id || !notifSettings) return
  setNotifSaving(true)
  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      tenant_id: tenant.id,
      is_enabled: notifSettings.is_enabled,
      send_time: notifSettings.send_time,
      recipients: notifSettings.recipients,
      msg_template: notifSettings.msg_template,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' })
  setNotifSaving(false)
  if (error) alert(`저장 오류: ${error.message}`)
}
```

- [ ] **Step 3: 알림 설정 섹션 JSX 추가**

AdminPage JSX의 기존 섹션들(슬롯 설정, 역할 설정 등) 아래에 새 섹션 추가:

```tsx
{/* ── 알림 설정 ── */}
{notifSettings && (
  <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-bold text-[var(--color-text-primary)]">D-1 배정 알림</h2>
      <label className="flex items-center gap-2 cursor-pointer">
        <span className="text-sm text-[var(--color-text-secondary)]">
          {notifSettings.is_enabled ? '활성' : '비활성'}
        </span>
        <button
          role="switch"
          aria-checked={notifSettings.is_enabled}
          onClick={() => setNotifSettings(s => s ? { ...s, is_enabled: !s.is_enabled } : s)}
          className={`relative w-10 h-6 rounded-full transition-colors ${notifSettings.is_enabled ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-border-strong)]'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifSettings.is_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </label>
    </div>

    <div className="grid grid-cols-2 gap-4">
      {/* 발송 시간 */}
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">발송 시간</label>
        <select
          value={notifSettings.send_time}
          onChange={e => setNotifSettings(s => s ? { ...s, send_time: e.target.value } : s)}
          className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30"
        >
          {Array.from({ length: 48 }, (_, i) => {
            const h = String(Math.floor(i / 2)).padStart(2, '0')
            const m = i % 2 === 0 ? '00' : '30'
            return `${h}:${m}`
          }).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* 수신 대상 */}
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">수신 대상</label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifSettings.recipients.assigned_members}
              onChange={e => setNotifSettings(s => s ? { ...s, recipients: { ...s.recipients, assigned_members: e.target.checked } } : s)}
              className="w-4 h-4 rounded accent-[var(--color-brand-primary)]"
            />
            <span className="text-sm text-[var(--color-text-primary)]">배정된 멤버</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifSettings.recipients.admins}
              onChange={e => setNotifSettings(s => s ? { ...s, recipients: { ...s.recipients, admins: e.target.checked } } : s)}
              className="w-4 h-4 rounded accent-[var(--color-brand-primary)]"
            />
            <span className="text-sm text-[var(--color-text-primary)]">관리자</span>
          </label>
        </div>
      </div>
    </div>

    {/* 메시지 템플릿 */}
    <div>
      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">메시지 템플릿</label>
      <textarea
        value={notifSettings.msg_template}
        onChange={e => setNotifSettings(s => s ? { ...s, msg_template: e.target.value } : s)}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30 resize-none"
      />
      <p className="text-xs text-[var(--color-text-muted)] mt-1">
        변수: <code className="bg-[var(--color-surface-secondary)] px-1 rounded">{'{{date}}'}</code> 날짜,{' '}
        <code className="bg-[var(--color-surface-secondary)] px-1 rounded">{'{{slot}}'}</code> 시간대,{' '}
        <code className="bg-[var(--color-surface-secondary)] px-1 rounded">{'{{org}}'}</code> 조직명
      </p>
    </div>

    <button
      onClick={saveNotifSettings}
      disabled={notifSaving}
      className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
      style={{ background: 'var(--color-brand-primary)' }}
    >
      {notifSaving ? '저장 중...' : '저장'}
    </button>
  </section>
)}
```

- [ ] **Step 4: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 5: 브라우저에서 확인**

1. AdminPage 접속 → 하단에 "D-1 배정 알림" 섹션 표시 확인
2. 토글 켜기/끄기, 시간 변경, 수신 대상 체크박스 동작 확인
3. "저장" 클릭 → Supabase Dashboard에서 `notification_settings` 테이블에 레코드 생성 확인

- [ ] **Step 6: 커밋**

```powershell
git add src/pages/AdminPage.tsx
git commit -m "feat: AdminPage에 D-1 배정 알림 설정 섹션 추가"
```

---

## Task 9: SuperAdminPage 수동 발송 버튼

**Files:**
- Modify: `src/pages/SuperAdminPage.tsx`

**Interfaces:**
- Consumes: `supabase.functions.invoke('send-reminders', ...)`, 기존 `message` state
- Produces: "D-1 알림 수동 발송" 버튼 + 결과 표시

- [ ] **Step 1: state 추가**

`SuperAdminPage.tsx` 내 기존 state 선언 아래에 추가:

```typescript
const [reminderSending, setReminderSending] = useState(false)
```

- [ ] **Step 2: 발송 함수 추가**

기존 함수들 아래에 추가:

```typescript
async function sendRemindersManually() {
  setReminderSending(true)
  try {
    const { data, error } = await supabase.functions.invoke('send-reminders', {
      body: {},
    })
    if (error) {
      setMessage(`오류: ${error.message}`)
    } else {
      const result = data as { sent: number; failed: number; orgs: Array<{ org: string; sent: number; failed: number }> }
      setMessage(`D-1 알림 발송 완료 — 총 ${result.sent}건 성공, ${result.failed}건 실패`)
    }
  } finally {
    setReminderSending(false)
  }
}
```

- [ ] **Step 3: 버튼 JSX 추가**

SuperAdminPage의 탭 네비게이션(`<div className="flex gap-1 mb-4 ...">`) 바로 위, `<PlanLimitsPanel />` 아래에 추가:

```tsx
{/* D-1 알림 수동 발송 */}
<div className="flex items-center justify-between p-4 mb-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
  <div>
    <p className="text-sm font-semibold text-[var(--color-text-primary)]">D-1 배정 알림 수동 발송</p>
    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">활성화된 조직의 내일 배정 알림을 즉시 발송합니다</p>
  </div>
  <button
    onClick={sendRemindersManually}
    disabled={reminderSending}
    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors whitespace-nowrap"
    style={{ background: 'var(--color-brand-primary)' }}
  >
    {reminderSending ? '발송 중...' : '지금 발송'}
  </button>
</div>
```

- [ ] **Step 4: 타입 체크**

```powershell
npx tsc -b
```

Expected: 출력 없음

- [ ] **Step 5: 브라우저에서 확인**

1. SuperAdminPage 접속
2. "D-1 배정 알림 수동 발송" 패널과 "지금 발송" 버튼 표시 확인
3. 클릭 → "발송 중..." 표시 후 결과 메시지 표시 확인
4. Supabase Dashboard → `notifications` 테이블에 레코드 생성 확인 (내일 배정이 있는 경우)

- [ ] **Step 6: 커밋**

```powershell
git add src/pages/SuperAdminPage.tsx
git commit -m "feat: SuperAdminPage에 D-1 알림 수동 발송 버튼 추가"
```

---

## 최종 체크리스트

- [ ] `npx tsc -b` 오류 없음
- [ ] 개발 서버(`npm run dev`)에서 벨 아이콘 표시 확인
- [ ] 알림 패널 드롭다운 열림/닫힘 확인
- [ ] 유저 메뉴에 "푸시 알림 켜기" 표시 + 클릭 시 브라우저 권한 요청 확인
- [ ] AdminPage 알림 설정 섹션 저장 확인
- [ ] SuperAdminPage 수동 발송 버튼 클릭 후 `notifications` 테이블에 레코드 생성 확인
- [ ] DevTools → Application → Service Workers에서 `/sw.js` 활성 상태 확인
- [ ] `docs/checklist_2026-06-27.md` 작성 (CLAUDE.md 규칙)
