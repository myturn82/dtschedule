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

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: '인증 필요' }, 401, corsHeaders)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !user) return json({ error: '인증 실패' }, 401, corsHeaders)

    await supabaseAdmin.from('tenant_members').delete().eq('user_id', user.id)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (error) return json({ error: '계정 삭제에 실패했습니다.' }, 500, corsHeaders)

    return json({ success: true }, 200, corsHeaders)
  } catch (_err) {
    return json({ error: '서버 오류가 발생했습니다.' }, 500, corsHeaders)
  }
})
