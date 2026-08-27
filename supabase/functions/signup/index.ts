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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      email, password, name, role,
      tenant_id, tenant_role_id, phone,
      terms_agreed_at, privacy_agreed_at,
      auto_approve,
      create_org, org_name, org_phone, tenant_settings, default_roles, source_vertical,
      redirect_to,
      lesson_types,
    } = await req.json()

    if (!email || !password || !name) {
      return json({ error: '필수 항목 누락' }, 400, corsHeaders)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const isDevMode = Deno.env.get('ALLOW_DEV_AUTO_APPROVE') === 'true'
    const now = new Date().toISOString()

    let userId: string

    if (isDevMode && !!auto_approve) {
      // DEV: admin API로 이메일 인증 우회
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          role: role ?? 'volunteer',
          terms_agreed_at: terms_agreed_at ?? now,
          privacy_agreed_at: privacy_agreed_at ?? now,
          ...(tenant_id && !create_org ? { tenant_id } : {}),
          ...(tenant_role_id ? { tenant_role_id } : {}),
          ...(phone ? { phone } : {}),
        },
      })
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return json({ error: '이미 가입된 이메일입니다. 로그인 후 재신청해 주세요.' }, 409, corsHeaders)
        }
        console.error(`[signup] DEV createUser failed: ${error.message}`)
        return json({ error: '계정 생성에 실패했습니다.' }, 500, corsHeaders)
      }
      userId = newUser.user.id
    } else {
      // 프로덕션: anon 클라이언트로 signUp → Resend를 통해 인증 메일 자동 발송
      const supabaseAnon = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      )
      const { data: signUpData, error } = await supabaseAnon.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirect_to ?? undefined,
          data: {
            name,
            role: role ?? 'volunteer',
            terms_agreed_at: terms_agreed_at ?? now,
            privacy_agreed_at: privacy_agreed_at ?? now,
            ...(tenant_id && !create_org ? { tenant_id } : {}),
            ...(tenant_role_id ? { tenant_role_id } : {}),
            ...(phone ? { phone } : {}),
          },
        },
      })
      if (error) {
        if (error.status === 429) return json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429, corsHeaders)
        if (error.message === 'User already registered') return json({ error: '이미 가입된 이메일입니다. 로그인 후 재신청해 주세요.' }, 409, corsHeaders)
        console.error(`[signup] signUp failed: ${error.message}`)
        return json({ error: '계정 생성에 실패했습니다.' }, 500, corsHeaders)
      }
      if (!signUpData.user) {
        return json({ error: '계정 생성에 실패했습니다.' }, 500, corsHeaders)
      }
      if (signUpData.user.identities?.length === 0) {
        return json({ error: '이미 가입된 이메일입니다. 로그인 후 재신청해 주세요.' }, 409, corsHeaders)
      }
      userId = signUpData.user.id
    }

    // 트리거(handle_new_user)가 profiles·tenant_members를 생성할 시간을 확보
    await new Promise(r => setTimeout(r, 300))

    // ── 서비스 + 조직 일괄 생성 (DEV & 프로덕션 공통) ────────────────────────
    if (create_org && org_name) {
      // 1. customer 생성
      const { data: custData, error: custErr } = await supabaseAdmin
        .from('customers')
        .insert({ name: org_name, owner_user_id: userId, plan: 'basic' })
        .select('id').single()
      if (custErr || !custData) {
        console.error(`[signup] customer create failed: ${custErr?.message}`)
        return json({ error: '서비스 생성에 실패했습니다.' }, 500, corsHeaders)
      }

      // 전화번호 암호화 저장
      if (org_phone) {
        await supabaseAdmin.rpc('update_customer_phone_enc', { p_customer_id: custData.id, p_phone: org_phone })
      }

      // 2. tenant 생성
      const newTenantId = crypto.randomUUID()
      const rawSlug = (org_name as string)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'org'
      const baseSlug = rawSlug.slice(0, 34).replace(/-+$/, '') || 'org'
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`
      // DEV 원스텝 생성은 위자드 불필요 — setup_completed_at 미리 설정
      const finalSettings = {
        ...(tenant_settings ?? {}),
        ...(isDevMode && auto_approve ? { setup_completed_at: now } : {}),
      }
      const { error: tenantErr } = await supabaseAdmin.from('tenants').insert({
        id: newTenantId, slug, name: org_name,
        customer_id: custData.id, is_active: true,
        settings: finalSettings,
        ...(source_vertical ? { source_vertical } : {}),
      })
      if (tenantErr) {
        console.error(`[signup] tenant create failed: ${tenantErr.message}`)
        return json({ error: '조직 생성에 실패했습니다.' }, 500, corsHeaders)
      }

      // 3. 기본 역할 생성 (string[] 또는 object[] 모두 처리)
      if (Array.isArray(default_roles) && default_roles.length > 0) {
        await supabaseAdmin.from('tenant_roles').insert(
          (default_roles as any[]).map((r: any, i: number) => {
            if (typeof r === 'string') {
              return { tenant_id: newTenantId, name: r, display_order: i }
            }
            return {
              tenant_id: newTenantId,
              name: r.name,
              split_cell: r.split_cell ?? false,
              indicator_bar: r.indicator_bar ?? false,
              display_order: r.display_order ?? i,
            }
          })
        )
      }

      // 3b. 레슨권 종류 생성
      if (Array.isArray(lesson_types) && lesson_types.length > 0) {
        await supabaseAdmin.from('lesson_package_types').insert(
          (lesson_types as any[]).map((lt: any) => ({
            tenant_id: newTenantId,
            name: lt.name,
            session_count: lt.session_count,
            validity_days: lt.validity_days ?? null,
            display_order: lt.display_order ?? 0,
          }))
        )
      }

      // 4. 관리자로 즉시 승인 등록
      await supabaseAdmin.from('tenant_members').upsert({
        tenant_id: newTenantId, user_id: userId, role: 'admin', is_approved: true,
      }, { onConflict: 'tenant_id,user_id' })

      // 5. 프로필 승인
      await supabaseAdmin.from('profiles').update({ is_approved: true }).eq('id', userId)

      // 6. 기본 스케줄 규칙 생성
      const defaultSlots: string[] = (tenant_settings?.time_slots as string[] | undefined)
        ?? ['09-10','10-11','11-12','12-13','13-14','14-15','15-16','16-17','17-18']
      await supabaseAdmin.from('schedule_rules').insert(
        [0,1,2,3,4,5,6].flatMap((d: number) =>
          defaultSlots.map((s: string) => ({ tenant_id: newTenantId, day_of_week: d, time_slot: s, is_open: true }))
        )
      )

      return json({ success: true, tenant_id: newTenantId }, 200, corsHeaders)
    }

    // ── DEV 전용: 기존 조직에 관리자로 즉시 승인 ──────────────────────────────
    if (isDevMode && auto_approve && tenant_id) {
      await supabaseAdmin.from('tenant_members')
        .update({ is_approved: true, role: 'admin' })
        .eq('user_id', userId).eq('tenant_id', tenant_id)
      await supabaseAdmin.from('profiles').update({ is_approved: true }).eq('id', userId)
    }

    return json({ success: true }, 200, corsHeaders)
  } catch (err) {
    console.error(`[signup] unhandled error: ${err instanceof Error ? err.message : String(err)}`)
    return json({ error: '서버 오류가 발생했습니다.' }, 500, corsHeaders)
  }
})
