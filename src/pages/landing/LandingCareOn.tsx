// src/pages/landing/LandingCareOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#34D399'

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Anim({ children, delay = 0, style, className }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

export function LandingCareOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=medical-care')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(52,211,153,0.35);} 50% { box-shadow:0 8px 52px rgba(52,211,153,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(52,211,153,0.1); border-color:rgba(52,211,153,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(52,211,153,0.3); } 50%{ box-shadow:0 6px 28px rgba(52,211,153,0.6); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
        @keyframes alertPulse { 0%,100% { border-color:rgba(239,68,68,0.3); } 50% { border-color:rgba(239,68,68,0.7); } }
        body { margin:0; background:#0a0b10; }
        .co-nav   { animation: navFade 0.5s ease both; }
        .co-badge { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .co-h1    { animation: fadeUp 0.75s ease 0.22s both; }
        .co-sub   { animation: fadeUp 0.65s ease 0.38s both; }
        .co-note  { animation: fadeUp 0.55s ease 0.5s both; }
        .co-cta   { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .co-glow  { animation: glowPulse 5s ease-in-out infinite; }
        .co-card  { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .co-card:hover { transform:translateY(-6px); border-color:rgba(52,211,153,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .co-tag-btn { transition: background 0.18s, transform 0.18s; }
        .co-tag-btn:hover { transform:scale(1.06); }
        .co-hero-card { animation: float 3.5s ease-in-out infinite; }
        .co-hero-card:nth-child(2) { animation-delay: 0.5s; }
        .co-hero-card:nth-child(3) { animation-delay: 1s; }
        .co-hero-card:nth-child(4) { animation-delay: 1.5s; }
        .co-alert { animation: alertPulse 2s ease-in-out infinite; }
        @media (max-width:720px) {
          .co-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .co-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .co-feat-text { order:1 !important; text-align:center !important; }
          .co-hero-cards { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

        {/* Nav */}
        <nav className="co-nav" style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(10,11,16,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>CARE:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, color 0.18s' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#0a0b10', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.18s' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          <div className="co-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(52,211,153,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />
          <div className="co-badge" style={{ display: 'inline-block', background: 'rgba(52,211,153,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>의료진 교대표 관리</div>
          <h1 className="co-h1" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 720 }}>
            의료진 교대표,<br /><span style={{ color: ACCENT }}>빠짐 없이 자동으로 채워집니다.</span>
          </h1>
          <p className="co-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.7 }}>
            역할별 자동 배정, 공백 감지, 담당자 전일 알림. 교대표 작성 시간을 줄이십시오.
          </p>
          <p className="co-note" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 40 }}>신용카드 불필요 · 10명까지 영구 무료 · 30초 가입</p>
          <button className="co-cta" onClick={goStart} style={{ background: ACCENT, color: '#0a0b10', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 72 }}>무료로 시작하기 →</button>

          {/* Hero 플로팅 카드 4개 */}
          <div className="co-hero-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 2 }}>
            {/* 카드 1: 이번 주 교대표 */}
            <div className="co-hero-card" style={{ background: 'rgba(20,21,32,0.9)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '18px 16px', textAlign: 'left', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>이번 주 교대표</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { role: '의사', count: 2, color: '#60a5fa' },
                  { role: '간호사', count: 6, color: ACCENT },
                  { role: '간병인', count: 4, color: '#a78bfa' },
                ].map(r => (
                  <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{r.role}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.count}명</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>총 12명 배정</div>
            </div>

            {/* 카드 2: 근무 알림 */}
            <div className="co-hero-card" style={{ background: 'rgba(20,21,32,0.9)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '18px 16px', textAlign: 'left', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>근무 알림</div>
              <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'rgba(255,255,255,0.85)' }}>📲 내일 야간 근무</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>야간 근무가 있습니다.<br />출근 시간을 확인하십시오.</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>발송 완료 <span style={{ color: ACCENT, fontWeight: 700 }}>12명</span></div>
            </div>

            {/* 카드 3: 주간 교대표 */}
            <div className="co-hero-card" style={{ background: 'rgba(20,21,32,0.9)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '18px 16px', textAlign: 'left', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>주간 교대표</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginBottom: 6 }}>
                {['의사', '간호', '간병'].map(r => (
                  <div key={r} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 3 }}>{r}</div>
                ))}
                {[
                  ['rgba(96,165,250,0.2)', 'rgba(52,211,153,0.2)', 'rgba(167,139,250,0.18)'],
                  ['rgba(96,165,250,0.2)', 'rgba(52,211,153,0.2)', ''],
                  ['', 'rgba(52,211,153,0.2)', 'rgba(167,139,250,0.18)'],
                  ['rgba(96,165,250,0.2)', '', 'rgba(167,139,250,0.18)'],
                ].map((row, ri) => row.map((bg, ci) => (
                  <div key={`${ri}-${ci}`} style={{ height: 14, borderRadius: 3, background: bg || 'rgba(255,255,255,0.04)', border: `1px solid ${bg ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}` }} />
                )))}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>역할별 슬롯 표시</div>
            </div>

            {/* 카드 4: 공백 감지 */}
            <div className="co-hero-card" style={{ background: 'rgba(20,21,32,0.9)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: '18px 16px', textAlign: 'left', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>공백 감지</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT, letterSpacing: '-1px', marginBottom: 4 }}>0개</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>빈 슬롯</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>↓ -3개</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>지난주 3개 → 0개</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 10 }}>
                <div style={{ height: '100%', width: '0%', background: ACCENT, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>이번 주 기준</div>
            </div>
          </div>
        </section>

        {/* Wave Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)', margin: '0 28px' }} />

        {/* Pain 섹션 */}
        <section style={{ padding: '100px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 16 }}>
              지금도 이렇게 하고 계신가요?
            </h2>
          </Anim>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📋', text: '교대표를 엑셀로 작성하고 수정을 반복합니다.' },
              { icon: '📞', text: '공백이 생겨도 파악이 늦어 긴급 연락에 나섭니다.' },
              { icon: '⚠️', text: '담당자 전달이 누락되어 당일 혼선이 발생합니다.' },
            ].map((item, i) => (
              <Anim key={item.text} delay={i * 80}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 22px', textAlign: 'left' }}>
                  <span style={{ fontSize: 24, flexShrink: 0, userSelect: 'none' }}>{item.icon}</span>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.text}</span>
                </div>
              </Anim>
            ))}
          </div>
        </section>

        {/* Wave Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)', margin: '0 28px' }} />

        {/* F01 — 역할별 자동 배정 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(52,211,153,0.05), transparent)' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F01 — 역할별 자동 배정</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>역할별 필요 인원이<br />자동으로 채워집니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>의사·간호사·간병인별 필요 인원을 설정하면 가능한 인원을 자동으로 배정합니다. 반복되는 교대표 작성 시간을 줄일 수 있습니다.</p>
            </Anim>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>역할별 교대표</span>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 1fr', gap: 5 }}>
                    <div />
                    {[
                      { label: '의사', color: '#60a5fa' },
                      { label: '간호사', color: ACCENT },
                      { label: '간병인', color: '#a78bfa' },
                    ].map(r => (
                      <div key={r.label} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: r.color, paddingBottom: 6 }}>{r.label}</div>
                    ))}
                    {[
                      { shift: '주간', cells: [{ name: '김의준', color: '#60a5fa' }, { name: '이간호', color: ACCENT }, { name: '박간병', color: '#a78bfa' }] },
                      { shift: '야간', cells: [{ name: '최의준', color: '#60a5fa' }, { name: '정간호', color: ACCENT }, null] },
                      { shift: '당직', cells: [null, { name: '한간호', color: ACCENT }, { name: '오간병', color: '#a78bfa' }] },
                    ].map((row, ri) => ([
                      <div key={`t${ri}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{row.shift}</div>,
                      ...row.cells.map((cell, ci) => (
                        <div key={`${ri}-${ci}`} style={{ height: 40, borderRadius: 8, background: cell ? `${cell.color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${cell ? `${cell.color}40` : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: cell ? 600 : undefined, color: cell ? cell.color : 'rgba(255,255,255,0.15)', opacity: 0, animation: `fadeUp 0.4s ease ${200 + (ri * 3 + ci) * 70}ms forwards` }}>
                          {cell ? cell.name.slice(0, 3) : '미배정'}
                        </div>
                      )),
                    ]))}
                  </div>
                  <div style={{ marginTop: 12, textAlign: 'center', background: ACCENT, color: '#0a0b10', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 8, animation: 'autoGlow 3s ease-in-out infinite' }}>★ 자동배정 실행</div>
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F02 — 공백 자동 감지 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', maxWidth: 340, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>공백 감지 알림</span>
                </div>
                <div style={{ padding: '18px 16px' }}>
                  {/* 공백 감지 카드 */}
                  <div className="co-alert" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>🚨</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>빈 슬롯 감지됨</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>2건 · 즉시 확인이 필요합니다</div>
                      </div>
                    </div>
                    {[
                      { shift: '8/15 야간 · 간호사', required: '2명 필요', current: '1명 배정' },
                      { shift: '8/16 주간 · 간병인', required: '3명 필요', current: '2명 배정' },
                    ].map((item, i) => (
                      <div key={item.shift} style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, marginBottom: 6, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 100}ms forwards` }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{item.shift}</div>
                        <div style={{ fontSize: 10, color: '#f87171' }}>{item.required} · 현재 {item.current}</div>
                      </div>
                    ))}
                    <div style={{ background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 12, textAlign: 'center', borderRadius: 8, padding: '8px', marginTop: 8 }}>긴급 배정</div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>담당자에게 즉시 알림이 발송됩니다</div>
                </div>
              </div>
            </Anim>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F02 — 공백 자동 감지</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>빈 슬롯을 즉시 감지해<br />알립니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>필수 인원이 채워지지 않은 슬롯을 자동으로 감지합니다. 담당자에게 즉시 알림을 발송하여 공백이 당일까지 이어지지 않도록 조치합니다.</p>
            </Anim>
          </div>
        </section>

        {/* F03 — 담당자 전일 알림 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(52,211,153,0.05), transparent)' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F03 — 담당자 전일 알림</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>근무 하루 전 자동 알림을<br />발송합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>근무 전날 배정된 의료진 전원에게 자동 알림을 발송합니다. 야간·주간 근무를 구분해 안내하여 당일 혼선을 방지합니다.</p>
            </Anim>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>전일 알림 발송</span>
                </div>
                <div style={{ padding: '16px' }}>
                  {/* 폰 목업 */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>📲 CARE:ON 알림</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                      내일 <span style={{ color: ACCENT, fontWeight: 700 }}>야간 근무</span>가 있습니다.<br />출근 시간: 22:00
                    </div>
                  </div>
                  {/* 발송 내역 */}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>발송 내역 · 오늘 발송 6명</div>
                  {[
                    { name: '김의준', role: '의사 · 주간', status: '읽음', statusColor: '#34D399' },
                    { name: '이간호', role: '간호사 · 야간', status: '읽음', statusColor: '#34D399' },
                    { name: '정간호', role: '간호사 · 야간', status: '읽음', statusColor: '#34D399' },
                    { name: '박간병', role: '간병인 · 주간', status: '미확인', statusColor: 'rgba(255,255,255,0.35)' },
                    { name: '오간병', role: '간병인 · 야간', status: '미확인', statusColor: 'rgba(255,255,255,0.35)' },
                    { name: '최의준', role: '의사 · 당직', status: '읽음', statusColor: '#34D399' },
                  ].map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 4, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 80}ms forwards` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.role}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.statusColor }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F04 — 면허·자격 정보 관리 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>인력 카드</span>
                </div>
                <div style={{ padding: '18px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, #60a5fa, ${ACCENT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0a0b10', flexShrink: 0 }}>김</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>김의준</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>의사</div>
                    </div>
                  </div>
                  {[
                    { label: '면허 종류', value: '의사 면허 (제12345호)', valueColor: '#60a5fa' },
                    { label: '담당 병동', value: '내과 3병동', valueColor: 'rgba(255,255,255,0.7)' },
                    { label: '근무 유형', value: '주간 전담', valueColor: ACCENT },
                    { label: '고용 형태', value: '정규직', valueColor: 'rgba(255,255,255,0.6)' },
                  ].map((item, i) => (
                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 80}ms forwards` }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: item.valueColor }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F04 — 인력 정보 관리</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>인력 정보를 체계적으로<br />관리합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>면허 종류, 담당 병동, 근무 유형 등을 커스텀 필드로 기록합니다. 배정 시 자격 기준을 확인하여 적합한 인원을 배치할 수 있습니다.</p>
            </Anim>
          </div>
        </section>

        {/* Wave Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)', margin: '0 28px' }} />

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 680, margin: '0 auto' }}>
              {['병원', '의원', '요양원', '요양병원', '간병 서비스', '재활센터', '정신건강센터', '보건소', '어린이병원', '응급실'].map((tag, i) => (
                <span key={tag} className="co-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 50}ms forwards` }}>{tag}</span>
              ))}
            </div>
          </Anim>
        </section>

        {/* Wave Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)', margin: '0 28px' }} />

        {/* 엔진 기능 */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Anim style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>엔진</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>교대표 뒤에서 움직이는 스케줄 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>CARE:ON은 의료·돌봄 업종에 최적화된 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      {([
                        { n: '1', label: '조직 이름 · 업종', done: true },
                        { n: '2', label: '역할 설정 (의사/간호사/간병인)', done: true },
                        { n: '3', label: '교대 유형 (주간/야간/당직)', done: true },
                        { n: '4', label: '역할별 필요 인원', active: true },
                        { n: '5', label: '알림 설정', done: false },
                        { n: '6', label: '커스텀 필드 (면허·병동)', done: false },
                        { n: '7', label: '운영 시간 · 공휴일', done: false },
                      ] as { n: string; label: string; done?: boolean; active?: boolean }[]).map(step => (
                        <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: step.done ? 'rgba(34,197,94,0.04)' : step.active ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(52,211,153,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 7, fontSize: 11, marginBottom: 4 }}>
                          <div style={{ width: 19, height: 19, borderRadius: '50%', background: step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)', color: step.done ? '#22c55e' : step.active ? ACCENT : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                            {step.done ? '✓' : step.n}
                          </div>
                          <span style={{ flex: 1, fontWeight: 600, color: step.done ? 'rgba(255,255,255,0.35)' : step.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', textDecoration: step.done ? 'line-through' : undefined, fontSize: 10 }}>{step.label}</span>
                          {step.active && <span style={{ fontSize: 10, color: ACCENT }}>진행 중</span>}
                          {step.done && <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>}
                        </div>
                      ))}
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 8, marginBottom: 5 }}>예상 소요 시간 · 약 5분</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg, #22c55e, ${ACCENT})`, borderRadius: 2, animation: 'wizFill 5s linear infinite' }} />
                      </div>
                    </div>
                  ),
                  title: '5분 셋업 위자드',
                  desc: '역할(의사/간호사/간병인), 교대 유형, 필요 인원을 7단계 안내에 따라 설정하면 즉시 운영을 시작합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {(['월간', '주간', '일간'] as string[]).map((label, i) => (
                          <span key={label} style={{ flex: 1, textAlign: 'center', background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#0a0b10' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 1 ? 700 : undefined, padding: '4px 0', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 1fr 1fr', gap: 3 }}>
                        <div />
                        {['의사', '간호', '간병'].map(r => (
                          <div key={r} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>{r}</div>
                        ))}
                        {[
                          { shift: '주간', cells: ['#60a5fa', ACCENT, '#a78bfa'] },
                          { shift: '야간', cells: ['#60a5fa', ACCENT, ''] },
                          { shift: '당직', cells: ['', ACCENT, '#a78bfa'] },
                        ].map(row => ([
                          <div key={`t-${row.shift}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.shift}</div>,
                          ...row.cells.map((color, ci) => (
                            <div key={`${row.shift}-${ci}`} style={{ height: 26, borderRadius: 4, background: color ? `${color}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${color ? `${color}40` : 'rgba(255,255,255,0.07)'}` }} />
                          )),
                        ]))}
                      </div>
                    </div>
                  ),
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간 보기를 상황에 따라 전환하여 역할별 교대표를 파악합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {(['관리자 화면', '의료진 화면'] as string[]).map((label, pi) => (
                          <div key={label} style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
                              {label}
                            </div>
                            {['주간', '야간', '당직'].map((shift, si) => (
                              <div key={shift} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 3, fontSize: 10, animation: si === 1 ? 'liveSlot 3s ease-in-out infinite' : undefined }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{shift}</span>
                                <span style={{ color: si === 1 ? ACCENT : 'rgba(255,255,255,0.7)', fontWeight: si === 1 ? 700 : undefined }}>{si === 1 ? (pi === 0 ? '✦ 신규!' : '✦ 배정됨!') : '배정됨'}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '6px 10px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: 7, fontSize: 9, color: 'rgba(34,197,94,0.8)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ animation: 'ledPulse 1s ease-in-out infinite' }}>●</span>
                        실시간 동기화 중 · tenant_id 필터 적용
                      </div>
                    </div>
                  ),
                  title: '실시간 동기화',
                  desc: '교대표 변경이 발생하면 관리자와 의료진 화면에 새로고침 없이 즉시 반영됩니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>교대 유형</div>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {(['2교대', '3교대', '맞춤'] as string[]).map((label, i) => (
                          <span key={label} style={{ background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#0a0b10' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 1 ? 700 : undefined, padding: '3px 10px', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>3교대 반복 · 매주 월~일</div>
                      {(['8/11 (월) · 주간', '8/12 (화) · 야간', '8/13 (수) · 당직'] as string[]).map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록',
                  desc: '2교대·3교대 반복 유형을 설정하면 교대표를 여러 슬롯에 한 번에 일괄 등록합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {[
                          { name: '김의준', color: '#60a5fa', avail: '주간 가능' },
                          { name: '이간호', color: ACCENT, avail: '야간·주간 가능' },
                          { name: '박간병', color: '#a78bfa', avail: '야간 가능' },
                        ].map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{m.avail}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', background: ACCENT, color: '#0a0b10', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 9, animation: 'autoGlow 3s ease-in-out infinite' }}>★ 역할별 인원 기준 자동배정</div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별 필요 인원 기준과 가능 교대를 설정하면 빈 슬롯을 규칙에 맞춰 자동으로 채웁니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: 'rgba(255,255,255,0.8)' }}>2026년 8월</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.28)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {Array.from({ length: 6 }, (_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: 31 }, (_, i) => {
                          const d = i + 1
                          const isHol = d === 15
                          const isSpc = d === 22
                          return (
                            <div key={d} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: isHol ? 'rgba(239,68,68,0.18)' : isSpc ? 'rgba(52,211,153,0.15)' : 'transparent' }}>
                              <span style={{ fontSize: 9, color: isHol ? '#ef4444' : isSpc ? ACCENT : 'rgba(255,255,255,0.55)' }}>{d}</span>
                              {!isHol && !isSpc && (
                                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(52,211,153,0.5)', marginTop: 1 }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                          { dot: true, color: ACCENT, label: '정상 운영' },
                          { dot: false, bg: 'rgba(239,68,68,0.5)', label: '공휴일' },
                          { dot: false, bg: 'rgba(52,211,153,0.5)', label: '특별 운영' },
                        ].map(li => (
                          <div key={li.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>
                            {li.dot ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: li.color }} /> : <span style={{ width: 7, height: 7, borderRadius: 2, background: li.bg }} />}
                            {li.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '반복 규칙 + 날짜 예외',
                  desc: '기본 교대 규칙을 설정하고 공휴일·특별 운영일을 개별 날짜에 따로 지정합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>인력 정보 · 커스텀 필드</div>
                      {[
                        { type: '텍스트', label: '면허 번호', value: '제12345호', tc: '#60a5fa', tb: 'rgba(96,165,250,0.12)' },
                        { type: '선택', label: '담당 병동', value: '내과 3병동', tc: ACCENT, tb: 'rgba(52,211,153,0.1)' },
                        { type: '선택', label: '근무 유형', value: '주간 전담', tc: '#a78bfa', tb: 'rgba(167,139,250,0.12)' },
                        { type: '선택', label: '고용 형태', value: '정규직', tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 5 }}>
                          <span style={{ background: f.tb, color: f.tc, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{f.type}</span>
                          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{f.label}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{f.value}</span>
                        </div>
                      ))}
                      <div style={{ border: `1px dashed ${ACCENT}`, borderRadius: 8, padding: '7px', textAlign: 'center', fontSize: 11, color: ACCENT, fontWeight: 700, marginTop: 4 }}>+ 필드 추가</div>
                    </div>
                  ),
                  title: '입력항목 설정',
                  desc: '면허, 병동, 근무 유형 등 조직 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>주간 근무 · 김의준</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>의사 · 내과 3병동</div>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>첨부 파일</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid rgba(255,255,255,0.1)' }}>📄</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>인수인계_0815.pdf</div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: '100%', height: '100%', background: ACCENT, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>업로드 완료</div>
                        </div>
                      </div>
                    </div>
                  ),
                  title: '사진·파일 첨부',
                  desc: '인수인계 문서나 관련 자료를 배정에 첨부합니다. 브라우저에서 자동 압축되어 저장 효율을 높입니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>이번 주 교대표</div>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>PDF 출력</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {(['XLSX', 'PDF', 'CSV', 'DOCX'] as string[]).map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: f === 'PDF' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)', border: `1px solid ${f === 'PDF' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: f === 'PDF' ? ACCENT : 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <div style={{ flex: 1, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: ACCENT, fontWeight: 600 }}>이번 주 선택</div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '0 2px' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: '#22c55e', fontWeight: 600 }}>다음 주 붙여넣기</div>
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 내보내기',
                  desc: '셀을 드래그해 복사·붙여넣기. 교대표를 엑셀·CSV·워드·PDF로 내보내고 출력합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"김 간호사 다음주 화요일 야간"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {[
                            { label: '인원', value: '김간호' },
                            { label: '교대', value: '야간' },
                            { label: '날짜', value: '다음주 화요일' },
                            { label: '역할', value: '간호사' },
                          ].map(item => (
                            <div key={item.label}>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{item.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: ACCENT, color: '#0a0b10', fontSize: 11, fontWeight: 700, textAlign: 'center', borderRadius: 7, padding: '7px' }}>교대표에 등록</div>
                      </div>
                    </div>
                  ),
                  title: 'AI 자연어 예약',
                  desc: '"김 간호사 다음주 화요일 야간"처럼 말하듯 입력하면 자동으로 교대표에 등록됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="co-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%' }}>
                    {card.visual}
                    <div style={{ fontWeight: 700, marginBottom: 8, paddingLeft: 2 }}>{card.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, paddingLeft: 2 }}>{card.desc}</div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </section>

        {/* Wave Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)', margin: '0 28px' }} />

        {/* Pricing */}
        <section style={{ padding: '100px 24px', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>요금제</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px' }}>규모에 맞게 선택하십시오</h2>
          </Anim>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 760, margin: '0 auto' }}>
            {[
              { name: '무료', price: '₩0', sub: '10명까지 영구 무료', features: ['의료진 최대 3명', '기본 교대표 관리', '공백 감지', '전일 알림'], highlight: false },
              { name: 'Pro', price: '₩29,000', sub: '/월 · 50명 + SMS', features: ['의료진 최대 20명', '자동 배정', '면허·자격 관리', '데이터 내보내기'], highlight: true },
              { name: 'Business', price: '₩79,000', sub: '/월 · 무제한', features: ['의료진 무제한', '멀티 병동 지원', '전용 도메인', '우선 지원'], highlight: false },
            ].map((plan, i) => (
              <Anim key={plan.name} delay={i * 80}>
                <div style={{ background: plan.highlight ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${plan.highlight ? ACCENT : 'rgba(255,255,255,0.08)'}`, borderRadius: 18, padding: '28px 22px', textAlign: 'left', height: '100%' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? ACCENT : 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>{plan.price}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{plan.sub}</div>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                      <span style={{ color: plan.highlight ? ACCENT : '#22c55e', flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                  <button onClick={goStart} style={{ marginTop: 20, width: '100%', background: plan.highlight ? ACCENT : 'rgba(255,255,255,0.07)', color: plan.highlight ? '#0a0b10' : 'rgba(255,255,255,0.7)', border: 0, borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>시작하기</button>
                </div>
              </Anim>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <Anim>
          <section style={{ textAlign: 'center', padding: '60px 24px 100px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, lineHeight: 1.5 }}>엑셀 교대표의 번거로움을 해소하십시오.<br />CARE:ON이 대신합니다.</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>신용카드 불필요 · 10명까지 영구 무료 · 30초 가입</p>
            <button className="co-cta" onClick={goStart} style={{ background: ACCENT, color: '#0a0b10', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

      </div>
      <DevFileLabel file="LandingCareOn.tsx" />
    </>
  )
}
