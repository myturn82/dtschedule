import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 요청자가 해당 테넌트의 admin인지 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: '인증 필요' }, 401)

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await supabaseUser.auth.getUser()
    if (!caller) return json({ error: '인증 실패' }, 401)

    const { email, password, name, role_id, tenant_id } = await req.json()

    if (!email || !password || !name || !tenant_id) {
      return json({ error: '필수 항목 누락' }, 400)
    }

    // 호출자 권한 확인 (super_admin, admin, team_leader 허용)
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('role, is_super_admin').eq('id', caller.id).single()
    const { data: callerMember } = await supabaseAdmin
      .from('tenant_members').select('role').eq('tenant_id', tenant_id).eq('user_id', caller.id).single()

    const isAuthorized = callerProfile?.is_super_admin ||
      callerProfile?.role === 'admin' ||
      callerProfile?.role === 'team_leader' ||
      callerMember?.role === 'admin'

    if (!isAuthorized) return json({ error: '권한 없음' }, 403)

    // 유저 생성 (이메일 인증 없이)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createError) {
      const msg = createError.message.includes('already registered')
        ? '이미 사용 중인 이메일입니다.'
        : createError.message
      return json({ error: msg }, 400)
    }

    // profiles 레코드 생성/업데이트
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: newUser.user.id,
      name,
      email,
      role: 'volunteer',
    })
    if (profileErr) return json({ error: `프로필 생성 오류: ${profileErr.message}` }, 500)

    // tenant_members 추가
    const { error: memberErr } = await supabaseAdmin.from('tenant_members').upsert({
      tenant_id,
      user_id: newUser.user.id,
      role: 'member',
      role_id: role_id ?? null,
    }, { onConflict: 'tenant_id,user_id' })
    if (memberErr) return json({ error: `조직 등록 오류: ${memberErr.message}` }, 500)

    return json({ success: true })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
