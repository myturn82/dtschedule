import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// ── 날짜/포맷 헬퍼 ───────────────────────────────────────────────────────────

function getTomorrowSeoul(): { year: number; month: number; day: number; dateStr: string } {
  const now = new Date()
  const seoulDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  const [y, m, d] = seoulDateStr.split('-').map(Number)
  const tomorrow = new Date(y, m - 1, d + 1)
  const year = tomorrow.getFullYear()
  const month = tomorrow.getMonth() + 1
  const day = tomorrow.getDate()
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { year, month, day, dateStr }
}

function formatDateLabel(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일(${dayNames[date.getDay()]})`
}

function getCurrentSeoulHHMM(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now)
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00'
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{{${k}}}`, v), template)
}

function formatSlot(slot: string): string {
  return slot.split('-').map(h => `${h}시`).join('-')
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수 누락' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let body: { tenant_id?: string; dry_run?: boolean; force?: boolean } = {}
  try { body = await req.json() } catch { /* 빈 바디 허용 */ }
  const { tenant_id, dry_run = false, force = false } = body

  const isCronMode = !tenant_id && !force

  // ── 호출자 인증 ──────────────────────────────────────────────────────────
  // cron 모드: GitHub Actions가 전용 비밀 헤더(x-cron-secret)를 실어 호출
  // 수동/강제 모드: 로그인한 사용자의 JWT로 본인 권한 확인
  if (isCronMode) {
    const cronSecret = Deno.env.get('CRON_SECRET')
    const providedSecret = req.headers.get('x-cron-secret')
    if (!cronSecret || providedSecret !== cronSecret) {
      return new Response(
        JSON.stringify({ error: '인증 실패' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
  } else {
    const authHeader = req.headers.get('Authorization')
    const callerToken = authHeader?.replace(/^Bearer\s+/i, '') ?? ''
    if (!callerToken) {
      return new Response(
        JSON.stringify({ error: '인증 필요' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const { data: { user: caller }, error: callerErr } = await supabase.auth.getUser(callerToken)
    if (callerErr || !caller) {
      return new Response(
        JSON.stringify({ error: '인증 실패' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: callerProfile } = await supabase
      .from('profiles').select('is_super_admin').eq('id', caller.id).single()
    const isSuperAdmin = callerProfile?.is_super_admin === true

    if (force) {
      if (!isSuperAdmin) {
        return new Response(
          JSON.stringify({ error: '권한 없음' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    } else {
      const { data: callerMember } = await supabase
        .from('tenant_members').select('role')
        .eq('tenant_id', tenant_id).eq('user_id', caller.id).eq('is_approved', true).maybeSingle()
      if (!isSuperAdmin && callerMember?.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: '권한 없음' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }
  }

  const seoulHHMM = isCronMode ? getCurrentSeoulHHMM() : null

  let settingsQuery = supabase
    .from('notification_settings')
    .select('*, tenant:tenants(id, name, settings)')
    .eq('is_enabled', true)

  if (tenant_id) {
    settingsQuery = settingsQuery.eq('tenant_id', tenant_id)
  } else if (isCronMode && seoulHHMM) {
    settingsQuery = settingsQuery.eq('send_time', seoulHHMM)
  }

  const { data: settings, error: settingsErr } = await settingsQuery
  if (settingsErr) {
    return new Response(
      JSON.stringify({ error: settingsErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { year, month, day, dateStr } = getTomorrowSeoul()
  const dateLabel = formatDateLabel(year, month, day)

  console.log(`[send-reminders] mode=${isCronMode ? 'cron' : force ? 'force' : 'manual'} tomorrow=${dateStr} settings=${settings?.length ?? 0}`)

  let totalSent = 0
  let totalFailed = 0
  const orgs: Array<{ org: string; sent: number; failed: number; skipped: number }> = []

  for (const setting of settings ?? []) {
    const tenantData = setting.tenant as { id: string; name: string; settings?: { tenant_mode?: string } } | null
    const tenantName = tenantData?.name ?? setting.tenant_id

    // 비회원(방문자 예약) 모드는 배정에 계정이 연결되지 않아 리마인더 대상이 될 수 없음
    if (tenantData?.settings?.tenant_mode === '비회원') continue

    const { data: assignments, error: assignErr } = await supabase
      .from('assignments')
      .select('user_id, time_slot')
      .eq('tenant_id', setting.tenant_id)
      .eq('year', year).eq('month', month).eq('day', day)
      .not('user_id', 'is', null)

    if (assignErr) console.error(`[send-reminders] tenant_id=${setting.tenant_id} assignErr=${assignErr.message}`)

    if (assignErr) { orgs.push({ org: tenantName, sent: 0, failed: 0, skipped: 1 }); continue }
    if (!assignments?.length) { orgs.push({ org: tenantName, sent: 0, failed: 0, skipped: 0 }); continue }

    const userIds = new Set<string>()
    if (setting.recipients?.assigned_members) {
      for (const a of assignments) { if (a.user_id) userIds.add(a.user_id) }
    }
    if (setting.recipients?.admins) {
      const { data: admins } = await supabase
        .from('tenant_members').select('user_id')
        .eq('tenant_id', setting.tenant_id).eq('role', 'admin').eq('is_approved', true)
      for (const a of admins ?? []) { if (a.user_id) userIds.add(a.user_id) }
    }

    let orgSent = 0
    let orgFailed = 0

    const allDaySlots = [...new Set(
      assignments.map(a => a.time_slot).filter(Boolean),
    )].sort().map(formatSlot).join(', ')

    const { data: profilesData } = await supabase
      .from('profiles').select('id, name').in('id', [...userIds])
    const nameMap = new Map<string, string>(
      (profilesData ?? []).map(p => [p.id as string, p.name as string]),
    )

    for (const userId of userIds) {
      const userSlots = assignments
        .filter(a => a.user_id === userId)
        .map(a => a.time_slot).filter(Boolean).sort().map(formatSlot).join(', ')
      const slotLabel = userSlots || allDaySlots || '미정'
      const userName = nameMap.get(userId) ?? ''
      const title = '📅 내일 배정 알림'
      const bodyText = renderTemplate(
        setting.msg_template ?? '안녕하세요 {{name}}님! 내일 {{date}} {{slot}} 배정이 있습니다. ({{org}})',
        { date: dateLabel, slot: slotLabel, org: tenantName, name: userName },
      )

      if (dry_run) continue

      // 인앱 알림 INSERT
      const { error: insertErr } = await supabase.from('notifications').insert({
        tenant_id: setting.tenant_id, user_id: userId,
        title, body: bodyText, type: 'd1_reminder',
        metadata: { date: dateStr, slot: slotLabel },
      })
      if (insertErr) {
        console.error(`[send-reminders] tenant_id=${setting.tenant_id} insert failed: ${insertErr.message}`)
        orgFailed++; continue
      }
      orgSent++

      // FCM Android 푸시
      const { error: fcmErr } = await supabase.functions.invoke('send-fcm-push', {
        body: { user_id: userId, title, body: bodyText },
      })
      if (fcmErr) {
        console.error(`[send-reminders] FCM 실패 tenant_id=${setting.tenant_id} user=${userId}: ${fcmErr.message}`)
      }
    }

    orgs.push({ org: tenantName, sent: orgSent, failed: orgFailed, skipped: 0 })
    totalSent += orgSent
    totalFailed += orgFailed
  }

  console.log(`[send-reminders] DONE totalSent=${totalSent} totalFailed=${totalFailed} orgCount=${orgs.length}`)
  return new Response(
    JSON.stringify({
      sent: totalSent, failed: totalFailed, orgs,
      mode: isCronMode ? 'cron' : force ? 'force-all' : 'manual',
      send_time_filter: isCronMode ? seoulHHMM : null,
      dry_run,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
