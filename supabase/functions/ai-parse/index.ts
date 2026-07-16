import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

const ANTHROPIC_MODEL = 'claude-sonnet-5'
const ANTHROPIC_VERSION = '2023-06-01'

function json(body: unknown, status = 200, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── Claude tool-use 스키마 (mode별) ──────────────────────────────────────

const SETUP_TOOL = {
  name: 'propose_setup',
  description: '조직 운영 설명을 파싱해 역할, 커스텀 필드, 요일별 운영 여부, 정원 제안을 만든다.',
  input_schema: {
    type: 'object',
    properties: {
      roles: {
        type: 'array',
        description: '텍스트에서 언급된 역할 목록',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            display_mode: { type: 'string', enum: ['none', 'split', 'bar'], description: '달력 표시 방식 — 확실치 않으면 none' },
          },
          required: ['name'],
        },
      },
      custom_fields: {
        type: 'array',
        description: '텍스트에서 언급된, 예약/배정 시 추가로 입력받아야 할 정보',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            type: { type: 'string', enum: ['text', 'number', 'select', 'radio', 'checkbox', 'checkbox_group', 'phone', 'image_upload'] },
            required: { type: 'boolean' },
            options: {
              type: 'array',
              description: 'type이 select/radio/checkbox_group일 때만',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'string' },
                  value_type: { type: 'string', enum: ['amount', 'quantity', 'people', 'session', 'none'] },
                },
                required: ['name', 'value'],
              },
            },
          },
          required: ['label', 'type'],
        },
      },
      closed_weekdays: {
        type: 'array',
        description: '휴무 요일 (0=일 ~ 6=토). 언급 없으면 빈 배열.',
        items: { type: 'integer', minimum: 0, maximum: 6 },
      },
      slot_capacity_hint: {
        type: 'integer',
        description: '시간대별 동시 정원이 언급됐다면 그 숫자. 언급 없으면 생략.',
      },
    },
    required: ['roles', 'custom_fields', 'closed_weekdays'],
  },
}

