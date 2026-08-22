import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// ── Google 서비스 계정 → OAuth 2.0 액세스 토큰 ────────────────────────────

function pemToBytes(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const bin = atob(b64)
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

function b64url(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? data : String.fromCharCode(...data)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }))

  const signingInput = `${header}.${payload}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(sa.private_key).buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput),
  )
  const jwt = `${signingInput}.${b64url(new Uint8Array(sigBytes))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

// ── FCM HTTP v1 단건 발송 ─────────────────────────────────────────────────

async function sendFcm(
  token: string,
  title: string,
  body: string,
  projectId: string,
  accessToken: string,
): Promise<{ ok: boolean; stale: boolean }> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          android: {
            priority: 'high',
            notification: { channel_id: 'default', sound: 'default' },
          },
        },
      }),
    },
  )
  if (res.ok) return { ok: true, stale: false }

  const err = await res.json().catch(() => ({}))
  const code: string = err?.error?.details?.[0]?.errorCode ?? ''
  console.error(`[send-fcm-push] FCM error token=${token.slice(0, 20)}… code=${code} status=${res.status}`)
  return { ok: false, stale: ['UNREGISTERED', 'INVALID_ARGUMENT'].includes(code) }
}

// ── 메인 핸들러 ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
  const projectId          = Deno.env.get('FIREBASE_PROJECT_ID')

  if (!serviceAccountJson || !projectId) {
    return new Response(
      JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT_JSON 또는 FIREBASE_PROJECT_ID 환경변수 누락' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  type Payload = { user_id?: string; title?: string; body?: string }
  let raw: Payload & { record?: Payload } = {}
  try { raw = await req.json() } catch { /* empty body */ }

  // Database Webhook: { type, record: {...} }  /  직접 호출: { user_id, title, body }
  const payload = raw.record ?? raw
  const { user_id, title, body: bodyText } = payload
  if (!user_id || !title || !bodyText) {
    return new Response(
      JSON.stringify({ error: 'user_id, title, body 필드 필수' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 해당 유저의 FCM 토큰 목록 조회
  const { data: tokenRows, error: tokensErr } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', user_id)

  if (tokensErr) {
    return new Response(
      JSON.stringify({ error: tokensErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
  if (!tokenRows?.length) {
    return new Response(
      JSON.stringify({ sent: 0, reason: 'no_tokens' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // OAuth 액세스 토큰 발급 (1회, 모든 기기 공용)
  let accessToken: string
  try {
    accessToken = await getAccessToken(serviceAccountJson)
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `OAuth 실패: ${e instanceof Error ? e.message : 'unknown'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  let sent = 0
  let failed = 0
  const staleTokens: string[] = []

  for (const { token } of tokenRows) {
    try {
      const { ok, stale } = await sendFcm(token, title, bodyText, projectId, accessToken)
      if (ok) {
        sent++
      } else {
        if (stale) staleTokens.push(token)
        failed++
      }
    } catch (e) {
      failed++
      console.error(`[send-fcm-push] 예외: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // 만료된 토큰 자동 정리
  if (staleTokens.length) {
    await supabase.from('push_tokens').delete().in('token', staleTokens)
    console.log(`[send-fcm-push] stale tokens removed: ${staleTokens.length}`)
  }

  console.log(`[send-fcm-push] user_id=${user_id} sent=${sent} failed=${failed}`)
  return new Response(
    JSON.stringify({ sent, failed }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
