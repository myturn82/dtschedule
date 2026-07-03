import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── WebCrypto 네이티브 Web Push 구현 ────────────────────────────────────────

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4)
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

function bytesToB64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function strToB64url(str: string): string {
  return bytesToB64url(new TextEncoder().encode(str))
}

async function hkdfSha256(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const saltKey = await crypto.subtle.importKey(
    'raw', salt.length ? salt : new Uint8Array(32),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm))

  const prkKey = await crypto.subtle.importKey(
    'raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const t1Input = new Uint8Array(info.length + 1)
  t1Input.set(info)
  t1Input[info.length] = 0x01
  const t1 = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, t1Input))
  return t1.slice(0, length)
}

async function encryptWebPushPayload(
  plaintext: string,
  p256dhBase64: string,
  authBase64: string,
): Promise<Uint8Array> {
  const receiverPublic = b64urlToBytes(p256dhBase64)
  const authSecret = b64urlToBytes(authBase64)

  // ephemeral 발신자 키 생성
  const senderKP = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  )
  const senderPubJwk = await crypto.subtle.exportKey('jwk', senderKP.publicKey)
  const senderPublic = new Uint8Array(65)
  senderPublic[0] = 0x04
  senderPublic.set(b64urlToBytes(senderPubJwk.x!), 1)
  senderPublic.set(b64urlToBytes(senderPubJwk.y!), 33)

  // ECDH 공유 비밀
  const receiverKey = await crypto.subtle.importKey(
    'raw', receiverPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  )
  const ecdhBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: receiverKey }, senderKP.privateKey, 256,
  )
  const ecdhSecret = new Uint8Array(ecdhBits)

  // RFC 8291: IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\x00"||recvPub||senderPub, L=32)
  const authInfoLabel = new TextEncoder().encode('WebPush: info\x00')
  const authInfo = new Uint8Array(authInfoLabel.length + receiverPublic.length + senderPublic.length)
  authInfo.set(authInfoLabel, 0)
  authInfo.set(receiverPublic, authInfoLabel.length)
  authInfo.set(senderPublic, authInfoLabel.length + receiverPublic.length)
  const ikm = await hkdfSha256(authSecret, ecdhSecret, authInfo, 32)

  // 메시지 salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // CEK, nonce 유도
  const cek = await hkdfSha256(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\x00'), 16)
  const nonce = await hkdfSha256(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\x00'), 12)

  // AES-128-GCM 암호화 (plaintext + 0x02 패딩 구분자)
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt'])
  const plaintextBytes = new TextEncoder().encode(plaintext)
  const paddedPlain = new Uint8Array(plaintextBytes.length + 1)
  paddedPlain.set(plaintextBytes)
  paddedPlain[plaintextBytes.length] = 0x02
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPlain))

  // aes128gcm 헤더: salt(16) + rs(4) + idlen(1) + senderPublic(65) + ciphertext
  const rs = 4096
  const result = new Uint8Array(16 + 4 + 1 + 65 + ciphertext.length)
  let off = 0
  result.set(salt, off); off += 16
  result[off++] = (rs >> 24) & 0xff
  result[off++] = (rs >> 16) & 0xff
  result[off++] = (rs >> 8) & 0xff
  result[off++] = rs & 0xff
  result[off++] = 65
  result.set(senderPublic, off); off += 65
  result.set(ciphertext, off)
  return result
}

