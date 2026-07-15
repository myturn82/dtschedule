import { Fragment, useState } from 'react'
import type { TenantMode } from '../../../types'
import { StepHeader, WIZARD_STEPS } from '../StepHeader'
import { ErrLine } from '../WizardField'
import { WizardIcon, type WizardIconKey } from '../WizardIcons'
import { getRecommendation, type Rec } from '../../../lib/wizardModeRecommendation'

interface Props {
  mode: TenantMode
  error: string
  industry?: string
  onChange: (mode: TenantMode) => void
}

const MODE_CARDS: {
  mode: TenantMode
  icon: WizardIconKey
  tone: string
  title: string
  desc: string
  examples: string
}[] = [
  {
    mode: '회원공유',
    icon: 'users',
    tone: 'green',
    title: '회원 공유',
    desc: '회원들이 스케줄을 실시간으로 공유합니다. 관리자와 멤버가 서로의 배정 현황을 함께 확인할 수 있어 혼선 없이 운영됩니다.',
    examples: '도서관 좌석 배정, 스터디그룹, 봉사 센터, 공동 작업 공간',
  },
  {
    mode: '회원개별',
    icon: 'lock',
    tone: 'indigo',
    title: '회원 개별',
    desc: '관리자만 각 회원의 스케줄을 통합 관리합니다. 회원 간에는 서로의 스케줄이 보이지 않아 개인별 관리에 적합합니다.',
    examples: 'PT·코칭, 교습소, 담당자별 독립 배정 관리',
  },
  {
    mode: '비회원',
    icon: 'walk',
    tone: 'amber',
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

// ── Mini schedule diagram ─────────────────────────────────────────────────────

type MdCell = { tone: 'sun' | 'blue' | 'form'; label: string } | null

function MdSched({ days, rows }: { days: string[]; rows: { time: string; cells: MdCell[] }[] }) {
  return (
    <div className="md-sched" style={{ gridTemplateColumns: `13px repeat(${days.length}, 1fr)` }}>
      <span />
      {days.map(d => <span key={d} className="md-dow">{d}</span>)}
      {rows.map((r, i) => (
        <Fragment key={i}>
          <span className="md-time">{r.time}</span>
          {r.cells.map((c, j) => c
            ? <span key={j} className={`md-cell md-${c.tone}`}>{c.label}</span>
            : <span key={j} className="md-cell empty" />)}
        </Fragment>
      ))}
    </div>
  )
}

function MiniDiagram({ mode }: { mode: TenantMode }) {
  const days = ['월', '화']
  if (mode === '회원공유') {
    return <MdSched days={days} rows={[
      { time: '9', cells: [{ tone: 'sun', label: '김○' }, { tone: 'blue', label: '이○' }] },
      { time: '10', cells: [{ tone: 'sun', label: '박○' }, null] },
    ]} />
  }
  if (mode === '회원개별') {
    return (
      <div className="md-stack">
        <div className="md-unit">
          <span className="md-cap">관리자</span>
          <MdSched days={days} rows={[{ time: '9', cells: [{ tone: 'sun', label: '김○' }, { tone: 'blue', label: '이○' }] }]} />
        </div>
        <div className="md-unit">
          <span className="md-cap">회원</span>
          <MdSched days={days} rows={[{ time: '9', cells: [{ tone: 'sun', label: '김○' }, null] }]} />
        </div>
      </div>
    )
  }
  return <MdSched days={days} rows={[
    { time: '9', cells: [{ tone: 'form', label: '홍○' }, null] },
    { time: '10', cells: [null, { tone: 'form', label: '정○' }] },
  ]} />
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
    <div className="step-body">
      <StepHeader step={WIZARD_STEPS[1]} />

      {/* Industry-based recommendation */}
      {hasRec && (
        <div className="rec-banner">
          <div className="rec-top">
            <span className="rec-spark"><WizardIcon.sparkles size={16} /></span>
            <p className="rec-title">추천 · <span>{MODE_NAMES[rec.mode]}</span></p>
            <button className="rec-x" onClick={() => setDismissed(true)} aria-label="닫기"><WizardIcon.x size={14} /></button>
          </div>
          <p className="rec-reason">
            {rec.reason}
            {rec.precision === 'top' && ' 세부 업종을 선택하면 더 정확해요.'}
          </p>
          <button className="btn btn-primary rec-apply" onClick={() => applyRec(rec.mode)}>
            이 모드로 설정 <WizardIcon.arrowRight size={15} />
          </button>
        </div>
      )}

      {/* Fallback questionnaire (shown when no industry match or dismissed) */}
      {!hasRec && !recoOpen && (
        <button className="btn btn-dashed"
          onClick={() => { setRecoOpen(true); setQ1(null); setQ2(null) }}>
          어떤 모드가 맞는지 모르겠어요 → 추천 받기
        </button>
      )}

      {recoOpen && (
        <div className="addbox">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="addbox-title">모드 추천</p>
            <button className="link-btn" onClick={() => setRecoOpen(false)}>닫기 <WizardIcon.x size={12} /></button>
          </div>
          <div className="wfield">
            <label className="wlabel">스케줄에 등록되는 대상은 누구인가요?</label>
            <div className="tpl-grid">
              {([
                { val: 'member' as const,  icon: 'users' as WizardIconKey,  label: '팀원·등록 회원',   desc: '사전에 등록된 멤버를 배정' },
                { val: 'visitor' as const, icon: 'walk' as WizardIconKey, label: '예약 손님·방문자', desc: '매번 정보를 직접 입력' },
              ]).map(opt => (
                <button key={opt.val} className={`tpl-card${q1 === opt.val ? ' on' : ''}`}
                  onClick={() => { setQ1(opt.val); setQ2(null) }}>
                  <span className="tpl-label">{opt.label}</span>
                  <span className="tpl-sub">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {q1 === 'member' && (
            <div className="wfield">
              <label className="wlabel">팀원·회원이 서로의 배정을 볼 수 있어야 하나요?</label>
              <div className="tpl-grid">
                {([
                  { val: 'shared' as const,  label: '예, 함께 봐요',    desc: '모든 멤버가 전체 스케줄 확인' },
                  { val: 'private' as const, label: '아니요, 개인별로', desc: '관리자만 전체 조회' },
                ]).map(opt => (
                  <button key={opt.val} className={`tpl-card${q2 === opt.val ? ' on' : ''}`} onClick={() => setQ2(opt.val)}>
                    <span className="tpl-label">{opt.label}</span>
                    <span className="tpl-sub">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {qRec && (
            <div className="rec-banner">
              <div className="rec-top">
                <span className="rec-spark"><WizardIcon.sparkles size={16} /></span>
                <p className="rec-title">추천 · <span>{MODE_NAMES[qRec.mode]}</span></p>
              </div>
              <p className="rec-reason">{qRec.reason}</p>
              <button className="btn btn-primary rec-apply" onClick={() => applyRec(qRec.mode)}>
                이 모드로 설정 <WizardIcon.arrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode cards */}
      <div className="mode-list">
        {MODE_CARDS.map(card => {
          const on = mode === card.mode
          const Mic = WizardIcon[card.icon]
          return (
            <button key={card.mode} className={`mode-card${on ? ' on' : ''}`} onClick={() => onChange(card.mode)}>
              <span className="mode-diagram"><MiniDiagram mode={card.mode} /></span>
              <span className="mode-main">
                <span className="mode-titlerow">
                  <span className={`mode-ic tone-${card.tone}`}><Mic size={15} /></span>
                  <span className="mode-name">{card.title}</span>
                  {on && <span className="mode-check"><WizardIcon.check2 size={16} sw={2.4} /></span>}
                </span>
                <span className="mode-desc">{card.desc}</span>
                <span className="mode-ex">예: {card.examples}</span>
              </span>
            </button>
          )
        })}
      </div>

      {mode === '비회원' && (
        <div className="info-note"><WizardIcon.warn size={15} /> 7단계(커스텀필드)에서 방문자 수집 정보를 설정해야 합니다.</div>
      )}

      <ErrLine error={error} />
    </div>
  )
}
