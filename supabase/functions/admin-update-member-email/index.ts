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

    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: { user: caller }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !caller) return json({ error: '인증 실패' }, 401, corsHeaders)

    const { user_id, email, tenant_id } = await req.json()

    if (!user_id || !email || !tenant_id) {
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

    // auth.users 이메일 업데이트
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, { email })
    if (authErr) {
      console.error(`[admin-update-member-email] auth update failed: ${authErr.message}`)
      return json({ error: '이메일 변경에 실패했습니다.' }, 500, corsHeaders)
    }

    // profiles 이메일 업데이트
    const { error: profileErr } = await supabaseAdmin
      .from('profiles').update({ email }).eq('id', user_id)
    if (profileErr) {
      console.error(`[admin-update-member-email] profile update failed: ${profileErr.message}`)
      return json({ error: '프로필 이메일 갱신에 실패했습니다.' }, 500, corsHeaders)
    }

    return json({ success: true }, 200, corsHeaders)
  } catch (err) {
    console.error(`[admin-update-member-email] unhandled error: ${err instanceof Error ? err.message : String(err)}`)
    return json({ error: '서버 오류가 발생했습니다.' }, 500, corsHeaders)
  }
})