async function sendWebPush(
  endpoint: string,
  p256dhBase64: string,
  authBase64: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string,
  payload?: string,
): Promise<{ status: number; text: string }> {
  // VAPID JWT 생성 (ES256)
  const pubBytes = b64urlToBytes(vapidPublic)
  const x = bytesToB64url(pubBytes.slice(1, 33))
  const y = bytesToB64url(pubBytes.slice(33, 65))

  const signingKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: vapidPrivate, x, y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  const audience = new URL(endpoint).origin
  const now = Math.floor(Date.now() / 1000)
  const jwtHeader = strToB64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const jwtPayload = strToB64url(JSON.stringify({ aud: audience, exp: now + 43200, sub: vapidSubject }))
  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    new TextEncoder().encode(`${jwtHeader}.${jwtPayload}`),
  )
  const sig = bytesToB64url(new Uint8Array(sigBytes))
  const jwt = `${jwtHeader}.${jwtPayload}.${sig}`

  const headers: Record<string, string> = {
    'Authorization': `vapid t=${jwt},k=${vapidPublic}`,
    'TTL': '86400',
  }

  let body: Uint8Array | undefined
  if (payload) {
    body = await encryptWebPushPayload(payload, p256dhBase64, authBase64)
    headers['Content-Type'] = 'application/octet-stream'
    headers['Content-Encoding'] = 'aes128gcm'
    headers['Content-Length'] = String(body.length)
  }

  const res = await fetch(endpoint, { method: 'POST', headers, body })
  const text = await res.text()
  return { status: res.status, text }
}

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

  const webPushEnabled = !!(vapidPublic && vapidPrivate && vapidSubject)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let body: { tenant_id?: string; dry_run?: boolean; force?: boolean; test_empty?: boolean } = {}
  try { body = await req.json() } catch { /* 빈 바디 허용 */ }
  const { tenant_id, dry_run = false, force = false, test_empty = false } = body

  const isCronMode = !tenant_id && !force

  // ── 호출자 인증 ──────────────────────────────────────────────────────────
  // cron 모드: GitHub Actions가 전용 비밀 헤더(x-cron-secret)를 실어 호출 (워크플로우 참고)
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

  console.log(`[send-reminders] mode=${isCronMode ? 'cron' : force ? 'force' : 'manual'} tomorrow=${dateStr} settings=${settings?.length ?? 0} webPush=${webPushEnabled} vapidPub=${vapidPublic?.slice(0, 10)} vapidPriv=${vapidPrivate?.slice(0, 5)}`)

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

    console.log(`[send-reminders] org=${tenantName} assignErr=${assignErr?.message ?? 'none'} assignments=${assignments?.length ?? 0}`)

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

    console.log(`[send-reminders] org=${tenantName} userIds=${userIds.size}`)

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
      const url = `/schedule?date=${dateStr}`

      if (dry_run) continue

      const { error: insertErr } = await supabase.from('notifications').insert({
        tenant_id: setting.tenant_id, user_id: userId,
        title, body: bodyText, type: 'd1_reminder',
        metadata: { date: dateStr, slot: slotLabel },
      })
      console.log(`[send-reminders] insert userId=${userId} err=${insertErr?.message ?? 'ok'}`)
      if (insertErr) { orgFailed++; continue }
      orgSent++

      if (webPushEnabled) {
        const { data: subs, error: subsErr } = await supabase
          .from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', userId)

        console.log(`[send-reminders] push userId=${userId} subsErr=${subsErr?.message ?? 'none'} subs=${subs?.length ?? 0}`)

        for (const sub of subs ?? []) {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) continue
          try {
            const pushPayload = test_empty ? undefined : JSON.stringify({ title, body: bodyText, url })
            const { status, text } = await sendWebPush(
              sub.endpoint, sub.p256dh, sub.auth,
              vapidPublic!, vapidPrivate!, vapidSubject!,
              pushPayload,
            )
            console.log(`[send-reminders] push userId=${userId} fcmStatus=${status} fcmBody=${text.slice(0, 50)}`)
            if (status === 410 || status === 404) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
          } catch (pushErr: unknown) {
            console.error(`[send-reminders] push ERROR userId=${userId} err=${String(pushErr).slice(0, 100)}`)
          }
        }
      }
    }

    orgs.push({ org: tenantName, sent: orgSent, failed: orgFailed, skipped: 0 })
    totalSent += orgSent
    totalFailed += orgFailed
  }

  console.log(`[send-reminders] DONE totalSent=${totalSent} totalFailed=${totalFailed} orgs=${JSON.stringify(orgs)}`)
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
