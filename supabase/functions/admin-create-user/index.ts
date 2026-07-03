import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

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

    // JWT 검증 — admin 클라이언트로 토큰 직접 검증
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: { user: caller }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !caller) return json({ error: '인증 실패' }, 401, corsHeaders)

    const { email, password, name, role_id, tenant_id } = await req.json()

    if (!email || !password || !name || !tenant_id) {
      return json({ error: '필수 항목 누락' }, 400, corsHeaders)
    }

    // 권한 확인: super_admin 또는 해당 테넌트의 승인된 admin만 허용
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles').select('is_super_admin').eq('id', caller.id).single()
    const { data: callerMember } = await supabaseAdmin
      .from('tenant_members').select('role')
      .eq('tenant_id', tenant_id).eq('user_id', caller.id).eq('is_approved', true).single()

    const isAuthorized = callerProfile?.is_super_admin === true || callerMember?.role === 'admin'
    if (!isAuthorized) return json({ error: '권한 없음' }, 403, corsHeaders)

    // 이메일로 기존 유저 조회 (삭제 후 재등록 케이스 처리)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    let userId: string

    if (existingProfile) {
      // 기존 유저 — 비밀번호 갱신 후 tenant_members에 추가
      userId = existingProfile.id
      const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: { name },
      })
      if (pwErr) {
        console.error(`[admin-create-user] updateUserById failed: ${pwErr.message}`)
        return json({ error: '정보 갱신에 실패했습니다.' }, 500, corsHeaders)
      }

      const { error: profileUpdateErr } = await supabaseAdmin
        .from('profiles')
        .update({ name })
        .eq('id', userId)
      if (profileUpdateErr) {
        console.error(`[admin-create-user] profile update failed: ${profileUpdateErr.message}`)
        return json({ error: '프로필 갱신에 실패했습니다.' }, 500, corsHeaders)
      }
    } else {
      // 신규 유저 생성
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      })
      if (createError) {
        console.error(`[admin-create-user] createUser failed: ${createError.message}`)
        return json({ error: '계정 생성에 실패했습니다.' }, 500, corsHeaders)
      }

      userId = newUser.user.id

      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        name,
        email,
        is_approved: false,
        is_super_admin: false,
      })
      if (profileErr) {
        console.error(`[admin-create-user] profile create failed: ${profileErr.message}`)
        return json({ error: '프로필 생성에 실패했습니다.' }, 500, corsHeaders)
      }
    }

    const { error: memberErr } = await supabaseAdmin.from('tenant_members').upsert({
      tenant_id,
      user_id: userId,
      role: 'member',
      role_id: role_id ?? null,
      is_approved: true,
    }, { onConflict: 'tenant_id,user_id' })
    if (memberErr) {
      console.error(`[admin-create-user] tenant_members upsert failed: ${memberErr.message}`)
      return json({ error: '조직 등록에 실패했습니다.' }, 500, corsHeaders)
    }

    return json({ success: true }, 200, corsHeaders)
  } catch (err) {
    console.error(`[admin-create-user] unhandled error: ${err instanceof Error ? err.message : String(err)}`)
    return json({ error: '서버 오류가 발생했습니다.' }, 500, corsHeaders)
  }
})
