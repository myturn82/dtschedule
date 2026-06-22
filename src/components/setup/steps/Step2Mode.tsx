import { useState } from 'react'
import type { TenantMode } from '../../../types'

interface Props {
  mode: TenantMode
  error: string
  industry?: string
  onChange: (mode: TenantMode) => void
}

const MODE_CARDS: {
  mode: TenantMode
  icon: string
  title: string
  desc: string
  examples: string
}[] = [
  {
    mode: '회원공유',
    icon: '👥',
    title: '회원 공유',
    desc: '회원들이 스케줄을 실시간으로 공유합니다. 관리자와 멤버가 서로의 배정 현황을 함께 확인할 수 있어 혼선 없이 운영됩니다.',
    examples: '도서관 좌석 배정, 스터디그룹, 봉사 센터, 공동 작업 공간',
  },
  {
    mode: '회원개별',
    icon: '🗂️',
    title: '회원 개별',
    desc: '관리자만 각 회원의 스케줄을 통합 관리합니다. 회원 간에는 서로의 스케줄이 보이지 않아 개인별 관리에 적합합니다.',
    examples: 'PT·코칭, 교습소, 담당자별 독립 배정 관리',
  },
  {
    mode: '비회원',
    icon: '📋',
    title: '비회원 (예약·방문)',
    desc: '회원 등록 없이 방문자 정보를 직접 입력합니다.',
    examples: '미용실, 식당 예약, 병원, 방문 서비스',
  },
]

const MODE_NAMES: Record<TenantMode, string> = {
  '회원공유': '회원 공유',
  '회원개별': '회원 개별',
  '비회원':   '비회원 (예약·방문)',
}

// ── Industry → mode recommendation ───────────────────────────────────────────

interface Rec { mode: TenantMode; reason: string }

