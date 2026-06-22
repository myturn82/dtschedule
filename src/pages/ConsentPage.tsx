import { useState } from 'react'
import { DevFileLabel } from '../components/DevFileLabel'
import { useNavigate } from 'react-router-dom'
import { ScheduleBackground } from '../components/auth/ScheduleBackground'
import { TERMS, type DocKey } from '../lib/legalTerms'

const ICheck = () => (
  <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m4 10 4 4 8-9"/>
  </svg>
)
const IArrow = () => (
  <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10h12M11 5l5 5-5 5"/>
  </svg>
)
const IClose = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="m5 5 10 10M15 5 5 15"/>
  </svg>
)

function CheckRow({ on, label, onToggle, onView }: {
  on: boolean; label: string; onToggle: () => void; onView: () => void
}) {
  return (
    <div className={`af-ck-row${on ? ' on' : ''}`} onClick={onToggle}>
      <div className="af-ck-left">
        <span className="af-ck">{on && <ICheck />}</span>
        <span className="af-lbl">{label}</span>
        <span className="af-ck-tag">필수</span>
      </div>
      <button className="af-ck-view" onClick={e => { e.stopPropagation(); onView() }}>보기</button>
    </div>
  )
}

export function ConsentPage() {
  const navigate = useNavigate()
  const [tos, setTos]         = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [doc, setDoc]         = useState<DocKey | null>(null)
  const canProceed = tos && privacy

  const topNavSlot = (
    <>
      <span className="lmp-nav-hint">이미 계정이 있나요?</span>
      <button className="lmp-nav-btn" onClick={() => navigate('/auth?tab=login')}>로그인</button>
    </>
  )

  return (
    <ScheduleBackground topNavSlot={topNavSlot}>
      <div className="af-card">
        <span className="af-eyebrow">CONSENT</span>
        <h2 className="af-title">서비스 이용 동의</h2>
        <p className="af-sub">서비스를 시작하기 전에 아래 항목에 동의해 주세요.</p>

        {/* 전체 동의 */}
        <div className={`af-consent-all${canProceed ? ' on' : ''}`}
          onClick={() => { const all = canProceed; setTos(!all); setPrivacy(!all) }}>
          <span className="af-ck">
            {canProceed && <span style={{ color: 'var(--ink-900)', display: 'flex' }}><ICheck /></span>}
          </span>
          <span className="af-lbl">전체 동의</span>
        </div>

        <CheckRow on={tos} label="서비스 이용약관 동의" onToggle={() => setTos(v => !v)} onView={() => setDoc('tos')} />
        <CheckRow on={privacy} label="개인정보 수집 및 이용 동의" onToggle={() => setPrivacy(v => !v)} onView={() => setDoc('privacy')} />

        <button className="af-btn af-btn-primary" disabled={!canProceed}
          style={{ marginTop: 18 }}
          onClick={() => {
            sessionStorage.setItem('vs_consent_ok', '1')
            sessionStorage.setItem('vs_consent_ts', new Date().toISOString())
            navigate('/auth?tab=signup')
          }}>
          동의 및 계속하기 {canProceed && <IArrow />}
        </button>
      </div>

      {/* 약관 상세 모달 */}
      {doc && (
        <>
          <div className="af-overlay" style={{ zIndex: 210 }} onClick={() => setDoc(null)} />
          <div className="af-popup-layer" style={{ zIndex: 211 }}>
            <div className="af-doc">
              <div className="af-doc-head">
                <span className="af-doc-title">{TERMS[doc].title}</span>
                <button className="af-popup-x" onClick={() => setDoc(null)}><IClose /></button>
              </div>
              <div className="af-doc-body">
                <p>{TERMS[doc].body}</p>
              </div>
            </div>
          </div>
        </>
      )}
      <DevFileLabel file="ConsentPage.tsx" />
    </ScheduleBackground>
  )
}
