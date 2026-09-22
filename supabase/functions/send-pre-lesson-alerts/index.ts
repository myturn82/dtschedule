import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// ── 서울 시간 헬퍼 ────────────────────────────────────────────────────────────

function getSeoulDateAndMinutes(ms: number): { dateStr: string; totalMinutes: number } {
  const d = new Date(ms)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`
  const totalMinutes = parseInt(get('hour')) * 60 + parseInt(get('minute'))
  return { dateStr, totalMinutes }
}

// totalMinutes → time_slot prefix
// 30분 경계가 아니면 '__no_slot__' 반환 → 어떤 슬롯과도 매칭되지 않음
// 예: 600 (10:00) → '10-'   630 (10:30) → '10.5-'   631 (10:31) → '__no_slot__'
function minutesToSlotPrefix(totalMinutes: number): string {
  if (totalMinutes % 30 !== 0) return '__no_slot__'
  const intHour = Math.floor(totalMinutes / 60)
  return totalMinutes % 60 === 0 ? `${intHour}-` : `${intHour}.5-`
}

// 슬롯 prefix → 한국어 시간 표기: '10-' → '10시',  '10.5-' → '10시 30분'
function slotPrefixToLabel(prefix: string): string {
  const hour = Number(prefix.replace('-', ''))
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return m === 0 ? `${h}시` : `${h}시 ${m}분`
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl    = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 인증 ─────────────────────────────────────────────────────────────────
  // cron 호출: x-cron-secret 헤더
  // 수동 테스트: 슈퍼관리자 JWT
  const cronSecret = Deno.env.get('CRON_SECRET')
  const providedSecret = req.headers.get('x-cron-secret')
  const isCronCall = !!(cronSecret && providedSecret === cronSecret)

  if (!isCronCall) {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(JSON.stringify({ error: '인증 필요' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: '인증 실패' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const { data: profile } = await supabase
      .from('profiles').select('is_super_admin').eq('id', user.id).single()
    if (!profile?.is_super_admin) {
      return new Response(JSON.stringify({ error: '슈퍼관리자 전용' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // ── 요청 바디 파싱 ────────────────────────────────────────────────────────
  let body: { dry_run?: boolean; tenant_id?: string } = {}
  try { body = await req.json() } catch { /* 빈 바디 허용 */ }
  const { dry_run = false, tenant_id } = body

  // ── pre_lesson_alert_enabled 조직 목록 조회 ───────────────────────────────
  let settingsQuery = supabase
    .from('notification_settings')
    .select('tenant_id, pre_lesson_alert_minutes, pre_lesson_alert_message, tenant:tenants(name)')
    .eq('pre_lesson_alert_enabled', true)
  if (tenant_id) settingsQuery = settingsQuery.eq('tenant_id', tenant_id)

  const { data: settings, error: settingsErr } = await settingsQuery
  if (settingsErr) {
    return new Response(JSON.stringify({ error: settingsErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const now = Date.now()
  let totalSent = 0
  let totalFailed = 0
  const results: Array<{ org: string; sent: number; failed: number; reason?: string }> = []

  for (const setting of settings ?? []) {
    const tenantName = (setting.tenant as { name: string } | null)?.name ?? setting.tenant_id
    const alertMinutes: number = setting.pre_lesson_alert_minutes ?? 10

    // ── 대상 슬롯 계산 ──────────────────────────────────────────────────────
    const targetMs = now + alertMinutes * 60_000
    const { dateStr: targetDate, totalMinutes: targetTotalMinutes } = getSeoulDateAndMinutes(targetMs)
    const slotPrefix = minutesToSlotPrefix(targetTotalMinutes)

    // 30분 경계가 아닌 분에는 아무것도 하지 않음 (dry_run은 설정 활성 여부만 확인)
    if (slotPrefix === '__no_slot__') {
      if (dry_run) results.push({ org: tenantName, sent: 0, failed: 0, reason: 'no_slot_boundary' })
      continue
    }

    const [y, m, d] = targetDate.split('-').map(Number)

    // ── 해당 슬롯 배정 존재 여부 확인 ───────────────────────────────────────
    const { data: assignments, error: assignErr } = await supabase
      .from('assignments')
      .select('user_id, profiles(name)')
      .eq('tenant_id', setting.tenant_id)
      .eq('year', y).eq('month', m).eq('day', d)
      .like('time_slot', `${slotPrefix}%`)

    if (assignErr) {
      console.error(`[pre-lesson] assignments 조회 실패 tenant=${setting.tenant_id}: ${assignErr.message}`)
      results.push({ org: tenantName, sent: 0, failed: 0, reason: 'assign_error' })
      continue
    }
    if (!assignments?.length) {
      results.push({ org: tenantName, sent: 0, failed: 0, reason: 'no_assignments' })
      continue
    }

    if (dry_run) {
      results.push({ org: tenantName, sent: 0, failed: 0, reason: 'dry_run' })
      continue
    }

    // ── 중복 방지: 이미 발송한 슬롯이면 skip ────────────────────────────────
    const { error: logErr } = await supabase
      .from('pre_lesson_alert_log')
      .insert({ tenant_id: setting.tenant_id, alert_date: targetDate, time_slot: slotPrefix })

    if (logErr) {
      // unique violation(23505) = 이미 발송됨
      if (logErr.code === '23505') {
        results.push({ org: tenantName, sent: 0, failed: 0, reason: 'already_sent' })
      } else {
        console.error(`[pre-lesson] log insert 실패 tenant=${setting.tenant_id}: ${logErr.message}`)
        results.push({ org: tenantName, sent: 0, failed: 0, reason: 'log_error' })
      }
      continue
    }

    // ── 알림 메시지 구성 ────────────────────────────────────────────────────
    const slotLabel = slotPrefixToLabel(slotPrefix)
    const memberNames = assignments
      .map(a => (a.profiles as { name: string } | null)?.name ?? '')
      .filter(Boolean)
      .join(', ')
    const title = '🔔 레슨 시작 전 알림'
    const customTemplate = (setting as { pre_lesson_alert_message?: string | null }).pre_lesson_alert_message
    const defaultTemplate = '{{time}} 레슨이 {{minutes}}분 후 시작됩니다. ({{members}})'
    const bodyText = (customTemplate?.trim() || defaultTemplate)
      .replace(/\{\{time\}\}/g, slotLabel)
      .replace(/\{\{minutes\}\}/g, String(alertMinutes))
      .replace(/\{\{members\}\}/g, memberNames)

    // ── 수신 대상: 조직 관리자 + 슈퍼관리자 (중복 제거) ─────────────────────
    const [{ data: tenantAdmins }, { data: superAdmins }] = await Promise.all([
      supabase
        .from('tenant_members')
        .select('user_id')
        .eq('tenant_id', setting.tenant_id)
        .eq('role', 'admin')
        .eq('is_approved', true),
      supabase
        .from('profiles')
        .select('id')
        .eq('is_super_admin', true),
    ])

    const adminUserIds = [
      ...new Set([
        ...(tenantAdmins ?? []).map(a => a.user_id as string),
        ...(superAdmins ?? []).map(a => a.id as string),
      ]),
    ]
    const admins = adminUserIds.map(user_id => ({ user_id }))

    let orgSent = 0
    let orgFailed = 0

    for (const admin of admins ?? []) {
      // 인앱 알림 INSERT (Realtime으로 벨 아이콘 즉시 갱신)
      await supabase.from('notifications').insert({
        tenant_id: setting.tenant_id,
        user_id:   admin.user_id,
        title,
        body:      bodyText,
        type:      'pre_lesson',
        metadata:  { date: targetDate, slot: slotPrefix.replace('-', '') },
      })

      // Android FCM 푸시 (기존 send-fcm-push 재활용)
      const { error: fcmErr } = await supabase.functions.invoke('send-fcm-push', {
        body: { user_id: admin.user_id, title, body: bodyText },
      })

      if (fcmErr) {
        console.error(`[pre-lesson] FCM 실패 tenant=${setting.tenant_id} user=${admin.user_id}: ${fcmErr.message}`)
        orgFailed++
      } else {
        orgSent++
      }
    }

    results.push({ org: tenantName, sent: orgSent, failed: orgFailed })
    totalSent  += orgSent
    totalFailed += orgFailed
  }

  console.log(`[pre-lesson-alerts] sent=${totalSent} failed=${totalFailed} orgs=${results.length}`)
  return new Response(
    JSON.stringify({ sent: totalSent, failed: totalFailed, results, dry_run }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