// 세부 업종 기반 (높은 정확도)
const MID_REC: Record<string, Rec> = {
  // 뷰티·헬스
  '뷰티·헬스/미용실·헤어샵':    { mode: '비회원',   reason: '미용실·헤어샵은 예약 손님 정보를 그때그때 직접 입력하는 방식이 일반적입니다.' },
  '뷰티·헬스/피부관리·에스테틱': { mode: '비회원',   reason: '피부관리샵은 예약 고객 정보를 매번 직접 입력하는 방식이 많습니다.' },
  '뷰티·헬스/네일아트':          { mode: '비회원',   reason: '네일샵은 예약 손님 정보를 직접 입력하는 방식이 일반적입니다.' },
  '뷰티·헬스/마사지·스파':       { mode: '비회원',   reason: '마사지·스파는 예약 고객 정보를 매번 직접 입력하는 방식이 많습니다.' },
  '뷰티·헬스/헬스클럽·피트니스': { mode: '회원개별', reason: 'PT·피트니스는 트레이너가 회원별 스케줄을 개별 관리하는 방식이 일반적입니다.' },
  // 의료·보건
  '의료·보건/병원·의원':         { mode: '비회원',   reason: '병원·의원은 예약 환자 정보를 매번 직접 입력하는 방식이 일반적입니다.' },
  '의료·보건/치과':               { mode: '비회원',   reason: '치과는 예약 환자 정보를 직접 입력하는 방식이 일반적입니다.' },
  '의료·보건/한의원':             { mode: '비회원',   reason: '한의원은 예약 환자 정보를 매번 직접 입력하는 방식이 일반적입니다.' },
  '의료·보건/약국':               { mode: '회원공유', reason: '약국 근무자 스케줄은 직원들이 함께 확인하는 방식이 일반적입니다.' },
  '의료·보건/요양원·요양병원':    { mode: '회원개별', reason: '요양원은 입소자별 개별 케어 스케줄을 관리자가 통합 관리합니다.' },
  // 교육
  '교육/학원·교습소': { mode: '회원개별', reason: '학원·교습소는 강사가 학생별 수업 스케줄을 개별 관리하는 방식이 일반적입니다.' },
  '교육/어린이집·유치원': { mode: '회원공유', reason: '어린이집·유치원은 교사들이 공동 스케줄을 함께 확인하며 운영합니다.' },
  '교육/학교':        { mode: '회원공유', reason: '학교는 교사·직원이 공동 일정을 함께 확인하며 운영합니다.' },
  '교육/강사·튜터':   { mode: '회원개별', reason: '개인 강사·튜터는 학생별 스케줄을 개별 관리하는 방식이 일반적입니다.' },
  // 스포츠·레저
  '스포츠·레저/요가·필라테스': { mode: '회원개별', reason: '요가·필라테스 스튜디오는 강사가 회원별 수업 스케줄을 개별 관리합니다.' },
  '스포츠·레저/수영장':        { mode: '회원공유', reason: '수영장은 레인·강습 스케줄을 직원·강사가 공동으로 관리합니다.' },
  '스포츠·레저/무술·격투기':   { mode: '회원개별', reason: '무술·격투기 도장은 관장이 회원별 스케줄을 개별 관리하는 방식이 일반적입니다.' },
  '스포츠·레저/골프':          { mode: '회원개별', reason: '골프 레슨은 코치가 회원별 수업 스케줄을 개별 관리합니다.' },
  '스포츠·레저/종합스포츠센터': { mode: '회원공유', reason: '종합스포츠센터는 직원·강사가 공동 스케줄을 함께 확인합니다.' },
  '스포츠·레저/구기·일반 스포츠': { mode: '회원개별', reason: '구기·일반 스포츠 레슨은 코치가 회원별 수업 스케줄을 개별 관리합니다.' },
  // 음식·외식
  '음식·외식/식당·음식점': { mode: '비회원',   reason: '식당 예약은 손님 정보를 매번 직접 입력하는 방식이 일반적입니다.' },
  '음식·외식/카페·디저트': { mode: '비회원',   reason: '카페 예약은 고객 정보를 그때그때 입력하는 방식이 많습니다.' },
  '음식·외식/베이커리':    { mode: '회원공유', reason: '베이커리 직원 근무 스케줄은 팀원이 공동으로 확인합니다.' },
  // 소매·유통
  '소매·유통/소매점·편의점': { mode: '회원공유', reason: '소매점·편의점 직원 근무 스케줄은 팀원이 공동으로 확인합니다.' },
  '소매·유통/마트·슈퍼마켓': { mode: '회원공유', reason: '마트·슈퍼마켓 직원 근무 스케줄은 팀원이 함께 확인합니다.' },
  // 전문·사무서비스
  '전문·사무서비스/법무·회계·세무': { mode: '회원공유', reason: '법무·회계 사무소는 직원이 공동 일정을 함께 확인합니다.' },
  '전문·사무서비스/IT·기술서비스':  { mode: '회원공유', reason: 'IT·기술 팀은 직원이 공동 스케줄을 함께 확인합니다.' },
  '전문·사무서비스/디자인·미디어':  { mode: '회원공유', reason: '디자인·미디어 팀은 직원이 공동 일정을 함께 확인합니다.' },
  '전문·사무서비스/부동산':         { mode: '회원공유', reason: '부동산 사무소는 직원 스케줄을 팀원이 공동으로 확인합니다.' },
  // 공공·비영리
  '공공·비영리/행정기관':           { mode: '회원공유', reason: '행정기관은 직원이 공동 근무 스케줄을 함께 확인합니다.' },
  '공공·비영리/도서관·문화시설':     { mode: '회원공유', reason: '도서관·문화시설은 직원·봉사자가 공동 스케줄을 함께 확인합니다.' },
  '공공·비영리/복지시설·사회서비스': { mode: '회원공유', reason: '복지시설은 직원·봉사자가 공동 스케줄을 함께 확인합니다.' },
  '공공·비영리/종교단체':           { mode: '회원공유', reason: '종교단체는 멤버가 공동 스케줄을 함께 확인합니다.' },
  '공공·비영리/자원봉사·시민단체':   { mode: '회원공유', reason: '자원봉사 단체는 봉사자들이 공동 스케줄을 함께 확인합니다.' },
}

// 대분류 기반 (세부업종 미선택 시 폴백)
const TOP_REC: Record<string, Rec> = {
  '뷰티·헬스':       { mode: '비회원',   reason: '뷰티·헬스 업종은 예약 손님 정보를 직접 입력하는 방식이 많습니다. 세부 업종을 선택하면 더 정확히 추천해 드릴 수 있어요.' },
  '의료·보건':       { mode: '비회원',   reason: '의료·보건 업종은 예약 환자 정보를 매번 입력하는 방식이 일반적입니다. 세부 업종을 선택하면 더 정확히 추천해 드릴 수 있어요.' },
  '교육':            { mode: '회원개별', reason: '교육 업종은 강사가 학습자별 스케줄을 개별 관리하는 방식이 일반적입니다. 세부 업종을 선택하면 더 정확히 추천해 드릴 수 있어요.' },
  '스포츠·레저':     { mode: '회원개별', reason: '스포츠·레저 업종은 강사가 회원별 스케줄을 개별 관리하는 방식이 많습니다. 세부 업종을 선택하면 더 정확히 추천해 드릴 수 있어요.' },
  '음식·외식':       { mode: '비회원',   reason: '음식·외식 업종은 예약 손님 정보를 직접 입력하는 방식이 일반적입니다.' },
  '소매·유통':       { mode: '회원공유', reason: '소매·유통 업종은 직원 근무 스케줄을 팀원이 함께 확인합니다.' },
  '전문·사무서비스': { mode: '회원공유', reason: '전문·사무서비스 업종은 직원이 공동 일정을 함께 확인합니다.' },
  '공공·비영리':     { mode: '회원공유', reason: '공공·비영리 업종은 직원·봉사자가 공동 스케줄을 함께 확인합니다.' },
}

