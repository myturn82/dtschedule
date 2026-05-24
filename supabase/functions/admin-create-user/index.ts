import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const isAllowed = allowed.length === 0 || allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function json(body: unknown, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: '인증 필요' }, 401, corsHeaders)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // JWT 검증 — getUser()는 Supabase Auth에서 직접 검증
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller }, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !caller) return json({ error: '인증 실패' }, 401, corsHeaders)

    const { email, password, name, role_id, tenant_id } = await req.json()

    if (!email || !password || !name || !tenant_id) {
      return json({ error: '필수 항목 누락' }, 400, corsHeaders)
    }

    // 권한 확인: super_admin 또는 해당 테넌트의 승인된 admin만 허용
    // global profiles.role은 사용자가 조작 가능하므로 사용하지 않음
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('is_super_admin').eq('id', caller.id).single()
    const { data: callerMember } = await supabaseAdmin
      .from('tenant_members').select('role')
      .eq('tenant_id', tenant_id).eq('user_id', caller.id).eq('is_approved', true).single()

    const isAuthorized = callerProfile?.is_super_admin === true || callerMember?.role === 'admin'
    if (!isAuthorized) return json({ error: '권한 없음' }, 403, corsHeaders)

    // 신규 유저 생성
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createError) {
      const msg = createError.message.includes('already registered')
        ? '이미 사용 중인 이메일입니다.'
        : '계정 생성에 실패했습니다.'
      return json({ error: msg }, 400, corsHeaders)
    }

    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      name,
      email,
      role: 'volunteer',
      is_approved: false,
      is_super_admin: false,
    })
    if (profileErr) return json({ error: '프로필 생성 오류' }, 500, corsHeaders)

    const { error: memberErr } = await supabaseAdmin.from('tenant_members').upsert({
      tenant_id,
      user_id: newUser.user.id,
      role: 'member',
      role_id: role_id ?? null,
      is_approved: true,
    }, { onConflict: 'tenant_id,user_id' })
    if (memberErr) return json({ error: '조직 등록 오류' }, 500, corsHeaders)

    return json({ success: true }, 200, corsHeaders)
  } catch (_err) {
    return json({ error: '서버 오류가 발생했습니다.' }, 500, corsHeaders)
  }
})
