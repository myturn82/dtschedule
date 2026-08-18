// src/pages/landing/LandingShiftOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#22C55E'

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

export function LandingShiftOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=shifton')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(34,197,94,0.35);} 50% { box-shadow:0 8px 52px rgba(34,197,94,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(34,197,94,0.3); } 50%{ box-shadow:0 6px 28px rgba(34,197,94,0.6); } }
        @keyframes barFill   { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes dragSel   { 0%,8%{ background:rgba(255,255,255,0.04); box-shadow:none; } 32%,68%{ background:rgba(34,197,94,0.18); box-shadow:inset 0 0 0 2px rgba(34,197,94,0.6); } 88%,100%{ background:rgba(255,255,255,0.04); box-shadow:none; } }
        @keyframes float1    { 0%,100%{ transform:translateY(0px) rotate(-2deg); } 50%{ transform:translateY(-10px) rotate(-2deg); } }
        @keyframes float2    { 0%,100%{ transform:translateY(0px) rotate(2deg); } 50%{ transform:translateY(-14px) rotate(2deg); } }
        @keyframes float3    { 0%,100%{ transform:translateY(0px) rotate(-1deg); } 50%{ transform:translateY(-8px) rotate(-1deg); } }
        @keyframes float4    { 0%,100%{ transform:translateY(0px) rotate(1.5deg); } 50%{ transform:translateY(-12px) rotate(1.5deg); } }
        body { margin:0; background:#0a0b10; }
        .sh-nav   { animation: navFade 0.5s ease both; }
        .sh-badge { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .sh-h1    { animation: fadeUp 0.75s ease 0.22s both; }
        .sh-sub   { animation: fadeUp 0.65s ease 0.38s both; }
        .sh-cta   { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .sh-glow  { animation: glowPulse 5s ease-in-out infinite; }
        .sh-card  { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .sh-card:hover { transform:translateY(-6px); border-color:rgba(34,197,94,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .sh-tag-btn { transition: background 0.18s, transform 0.18s; }
        .sh-tag-btn:hover { transform:scale(1.06); }
        .sh-hero-card1 { animation: float1 4.5s ease-in-out 0.3s infinite; }
        .sh-hero-card2 { animation: float2 5s ease-in-out 0.8s infinite; }
        .sh-hero-card3 { animation: float3 4.2s ease-in-out 1.2s infinite; }
        .sh-hero-card4 { animation: float4 4.8s ease-in-out 0.5s infinite; }
        @media (max-width:720px) {
          .sh-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .sh-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .sh-feat-text { order:1 !important; text-align:center !important; }
          .sh-hero-cards { display:none !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

        {/* Nav */}
        <nav className="sh-nav" style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(10,11,16,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>SHIFT:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '120px 24px 140px', position: 'relative', overflow: 'hidden' }}>
          <div className="sh-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(34,197,94,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />

          {/* 플로팅 카드 */}
          <div className="sh-hero-cards" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            {/* 카드1: 이번 주 알바 */}
            <div className="sh-hero-card1" style={{ position: 'absolute', top: '14%', left: '4%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left', minWidth: 160 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>이번 주 알바</div>
              {[{ label: '홀', count: 3, color: ACCENT }, { label: '주방', count: 2, color: '#60A5FA' }, { label: '카운터', count: 1, color: '#F59E0B' }].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{r.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.count}명</span>
                </div>
              ))}
            </div>

            {/* 카드2: 출근 D-1 알림 */}
            <div className="sh-hero-card2" style={{ position: 'absolute', top: '12%', right: '4%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left', maxWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>◆</span>
                <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700 }}>출근 D-1 알림</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>내일 오후 2시<br />카운터 근무가 있습니다.</div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>방금 전 · 읽음 ✓</div>
            </div>

            {/* 카드3: 주간 배정 */}
            <div className="sh-hero-card3" style={{ position: 'absolute', bottom: '12%', left: '5%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>주간 배정</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
                {['월', '화', '수', '목', '금', '토'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                ))}
                {[true, true, false, true, true, false, false, true, false, true, false, true].map((filled, i) => (
                  <div key={i} style={{ height: 20, borderRadius: 4, background: filled ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filled ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.07)'}` }} />
                ))}
              </div>
            </div>

            {/* 카드4: 이번 달 근무 */}
            <div className="sh-hero-card4" style={{ position: 'absolute', bottom: '14%', right: '5%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '14px 18px', textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>이번 달 근무</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>38<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>시간</span></div>
              <div style={{ marginTop: 6, fontSize: 11, color: ACCENT, fontWeight: 700 }}>↑ +5시간 지난달 대비</div>
            </div>
          </div>

          <div className="sh-badge" style={{ display: 'inline-block', background: 'rgba(34,197,94,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>알바 스케줄 자동화</div>
          <h1 className="sh-h1" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 720 }}>
            알바 짜는 데 30분?<br /><span style={{ color: ACCENT }}>SHIFT:ON</span>이면 5분입니다.
          </h1>
          <p className="sh-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>드래그 배정, 자동 알림, 근무 시간 집계. 매장 운영에만 집중하십시오.</p>
          <button className="sh-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기 →</button>
        </section>

        {/* wave divider */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)', margin: '0 24px' }} />

        {/* Pain 섹션 */}
        <section style={{ padding: '100px 24px', maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 12 }}>지금도 이렇게 하고 계신가요?</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>매장 운영자가 가장 많이 겪는 스케줄 관리의 어려움입니다.</p>
          </Anim>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '·', title: '카카오톡으로 일일이', desc: '근무 가능 여부를 한 명씩 물어보고 취합하느라 시간을 낭비합니다.' },
              { icon: '·', title: '엑셀 스케줄표 공유', desc: '파일을 공유한 뒤 수정 요청이 폭주해 버전 관리가 불가능합니다.' },
              { icon: '·', title: '교대 바꾸기 요청', desc: '교대 바꿔줄 사람을 직접 찾아달라는 연락이 매주 반복됩니다.' },
            ].map((item, i) => (
              <Anim key={item.title} delay={i * 80}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 20px', textAlign: 'left' }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </Anim>
            ))}
          </div>
        </section>

        {/* wave divider */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)', margin: '0 24px' }} />

        {/* F01 — 드래그 배정 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.05), transparent)' }}>
          <div className="sh-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="sh-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>01 — 드래그 배정</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>드래그 한 번으로<br />배정 완료</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 20 }}>이름을 칸에 올려놓으면 즉시 배정됩니다. 역할별 색상(홀·주방·카운터)으로 전체 현황을 한눈에 파악하십시오.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['역할별 필요 인원 초과 시 자동 경고', '교대 신청 즉시 반영'].map(pt => (
                  <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span>{pt}
                  </div>
                ))}
              </div>
            </Anim>
            <Anim delay={120} className="sh-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>주간 배정표</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  {[['홀', ACCENT], ['주방', '#60A5FA'], ['카운터', '#F59E0B']].map(([label, color]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(5, 1fr)', gap: 4 }}>
                  <div />
                  {['월', '화', '수', '목', '금'].map(d => (
                    <div key={d} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingBottom: 4 }}>{d}</div>
                  ))}
                  {([
                    { time: '10:00', cells: [{ name: '지민', role: 'hall' }, null, { name: '수빈', role: 'counter' }, { name: '지민', role: 'hall' }, null] },
                    { time: '14:00', cells: [null, { name: '태양', role: 'kitchen' }, { name: '지민', role: 'hall' }, null, { name: '수빈', role: 'counter' }] },
                    { time: '18:00', cells: [{ name: '수빈', role: 'counter' }, { name: '지민', role: 'hall' }, null, { name: '태양', role: 'kitchen' }, { name: '지민', role: 'hall' }] },
                  ] as { time: string; cells: ({ name: string; role: string } | null)[] }[]).map((row, ri) => ([
                    <div key={`t-${row.time}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                    ...row.cells.map((cell, ci) => {
                      const color = cell?.role === 'hall' ? ACCENT : cell?.role === 'kitchen' ? '#60A5FA' : '#F59E0B'
                      return cell ? (
                        <div key={ci} style={{ background: cell.role === 'hall' ? 'rgba(34,197,94,0.12)' : cell.role === 'kitchen' ? 'rgba(96,165,250,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${color}55`, borderRadius: 7, padding: '6px 3px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)', opacity: 0, animation: `fadeUp 0.4s ease ${300 + (ri * 5 + ci) * 50}ms both` }}>{cell.name}</div>
                      ) : (
                        <div key={ci} style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 3px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>+</div>
                      )
                    }),
                  ]))}
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F02 — 출근 전 자동 알림 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="sh-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="sh-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 340, justifySelf: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>출근 알림 발송 현황</span>
                </div>
                <div style={{ background: '#111827', border: '2px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '16px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textAlign: 'center' }}>SHIFT:ON 알림</div>
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>◆ 내일 출근 안내</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>내일 오후 2시 카운터<br />근무가 있습니다.<br />지각 없이 출근하십시오.</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>발송 내역 · 오늘 오후 1시</div>
                {[
                  { name: '김지민', status: '읽음', color: ACCENT },
                  { name: '이수빈', status: '읽음', color: ACCENT },
                  { name: '박태양', status: '미확인', color: 'rgba(255,255,255,0.35)' },
                ].map((r, i) => (
                  <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 5, fontSize: 12, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 100}ms forwards` }}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <span style={{ color: r.color, fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </Anim>
            <Anim className="sh-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>02 — 출근 전 자동 알림</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>연락 안 해도<br />알아서 출근합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>출근 하루 전 해당 알바에게 자동 문자를 발송합니다. 읽음 여부까지 확인하여 미확인 인원에게 추가 안내를 발송할 수 있습니다.</p>
            </Anim>
          </div>
        </section>

        {/* F03 — 근무 시간 집계 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.05), transparent)' }}>
          <div className="sh-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="sh-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>03 — 근무 시간 집계</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>급여 정산이<br />1분이면 됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>알바별 월간 근무 시간을 자동으로 집계합니다. 시급을 입력하면 예상 급여까지 즉시 계산하여 정산 자료를 제공합니다.</p>
            </Anim>
            <Anim delay={120} className="sh-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>이번 달 급여 정산</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.8fr 1fr', fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '0 8px 8px', textAlign: 'center' }}>
                  <span style={{ textAlign: 'left' }}>이름</span><span>근무</span><span>시급</span><span>예상급여</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { name: '김지민', hours: '38h', wage: '10,030', pay: '380,540', highlight: false },
                    { name: '이수빈', hours: '42h', wage: '10,030', pay: '421,260', highlight: true },
                    { name: '박태양', hours: '24h', wage: '11,000', pay: '264,000', highlight: false },
                    { name: '최하늘', hours: '32h', wage: '10,030', pay: '320,960', highlight: false },
                  ].map((r, i) => (
                    <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.8fr 1fr', alignItems: 'center', background: r.highlight ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${r.highlight ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, textAlign: 'center', opacity: 0, animation: `fadeUp 0.5s ease ${150 + i * 100}ms forwards` }}>
                      <span style={{ fontWeight: 600, textAlign: 'left' }}>{r.name}</span>
                      <span style={{ color: r.highlight ? ACCENT : 'rgba(255,255,255,0.6)', fontWeight: r.highlight ? 700 : undefined }}>{r.hours}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>₩{r.wage}</span>
                      <span style={{ color: r.highlight ? ACCENT : 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: 11 }}>₩{r.pay}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F04 — 반복 배정 + 예외 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="sh-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="sh-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 340, justifySelf: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>반복 배정 설정</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: 'rgba(255,255,255,0.8)' }}>반복 배정</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>요일</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => {
                      const on = i === 2 || i === 4
                      return <span key={d} style={{ width: 24, height: 24, borderRadius: 6, background: on ? 'rgba(34,197,94,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>시간</div>
                  <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 7, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>매주 화·목 18:00</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>자동 생성된 슬롯</div>
                  {['8/5 (화) · 18:00', '8/7 (목) · 18:00', '8/12 (화) · 18:00'].map((slot, i) => (
                    <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 6, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 100}ms forwards` }}>
                      <span style={{ color: ACCENT }}>✓</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>8/15 광복절 휴무</span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 10, padding: '4px 10px', borderRadius: 8 }}>+ 예외 추가</span>
                </div>
              </div>
            </Anim>
            <Anim className="sh-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>04 — 반복 배정 + 예외</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>고정 알바는 한 번만<br />설정하면 됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>매주 같은 요일·시간으로 반복 배정하십시오. 공휴일이나 특별 영업일은 그날만 예외 처리하여 정확한 스케줄을 유지합니다.</p>
            </Anim>
          </div>
        </section>

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
              {['카페', '음식점', '편의점', '베이커리', '마트', '소매점', '호텔', '주점', '패스트푸드', '치킨집'].map((tag, i) => (
                <span key={tag} className="sh-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 50}ms forwards` }}>{tag}</span>
              ))}
            </div>
          </Anim>
        </section>

        {/* 엔진 기능 */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Anim style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>엔진</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>알바 스케줄 뒤에서 움직이는 운영 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>SHIFT:ON은 매장 규모와 업종을 가리지 않는 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                        {([
                          { n: '1', label: '매장 이름 · 업종', done: true },
                          { n: '2', label: '운영 모드 선택', done: true },
                          { n: '3', label: '역할 설정 (홀/주방/카운터)', done: true },
                          { n: '4', label: '슬롯 규칙', active: true },
                          { n: '5', label: '운영 시간', done: false },
                          { n: '6', label: '커스텀 필드', done: false },
                          { n: '7', label: '테마 색상', done: false },
                        ] as { n: string; label: string; done?: boolean; active?: boolean }[]).map(step => (
                          <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: step.done ? 'rgba(34,197,94,0.04)' : step.active ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 7, fontSize: 11 }}>
                            <div style={{ width: 19, height: 19, borderRadius: '50%', background: step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', color: step.done ? ACCENT : step.active ? ACCENT : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{step.done ? '✓' : step.n}</div>
                            <span style={{ flex: 1, fontWeight: 600, color: step.done ? 'rgba(255,255,255,0.35)' : step.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', textDecoration: step.done ? 'line-through' : undefined }}>{step.label}</span>
                            {step.active && <span style={{ fontSize: 10, color: ACCENT }}>진행 중</span>}
                            {step.done && <span style={{ color: ACCENT, fontSize: 11 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 5 }}>예상 소요 시간 · 약 5분</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #16a34a)`, borderRadius: 2, animation: 'wizFill 5s linear infinite' }} />
                      </div>
                    </div>
                  ),
                  title: '5분 셋업 위자드',
                  desc: '역할(홀·주방·카운터) 설정부터 운영 시간, 슬롯 규칙까지 7단계 안내로 바로 시작합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {([['월간', false], ['주간', true], ['일간', false]] as [string, boolean][]).map(([label, active]) => (
                          <span key={label} style={{ flex: 1, textAlign: 'center', background: active ? ACCENT : 'rgba(255,255,255,0.07)', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: active ? 700 : undefined, padding: '4px 0', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '30px repeat(5, 1fr)', gap: 3 }}>
                        <div />
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>{d}</div>
                        ))}
                        {([
                          { time: '10:00', cells: ['지민', null, '수빈', null, '지민'] },
                          { time: '14:00', cells: [null, '태양', '지민', null, '수빈'] },
                          { time: '18:00', cells: ['수빈', '지민', null, '태양', null] },
                        ] as { time: string; cells: (string | null)[] }[]).map(row => ([
                          <div key={`t-${row.time}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                          ...row.cells.map((name, ci) => (
                            <div key={`${row.time}-${ci}`} style={{ height: 22, borderRadius: 4, background: name ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${name ? 'rgba(34,197,94,0.28)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: name ? 600 : undefined, color: name ? 'rgba(255,255,255,0.8)' : 'transparent' }}>{name ? name.slice(0, 2) : '·'}</div>
                          )),
                        ]))}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                        {(['일자별', '시간별'] as string[]).map((label, i) => (
                          <span key={label} style={{ background: i === 1 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', color: i === 1 ? ACCENT : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 1 ? 700 : undefined, padding: '3px 10px', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간, 일자별·시간별 보기를 상황에 따라 자유롭게 전환합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {([
                          { label: '점장 화면', slots: [{ time: '10:00', name: '지민 배정', live: false }, { time: '14:00', name: '✦ 교대 완료!', live: true, isNew: true }, { time: '18:00', name: '수빈 배정', live: false }] },
                          { label: '알바 화면', slots: [{ time: '10:00', name: '확인됨', live: false }, { time: '14:00', name: '✦ 일정 변경!', live: true, isNew: true }, { time: '18:00', name: '확인됨', live: false }] },
                        ] as { label: string; slots: { time: string; name: string; live: boolean; isNew?: boolean }[] }[]).map(pane => (
                          <div key={pane.label} style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT, display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
                              {pane.label}
                            </div>
                            {pane.slots.map(slot => (
                              <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 4, fontSize: 10, animation: slot.live ? 'liveSlot 3s ease-in-out infinite' : undefined }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{slot.time}</span>
                                <span style={{ color: slot.isNew ? ACCENT : 'rgba(255,255,255,0.7)', fontWeight: slot.live ? 700 : undefined }}>{slot.name}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '6px 10px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: 7, fontSize: 9, color: 'rgba(34,197,94,0.8)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ animation: 'ledPulse 1s ease-in-out infinite' }}>●</span>
                        실시간 구독 중 · tenant_id 필터 적용
                      </div>
                    </div>
                  ),
                  title: '실시간 동기화',
                  desc: '점장과 알바가 동시에 화면을 봐도 새로고침 없이 즉시 반영되어 중복 배정을 방지합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>반복 유형</div>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {(['매일', '매주', '매월'] as string[]).map((label, i) => (
                          <span key={label} style={{ background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 1 ? 700 : undefined, padding: '3px 10px', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>요일 선택</div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                        {(['일', '월', '화', '수', '목', '금', '토'] as string[]).map((d, i) => {
                          const on = i === 2 || i === 4 || i === 6
                          return <span key={d} style={{ width: 22, height: 22, borderRadius: 6, background: on ? 'rgba(34,197,94,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                        })}
                      </div>
                      {['8/5 (화) · 18:00', '8/7 (목) · 18:00', '8/9 (토) · 18:00'].map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록',
                  desc: '고정 알바를 요일·시간대로 한 번 등록하면 이후 슬롯이 자동으로 생성됩니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      {/* 인원 설정 */}
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>인원 설정</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                        {([
                          { name: '김지민', color: ACCENT, days: '화·목·토', max: 16, delay: 0 },
                          { name: '이수빈', color: '#60A5FA', days: '월·수·금', max: 12, delay: 80 },
                          { name: '박태양', color: '#F59E0B', days: '주말', max: 8, delay: 160 },
                        ] as { name: string; color: string; days: string; max: number; delay: number }[]).map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: 11, opacity: 0, animation: `fadeUp 0.4s ease ${m.delay}ms forwards` }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)' }}>{m.days} 선호</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: m.color, background: `${m.color}1a`, padding: '2px 5px', borderRadius: 4 }}>최대 {m.max}회/월</span>
                          </div>
                        ))}
                      </div>
                      {/* 역할별 비율 */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>역할별 배정 비율</div>
                        {([
                          { label: '홀', pct: 50, count: '2명', color: ACCENT, delay: 260 },
                          { label: '주방', pct: 30, count: '1명', color: '#60A5FA', delay: 360 },
                          { label: '카운터', pct: 20, count: '1명', color: '#F59E0B', delay: 460 },
                        ] as { label: string; pct: number; count: string; color: string; delay: number }[]).map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, opacity: 0, animation: `fadeUp 0.4s ease ${r.delay}ms forwards` }}>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 36, flexShrink: 0 }}>{r.label}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, background: r.color, width: `${r.pct}%`, transformOrigin: 'left', animation: `barFill 0.6s ease ${r.delay + 150}ms both` }} />
                            </div>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 22, flexShrink: 0, textAlign: 'right' }}>{r.pct}%</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', width: 18, flexShrink: 0, textAlign: 'right' }}>{r.count}</span>
                          </div>
                        ))}
                      </div>
                      {/* 실행 버튼 */}
                      <div style={{ textAlign: 'center', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 9, marginBottom: 10, animation: 'autoGlow 3s ease-in-out infinite' }}>자동배정 실행</div>
                      {/* 결과 그리드 */}
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>배정 결과 미리보기</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {([
                          { init: '이', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', color: '#60A5FA', delay: 600 },
                          { init: '김', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: ACCENT, delay: 750 },
                          { init: '이', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', color: '#60A5FA', delay: 900 },
                          { init: '김', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: ACCENT, delay: 1050 },
                          { init: '박', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1200 },
                          { init: '박', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1350 },
                          { init: '—',  bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1500 },
                          { init: '박', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1650 },
                          { init: '—',  bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1800 },
                          { init: '이', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', color: '#60A5FA', delay: 1950 },
                        ] as { init: string; bg: string; border: string; color: string; delay: number }[]).map((cell, i) => (
                          <div key={i} style={{ padding: '5px 0', textAlign: 'center', borderRadius: 5, background: cell.bg, border: `1px solid ${cell.border}`, fontSize: 10, fontWeight: 700, color: cell.color, opacity: 0, animation: `cellFill 0.4s ease ${cell.delay}ms forwards` }}>{cell.init}</div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별 배정 비율과 월별 최대 횟수를 설정하면, 알바의 가능 요일에 맞춰 빈 슬롯을 자동으로 채웁니다.',
                },
                {
                  visual: (() => {
                    const days = Array.from({ length: 31 }, (_, i) => {
                      const d = i + 1
                      const dow = (6 + i) % 7
                      const isSlot = dow === 2 || dow === 4 || dow === 6
                      const isHol = d === 15
                      const isSpc = d === 22
                      const isToday = d === 14
                      return { d, isSlot, isHol, isSpc, isToday }
                    })
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: 'rgba(255,255,255,0.8)' }}>2026년 8월</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
                          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.28)', paddingBottom: 3 }}>{d}</div>
                          ))}
                          {Array.from({ length: 6 }, (_, i) => <div key={`e${i}`} />)}
                          {days.map(({ d, isSlot, isHol, isSpc, isToday }) => (
                            <div key={d} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: isToday ? '50%' : 4, background: isToday ? ACCENT : isHol ? 'rgba(239,68,68,0.18)' : isSpc ? 'rgba(34,197,94,0.15)' : 'transparent', position: 'relative' }}>
                              <span style={{ fontSize: 9, fontWeight: isToday ? 700 : undefined, color: isToday ? '#fff' : isHol ? '#ef4444' : isSpc ? '#22c55e' : isSlot ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }}>{d}</span>
                              {isSlot && !isHol && !isSpc && !isToday && (
                                <span style={{ position: 'absolute', bottom: 1, width: 3, height: 3, borderRadius: '50%', background: ACCENT }} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {[
                            { dot: true, color: ACCENT, label: '반복 슬롯' },
                            { dot: false, bg: 'rgba(239,68,68,0.5)', label: '광복절 휴무' },
                            { dot: false, bg: 'rgba(34,197,94,0.5)', label: '특별 영업일' },
                          ].map(li => (
                            <div key={li.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>
                              {li.dot
                                ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: li.color }} />
                                : <span style={{ width: 7, height: 7, borderRadius: 2, background: li.bg }} />}
                              {li.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })(),
                  title: '반복 규칙 + 날짜 예외',
                  desc: '기본 운영 요일 규칙에 공휴일·특별 영업일을 날짜 단위로 예외 처리합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>알바 정보 · 커스텀 필드</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {([
                          { type: '숫자', label: '시급', value: '10,030원', tc: ACCENT, tb: 'rgba(34,197,94,0.1)' },
                          { type: '텍스트', label: '계좌번호', value: '국민 1234-***', tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                          { type: '선택', label: '고용 형태', value: '아르바이트', tc: '#818cf8', tb: 'rgba(99,102,241,0.12)' },
                          { type: '날짜', label: '근무 시작일', value: '2026.06.01', tc: '#60A5FA', tb: 'rgba(96,165,250,0.1)' },
                        ] as { type: string; label: string; value: string; tc: string; tb: string }[]).map(f => (
                          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                            <span style={{ background: f.tb, color: f.tc, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{f.type}</span>
                            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{f.label}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ border: `1px dashed ${ACCENT}`, borderRadius: 8, padding: '7px', textAlign: 'center', fontSize: 11, color: ACCENT, fontWeight: 700 }}>+ 필드 추가</div>
                    </div>
                  ),
                  title: '입력항목 설정',
                  desc: '시급, 계좌번호, 고용 형태 등 매장 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>화 18:00 · 김지민</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>홀 · 저녁 타임</div>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>첨부 사진</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <svg width="28" height="26" viewBox="0 0 28 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="1" y="4" width="26" height="20" rx="3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4"/>
                            <path d="M1 16 L8 10 L13 15 L19 8 L27 16" stroke="rgba(255,255,255,0.38)" strokeWidth="1.3" strokeLinejoin="round"/>
                            <circle cx="8.5" cy="10" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/>
                            <rect x="18" y="1" width="8" height="6" rx="2" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                            <circle cx="22" cy="4" r="1.2" fill="rgba(255,255,255,0.55)"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>업무지시_홀담당_0804.webp</div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: '100%', height: '100%', background: ACCENT, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>284 KB · 압축 완료</div>
                        </div>
                      </div>
                    </div>
                  ),
                  title: '사진 첨부',
                  desc: '업무 지시사항 사진을 배정에 첨부합니다. 브라우저에서 자동 압축되어 저장 효율을 높입니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', marginBottom: 8, fontSize: 8, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: ACCENT, fontWeight: 700 }}>엑셀 모드 ON</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>
                        드래그 또는 Shift+클릭으로 범위 선택, Ctrl+C/V 복사·붙여넣기
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>이번 주 스케줄</div>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>드래그 선택 중</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(5, 1fr)', gap: 3, marginBottom: 10 }}>
                        <div />
                        {(['월','화','수','목','금'] as string[]).map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                        ))}
                        {([
                          { time: '10:00', delays: [null, 0, 350, null, null] },
                          { time: '14:00', delays: [null, 700, 1050, null, null] },
                          { time: '18:00', delays: [null, null, null, null, null] },
                        ] as { time: string; delays: (number | null)[] }[]).map(row => ([
                          <div key={`t-${row.time}`} style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                          ...row.delays.map((delay, ci) => (
                            <div key={`${row.time}-${ci}`} style={{
                              height: 18, borderRadius: 3,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              ...(delay !== null ? { animation: `dragSel 3.6s ease ${delay}ms infinite` } : {}),
                            }} />
                          )),
                        ]))}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                        <div style={{ flex: 1, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: ACCENT, fontWeight: 600 }}>이번 주 선택</div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '0 2px' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: ACCENT, fontWeight: 600 }}>다음 주 붙여넣기</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['XLSX', 'PDF', 'CSV', 'DOCX'] as string[]).map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 문서다운로드',
                  desc: '셀을 드래그해 복사·붙여넣기. 급여 계산용 스케줄을 XLSX·CSV·PDF로 내보냅니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"지민이 이번주 토요일 저녁 카운터"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {([
                            { label: '알바', value: '김지민' },
                            { label: '요일', value: '이번주 토요일' },
                            { label: '시간', value: '18:00' },
                            { label: '역할', value: '카운터' },
                          ] as { label: string; value: string }[]).map(item => (
                            <div key={item.label}>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{item.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', borderRadius: 7, padding: '7px' }}>슬롯에 등록</div>
                      </div>
                    </div>
                  ),
                  title: 'AI 자연어 예약',
                  desc: '"지민이 이번주 토요일 저녁 카운터"처럼 말하듯 입력하면 자동으로 슬롯에 등록됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="sh-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, paddingLeft: 2 }}>{card.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, paddingLeft: 2, marginBottom: 16 }}>{card.desc}</div>
                    <div style={{ overflow: 'hidden' }}>{card.visual}</div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <Anim>
          <section style={{ textAlign: 'center', padding: '60px 24px 100px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>스케줄 관리의 번거로움을 해소하십시오.<br />SHIFT:ON이 대신합니다.</h2>
            <button className="sh-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

      </div>
      <DevFileLabel file="LandingShiftOn.tsx" />
    </>
  )
}