const BOOKING_TOOL = {
  name: 'propose_booking',
  description: '자연어 예약 요청을 파싱해 등록/수정/삭제 의도와 대상자, 날짜(단일 또는 반복), 시간대(복수 가능), 메모를 추출한다.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'update', 'delete'],
        description: '"예약 등록/추가"면 create, "시간/메모 변경·이동"이면 update, "취소/삭제"면 delete.',
      },
      person_name_guess: { type: ['string', 'null'], description: '예약 대상자로 언급된 이름. 없으면 null.' },
      time_slots_guess: {
        type: 'array',
        items: { type: 'string' },
        description: 'create: 제공된 시간슬롯 목록 중 요청된 시간(범위 포함)에 해당하는 슬롯을 전부 골라 그 문자열 그대로 나열. update/delete: 대상을 찾을 때 좁힐 시간대(언급 없으면 빈 배열 — 그 날짜의 모든 슬롯에서 찾음).',
      },
      is_recurring: {
        type: 'boolean',
        description: 'create에서만 사용. 특정 하루가 아니라 "매주 O요일", "N월부터 M월까지" 처럼 요일 반복 패턴으로 여러 날짜에 걸쳐 등록해야 하는 요청이면 true. update/delete는 항상 false.',
      },
      target_scope: {
        type: 'string',
        enum: ['single', 'range'],
        description: 'action이 update/delete일 때만 사용. "7월 전체", "이번달 전부", "7월부터 9월까지"처럼 특정 하루가 아니라 기간 전체를 가리키면 range. 특정 하루(오늘/내일/O월 O일/이번주 O요일 등)만 가리키면 single.',
      },
      weekday_guess: { type: 'integer', minimum: 0, maximum: 6, description: 'target_scope=single일 때(create의 is_recurring=false 포함): 대상 날짜의 요일 (0=일~6=토) — 제공된 기준일(오늘)로부터 직접 계산' },
      resolved_date: { type: 'string', description: 'target_scope=single일 때(create의 is_recurring=false 포함): YYYY-MM-DD 형식으로 계산한 날짜. 제공된 기준일(오늘)을 기준으로 계산.' },
      range_start_date: { type: 'string', description: 'action이 update/delete이고 target_scope=range일 때: 대상 기간 시작일 YYYY-MM-DD. 특정 일자 언급이 없으면 해당 월 1일. 연도 언급이 없으면 기준일(오늘)과 같은 해.' },
      range_end_date: { type: 'string', description: 'action이 update/delete이고 target_scope=range일 때: 대상 기간 종료일 YYYY-MM-DD. 특정 일자 언급이 없으면 해당 월의 마지막 날.' },
      recurrence_weekdays: {
        type: 'array',
        items: { type: 'integer', minimum: 0, maximum: 6 },
        description: 'action=create이고 is_recurring=true일 때: 반복할 요일들 (0=일~6=토). 명시가 없으면 기준일(오늘)의 요일 하나만.',
      },
      recurrence_start_date: { type: 'string', description: 'action=create이고 is_recurring=true일 때: 반복 시작일 YYYY-MM-DD. 특정 일자 언급이 없으면 해당 월 1일. 연도 언급이 없으면 기준일(오늘)과 같은 해.' },
      recurrence_end_date: { type: 'string', description: 'action=create이고 is_recurring=true일 때: 반복 종료일 YYYY-MM-DD. 특정 일자 언급이 없으면 해당 월의 마지막 날.' },
      note: { type: ['string', 'null'], description: 'action=create일 때: 예약 사유/메모로 쓸만한 짧은 텍스트 (예: "레슨"). 없으면 null.' },
      new_time_slot_guess: { type: ['string', 'null'], description: 'action=update이고 시간을 다른 시간대로 옮기라는 요청이면, 제공된 시간슬롯 목록 중 새로 옮길 슬롯. 시간 변경이 아니면 null.' },
      new_note: { type: ['string', 'null'], description: 'action=update이고 메모를 바꾸라는 요청이면 새 메모 내용. 메모 변경이 아니면 null.' },
      custom_field_guesses: {
        type: 'object',
        description: 'action=create일 때: 제공된 커스텀 필드 중 텍스트에서 값을 유추할 수 있는 것만 {필드id: 값} 형태로. 유추 불가하면 포함하지 않음.',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['action', 'person_name_guess', 'time_slots_guess', 'is_recurring'],
  },
}

interface SetupContext { industry?: string }
interface BookingContext {
  today: string // YYYY-MM-DD
  todayWeekday: number // 0-6
  timeSlots: string[]
  customFields: { id: string; label: string; type: string }[]
}

