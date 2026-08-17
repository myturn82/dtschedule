// src/pages/landing/LandingServeOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#10B981'

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

export function LandingServeOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=serveon')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(16,185,129,0.35);} 50% { box-shadow:0 8px 52px rgba(16,185,129,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(16,185,129,0.3); } 50%{ box-shadow:0 6px 28px rgba(16,185,129,0.6); } }
        @keyframes barFill   { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes dragSel   { 0%,8%{ background:rgba(255,255,255,0.04); box-shadow:none; } 32%,68%{ background:rgba(16,185,129,0.18); box-shadow:inset 0 0 0 2px rgba(16,185,129,0.6); } 88%,100%{ background:rgba(255,255,255,0.04); box-shadow:none; } }
        @keyframes barGrow   { from{ width:0%; } to{ width:var(--bar-w); } }
        @keyframes float1    { 0%,100%{ transform:translateY(0px) rotate(-2deg); } 50%{ transform:translateY(-10px) rotate(-2deg); } }
        @keyframes float2    { 0%,100%{ transform:translateY(0px) rotate(2deg); } 50%{ transform:translateY(-14px) rotate(2deg); } }
        @keyframes float3    { 0%,100%{ transform:translateY(0px) rotate(-1deg); } 50%{ transform:translateY(-8px) rotate(-1deg); } }
        @keyframes float4    { 0%,100%{ transform:translateY(0px) rotate(1.5deg); } 50%{ transform:translateY(-12px) rotate(1.5deg); } }
        body { margin:0; background:#0a0b10; }
        .sv-nav   { animation: navFade 0.5s ease both; }
        .sv-badge { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .sv-h1    { animation: fadeUp 0.75s ease 0.22s both; }
        .sv-sub   { animation: fadeUp 0.65s ease 0.38s both; }
        .sv-cta   { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .sv-glow  { animation: glowPulse 5s ease-in-out infinite; }
        .sv-card  { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .sv-card:hover { transform:translateY(-6px); border-color:rgba(16,185,129,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .sv-tag-btn { transition: background 0.18s, transform 0.18s; }
        .sv-tag-btn:hover { transform:scale(1.06); }
        .sv-hero-card1 { animation: float1 4.5s ease-in-out 0.3s infinite; }
        .sv-hero-card2 { animation: float2 5s ease-in-out 0.8s infinite; }
        .sv-hero-card3 { animation: float3 4.2s ease-in-out 1.2s infinite; }
        .sv-hero-card4 { animation: float4 4.8s ease-in-out 0.5s infinite; }
        @media (max-width:720px) {
          .sv-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .sv-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .sv-feat-text { order:1 !important; text-align:center !important; }
          .sv-hero-cards { display:none !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

        {/* Nav */}
        <nav className="sv-nav" style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(10,11,16,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>SERVE:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '120px 24px 140px', position: 'relative', overflow: 'hidden' }}>
          <div className="sv-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(16,185,129,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />

          {/* 플로팅 카드 */}
          <div className="sv-hero-cards" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            {/* 카드1: 봉사자 현황 */}
            <div className="sv-hero-card1" style={{ position: 'absolute', top: '14%', left: '4%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left', minWidth: 170 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>봉사자 현황</div>
              {[
                { label: '등록', value: '42명', color: 'rgba(255,255,255,0.7)' },
                { label: '이번 달 활동', value: '18명', color: ACCENT },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* 카드2: 참석 알림 */}
            <div className="sv-hero-card2" style={{ position: 'absolute', top: '12%', right: '4%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left', maxWidth: 210 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>◆</span>
                <span style={{ fontSize: 10, color: ACCENT, fontWeight: 700 }}>참석 알림</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>내일 오전 9시<br />급식 봉사가 있습니다.</div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>방금 전 · 읽음 ✓</div>
            </div>

            {/* 카드3: 이번 주 배정 */}
            <div className="sv-hero-card3" style={{ position: 'absolute', bottom: '12%', left: '5%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '14px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>이번 주 배정</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                {['월', '화', '수', '목', '금'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                ))}
                {[true, false, true, false, true, false, true, false, true, false].map((filled, i) => (
                  <div key={i} style={{ height: 20, borderRadius: 4, background: filled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${filled ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)'}` }} />
                ))}
              </div>
            </div>

            {/* 카드4: 봉사 시간 */}
            <div className="sv-hero-card4" style={{ position: 'absolute', bottom: '14%', right: '5%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: '14px 18px', textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>봉사 시간</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>126<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)', marginLeft: 3 }}>시간</span></div>
              <div style={{ marginTop: 6, fontSize: 11, color: ACCENT, fontWeight: 700 }}>평균 7시간/인</div>
            </div>
          </div>

          <div className="sv-badge" style={{ display: 'inline-block', background: 'rgba(16,185,129,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>봉사 활동 관리 플랫폼</div>
          <h1 className="sv-h1" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 720 }}>
            봉사자 모집부터 배정·확인까지<br /><span style={{ color: ACCENT }}>엑셀 없이 한 화면에</span>
          </h1>
          <p className="sv-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.7 }}>봉사자 명단, 일정 배정, 봉사 시간 집계를 SERVE:ON이 자동으로 처리합니다.</p>
          <button className="sv-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기 →</button>
          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>신용카드 불필요 · 10명까지 영구 무료 · 30초 가입</div>
        </section>

        {/* wave divider */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)', margin: '0 24px' }} />

        {/* Pain 섹션 */}
        <section style={{ padding: '100px 24px', maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 12 }}>지금도 이렇게 하고 계신가요?</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>봉사 담당자가 가장 많이 겪는 관리의 어려움입니다.</p>
          </Anim>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '·', title: '엑셀 + 카톡 그룹방', desc: '봉사자 명단을 엑셀로 관리하고 카톡 그룹방으로 공지하느라 정보가 분산됩니다.' },
              { icon: '·', title: '일일이 전화·문자', desc: '참석 여부를 한 명씩 확인하느라 봉사 준비보다 연락에 더 많은 시간을 씁니다.' },
              { icon: '·', title: '봉사 시간 수기 계산', desc: '활동 시간을 개별로 집계하고 인증서 자료를 수작업으로 정리합니다.' },
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
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)', margin: '0 24px' }} />

        {/* F01 — 봉사자 명단 + 커스텀 필드 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.05), transparent)' }}>
          <div className="sv-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="sv-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>01 — 봉사자 명단</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>봉사자 정보를<br />체계적으로 관리합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>가능 요일, 자격증, 보유 차량 등 단체 고유 항목을 코드 수정 없이 추가합니다. 모든 정보를 한 화면에서 조회하십시오.</p>
            </Anim>
            <Anim delay={120} className="sv-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>봉사자 명단</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.5fr 0.7fr', fontSize: 10, color: 'rgba(255,255,255,0.35)', padding: '0 6px 8px', textAlign: 'center' }}>
                  <span style={{ textAlign: 'left' }}>이름</span><span>가능 요일</span><span>자격증</span><span>차량</span><span>누적시간</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { name: '김영희', days: '월·수·금', cert: '사회복지사', car: '○', hours: '48h', highlight: false },
                    { name: '이철수', days: '화·목', cert: '없음', car: '○', hours: '32h', highlight: false },
                    { name: '박미영', days: '전일 가능', cert: '요양보호사', car: '✕', hours: '61h', highlight: true },
                    { name: '최준호', days: '주말', cert: '없음', car: '○', hours: '24h', highlight: false },
                  ].map((r, i) => (
                    <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 0.8fr 0.5fr 0.7fr', alignItems: 'center', background: r.highlight ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${r.highlight ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '9px 10px', fontSize: 11, textAlign: 'center', opacity: 0, animation: `fadeUp 0.5s ease ${150 + i * 100}ms forwards` }}>
                      <span style={{ fontWeight: 600, textAlign: 'left' }}>{r.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{r.days}</span>
                      <span style={{ color: r.cert !== '없음' ? ACCENT : 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: r.cert !== '없음' ? 700 : undefined }}>{r.cert}</span>
                      <span style={{ color: r.car === '○' ? ACCENT : 'rgba(255,255,255,0.35)' }}>{r.car}</span>
                      <span style={{ color: r.highlight ? ACCENT : 'rgba(255,255,255,0.6)', fontWeight: r.highlight ? 700 : undefined }}>{r.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F02 — 자동 배정 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="sv-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="sv-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 360, justifySelf: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>활동 배정</span>
                </div>
                {/* 활동 카드 */}
                <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>급식 봉사</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>8월 15일 오전 9시 · 경로식당</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: '봉사자', need: 5, filled: 3 },
                      { label: '담당자', need: 1, filled: 1 },
                    ].map(r => (
                      <div key={r.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: r.filled >= r.need ? ACCENT : '#F59E0B' }}>{r.filled}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>/{r.need}</span></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', borderRadius: 8, padding: '8px', animation: 'autoGlow 3s ease-in-out infinite', cursor: 'default' }}>자동배정 실행</div>
                </div>
                {/* 배정 결과 */}
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>배정 결과</div>
                {['김영희', '박미영', '최준호'].map((name, i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 7, marginBottom: 4, fontSize: 11, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 100}ms forwards` }}>
                    <span style={{ color: ACCENT }}>✓</span>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>배정됨</span>
                  </div>
                ))}
              </div>
            </Anim>
            <Anim className="sv-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>02 — 자동 배정</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>역할별 필요 인원을<br />자동으로 채웁니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>활동마다 필요한 역할·인원 수를 설정하면 가능한 봉사자를 자동으로 배정합니다. 직접 연락하지 않아도 적임자가 채워집니다.</p>
            </Anim>
          </div>
        </section>

        {/* F03 — 봉사 시간 자동 집계 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.05), transparent)' }}>
          <div className="sv-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="sv-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>03 — 봉사 시간 집계</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>인증서 발급 자료가<br />자동으로 준비됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>참석 체크 시 봉사 시간이 자동으로 누적됩니다. 개인별 누적 시간을 인증서·수료증 발급 자료로 즉시 활용하십시오.</p>
            </Anim>
            <Anim delay={120} className="sv-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>봉사자별 누적 시간</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { name: '박미영', hours: 61, max: 80, color: ACCENT },
                    { name: '김영희', hours: 48, max: 80, color: '#60A5FA' },
                    { name: '이철수', hours: 32, max: 80, color: '#A78BFA' },
                    { name: '최준호', hours: 24, max: 80, color: '#F59E0B' },
                    { name: '정다은', hours: 18, max: 80, color: 'rgba(255,255,255,0.4)' },
                  ].map((r, i) => (
                    <div key={r.name} style={{ opacity: 0, animation: `fadeUp 0.5s ease ${150 + i * 80}ms forwards` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.hours}h</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(r.hours / r.max) * 100}%`, background: r.color, borderRadius: 4, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 8, fontSize: 11, color: ACCENT, textAlign: 'center', fontWeight: 700 }}>인증서 자료 내보내기</div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F04 — D-1 참석 알림 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="sv-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="sv-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 340, justifySelf: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F59E0B' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>참석 알림 발송 현황</span>
                </div>
                <div style={{ background: '#111827', border: '2px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '16px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 8, textAlign: 'center' }}>SERVE:ON 알림</div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>◆ 내일 봉사 안내</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>내일 오전 9시 급식 봉사가<br />있습니다. 시간에 맞춰<br />참석하십시오.</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>발송 내역 · 오늘 오후 2시</div>
                {[
                  { name: '김영희', status: '읽음', color: ACCENT },
                  { name: '박미영', status: '읽음', color: ACCENT },
                  { name: '이철수', status: '미확인', color: 'rgba(255,255,255,0.35)' },
                ].map((r, i) => (
                  <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 5, fontSize: 12, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 100}ms forwards` }}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    <span style={{ color: r.color, fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </Anim>
            <Anim className="sv-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>04 — D-1 참석 알림</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>참석 확인 연락을<br />자동으로 보냅니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>활동 하루 전 배정된 봉사자에게 자동 알림을 발송합니다. 읽음 여부를 추적하여 미확인 인원에게 추가 안내를 보낼 수 있습니다.</p>
            </Anim>
          </div>
        </section>

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
              {['복지관', '사회복지시설', '시민단체', '종교단체', '지자체', '도서관', '문화시설', '자원봉사센터', '병원 봉사', '환경단체'].map((tag, i) => (
                <span key={tag} className="sv-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 50}ms forwards` }}>{tag}</span>
              ))}
            </div>
          </Anim>
        </section>

        {/* 엔진 기능 */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Anim style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>엔진</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>봉사 활동 뒤에서 움직이는 운영 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>SERVE:ON은 다양한 봉사 단체에 적용 가능한 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                        {([
                          { n: '1', label: '단체 이름 · 분야', done: true },
                          { n: '2', label: '운영 모드 선택', done: true },
                          { n: '3', label: '역할 설정 (봉사자/담당자)', done: true },
                          { n: '4', label: '슬롯 규칙', active: true },
                          { n: '5', label: '운영 시간', done: false },
                          { n: '6', label: '커스텀 필드', done: false },
                          { n: '7', label: '테마 색상', done: false },
                        ] as { n: string; label: string; done?: boolean; active?: boolean }[]).map(step => (
                          <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: step.done ? 'rgba(16,185,129,0.04)' : step.active ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(16,185,129,0.18)' : step.active ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 7, fontSize: 11 }}>
                            <div style={{ width: 19, height: 19, borderRadius: '50%', background: step.done ? 'rgba(16,185,129,0.18)' : step.active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)', color: step.done ? ACCENT : step.active ? ACCENT : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{step.done ? '✓' : step.n}</div>
                            <span style={{ flex: 1, fontWeight: 600, color: step.done ? 'rgba(255,255,255,0.35)' : step.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', textDecoration: step.done ? 'line-through' : undefined }}>{step.label}</span>
                            {step.active && <span style={{ fontSize: 10, color: ACCENT }}>진행 중</span>}
                            {step.done && <span style={{ color: ACCENT, fontSize: 11 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 5 }}>예상 소요 시간 · 약 5분</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #059669)`, borderRadius: 2, animation: 'wizFill 5s linear infinite' }} />
                      </div>
                    </div>
                  ),
                  title: '5분 셋업 위자드',
                  desc: '단체 분야·역할(봉사자/담당자) 설정부터 슬롯 규칙까지 7단계 안내로 바로 시작합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {([['월간', true], ['주간', false], ['일간', false]] as [string, boolean][]).map(([label, active]) => (
                          <span key={label} style={{ flex: 1, textAlign: 'center', background: active ? ACCENT : 'rgba(255,255,255,0.07)', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: active ? 700 : undefined, padding: '4px 0', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.28)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {Array.from({ length: 3 }, (_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: 31 }, (_, i) => {
                          const d = i + 1
                          const dow = (3 + i) % 7
                          const hasAct = dow === 1 || dow === 3
                          return (
                            <div key={d} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: hasAct ? 'rgba(16,185,129,0.15)' : 'transparent', position: 'relative' }}>
                              <span style={{ fontSize: 8, color: hasAct ? ACCENT : 'rgba(255,255,255,0.3)', fontWeight: hasAct ? 700 : undefined }}>{d}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                        {(['일자별', '시간별'] as string[]).map((label, i) => (
                          <span key={label} style={{ background: i === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)', color: i === 0 ? ACCENT : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 0 ? 700 : undefined, padding: '3px 10px', borderRadius: 6 }}>{label}</span>
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
                          { label: '담당자 화면', slots: [{ time: '09:00', name: '영희 배정', live: false }, { time: '10:00', name: '✦ 신규 신청!', live: true, isNew: true }, { time: '14:00', name: '미영 배정', live: false }] },
                          { label: '봉사자 화면', slots: [{ time: '09:00', name: '확인됨', live: false }, { time: '10:00', name: '✦ 배정됨!', live: true, isNew: true }, { time: '14:00', name: '확인됨', live: false }] },
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
                      <div style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.14)', borderRadius: 7, fontSize: 9, color: 'rgba(16,185,129,0.8)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ animation: 'ledPulse 1s ease-in-out infinite' }}>●</span>
                        실시간 구독 중 · tenant_id 필터 적용
                      </div>
                    </div>
                  ),
                  title: '실시간 동기화',
                  desc: '담당자와 봉사자가 동시에 화면을 봐도 새로고침 없이 즉시 반영됩니다.',
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
                          const on = i === 1 || i === 3
                          return <span key={d} style={{ width: 22, height: 22, borderRadius: 6, background: on ? 'rgba(16,185,129,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                        })}
                      </div>
                      {['8/4 (월) · 09:00', '8/6 (수) · 09:00', '8/11 (월) · 09:00'].map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록',
                  desc: '정기 봉사 활동을 요일·시간대로 한 번 등록하면 이후 슬롯이 자동으로 생성됩니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>인원 설정</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                        {([
                          { name: '김영희', color: ACCENT, days: '월·수·금', max: 12, delay: 0 },
                          { name: '박미영', color: '#60A5FA', days: '전일', max: 16, delay: 80 },
                          { name: '이철수', color: '#A78BFA', days: '화·목', max: 8, delay: 160 },
                        ] as { name: string; color: string; days: string; max: number; delay: number }[]).map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: 11, opacity: 0, animation: `fadeUp 0.4s ease ${m.delay}ms forwards` }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)' }}>{m.days} 가능</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: m.color, background: `${m.color}1a`, padding: '2px 5px', borderRadius: 4 }}>최대 {m.max}회/월</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>역할별 배정 비율</div>
                        {([
                          { label: '교육지원', pct: 40, count: '2명', color: ACCENT, delay: 260 },
                          { label: '생활지원', pct: 35, count: '1명', color: '#60A5FA', delay: 360 },
                          { label: '행정지원', pct: 25, count: '1명', color: '#A78BFA', delay: 460 },
                        ] as { label: string; pct: number; count: string; color: string; delay: number }[]).map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, opacity: 0, animation: `fadeUp 0.4s ease ${r.delay}ms forwards` }}>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 42, flexShrink: 0 }}>{r.label}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, background: r.color, width: `${r.pct}%`, transformOrigin: 'left', animation: `barFill 0.6s ease ${r.delay + 150}ms both` }} />
                            </div>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 22, flexShrink: 0, textAlign: 'right' }}>{r.pct}%</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', width: 18, flexShrink: 0, textAlign: 'right' }}>{r.count}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 9, marginBottom: 10, animation: 'autoGlow 3s ease-in-out infinite' }}>자동배정 실행</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>배정 결과 미리보기</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {([
                          { init: '영', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: ACCENT, delay: 600 },
                          { init: '이', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', color: '#A78BFA', delay: 750 },
                          { init: '영', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: ACCENT, delay: 900 },
                          { init: '이', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', color: '#A78BFA', delay: 1050 },
                          { init: '박', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', color: '#60A5FA', delay: 1200 },
                          { init: '박', bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', color: '#60A5FA', delay: 1350 },
                          { init: '—',  bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1500 },
                          { init: '영', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: ACCENT, delay: 1650 },
                          { init: '—',  bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1800 },
                          { init: '이', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', color: '#A78BFA', delay: 1950 },
                        ] as { init: string; bg: string; border: string; color: string; delay: number }[]).map((cell, i) => (
                          <div key={i} style={{ padding: '5px 0', textAlign: 'center', borderRadius: 5, background: cell.bg, border: `1px solid ${cell.border}`, fontSize: 10, fontWeight: 700, color: cell.color, opacity: 0, animation: `cellFill 0.4s ease ${cell.delay}ms forwards` }}>{cell.init}</div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별 배정 비율과 월별 최대 횟수를 설정하면, 가능한 봉사자를 규칙에 맞춰 자동으로 배정합니다.',
                },
                {
                  visual: (() => {
                    const days = Array.from({ length: 31 }, (_, i) => {
                      const d = i + 1
                      const dow = (6 + i) % 7
                      const isSlot = dow === 1 || dow === 3
                      const isHol = d === 15
                      const isSpc = d === 20
                      const isToday = d === 11
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
                            <div key={d} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: isToday ? '50%' : 4, background: isToday ? ACCENT : isHol ? 'rgba(239,68,68,0.18)' : isSpc ? 'rgba(16,185,129,0.15)' : 'transparent', position: 'relative' }}>
                              <span style={{ fontSize: 9, fontWeight: isToday ? 700 : undefined, color: isToday ? '#fff' : isHol ? '#ef4444' : isSpc ? ACCENT : isSlot ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }}>{d}</span>
                              {isSlot && !isHol && !isSpc && !isToday && (
                                <span style={{ position: 'absolute', bottom: 1, width: 3, height: 3, borderRadius: '50%', background: ACCENT }} />
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {[
                            { dot: true, color: ACCENT, label: '정기 활동' },
                            { dot: false, bg: 'rgba(239,68,68,0.5)', label: '광복절 휴무' },
                            { dot: false, bg: 'rgba(16,185,129,0.5)', label: '특별 활동일' },
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
                  desc: '정기 활동 요일에 공휴일·특별 활동일을 날짜 단위로 예외 처리합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>봉사자 정보 · 커스텀 필드</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {([
                          { type: '선택', label: '가능 요일', value: '월·수·금', tc: ACCENT, tb: 'rgba(16,185,129,0.1)' },
                          { type: '텍스트', label: '자격증', value: '사회복지사', tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                          { type: '체크', label: '차량 유무', value: '보유', tc: '#60A5FA', tb: 'rgba(96,165,250,0.1)' },
                          { type: '숫자', label: '봉사 가능 시간', value: '월 16h', tc: '#A78BFA', tb: 'rgba(167,139,250,0.1)' },
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
                  desc: '가능 요일, 자격증, 차량 유무 등 단체 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>월 09:00 · 급식 봉사</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>경로식당 · 봉사자 5명</div>
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
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>활동현장_급식봉사_0804.webp</div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: '100%', height: '100%', background: ACCENT, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>298 KB · 압축 완료</div>
                        </div>
                      </div>
                    </div>
                  ),
                  title: '사진 첨부',
                  desc: '활동 현장 사진을 배정에 첨부합니다. 브라우저에서 자동 압축되어 저장 효율을 높입니다.',
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
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>봉사 시간 집계 자료</div>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>내보내기</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {[
                          { name: '박미영', hours: 61, pct: 76 },
                          { name: '김영희', hours: 48, pct: 60 },
                          { name: '이철수', hours: 32, pct: 40 },
                        ].map((r, i) => (
                          <div key={r.name} style={{ opacity: 0, animation: `fadeUp 0.4s ease ${150 + i * 80}ms forwards` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{r.name}</span>
                              <span style={{ color: ACCENT, fontWeight: 700 }}>{r.hours}h</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${r.pct}%`, background: ACCENT, borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['XLSX', 'PDF', 'CSV', 'DOCX'] as string[]).map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 문서다운로드',
                  desc: '봉사 시간 집계 자료를 XLSX·CSV·PDF로 내보내 인증서 발급과 보고서 작성에 활용합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"영희씨 다음주 월요일 급식봉사 배정"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {([
                            { label: '봉사자', value: '김영희' },
                            { label: '요일', value: '다음주 월요일' },
                            { label: '시간', value: '09:00' },
                            { label: '활동', value: '급식봉사' },
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
                  desc: '"영희씨 다음주 월요일 급식봉사 배정"처럼 말하듯 입력하면 자동으로 슬롯에 등록됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="sv-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>봉사 관리의 번거로움을 해소하십시오.<br />SERVE:ON이 대신합니다.</h2>
            <button className="sv-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

      </div>
      <DevFileLabel file="LandingServeOn.tsx" />
    </>
  )
}