function getRecommendation(industry: string): (Rec & { precision: 'mid' | 'top' | null }) {
  if (!industry || industry === '기타') return { mode: '회원공유', reason: '', precision: null }
  const parts = industry.split(' / ')
  const top = parts[0]
  const mid = parts[1]
  if (top && mid && MID_REC[`${top}/${mid}`]) {
    return { ...MID_REC[`${top}/${mid}`], precision: 'mid' }
  }
  if (top && TOP_REC[top]) {
    return { ...TOP_REC[top], precision: 'top' }
  }
  return { mode: '회원공유', reason: '', precision: null }
}

// ── Mini grid diagram ─────────────────────────────────────────────────────────

interface ChipData { text: string; bg: string; ink: string }

function SchedMiniGrid({ chips, label }: { chips: ChipData[]; label?: string }) {
  const borderCls = 'border-[var(--color-border-table)]'
  const headerCls = 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] font-semibold'
  return (
    <div className="flex flex-col items-center gap-[3px]">
      {label && <span className="text-[7px] font-semibold text-[var(--color-text-muted)]">{label}</span>}
      <div className={`border ${borderCls} rounded overflow-hidden`} style={{ width: 80 }}>
        <div className={`flex border-b ${borderCls}`}>
          <div className={`w-[22px] shrink-0 ${headerCls} border-r ${borderCls}`} />
          <div className={`flex-1 text-[8px] text-center ${headerCls} py-[2px]`}>화</div>
        </div>
        <div className="flex">
          <div className={`w-[22px] shrink-0 flex items-center justify-center text-[7px] ${headerCls} border-r ${borderCls} py-[3px]`}>10시</div>
          <div className="flex-1 flex flex-col gap-[2px] p-[3px] bg-[var(--color-surface)]">
            {chips.map((c, i) => (
              <span key={i} className="text-[7px] font-semibold px-[3px] py-[1px] rounded text-center truncate leading-[11px]"
                style={{ background: c.bg, color: c.ink }}>{c.text}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniDiagram({ mode }: { mode: TenantMode }) {
  const sun  = { bg: 'var(--tint-sun)',  ink: 'var(--tint-sun-ink)' }
  const blue = { bg: 'oklch(0.93 0.06 240)', ink: 'oklch(0.38 0.16 240)' }
  const form = { bg: 'var(--color-surface-secondary)', ink: 'var(--color-text-secondary)' }
  if (mode === '회원공유') return (
    <SchedMiniGrid chips={[{ text: '김○○', ...sun }, { text: '이○○', ...sun }]} />
  )
  if (mode === '회원개별') return (
    <div className="flex flex-col gap-[6px]">
      <SchedMiniGrid label="관리자" chips={[{ text: '김○○', ...sun }, { text: '이○○', ...blue }]} />
      <SchedMiniGrid label="회원"   chips={[{ text: '김○○', ...sun }]} />
    </div>
  )
  return (
    <SchedMiniGrid chips={[{ text: '📝 홍길동', ...form }, { text: '010-1234', ...form }]} />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Q1Answer = 'member' | 'visitor' | null
type Q2Answer = 'shared'  | 'private' | null

export function Step2Mode({ mode, error, industry, onChange }: Props) {
  const [dismissed, setDismissed]   = useState(false)
  const [recoOpen, setRecoOpen]     = useState(false)
  const [q1, setQ1]                 = useState<Q1Answer>(null)
  const [q2, setQ2]                 = useState<Q2Answer>(null)

  const rec = getRecommendation(industry ?? '')
  const hasRec = rec.precision !== null && !dismissed

  // Questionnaire result (fallback when no industry match)
  const qRec: Rec | null = (() => {
    if (q1 === 'visitor') return { mode: '비회원',   reason: '방문자·예약 고객 정보를 매번 입력하는 방식에는 비회원 모드가 적합합니다.' }
    if (q1 === 'member' && q2 === 'shared')  return { mode: '회원공유', reason: '팀원·회원이 서로의 배정을 함께 확인하려면 회원 공유 모드가 적합합니다.' }
    if (q1 === 'member' && q2 === 'private') return { mode: '회원개별', reason: '관리자만 전체를 보고 회원끼리는 서로 보이지 않으려면 회원 개별 모드가 적합합니다.' }
    return null
  })()

  function applyRec(m: TenantMode) {
    onChange(m)
    setDismissed(true)
    setRecoOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pt-2">
        <div className="text-4xl select-none">⚙️</div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">어떻게 운영할 예정인가요?</h2>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm mx-auto">아래 방식 중 내 서비스에 맞는 것을 선택해주세요. 나중에 변경할 수 있습니다.</p>
      </div>

      {/* Industry-based recommendation */}
      {hasRec && (
        <div className="rounded-2xl border-2 border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-primary)]/4 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg select-none">✨</span>
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                추천: <span className="text-[var(--color-brand-primary)]">{MODE_NAMES[rec.mode]}</span>
                {rec.precision === 'top' && (
                  <span className="ml-1.5 text-[10px] font-normal text-[var(--color-text-muted)]">세부 업종 선택 시 더 정확해요</span>
                )}
              </p>
            </div>
            <button onClick={() => setDismissed(true)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] text-xs shrink-0">✕</button>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{rec.reason}</p>
          <button onClick={() => applyRec(rec.mode)}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-[var(--color-brand-primary)] text-white hover:brightness-95 transition-colors">
            이 모드로 설정 →
          </button>
        </div>
      )}

      {/* Fallback questionnaire (shown when no industry match or dismissed) */}
      {!hasRec && !recoOpen && (
        <button onClick={() => { setRecoOpen(true); setQ1(null); setQ2(null) }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--color-brand-primary)]/50 text-sm text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/4 transition-colors">
          <span className="text-base select-none">🤔</span>
          어떤 모드가 맞는지 모르겠어요 → 추천 받기
        </button>
      )}

      {recoOpen && (
        <div className="rounded-2xl border border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-primary)]/3 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wide">모드 추천</p>
            <button onClick={() => setRecoOpen(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">닫기 ✕</button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">스케줄에 등록되는 대상은 누구인가요?</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { val: 'member',  icon: '👤', label: '팀원·등록 회원',   desc: '사전에 등록된 멤버를 배정' },
                { val: 'visitor', icon: '🚶', label: '예약 손님·방문자', desc: '매번 정보를 직접 입력' },
              ] as const).map(opt => (
                <button key={opt.val} onClick={() => { setQ1(opt.val); setQ2(null) }}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${q1 === opt.val ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 bg-[var(--color-surface)]'}`}>
                  <div className="text-lg select-none mb-0.5">{opt.icon}</div>
                  <div className="text-xs font-semibold text-[var(--color-text-primary)]">{opt.label}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {q1 === 'member' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">팀원·회원이 서로의 배정을 볼 수 있어야 하나요?</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { val: 'shared',  icon: '👥', label: '예, 함께 봐요',    desc: '모든 멤버가 전체 스케줄 확인' },
                  { val: 'private', icon: '🔒', label: '아니요, 개인별로', desc: '관리자만 전체 조회' },
                ] as const).map(opt => (
                  <button key={opt.val} onClick={() => setQ2(opt.val)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${q2 === opt.val ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8' : 'border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 bg-[var(--color-surface)]'}`}>
                    <div className="text-lg select-none mb-0.5">{opt.icon}</div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">{opt.label}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {qRec && (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-brand-primary)]/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base select-none">✨</span>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">추천: {MODE_NAMES[qRec.mode]}</p>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{qRec.reason}</p>
              <button onClick={() => applyRec(qRec.mode)}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-[var(--color-brand-primary)] text-white hover:brightness-95 transition-colors">
                이 모드로 설정 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode cards */}
      <div className="space-y-3">
        {MODE_CARDS.map(card => (
          <button key={card.mode} onClick={() => onChange(card.mode)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              mode === card.mode
                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5'
                : 'border-[var(--color-border)] hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-surface-hover)]'
            }`}>
            <div className="flex gap-3 items-start">
              <div className="shrink-0"><MiniDiagram mode={card.mode} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl select-none">{card.icon}</span>
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">{card.title}</span>
                  {mode === card.mode && <span className="ml-auto text-[var(--color-brand-primary)] text-base shrink-0">✓</span>}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{card.desc}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">예: {card.examples}</p>
              </div>
            </div>
            {card.mode === '비회원' && mode === '비회원' && (
              <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-xs text-orange-600 dark:text-orange-400">
                ⚠ 6단계(커스텀필드)에서 방문자 수집 정보를 설정해야 합니다.
              </div>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