function buildPrompt(mode: string, text: string, context: unknown): string {
  if (mode === 'setup') {
    const ctx = (context ?? {}) as SetupContext
    return [
      '아래는 스케줄 관리 조직의 관리자가 직접 입력한, 자신의 조직 운영 방식에 대한 자유 서술입니다.',
      ctx.industry ? `조직 업종: ${ctx.industry}` : '',
      '이 설명에서 역할, 예약/배정 시 추가로 받아야 할 정보(커스텀 필드), 휴무 요일, 시간대별 정원을 뽑아 propose_setup 도구를 호출하세요.',
      '텍스트에 없는 내용은 추측해서 채우지 말고 비워두세요.',
      '',
      `설명: ${text}`,
    ].filter(Boolean).join('\n')
  }
  const ctx = (context ?? {}) as BookingContext
  return [
    '아래는 스케줄 예약을 자연어로 요청한 텍스트입니다.',
    `기준일(오늘): ${ctx.today} (요일 코드 ${ctx.todayWeekday}, 0=일~6=토) — 상대 날짜·연도 표현은 반드시 이 기준일로부터 계산하세요.`,
    `사용 가능한 시간슬롯 목록: ${JSON.stringify(ctx.timeSlots ?? [])} — time_slots_guess는 이 목록의 문자열만 그대로 사용해야 합니다.`,
    ctx.customFields?.length
      ? `추가로 입력받을 수 있는 항목: ${JSON.stringify(ctx.customFields.map(f => ({ id: f.id, label: f.label })))}`
      : '',
    '주의: "N시"는 시각(시간)이고 "N일"은 날짜입니다. 예를 들어 "15시"는 오후 3시(time_slots_guess로 매칭할 시간)이지 15일이 아닙니다. 절대 혼동하지 마세요.',
    '"매주 화요일", "7월부터 12월까지"처럼 특정 하루가 아니라 요일 반복 패턴이 언급되면 is_recurring=true로 하고 recurrence_* 필드를 채우세요.',
    '그렇지 않고 특정 하루(오늘/내일/이번주 O요일 등)만 언급되면 is_recurring=false로 하고 weekday_guess/resolved_date를 채우세요.',
    '"예약해줘/등록해줘/잡아줘"처럼 새로 만드는 요청이면 action=create.',
    '"시간 바꿔줘/변경해줘/옮겨줘/메모 수정해줘"처럼 기존 예약을 고치는 요청이면 action=update.',
    '"취소해줘/삭제해줘/빼줘"처럼 기존 예약을 없애는 요청이면 action=delete.',
    'action이 update/delete일 때: "7월 전체", "이번달 예약 전부", "7월부터 9월까지"처럼 특정 하루가 아니라 기간 전체가 대상이면 target_scope=range로 하고 range_start_date/range_end_date를 채우세요 (요일 반복 패턴이 아니라 그 기간의 모든 날짜가 대상입니다).',
    '그렇지 않고 특정 하루만 대상이면 target_scope=single로 weekday_guess/resolved_date를 채우세요.',
    'update/delete일 때 is_recurring은 항상 false로 하세요 (반복 "등록"은 create에서만 지원 — update/delete의 기간 지정은 target_scope를 쓰세요).',
    '이 내용을 파싱해 propose_booking 도구를 호출하세요.',
    '',
    `요청: ${text}`,
  ].filter(Boolean).join('\n')
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

    // 로그인 사용자만 허용 — V1은 별도 rate limit 없이 인증 게이트로 남용 방지
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const { data: { user: caller }, error: userErr } = await supabaseAdmin.auth.getUser(token)
    if (userErr || !caller) return json({ error: '인증 실패' }, 401, corsHeaders)

    const { mode, text, context } = await req.json()
    if (mode !== 'setup' && mode !== 'booking') return json({ error: '잘못된 mode' }, 400, corsHeaders)
    if (!text || typeof text !== 'string' || !text.trim()) return json({ error: '내용을 입력해 주세요.' }, 400, corsHeaders)

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('[ai-parse] ANTHROPIC_API_KEY not configured')
      return json({ error: 'AI 기능이 아직 설정되지 않았습니다.' }, 500, corsHeaders)
    }

    const tool = mode === 'setup' ? SETUP_TOOL : BOOKING_TOOL
    const prompt = buildPrompt(mode, text.trim(), context)

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        tools: [tool],
        tool_choice: { type: 'tool', name: tool.name },
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error(`[ai-parse] Anthropic API error (${anthropicRes.status}): ${errText}`)
      return json({ error: 'AI 파싱에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, 502, corsHeaders)
    }

    const anthropicData = await anthropicRes.json()
    const toolUseBlock = (anthropicData.content ?? []).find(
      (b: { type: string }) => b.type === 'tool_use'
    ) as { input: unknown } | undefined

    if (!toolUseBlock) {
      console.error('[ai-parse] no tool_use block in response')
      return json({ error: 'AI 응답을 해석하지 못했습니다.' }, 502, corsHeaders)
    }

    return json({ proposal: toolUseBlock.input }, 200, corsHeaders)
  } catch (err) {
    console.error(`[ai-parse] unhandled error: ${err instanceof Error ? err.message : String(err)}`)
    return json({ error: '서버 오류가 발생했습니다.' }, 500, corsHeaders)
  }
})
