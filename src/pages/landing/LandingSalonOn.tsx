// src/pages/landing/LandingSalonOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#A78BFA'

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

export function LandingSalonOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=salonon')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(167,139,250,0.35);} 50% { box-shadow:0 8px 52px rgba(167,139,250,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(167,139,250,0.1); border-color:rgba(167,139,250,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(167,139,250,0.3); } 50%{ box-shadow:0 6px 28px rgba(167,139,250,0.6); } }
        @keyframes barFill   { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes dragSel   { 0%,8%{ background:rgba(255,255,255,0.04); box-shadow:none; } 32%,68%{ background:rgba(167,139,250,0.18); box-shadow:inset 0 0 0 2px rgba(167,139,250,0.6); } 88%,100%{ background:rgba(255,255,255,0.04); box-shadow:none; } }
        @keyframes float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
        body { margin:0; background:#0a0b10; }
        .so-nav   { animation: navFade 0.5s ease both; }
        .so-badge { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .so-h1    { animation: fadeUp 0.75s ease 0.22s both; }
        .so-sub   { animation: fadeUp 0.65s ease 0.38s both; }
        .so-note  { animation: fadeUp 0.55s ease 0.5s both; }
        .so-cta   { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .so-glow  { animation: glowPulse 5s ease-in-out infinite; }
        .so-card  { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .so-card:hover { transform:translateY(-6px); border-color:rgba(167,139,250,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .so-tag-btn { transition: background 0.18s, transform 0.18s; }
        .so-tag-btn:hover { transform:scale(1.06); }
        .so-hero-card { animation: float 3.5s ease-in-out infinite; }
        .so-hero-card:nth-child(2) { animation-delay: 0.5s; }
        .so-hero-card:nth-child(3) { animation-delay: 1s; }
        .so-hero-card:nth-child(4) { animation-delay: 1.5s; }
        @media (max-width:720px) {
          .so-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .so-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .so-feat-text { order:1 !important; text-align:center !important; }
          .so-hero-cards { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

        {/* Nav */}
        <nav className="so-nav" style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(10,11,16,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>SALON:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, color 0.18s' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.18s' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          <div className="so-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(167,139,250,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />
          <div className="so-badge" style={{ display: 'inline-block', background: 'rgba(167,139,250,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>살롱·뷰티 예약 관리</div>
          <h1 className="so-h1" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 720 }}>
            고객이 직접 시술사를 고르고<br /><span style={{ color: ACCENT }}>예약합니다. 전화 없이.</span>
          </h1>
          <p className="so-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.7 }}>
            공개 예약 링크 하나로 시술사별 빈 시간을 고객이 직접 선택합니다.
          </p>
          <button className="so-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기 →</button>
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
              { icon: '·', text: '전화·문자로 예약받고 수첩에 기록합니다.' },
              { icon: '·', text: '시술사 스케줄을 각자 따로 관리하다 겹침이 발생합니다.' },
              { icon: '·', text: '당일 노쇼로 빈 시간이 낭비됩니다.' },
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

        {/* F01 — 시술사별 예약 스케줄 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(167,139,250,0.05), transparent)' }}>
          <div className="so-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="so-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F01 — 시술사별 예약 스케줄</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>시술사별 예약이<br />한눈에 표시됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>디자이너·인턴별로 예약 슬롯을 분리해 표시합니다. 빈 시간과 겹침을 즉시 파악하여 과부하 없이 스케줄을 운영할 수 있습니다.</p>
            </Anim>
            <Anim delay={120} className="so-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                {/* Demo 상단 바 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>시술사별 주간 스케줄</span>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 1fr', gap: 5 }}>
                    <div />
                    {['디자이너 A', '디자이너 B', '인턴 C'].map((n, i) => (
                      <div key={n} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: [ACCENT, '#818cf8', '#34D399'][i], paddingBottom: 6 }}>{n}</div>
                    ))}
                    {[
                      { time: '10:00', cells: [{ name: '커트', color: ACCENT }, null, { name: '염색', color: '#34D399' }] },
                      { time: '11:30', cells: [null, { name: '펌', color: '#818cf8' }, { name: '커트', color: '#34D399' }] },
                      { time: '13:00', cells: [{ name: '염색', color: ACCENT }, { name: '커트', color: '#818cf8' }, null] },
                      { time: '14:30', cells: [{ name: '트리트먼트', color: ACCENT }, null, { name: '펌', color: '#34D399' }] },
                    ].map((row, ri) => ([
                      <div key={`t${ri}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{row.time}</div>,
                      ...row.cells.map((cell, ci) => (
                        <div key={`${ri}-${ci}`} style={{ height: 36, borderRadius: 8, background: cell ? `${cell.color}1a` : 'rgba(255,255,255,0.03)', border: `1px solid ${cell ? `${cell.color}40` : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: cell ? 600 : undefined, color: cell ? cell.color : 'rgba(255,255,255,0.2)', opacity: 0, animation: `fadeUp 0.4s ease ${200 + (ri * 3 + ci) * 60}ms forwards` }}>
                          {cell ? cell.name : '·'}
                        </div>
                      )),
                    ]))}
                  </div>
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F02 — 고객 직접 예약 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="so-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="so-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>예약 신청</span>
                </div>
                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>1. 시술사 선택</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['디자이너 A', '디자이너 B'].map((n, i) => (
                        <div key={n} style={{ flex: 1, background: i === 0 ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? ACCENT : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '7px', textAlign: 'center', fontSize: 11, fontWeight: i === 0 ? 700 : undefined, color: i === 0 ? ACCENT : 'rgba(255,255,255,0.5)' }}>{n}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>2. 날짜 선택</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                      {['월', '화', '수', '목', '금', '토', '일'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                      ))}
                      {Array.from({ length: 7 }, (_, i) => i + 11).map(d => (
                        <div key={d} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, background: d === 13 ? ACCENT : 'rgba(255,255,255,0.04)', border: `1px solid ${d === 13 ? ACCENT : 'rgba(255,255,255,0.06)'}`, fontSize: 10, fontWeight: d === 13 ? 700 : undefined, color: d === 13 ? '#fff' : 'rgba(255,255,255,0.5)' }}>{d}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>3. 시간 선택</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {['10:00', '11:30', '14:00', '15:30'].map((t, i) => (
                        <span key={t} style={{ background: i === 2 ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 2 ? ACCENT : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: i === 2 ? 700 : undefined, color: i === 2 ? ACCENT : 'rgba(255,255,255,0.5)' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>4. 시술 종류</div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>커트 + 염색</div>
                  </div>
                  <div style={{ background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, textAlign: 'center', borderRadius: 10, padding: '10px', marginTop: 4 }}>예약 완료</div>
                </div>
              </div>
            </Anim>
            <Anim className="so-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F02 — 고객 직접 예약</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>공개 링크로 고객이<br />직접 예약합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>매장 공개 달력 링크를 공유하면 고객이 원하는 시술사와 시간을 직접 선택합니다. 전화 응대 없이 24시간 예약이 가능합니다.</p>
            </Anim>
          </div>
        </section>

        {/* F03 — 노쇼 방지 D-1 알림 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(167,139,250,0.05), transparent)' }}>
          <div className="so-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim className="so-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F03 — 노쇼 방지 D-1 알림</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>자동 알림으로<br />노쇼를 줄입니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>예약 하루 전 고객에게 자동 알림을 발송합니다. 읽음 여부를 확인할 수 있어 미확인 고객에게 추가 안내가 가능합니다.</p>
            </Anim>
            <Anim delay={120} className="so-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>D-1 알림 발송</span>
                </div>
                <div style={{ padding: '16px' }}>
                  {/* 폰 목업 */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>SALON:ON 알림</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                      내일 오후 2:00<br />
                      <span style={{ color: ACCENT, fontWeight: 700 }}>디자이너 A</span>님과 커트+염색 예약이 있습니다.
                    </div>
                  </div>
                  {/* 발송 내역 */}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>발송 내역 · 오늘 발송 3명</div>
                  {[
                    { name: '김지은', time: '오후 2:00 · 커트+염색', status: '읽음', statusColor: '#34D399' },
                    { name: '박수아', time: '오후 4:00 · 펌', status: '읽음', statusColor: '#34D399' },
                    { name: '이하늘', time: '오후 5:30 · 트리트먼트', status: '미확인', statusColor: 'rgba(255,255,255,0.35)' },
                  ].map((r, i) => (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, marginBottom: 5, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 100}ms forwards` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.time}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.statusColor }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F04 — 시술 이력 + 특이사항 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="so-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120} className="so-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingRight: 32 }}>고객 카드</span>
                </div>
                <div style={{ padding: '18px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, #818cf8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>김</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>김지은</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>010-****-5678</div>
                    </div>
                  </div>
                  {[
                    { label: '알레르기', value: '암모니아 민감', valueColor: '#f87171' },
                    { label: '선호 스타일', value: '자연스러운 웨이브', valueColor: 'rgba(255,255,255,0.7)' },
                    { label: '지난 시술', value: '커트 + C컬 (2026.07.18)', valueColor: 'rgba(255,255,255,0.6)' },
                    { label: '다음 예약', value: '2026.08.13 오후 2:00', valueColor: ACCENT },
                  ].map((item, i) => (
                    <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 80}ms forwards` }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{item.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: item.valueColor }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
            <Anim className="so-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>F04 — 고객 이력 관리</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>고객 정보와 시술 이력을<br />기록합니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>알레르기, 선호 스타일, 지난 시술 이력을 고객 카드에 기록합니다. 다음 방문 때 바로 참고하여 맞춤 서비스를 제공할 수 있습니다.</p>
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
              {['미용실', '네일샵', '피부관리실', '속눈썹', '메이크업', '왁싱', '두피케어', '바버샵', '태닝샵', '마사지샵'].map((tag, i) => (
                <span key={tag} className="so-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 50}ms forwards` }}>{tag}</span>
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
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>예약 뒤에서 움직이는 스케줄 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>SALON:ON은 뷰티 업종에 최적화된 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      {([
                        { n: '1', label: '조직 이름 · 업종', done: true },
                        { n: '2', label: '시술사 역할 설정', done: true },
                        { n: '3', label: '시술 종류 설정', done: true },
                        { n: '4', label: '운영 시간 설정', active: true },
                        { n: '5', label: '고객 입력 항목', done: false },
                        { n: '6', label: '알림 설정', done: false },
                        { n: '7', label: '공개 링크 활성화', done: false },
                      ] as { n: string; label: string; done?: boolean; active?: boolean }[]).map(step => (
                        <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: step.done ? 'rgba(34,197,94,0.04)' : step.active ? `rgba(167,139,250,0.08)` : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(167,139,250,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 7, fontSize: 11, marginBottom: 4 }}>
                          <div style={{ width: 19, height: 19, borderRadius: '50%', background: step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)', color: step.done ? '#22c55e' : step.active ? ACCENT : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                            {step.done ? '✓' : step.n}
                          </div>
                          <span style={{ flex: 1, fontWeight: 600, color: step.done ? 'rgba(255,255,255,0.35)' : step.active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', textDecoration: step.done ? 'line-through' : undefined }}>{step.label}</span>
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
                  desc: '시술사 역할, 시술 종류 등을 7단계 안내에 따라 설정하면 바로 운영을 시작합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {(['월간', '주간', '일간'] as string[]).map((label, i) => (
                          <span key={label} style={{ flex: 1, textAlign: 'center', background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: i === 1 ? 700 : undefined, padding: '4px 0', borderRadius: 6 }}>{label}</span>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr 1fr', gap: 3 }}>
                        <div />
                        {['A', 'B', 'C'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 4 }}>디자{d}</div>
                        ))}
                        {[
                          { time: '10:00', cells: [true, false, true] },
                          { time: '11:30', cells: [false, true, true] },
                          { time: '13:00', cells: [true, true, false] },
                        ].map(row => ([
                          <div key={`t-${row.time}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                          ...row.cells.map((active, ci) => (
                            <div key={`${row.time}-${ci}`} style={{ height: 22, borderRadius: 4, background: active ? `${ACCENT}1a` : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? `${ACCENT}40` : 'rgba(255,255,255,0.07)'}` }} />
                          )),
                        ]))}
                      </div>
                    </div>
                  ),
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간 보기를 상황에 따라 전환하여 시술사별 스케줄을 파악합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {(['매장 화면', '고객 화면'] as string[]).map((label, pi) => (
                          <div key={label} style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
                              {label}
                            </div>
                            {['10:00', '11:30', '14:00'].map((slot, si) => (
                              <div key={slot} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 3, fontSize: 10, animation: si === 1 ? 'liveSlot 3s ease-in-out infinite' : undefined }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{slot}</span>
                                <span style={{ color: si === 1 ? ACCENT : 'rgba(255,255,255,0.7)', fontWeight: si === 1 ? 700 : undefined }}>{si === 1 ? (pi === 0 ? '✦ 신규!' : '✦ 예약됨!') : '배정됨'}</span>
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
                  desc: '고객이 예약을 완료하면 매장 화면에 새로고침 없이 즉시 반영되어 중복 예약을 방지합니다.',
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
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>정기 방문 고객 · 매주 화요일 오후 2시</div>
                      {(['8/5 (화) · 14:00', '8/12 (화) · 14:00', '8/19 (화) · 14:00'] as string[]).map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: `rgba(167,139,250,0.08)`, border: `1px solid rgba(167,139,250,0.18)`, borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${200 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록',
                  desc: '정기 방문 고객의 예약을 반복 유형·요일·시간으로 설정하면 여러 슬롯에 한 번에 등록합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>인원 설정</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                        {([
                          { name: '디자이너 A', color: ACCENT, days: '화·목', max: 16, delay: 0 },
                          { name: '디자이너 B', color: '#818cf8', days: '월·수·금', max: 12, delay: 80 },
                          { name: '인턴 C', color: '#34D399', days: '상시', max: 8, delay: 160 },
                        ] as { name: string; color: string; days: string; max: number; delay: number }[]).map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: 11, opacity: 0, animation: `fadeUp 0.4s ease ${m.delay}ms forwards` }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)' }}>{m.days} 집중</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: m.color, background: `${m.color}1a`, padding: '2px 5px', borderRadius: 4 }}>최대 {m.max}회/월</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>역할별 배정 비율</div>
                        {([
                          { label: '헤어', pct: 50, count: '2명', color: ACCENT, delay: 260 },
                          { label: '피부', pct: 30, count: '1명', color: '#818cf8', delay: 360 },
                          { label: '네일', pct: 20, count: '1명', color: '#34D399', delay: 460 },
                        ] as { label: string; pct: number; count: string; color: string; delay: number }[]).map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, opacity: 0, animation: `fadeUp 0.4s ease ${r.delay}ms forwards` }}>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 28, flexShrink: 0 }}>{r.label}</span>
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
                          { init: 'B', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', color: '#818cf8', delay: 600 },
                          { init: 'A', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', color: ACCENT, delay: 750 },
                          { init: 'B', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', color: '#818cf8', delay: 900 },
                          { init: 'A', bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)', color: ACCENT, delay: 1050 },
                          { init: 'C', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.28)',  color: '#34D399', delay: 1200 },
                          { init: 'C', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.28)',  color: '#34D399', delay: 1350 },
                          { init: '—', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1500 },
                          { init: 'C', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.28)',  color: '#34D399', delay: 1650 },
                          { init: '—', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1800 },
                          { init: 'B', bg: 'rgba(129,140,248,0.15)', border: 'rgba(129,140,248,0.3)', color: '#818cf8', delay: 1950 },
                        ] as { init: string; bg: string; border: string; color: string; delay: number }[]).map((cell, i) => (
                          <div key={i} style={{ padding: '5px 0', textAlign: 'center', borderRadius: 5, background: cell.bg, border: `1px solid ${cell.border}`, fontSize: 10, fontWeight: 700, color: cell.color, opacity: 0, animation: `cellFill 0.4s ease ${cell.delay}ms forwards` }}>{cell.init}</div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별 배정 비율과 월별 최대 횟수를 설정하면, 가능 요일에 맞춰 빈 슬롯을 자동으로 채웁니다.',
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
                          const dow = (6 + i) % 7
                          const isOpen = dow >= 1 && dow <= 6
                          const isHol = d === 15
                          const isSpc = d === 23
                          const isToday = d === 15
                          return (
                            <div key={d} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: isToday ? '50%' : 4, background: isHol ? 'rgba(239,68,68,0.18)' : isSpc ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                              <span style={{ fontSize: 9, color: isHol ? '#ef4444' : isSpc ? '#22c55e' : isOpen ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)' }}>{d}</span>
                              {isOpen && !isHol && !isSpc && (
                                <span style={{ width: 3, height: 3, borderRadius: '50%', background: ACCENT, marginTop: 1 }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                          { dot: true, color: ACCENT, label: '정상 운영' },
                          { dot: false, bg: 'rgba(239,68,68,0.5)', label: '휴무일' },
                          { dot: false, bg: 'rgba(34,197,94,0.5)', label: '특별 영업' },
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
                  desc: '기본 운영 요일을 설정하고 휴무일·특별 영업일을 개별 날짜에 따로 지정합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>고객 입력 항목 · 커스텀 필드</div>
                      {[
                        { type: '텍스트', label: '알레르기 정보', value: '암모니아 민감', tc: '#f87171', tb: 'rgba(248,113,113,0.1)' },
                        { type: '선택', label: '선호 시술사', value: '디자이너 A', tc: ACCENT, tb: `rgba(167,139,250,0.12)` },
                        { type: '텍스트', label: '선호 스타일', value: '자연스러운 웨이브', tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                        { type: '날짜', label: '지난 시술일', value: '2026.07.18', tc: '#22c55e', tb: 'rgba(34,197,94,0.1)' },
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
                  desc: '알레르기, 선호 시술사, 스타일 메모 등 매장 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>화 14:00 · 김지은</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>커트 + 디지털펌</div>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>시술 전후 사진</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['시술 전', '시술 후'] as string[]).map((label, i) => (
                          <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                            <div style={{ height: 40, borderRadius: 6, background: i === 1 ? `rgba(167,139,250,0.1)` : 'rgba(255,255,255,0.06)', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{i === 0 ? '□' : '✦'}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700, marginTop: 8, textAlign: 'right' }}>자동 압축 완료</div>
                    </div>
                  ),
                  title: '사진 첨부',
                  desc: '시술 전후 사진을 예약에 첨부합니다. 브라우저에서 자동 압축되어 저장 효율을 높입니다.',
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
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>이번 주 예약 현황</div>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>드래그 선택 중</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {(['XLSX', 'PDF', 'CSV', 'DOCX'] as string[]).map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <div style={{ flex: 1, background: `rgba(167,139,250,0.1)`, border: `1px solid rgba(167,139,250,0.25)`, borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: ACCENT, fontWeight: 600 }}>이번 주 선택</div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '0 2px' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: '#22c55e', fontWeight: 600 }}>다음 주 붙여넣기</div>
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 문서다운로드',
                  desc: '셀을 드래그해 복사·붙여넣기. 예약 내역을 엑셀·CSV·워드·PDF로 내보냅니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"지은 님 다음주 화요일 2시 커트 예약"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: `rgba(167,139,250,0.08)`, border: `1px solid rgba(167,139,250,0.2)`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {[
                            { label: '고객', value: '김지은' },
                            { label: '요일', value: '다음주 화요일' },
                            { label: '시간', value: '14:00' },
                            { label: '시술', value: '커트' },
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
                  desc: '"지은 님 다음주 화요일 2시 커트 예약"처럼 말하듯 입력하면 자동으로 슬롯에 등록됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="so-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12, lineHeight: 1.5 }}>전화 예약의 번거로움을 해소하십시오.<br />SALON:ON이 대신합니다.</h2>
            <button className="so-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

      </div>
      <DevFileLabel file="LandingSalonOn.tsx" />
    </>
  )
}
