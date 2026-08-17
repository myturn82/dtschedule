// src/pages/landing/LandingClassOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#6366F1'
const GREEN = '#3DDC84'

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

export function LandingClassOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=classon')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(99,102,241,0.35);} 50% { box-shadow:0 8px 52px rgba(99,102,241,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(99,102,241,0.3); } 50%{ box-shadow:0 6px 28px rgba(99,102,241,0.6); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes float1    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes float2    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes float3    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes float4    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        .co-qmark  { animation: qPulse 2s ease-in-out infinite; }
        body { margin:0; background:#0a0b10; }
        .co-nav    { animation: navFade 0.5s ease both; }
        .co-badge  { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .co-h1     { animation: fadeUp 0.75s ease 0.22s both; }
        .co-sub    { animation: fadeUp 0.65s ease 0.38s both; }
        .co-cta    { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .co-glow   { animation: glowPulse 5s ease-in-out infinite; }
        .co-card   { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .co-card:hover { transform:translateY(-6px); border-color:rgba(99,102,241,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .co-tag-btn { transition: background 0.18s, transform 0.18s; }
        .co-tag-btn:hover { transform:scale(1.06); }
        .co-float1 { animation: float1 3.8s ease-in-out infinite; }
        .co-float2 { animation: float2 4.2s ease-in-out 0.5s infinite; }
        .co-float3 { animation: float3 4.6s ease-in-out 1s infinite; }
        .co-float4 { animation: float4 3.4s ease-in-out 1.5s infinite; }
        .wave { height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent); margin: 0 28px; }
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
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>CLASS:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, color 0.18s' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.18s' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          <div className="co-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />
          <div className="co-badge" style={{ display: 'inline-block', background: 'rgba(99,102,241,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>학원 수강권·출석 관리</div>
          <h1 className="co-h1" style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 680 }}>
            수강권 횟수 관리,<br /><span style={{ color: ACCENT }}>이제 앱이 대신합니다.</span>
          </h1>
          <p className="co-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.7 }}>출석 체크 한 번으로 자동 차감. 만료 임박 학생은 즉시 알림.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 36 }}>신용카드 불필요 · 10명까지 영구 무료 · 30초 가입</p>
          <button className="co-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 72 }}>무료로 시작하기 →</button>

          {/* Hero floating cards */}
          <div className="co-hero-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Card 1: 수강권 현황 */}
            <div className="co-float1" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>수강권 현황</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>영어 20회권</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '40%', height: '100%', background: ACCENT, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700, whiteSpace: 'nowrap' }}>8/20</span>
              </div>
              <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700 }}>만료 D-14</div>
            </div>
            {/* Card 2: D-1 알림 */}
            <div className="co-float2" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>D-1 알림</div>
              <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>내일 오후 4시 수학 수업이 있습니다</div>
              </div>
              <div style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>발송 완료 3명</div>
            </div>
            {/* Card 3: 이번 주 수업 */}
            <div className="co-float3" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>이번 주 수업</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                {['월', '화', '수', '목', '금'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 3 }}>{d}</div>
                ))}
                {[
                  { name: '지수', filled: true }, { name: null, filled: false }, { name: '민준', filled: true }, { name: null, filled: false }, { name: '수아', filled: true },
                  { name: null, filled: false }, { name: '예린', filled: true }, { name: null, filled: false }, { name: '지수', filled: true }, { name: null, filled: false },
                ].map((cell, i) => (
                  <div key={i} style={{ height: 22, borderRadius: 4, background: cell.filled ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${cell.filled ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: cell.filled ? 600 : undefined, color: cell.filled ? 'rgba(255,255,255,0.8)' : 'transparent' }}>
                    {cell.name ?? '·'}
                  </div>
                ))}
              </div>
            </div>
            {/* Card 4: 출석률 */}
            <div className="co-float4" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>출석률</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: GREEN, marginBottom: 4 }}>87%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>이번 달 출석률</div>
              <div style={{ fontSize: 12, color: GREEN, fontWeight: 700 }}>↑ 전월 대비 +5%</div>
            </div>
          </div>
        </section>

        <div className="wave" />

        {/* Pain 섹션 */}
        <section style={{ padding: '100px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 1, marginBottom: 20 }}>지금도 이렇게 하고 계신가요?</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 0 }}>
              수강권 관리의 반복 작업에서<br />벗어날 수 있습니다.
            </h2>
          </Anim>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '·', text: '수강권 횟수를 노트에 직접 표시하다 실수가 잦습니다.' },
              { icon: '·', text: '출석 체크 후 남은 횟수를 매번 직접 계산합니다.' },
              { icon: '·', text: '만료 임박 학생에게 일일이 전화나 문자로 연락합니다.' },
            ].map((item, i) => (
              <Anim key={i} delay={i * 80}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', textAlign: 'left' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.text}</span>
                </div>
              </Anim>
            ))}
          </div>
        </section>

        <div className="wave" />

        {/* F01 — 수강권 자동 차감 */}
        <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.05), transparent)' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>01 — 수강권 자동 차감</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>출석 체크 한 번,<br />수강권이 자동 차감됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 20 }}>횟수제·기간제·복합권 모두 지원합니다. 출석 체크 시 수강권이 자동으로 차감되며, 잔여 횟수를 실시간으로 확인할 수 있습니다.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['출석 시 자동 차감', '만료 임박 자동 표시', '차감 이력 전체 추적'].map(pt => (
                  <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                    <span style={{ color: ACCENT, fontWeight: 700 }}>✓</span> {pt}
                  </div>
                ))}
              </div>
            </Anim>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>수강권 현황</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { name: '영어 20회권', used: 8, total: 20, status: '진행중', statusColor: GREEN, highlight: false },
                      { name: '수학 10회권', used: 8, total: 10, status: '만료 임박', statusColor: '#F59E0B', highlight: true },
                      { name: '미술 월정액', used: 15, total: 30, status: '15/30일 경과', statusColor: 'rgba(255,255,255,0.45)', highlight: false },
                    ].map((item, i) => (
                      <div key={item.name} style={{ background: item.highlight ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${item.highlight ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 16px', opacity: 0, animation: `fadeUp 0.5s ease ${200 + i * 100}ms forwards` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: item.statusColor }}>{item.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(item.used / item.total) * 100}%`, height: '100%', background: item.highlight ? '#F59E0B' : ACCENT, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{item.used}/{item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F02 — 출석률 통계 */}
        <section style={{ padding: '100px 24px' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>학생별 출석 현황</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr 1fr', fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '0 0 8px', textAlign: 'center' }}>
                    <span style={{ textAlign: 'left' }}>이름</span><span>이번달</span><span>총 수업</span><span>출석률</span>
                  </div>
                  {[
                    { name: '김지수', attended: 12, total: 13, rate: 92 },
                    { name: '이민준', attended: 8, total: 13, rate: 62 },
                    { name: '박수아', attended: 13, total: 13, rate: 100 },
                    { name: '최예린', attended: 5, total: 13, rate: 38 },
                  ].map((s, i) => (
                    <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 0.7fr 1fr', alignItems: 'center', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, textAlign: 'center', opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 80}ms forwards` }}>
                      <span style={{ fontWeight: 600, textAlign: 'left' }}>{s.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.attended}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.total}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${s.rate}%`, height: '100%', background: s.rate >= 80 ? GREEN : s.rate >= 60 ? '#F59E0B' : '#EF4444', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{s.rate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>02 — 출석률 통계</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>학생별 출석률을<br />한눈에 파악합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>과목별·학생별 출석 추이를 자동으로 집계합니다. 출석률이 하락한 학생을 즉시 파악하여 선제적으로 대응할 수 있습니다.</p>
            </Anim>
          </div>
        </section>

        {/* F03 — 만료 임박 알림 */}
        <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.05), transparent)' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>03 — 만료 임박 알림</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>재등록을<br />자동으로 유도합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>수강권 만료가 임박하거나 잔여 횟수가 부족한 학생을 자동으로 추출합니다. 기준을 설정하면 문자를 일괄 발송하여 재등록을 유도할 수 있습니다.</p>
            </Anim>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>만료 임박 알림</div>
                  <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>만료 D-7 이내 학생 3명</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>선택한 기간 내 수강권 만료가 임박한 학생입니다. 문자로 재등록을 안내하십시오.</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {['D-7', 'D-14', '직접입력'].map((label, i) => (
                        <span key={label} style={{ background: i === 0 ? ACCENT : 'rgba(255,255,255,0.06)', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: i === 0 ? 700 : undefined, padding: '5px 10px', borderRadius: 8 }}>{label}</span>
                      ))}
                    </div>
                    {['이민준 (영어 20회권 · D-3)', '최예린 (수학 10회권 · D-5)', '김지수 (미술 월정액 · D-7)'].map((name, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : undefined }}>{name}</div>
                    ))}
                    <div style={{ marginTop: 14, background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center', borderRadius: 10, padding: 10, cursor: 'pointer' }}>✉ 문자 일괄 발송</div>
                  </div>
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F04 — 반복 수업 스케줄 */}
        <section style={{ padding: '100px 24px' }}>
          <div className="co-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim delay={120} className="co-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>반복 수업 등록</div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>반복 요일</div>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                      {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => {
                        const on = i === 2 || i === 4
                        return (
                          <span key={d} style={{ width: 26, height: 26, borderRadius: 7, background: on ? 'rgba(99,102,241,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                        )
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>시간</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: ACCENT, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8 }}>16:00</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>~</span>
                      <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 12, padding: '5px 12px', borderRadius: 8 }}>17:00</span>
                    </div>
                    <div style={{ background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', borderRadius: 8, padding: '8px', cursor: 'pointer', animation: 'autoGlow 3s ease-in-out infinite' }}>슬롯 자동 생성</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자동 생성된 슬롯</div>
                  {['8/12 (화) · 16:00 · 영어반', '8/14 (목) · 16:00 · 영어반', '8/19 (화) · 16:00 · 영어반'].map((slot, i) => (
                    <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 8, marginBottom: 5, fontSize: 11, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 100}ms forwards` }}>
                      <span style={{ color: ACCENT }}>✓</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
            <Anim className="co-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>04 — 반복 수업 스케줄</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>반복 수업을<br />한 번에 등록합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>매주 같은 요일·시간으로 반복 수업을 일괄 등록합니다. 공휴일만 예외 처리하면 나머지 슬롯이 자동으로 생성됩니다.</p>
            </Anim>
          </div>
        </section>

        <div className="wave" />

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 640, margin: '0 auto' }}>
              {['영어학원', '수학학원', '미술학원', '음악학원', '태권도', '댄스', '과외·튜터링', '독서실', '어린이집', '교습소'].map((tag, i) => (
                <span key={tag} className="co-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 40}ms forwards` }}>{tag}</span>
              ))}
            </div>
          </Anim>
        </section>

        <div className="wave" />

        {/* 엔진 기능 */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Anim style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>엔진</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>수강권 뒤에서 움직이는 스케줄 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>CLASS:ON은 다양한 업종에 적용 가능한 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {[
                          { n: '1', label: '조직 이름 · 업종', done: true },
                          { n: '2', label: '운영 모드 선택', done: true },
                          { n: '3', label: '역할 설정', done: true },
                          { n: '4', label: '슬롯 규칙', active: true },
                          { n: '5', label: '운영 시간', done: false },
                          { n: '6', label: '커스텀 필드', done: false },
                          { n: '7', label: '테마 색상', done: false },
                        ].map(step => (
                          <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: step.done ? 'rgba(34,197,94,0.04)' : step.active ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 7, fontSize: 11 }}>
                            <div style={{ width: 19, height: 19, borderRadius: '50%', background: step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.07)', color: step.done ? '#22c55e' : step.active ? ACCENT : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                              {step.done ? '✓' : step.n}
                            </div>
                            <span style={{ flex: 1, fontWeight: 600, color: step.done ? 'rgba(255,255,255,0.35)' : step.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', textDecoration: step.done ? 'line-through' : undefined }}>{step.label}</span>
                            {step.active && <span style={{ fontSize: 10, color: ACCENT }}>진행 중</span>}
                            {step.done && <span style={{ color: '#22c55e', fontSize: 11 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', margin: '10px 0 5px' }}>예상 소요 시간 · 약 5분</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: `linear-gradient(90deg, #22c55e, ${ACCENT})`, borderRadius: 2, animation: 'wizFill 5s linear infinite' }} />
                      </div>
                    </div>
                  ),
                  title: '5분 셋업 위자드',
                  desc: '운영 모드·시간 단위·요일 규칙을 7단계 질문으로 안내받아 바로 시작합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {(['월간', '주간', '일간'] as string[]).map((label, i) => (
                          <span key={label} style={{ flex: 1, textAlign: 'center', background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 1 ? 700 : undefined, padding: '4px 0', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '30px repeat(5, 1fr)', gap: 3 }}>
                        <div />
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>{d}</div>
                        ))}
                        {[
                          { time: '14:00', cells: ['지수', null, '민준', null, '수아'] },
                          { time: '16:00', cells: [null, '예린', null, '지수', null] },
                          { time: '18:00', cells: ['수아', null, '예린', null, '민준'] },
                        ].map(row => ([
                          <div key={`t-${row.time}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                          ...row.cells.map((name, ci) => (
                            <div key={`${row.time}-${ci}`} style={{ height: 22, borderRadius: 4, background: name ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${name ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: name ? 600 : undefined, color: name ? 'rgba(255,255,255,0.8)' : 'transparent' }}>
                              {name ? name.slice(0, 1) : '·'}
                            </div>
                          )),
                        ]))}
                      </div>
                    </div>
                  ),
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간, 일자별·시간별 보기를 상황에 따라 자유롭게 전환할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {[
                          { label: '선생님 화면', slots: [{ time: '14:00', name: '김지수', live: false }, { time: '16:00', name: '이민준', live: true }, { time: '18:00', name: '박수아', live: false }] },
                          { label: '학생 화면', slots: [{ time: '14:00', name: '배정됨', live: false }, { time: '16:00', name: '✦ 새 수업!', live: true, isNew: true }, { time: '18:00', name: '배정됨', live: false }] },
                        ].map(pane => (
                          <div key={pane.label} style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
                              {pane.label}
                            </div>
                            {pane.slots.map(slot => (
                              <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 4, fontSize: 10, animation: slot.live ? 'liveSlot 3s ease-in-out infinite' : undefined }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{slot.time}</span>
                                <span style={{ color: (slot as { isNew?: boolean }).isNew ? ACCENT : 'rgba(255,255,255,0.7)', fontWeight: slot.live ? 700 : undefined }}>{slot.name}</span>
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
                  desc: '선생님이 수업을 등록하면 학생 화면에 새로고침 없이 즉시 반영됩니다.',
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
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>요일 선택 (화·목)</div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => {
                          const on = i === 2 || i === 4
                          return (
                            <span key={d} style={{ width: 22, height: 22, borderRadius: 6, background: on ? 'rgba(99,102,241,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                          )
                        })}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>자동 생성된 슬롯</div>
                      {['8/12 (화) · 16:00', '8/14 (목) · 16:00', '8/19 (화) · 16:00'].map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록 (매주 수업 일괄 등록)',
                  desc: '반복 유형·요일·시간대를 지정하면 수업 슬롯을 한 번에 일괄 등록합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {[
                          { name: '김지수', color: ACCENT, slots: '화·목 선호' },
                          { name: '이민준', color: '#22c55e', slots: '월·수·금 선호' },
                          { name: '박수아', color: '#F59E0B', slots: '상시 가능' },
                        ].map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{m.slots}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 9, marginBottom: 10, animation: 'autoGlow 3s ease-in-out infinite' }}>★ 자동배정 실행</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {[
                          { init: '이', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)', color: '#22c55e', delay: 200 },
                          { init: '김', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', color: ACCENT, delay: 400 },
                          { init: '이', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)', color: '#22c55e', delay: 600 },
                          { init: '김', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', color: ACCENT, delay: 800 },
                          { init: '박', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1000 },
                          { init: '박', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1200 },
                          { init: '—', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1400 },
                          { init: '박', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1600 },
                          { init: '—', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1800 },
                          { init: '이', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)', color: '#22c55e', delay: 2000 },
                        ].map((cell, i) => (
                          <div key={i} style={{ padding: '5px 0', textAlign: 'center', borderRadius: 5, background: cell.bg, border: `1px solid ${cell.border}`, fontSize: 10, fontWeight: 700, color: cell.color, opacity: 0, animation: `cellFill 0.4s ease ${cell.delay}ms forwards` }}>{cell.init}</div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별 비율과 학생별 가능 요일을 설정하면 빈 슬롯을 규칙에 맞춰 자동으로 채웁니다.',
                },
                {
                  visual: (() => {
                    const days = Array.from({ length: 31 }, (_, i) => {
                      const d = i + 1
                      const dow = (6 + i) % 7
                      const isSlot = dow === 2 || dow === 4
                      const isHol = d === 15
                      const isSpc = d === 23
                      const isToday = d === 12
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
                            { dot: true, color: ACCENT, label: '반복 수업일' },
                            { dot: false, bg: 'rgba(239,68,68,0.5)', label: '광복절 휴관' },
                            { dot: false, bg: 'rgba(34,197,94,0.5)', label: '특별 운영일' },
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
                  desc: '"화·목 수업" 기본 규칙에 휴관일·특별 운영일을 그날만 따로 지정할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>학생 정보 · 커스텀 필드</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {[
                          { type: '텍스트', label: '학교', value: '세종초등학교', tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                          { type: '선택', label: '학년', value: '4학년', tc: '#818cf8', tb: 'rgba(99,102,241,0.12)' },
                          { type: '텍스트', label: '학부모 연락처', value: '010-1234-5678', tc: '#22c55e', tb: 'rgba(34,197,94,0.1)' },
                          { type: '선택', label: '수강 과목', value: '영어·수학', tc: ACCENT, tb: 'rgba(99,102,241,0.1)' },
                        ].map(f => (
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
                  title: '입력항목 설정 (학년·학교·과목·학부모)',
                  desc: '학년, 학교, 과목, 학부모 연락처 등 학원 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>화 16:00 · 이민준</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>영어 · 그룹 수업</div>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>첨부 파일</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1px solid rgba(255,255,255,0.1)' }}>□</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>시험지_영어_0814.jpg</div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: '100%', height: '100%', background: ACCENT, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>428 KB · 압축 완료</div>
                        </div>
                      </div>
                    </div>
                  ),
                  title: '사진 첨부 (숙제·시험지)',
                  desc: '숙제, 시험지, 수업 자료를 수업 슬롯에 직접 첨부합니다. 브라우저에서 자동 압축되어 저장 효율을 높입니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>이번 주 수업표</div>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>Ctrl+C</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(5, 1fr)', gap: 3, marginBottom: 10 }}>
                        <div />
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                        ))}
                        {[
                          { time: '14:00', sel: [false, true, true, false, false] },
                          { time: '16:00', sel: [false, true, true, false, false] },
                          { time: '18:00', sel: [false, false, false, false, false] },
                        ].map(row => ([
                          <div key={`t-${row.time}`} style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                          ...row.sel.map((selected, ci) => (
                            <div key={`${row.time}-${ci}`} style={{ height: 18, borderRadius: 3, background: selected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)', border: `${selected ? 2 : 1}px solid ${selected ? ACCENT : 'rgba(255,255,255,0.07)'}` }} />
                          )),
                        ]))}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['XLSX', 'PDF', 'CSV', 'DOCX'].map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 내보내기',
                  desc: '셀을 드래그해 복사·붙여넣기. 한 달 수업표를 엑셀·CSV·워드·PDF로 내보냅니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"지수 목요일 4시 영어 등록"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {[
                            { label: '학생', value: '김지수' },
                            { label: '요일', value: '목요일' },
                            { label: '시간', value: '16:00' },
                            { label: '과목', value: '영어' },
                          ].map(item => (
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
                  desc: '"지수 목요일 4시 영어 등록"처럼 말하듯 입력하면 자동으로 수업 슬롯에 등록됩니다.',
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

        {/* Footer CTA */}
        <Anim>
          <section style={{ textAlign: 'center', padding: '60px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.5 }}>수강권 관리의 번거로움을 해소하십시오.<br />CLASS:ON이 대신합니다.</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>신용카드 불필요 · 10명까지 영구 무료</p>
            <button className="co-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

        <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          © 2026 CLASS:ON · DTS · <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>개인정보처리방침</a>
        </footer>

      </div>
      <DevFileLabel file="LandingClassOn.tsx" />
    </>
  )
}
