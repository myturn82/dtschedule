import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** 서울 기준 내일 날짜를 반환 */
function getTomorrowSeoul(): { year: number; month: number; day: number; dateStr: string } {
  // Intl.DateTimeFormat으로 서울 현재 날짜 문자열(YYYY-MM-DD) 추출
  const now = new Date()
  const seoulDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) // "2026-06-28" 형식

  // 내일 날짜 계산 (Date 생성 시 UTC 해석 방지를 위해 직접 파싱)
  const [y, m, d] = seoulDateStr.split('-').map(Number)
  const tomorrow = new Date(y, m - 1, d + 1) // 로컬 날짜 연산 (timezone 무관)
  const year = tomorrow.getFullYear()
  const month = tomorrow.getMonth() + 1
  const day = tomorrow.getDate()
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { year, month, day, dateStr }
}

/** 한국어 날짜 레이블 포맷 (예: "6월 29일(월)") */
function formatDateLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일(${dayNames[date.getDay()]})`
}

/** 서울 기준 현재 시각 HH:MM 반환 */
function getCurrentSeoulHHMM(): string {
  const now = new Date()
  // hour12: false로 24시간제, 한국어 포맷은 "23시 05분" 형태이므로 en-GB로 추출
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00'
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

/** 템플릿 변수 치환 ({{key}} → value) */
function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{{${k}}}`, v),
    template,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수 누락' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // VAPID 키가 있을 때만 웹 푸시 초기화
  const webPushEnabled = !!(vapidPublic && vapidPrivate && vapidSubject)
  if (webPushEnabled) {
    webpush.setVapidDetails(vapidSubject!, vapidPublic!, vapidPrivate!)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 요청 바디 파싱
  // - tenant_id: string  → 특정 조직만 수동 발송
  // - force: true        → send_time 필터 없이 전체 활성 조직 발송 (SuperAdmin 수동 트리거)
  // - dry_run: true      → DB 기록 없이 대상만 조회
  // - (없음/빈 바디)     → 크론 모드: send_time이 현재 서울 시각과 일치하는 조직만
  let body: { tenant_id?: string; dry_run?: boolean; force?: boolean } = {}
  try {
    body = await req.json()
  } catch {
    /* 빈 바디 허용 */
  }
  const { tenant_id, dry_run = false, force = false } = body

  // 크론 모드일 때만 send_time 필터 사용
  const isCronMode = !tenant_id && !force
  const seoulHHMM = isCronMode ? getCurrentSeoulHHMM() : null

  // notification_settings 쿼리 구성
  let settingsQuery = supabase
    .from('notification_settings')
    .select('*, tenant:tenants(id, name)')
    .eq('is_enabled', true)

  if (tenant_id) {
    // 특정 조직 수동 트리거
    settingsQuery = settingsQuery.eq('tenant_id', tenant_id)
  } else if (isCronMode && seoulHHMM) {
    // 크론 트리거: 현재 서울 시각과 일치하는 조직만
    settingsQuery = settingsQuery.eq('send_time', seoulHHMM)
  }
  // force=true이면 전체 활성 조직 (추가 필터 없음)

  const { data: settings, error: settingsErr } = await settingsQuery
  if (settingsErr) {
    return new Response(
      JSON.stringify({ error: settingsErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { year, month, day, dateStr } = getTomorrowSeoul()
  const dateLabel = formatDateLabel(year, month, day)

  let totalSent = 0
  let totalFailed = 0
  const orgs: Array<{ org: string; sent: number; failed: number; skipped: number }> = []

  for (const setting of settings ?? []) {
    const tenantData = setting.tenant as { id: string; name: string } | null
    const tenantName = tenantData?.name ?? setting.tenant_id

    // 내일 배정 조회 (user_id가 null인 행 제외)
    const { data: assignments, error: assignErr } = await supabase
      .from('assignments')
      .select('user_id, time_slot')
      .eq('tenant_id', setting.tenant_id)
      .eq('year', year)
      .eq('month', month)
      .eq('day', day)
      .not('user_id', 'is', null)

    if (assignErr) {
      orgs.push({ org: tenantName, sent: 0, failed: 0, skipped: 1 })
      continue
    }

    if (!assignments?.length) {
      orgs.push({ org: tenantName, sent: 0, failed: 0, skipped: 0 })
      continue
    }

    // 수신 대상 user_id 집합 구성
    const userIds = new Set<string>()

    if (setting.recipients?.assigned_members) {
      for (const a of assignments) {
        if (a.user_id) userIds.add(a.user_id)
      }
    }

    if (setting.recipients?.admins) {
      const { data: admins } = await supabase
        .from('tenant_members')
        .select('user_id')
        .eq('tenant_id', setting.tenant_id)
        .eq('role', 'admin')
        .eq('is_approved', true)
      for (const a of admins ?? []) {
        if (a.user_id) userIds.add(a.user_id)
      }
    }

    let orgSent = 0
    let orgFailed = 0

    for (const userId of userIds) {
      // 해당 유저의 내일 슬롯 목록
      const userSlots = assignments
        .filter(a => a.user_id === userId)
        .map(a => a.time_slot)
        .filter(Boolean)
        .join(', ')
      const slotLabel = userSlots || '미정'

      const title = '📅 내일 배정 알림'
      const bodyText = renderTemplate(setting.msg_template ?? '안녕하세요! 내일 {{date}} {{slot}} 배정이 있습니다. ({{org}})', {
        date: dateLabel,
        slot: slotLabel,
        org: tenantName,
      })
      const url = `/schedule?date=${dateStr}`

      if (dry_run) {
        // dry_run: 실제 발송 없이 대상만 조회
        continue
      }

      // 1. 인앱 알림 INSERT
      const { error: insertErr } = await supabase.from('notifications').insert({
        tenant_id: setting.tenant_id,
        user_id: userId,
        title,
        body: bodyText,
        type: 'd1_reminder',
        metadata: { date: dateStr, slot: slotLabel },
      })
      if (insertErr) {
        orgFailed++
        continue
      }

      // 인앱 알림 INSERT 성공 → sent 카운트
      orgSent++

      // 2. 웹 푸시 발송 (VAPID 키가 설정된 경우에만, 실패해도 sent 카운트는 유지)
      if (webPushEnabled) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', userId)

        for (const sub of subs ?? []) {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) continue

          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({ title, body: bodyText, url }),
            )
          } catch (pushErr: unknown) {
            // 410 Gone / 404: 만료된 구독 → 삭제 (sent 카운트는 영향 없음)
            const status = (pushErr as { statusCode?: number })?.statusCode
            if (status === 410 || status === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', sub.endpoint)
            }
          }
        }
      }
    }

    orgs.push({ org: tenantName, sent: orgSent, failed: orgFailed, skipped: 0 })
    totalSent += orgSent
    totalFailed += orgFailed
  }

  return new Response(
    JSON.stringify({
      sent: totalSent,
      failed: totalFailed,
      orgs,
      mode: isCronMode ? 'cron' : force ? 'force-all' : 'manual',
      send_time_filter: isCronMode ? seoulHHMM : null,
      dry_run,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
