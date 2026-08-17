// src/pages/landing/LandingWorkOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#3B82F6'
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

export function LandingWorkOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=workon')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(59,130,246,0.35);} 50% { box-shadow:0 8px 52px rgba(59,130,246,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(59,130,246,0.3); } 50%{ box-shadow:0 6px 28px rgba(59,130,246,0.6); } }
        @keyframes barFill   { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes dragSel   { 0%,8%{ background:rgba(255,255,255,0.04); box-shadow:none; } 32%,68%{ background:rgba(59,130,246,0.18); box-shadow:inset 0 0 0 2px rgba(59,130,246,0.6); } 88%,100%{ background:rgba(255,255,255,0.04); box-shadow:none; } }
        @keyframes float1    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes float2    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes float3    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes float4    { 0%,100%{ transform:translateY(0px); } 50%{ transform:translateY(-7px); } }
        @keyframes barGrow   { from{ width:0%; } to{ width:var(--w); } }
        .wo-qmark  { animation: qPulse 2s ease-in-out infinite; }
        body { margin:0; background:#0a0b10; }
        .wo-nav    { animation: navFade 0.5s ease both; }
        .wo-badge  { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .wo-h1     { animation: fadeUp 0.75s ease 0.22s both; }
        .wo-sub    { animation: fadeUp 0.65s ease 0.38s both; }
        .wo-cta    { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .wo-glow   { animation: glowPulse 5s ease-in-out infinite; }
        .wo-card   { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .wo-card:hover { transform:translateY(-6px); border-color:rgba(59,130,246,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .wo-tag-btn { transition: background 0.18s, transform 0.18s; }
        .wo-tag-btn:hover { transform:scale(1.06); }
        .wo-float1 { animation: float1 3.8s ease-in-out infinite; }
        .wo-float2 { animation: float2 4.2s ease-in-out 0.5s infinite; }
        .wo-float3 { animation: float3 4.6s ease-in-out 1s infinite; }
        .wo-float4 { animation: float4 3.4s ease-in-out 1.5s infinite; }
        .wave { height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent); margin: 0 28px; }
        @media (max-width:720px) {
          .wo-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .wo-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .wo-feat-text { order:1 !important; text-align:center !important; }
          .wo-hero-cards { grid-template-columns:1fr 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

        {/* Nav */}
        <nav className="wo-nav" style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(10,11,16,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>WORK:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, color 0.18s' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.18s' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          <div className="wo-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />
          <div className="wo-badge" style={{ display: 'inline-block', background: 'rgba(59,130,246,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>팀 업무 스케줄 관리</div>
          <h1 className="wo-h1" style={{ fontSize: 'clamp(28px,5.5vw,50px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 700 }}>
            팀 스케줄, 카톡·엑셀·캘린더<br /><span style={{ color: ACCENT }}>더 이상 오가지 마십시오.</span>
          </h1>
          <p className="wo-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.7 }}>업무 배정부터 실시간 공유까지. WORK:ON 한 곳에서 관리합니다.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 36 }}>신용카드 불필요 · 10명까지 영구 무료 · 30초 가입</p>
          <button className="wo-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 72 }}>무료로 시작하기 →</button>

          {/* Hero floating cards */}
          <div className="wo-hero-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, maxWidth: 880, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            {/* Card 1: 이번 주 업무 */}
            <div className="wo-float1" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>이번 주 업무</div>
              {[
                { name: '김지현', task: '디자인 검토', color: ACCENT },
                { name: '박민수', task: '클라이언트 미팅', color: '#8B5CF6' },
                { name: '이수연', task: '기획서 작성', color: GREEN },
                { name: '최준혁', task: '개발 QA', color: '#F59E0B' },
              ].map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{m.name}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.task}</span>
                </div>
              ))}
            </div>
            {/* Card 2: 업무 알림 */}
            <div className="wo-float2" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>업무 알림</div>
              <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>내일 오전 10시 클라이언트 미팅이 있습니다</div>
              </div>
              <div style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>참석자 4명 확인됨</div>
            </div>
            {/* Card 3: 팀 캘린더 */}
            <div className="wo-float3" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>팀 캘린더</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                {['월', '화', '수', '목', '금'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 3 }}>{d}</div>
                ))}
                {[
                  { color: ACCENT, filled: true }, { color: '#8B5CF6', filled: true }, { color: ACCENT, filled: true }, { color: GREEN, filled: true }, { color: '#F59E0B', filled: true },
                  { color: GREEN, filled: true }, { color: ACCENT, filled: true }, { color: '#8B5CF6', filled: false }, { color: ACCENT, filled: true }, { color: GREEN, filled: false },
                ].map((cell, i) => (
                  <div key={i} style={{ height: 22, borderRadius: 4, background: cell.filled ? `${cell.color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${cell.filled ? `${cell.color}44` : 'rgba(255,255,255,0.07)'}` }} />
                ))}
              </div>
            </div>
            {/* Card 4: 배정 현황 */}
            <div className="wo-float4" style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>배정 현황</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT, marginBottom: 4 }}>48건</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>이번 달 총 업무 건</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>팀원 평균 12건</div>
            </div>
          </div>
        </section>

        <div className="wave" />

        {/* Pain 섹션 */}
        <section style={{ padding: '100px 24px', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 1, marginBottom: 20 }}>지금도 이렇게 하고 계신가요?</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 0 }}>
              분산된 업무 채널을<br />하나로 통합할 수 있습니다.
            </h2>
          </Anim>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '·', text: '카톡·슬랙·이메일·엑셀에 업무가 분산되어 파악이 어렵습니다.' },
              { icon: '·', text: '누가 무슨 업무를 맡고 있는지 매번 물어봐야 합니다.' },
              { icon: '·', text: '일정 충돌과 업무 쏠림을 사전에 파악할 수 없습니다.' },
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

        {/* F01 — 팀 스케줄 한 화면 */}
        <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.05), transparent)' }}>
          <div className="wo-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim className="wo-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>01 — 팀 스케줄 한 화면</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>팀 전체 업무가<br />한 화면에 표시됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>팀원별·프로젝트별로 필터하고, 충돌과 공백을 시각적으로 확인합니다. 별도 공유 없이 팀 전원이 동일한 화면을 봅니다.</p>
            </Anim>
            <Anim delay={120} className="wo-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '16px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(5, 1fr)', gap: 4 }}>
                    <div />
                    {['월', '화', '수', '목', '금'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', paddingBottom: 6 }}>{d}</div>
                    ))}
                    {[
                      { name: '김지현', color: ACCENT, tasks: ['디자인', null, '검토', null, '발표'] },
                      { name: '박민수', color: '#8B5CF6', tasks: [null, '미팅', null, '미팅', null] },
                      { name: '이수연', color: GREEN, tasks: ['기획서', '기획서', null, '보고서', null] },
                      { name: '최준혁', color: '#F59E0B', tasks: [null, 'QA', 'QA', null, 'QA'] },
                    ].map((member, ri) => ([
                      <div key={`name-${member.name}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', paddingRight: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.color, flexShrink: 0 }} />
                        {member.name.slice(0, 2)}
                      </div>,
                      ...member.tasks.map((task, ci) => {
                        return (
                          <div key={`${member.name}-${ci}`} style={{ height: 28, borderRadius: 5, background: task ? `${member.color}1A` : 'rgba(255,255,255,0.03)', border: `1px solid ${task ? `${member.color}40` : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: task ? 600 : undefined, color: task ? 'rgba(255,255,255,0.75)' : 'transparent', opacity: 0, animation: `fadeUp 0.4s ease ${200 + (ri * 5 + ci) * 40}ms forwards` }}>
                            {task ?? '·'}
                          </div>
                        )
                      }),
                    ]))}
                  </div>
                  {/* 충돌 표시 */}
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 11 }}>
                    <span style={{ color: '#EF4444' }}>⚠</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>수요일 · 이수연·최준혁 일정 겹침</span>
                  </div>
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* F02 — 자동 균등 배정 */}
        <section style={{ padding: '100px 24px' }}>
          <div className="wo-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim delay={120} className="wo-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>팀원별 업무량</div>
                  {[
                    { name: '김지현', count: 14, max: 20, color: '#EF4444' },
                    { name: '박민수', count: 6, max: 20, color: '#F59E0B' },
                    { name: '이수연', count: 12, max: 20, color: ACCENT },
                    { name: '최준혁', count: 4, max: 20, color: '#F59E0B' },
                  ].map((m, i) => (
                    <div key={m.name} style={{ marginBottom: 10, opacity: 0, animation: `fadeUp 0.4s ease ${150 + i * 80}ms forwards` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{m.name}</span>
                        <span style={{ color: m.color, fontWeight: 700 }}>{m.count}건</span>
                      </div>
                      <div style={{ height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(m.count / m.max) * 100}%`, height: '100%', background: m.color, borderRadius: 4, transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '10px', borderRadius: 9, marginTop: 14, animation: 'autoGlow 3s ease-in-out infinite', cursor: 'pointer' }}>자동 균등 배정 실행</div>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>→ 배정 후: 전원 9~10건으로 균등 분배</div>
                </div>
              </div>
            </Anim>
            <Anim className="wo-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>02 — 자동 균등 배정</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>업무가 자동으로<br />균등하게 배분됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>팀원 가용 시간과 업무 부하를 고려해 자동으로 배정합니다. 특정 팀원에게 쏠리는 업무를 균등하게 분산합니다.</p>
            </Anim>
          </div>
        </section>

        {/* F03 — 실시간 동기화 */}
        <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, transparent, rgba(59,130,246,0.05), transparent)' }}>
          <div className="wo-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim className="wo-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>03 — 실시간 동기화</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>새로고침 없이<br />즉시 반영됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>팀장이 업무를 배정하면 팀원 화면에 즉시 반영됩니다. 별도 공유나 알림 없이 팀 전원이 동일한 최신 상태를 확인합니다.</p>
            </Anim>
            <Anim delay={120} className="wo-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '16px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    {[
                      { label: '팀장 화면', slots: [{ time: '월 10:00', name: '기획 발표', live: false }, { time: '화 14:00', name: '클라이언트', live: true }, { time: '목 09:00', name: 'QA 리뷰', live: false }] },
                      { label: '팀원 화면', slots: [{ time: '월 10:00', name: '배정됨', live: false }, { time: '화 14:00', name: '✦ 새 업무!', live: true, isNew: true }, { time: '목 09:00', name: '배정됨', live: false }] },
                    ].map(pane => (
                      <div key={pane.label} style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
                          {pane.label}
                        </div>
                        {pane.slots.map(slot => (
                          <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 4, fontSize: 9, animation: slot.live ? 'liveSlot 3s ease-in-out infinite' : undefined }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{slot.time}</span>
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
              </div>
            </Anim>
          </div>
        </section>

        {/* F04 — 내보내기 + 캘린더 연동 */}
        <section style={{ padding: '100px 24px' }}>
          <div className="wo-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <Anim delay={120} className="wo-feat-visual">
              <div style={{ background: '#13141c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 6, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>내보내기 · 연동</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { label: 'XLSX', desc: '엑셀 스프레드시트', color: '#22c55e' },
                      { label: 'PDF', desc: '고정 레이아웃', color: '#EF4444' },
                      { label: 'ICS', desc: '구글 캘린더 연동', color: ACCENT },
                      { label: 'CSV', desc: '원시 데이터', color: '#F59E0B' },
                    ].map((f, i) => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, cursor: 'pointer', opacity: 0, animation: `fadeUp 0.4s ease ${150 + i * 80}ms forwards` }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{f.label}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{f.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>이번 주 → 다음 주 복사</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1, padding: '6px 10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 7, fontSize: 11, fontWeight: 600, color: ACCENT, textAlign: 'center' }}>8/11–8/15</div>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
                      <div style={{ flex: 1, padding: '6px 10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 7, fontSize: 11, fontWeight: 600, color: GREEN, textAlign: 'center' }}>8/18–8/22</div>
                    </div>
                  </div>
                </div>
              </div>
            </Anim>
            <Anim className="wo-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>04 — 내보내기 + 캘린더 연동</div>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>주간 업무표를<br />즉시 내보냅니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>주간 스케줄을 XLSX·PDF로 내보내고, 캘린더 파일(.ics)로 구글 캘린더에 가져올 수 있습니다. 이번 주 스케줄을 다음 주에 그대로 복사하여 반복 업무를 빠르게 설정합니다.</p>
            </Anim>
          </div>
        </section>

        <div className="wave" />

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 640, margin: '0 auto' }}>
              {['IT·스타트업', '디자인 에이전시', '마케팅팀', '프리랜서 팀', '컨설팅', '법무·회계', '건축·인테리어', '미디어', '이커머스', '교육 기관'].map((tag, i) => (
                <span key={tag} className="wo-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 40}ms forwards` }}>{tag}</span>
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
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>업무 배정 뒤에서 움직이는 스케줄 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>WORK:ON은 다양한 업종에 적용 가능한 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
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
                          <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: step.done ? 'rgba(34,197,94,0.04)' : step.active ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 7, fontSize: 11 }}>
                            <div style={{ width: 19, height: 19, borderRadius: '50%', background: step.done ? 'rgba(34,197,94,0.18)' : step.active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.07)', color: step.done ? '#22c55e' : step.active ? ACCENT : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
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
                          { time: '09:00', cells: ['기획', null, '발표', null, '검토'] },
                          { time: '13:00', cells: [null, '미팅', null, '미팅', null] },
                          { time: '16:00', cells: ['QA', null, 'QA', null, '보고'] },
                        ].map(row => ([
                          <div key={`t-${row.time}`} style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
                          ...row.cells.map((name, ci) => (
                            <div key={`${row.time}-${ci}`} style={{ height: 22, borderRadius: 4, background: name ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${name ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: name ? 600 : undefined, color: name ? 'rgba(255,255,255,0.8)' : 'transparent' }}>
                              {name ?? '·'}
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
                          { label: '팀장 화면', slots: [{ time: '월 10:00', name: '전략 회의', live: false }, { time: '화 14:00', name: '박민수', live: true }, { time: '목 09:00', name: 'QA 리뷰', live: false }] },
                          { label: '팀원 화면', slots: [{ time: '월 10:00', name: '확인됨', live: false }, { time: '화 14:00', name: '✦ 새 배정!', live: true, isNew: true }, { time: '목 09:00', name: '확인됨', live: false }] },
                        ].map(pane => (
                          <div key={pane.label} style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
                              {pane.label}
                            </div>
                            {pane.slots.map(slot => (
                              <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, marginBottom: 4, fontSize: 9, animation: slot.live ? 'liveSlot 3s ease-in-out infinite' : undefined }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 42 }}>{slot.time}</span>
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
                  desc: '팀장이 업무를 배정하면 팀원 화면에 새로고침 없이 즉시 반영됩니다.',
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
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>요일 선택 (월·수·금)</div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => {
                          const on = i === 1 || i === 3 || i === 5
                          return (
                            <span key={d} style={{ width: 22, height: 22, borderRadius: 6, background: on ? 'rgba(59,130,246,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                          )
                        })}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>자동 생성된 슬롯</div>
                      {['8/11 (월) · 10:00 · 정기 미팅', '8/13 (수) · 10:00 · 정기 미팅', '8/15 (금) · 10:00 · 정기 미팅'].map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록 (정기 미팅·업무 반복)',
                  desc: '반복 유형·요일·시간대를 지정하면 정기 미팅과 반복 업무를 한 번에 일괄 등록합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>인원 설정</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                        {([
                          { name: '김지현', color: ACCENT, load: '14건', max: 10, delay: 0 },
                          { name: '박민수', color: '#8B5CF6', load: '6건', max: 10, delay: 80 },
                          { name: '이수연', color: GREEN, load: '12건', max: 10, delay: 160 },
                          { name: '최준혁', color: '#F59E0B', load: '4건', max: 10, delay: 240 },
                        ] as { name: string; color: string; load: string; max: number; delay: number }[]).map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, fontSize: 11, opacity: 0, animation: `fadeUp 0.4s ease ${m.delay}ms forwards` }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)' }}>현재 {m.load}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: m.color, background: `${m.color}1a`, padding: '2px 5px', borderRadius: 4 }}>최대 {m.max}회/월</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>균등 배정 기준</div>
                        {([
                          { label: '목표 균등도', pct: 90, unit: '90%', color: ACCENT, delay: 340 },
                          { label: '허용 편차', pct: 20, unit: '±2건', color: '#8B5CF6', delay: 440 },
                        ] as { label: string; pct: number; unit: string; color: string; delay: number }[]).map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, opacity: 0, animation: `fadeUp 0.4s ease ${r.delay}ms forwards` }}>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 48, flexShrink: 0 }}>{r.label}</span>
                            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, background: r.color, width: `${r.pct}%`, transformOrigin: 'left', animation: `barFill 0.6s ease ${r.delay + 150}ms both` }} />
                            </div>
                            <span style={{ fontSize: 9, color: r.color, fontWeight: 700, width: 26, flexShrink: 0, textAlign: 'right' }}>{r.unit}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 9, marginBottom: 10, animation: 'autoGlow 3s ease-in-out infinite' }}>자동 균등 배정 실행</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>배정 결과 미리보기</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                        {['월', '화', '수', '목', '금'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {([
                          { init: '박', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.28)', color: '#8B5CF6', delay: 600 },
                          { init: '김', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: ACCENT, delay: 750 },
                          { init: '최', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 900 },
                          { init: '이', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)', color: GREEN, delay: 1050 },
                          { init: '박', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.28)', color: '#8B5CF6', delay: 1200 },
                          { init: '최', bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.28)', color: '#F59E0B', delay: 1350 },
                          { init: '김', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: ACCENT, delay: 1500 },
                          { init: '이', bg: 'rgba(34,197,94,0.13)', border: 'rgba(34,197,94,0.28)', color: GREEN, delay: 1650 },
                          { init: '—', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', delay: 1800 },
                          { init: '박', bg: 'rgba(139,92,246,0.13)', border: 'rgba(139,92,246,0.28)', color: '#8B5CF6', delay: 1950 },
                        ] as { init: string; bg: string; border: string; color: string; delay: number }[]).map((cell, i) => (
                          <div key={i} style={{ padding: '5px 0', textAlign: 'center', borderRadius: 5, background: cell.bg, border: `1px solid ${cell.border}`, fontSize: 10, fontWeight: 700, color: cell.color, opacity: 0, animation: `cellFill 0.4s ease ${cell.delay}ms forwards` }}>{cell.init}</div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '자동 배정 (업무 균등 분배)',
                  desc: '월별 최대 횟수와 균등도 목표를 설정하면, 팀원 부하를 고려해 빈 슬롯을 자동으로 채웁니다.',
                },
                {
                  visual: (() => {
                    const days = Array.from({ length: 31 }, (_, i) => {
                      const d = i + 1
                      const dow = (6 + i) % 7
                      const isSlot = dow >= 1 && dow <= 5
                      const isHol = d === 15
                      const isSpc = d === 22
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
                            { dot: true, color: ACCENT, label: '정기 업무일' },
                            { dot: false, bg: 'rgba(239,68,68,0.5)', label: '광복절 휴일' },
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
                  title: '반복 규칙 + 날짜 예외 (휴일·특별일)',
                  desc: '"평일 운영" 기본 규칙에 휴일·특별 운영일을 그날만 따로 지정할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>업무 정보 · 커스텀 필드</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {[
                          { type: '텍스트', label: '프로젝트', value: 'DTS v2.0', tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                          { type: '텍스트', label: '클라이언트', value: '(주)ABC Corp', tc: ACCENT, tb: 'rgba(59,130,246,0.12)' },
                          { type: '선택', label: '우선순위', value: '높음', tc: '#EF4444', tb: 'rgba(239,68,68,0.12)' },
                          { type: '날짜', label: '마감일', value: '2026.08.29', tc: '#F59E0B', tb: 'rgba(245,158,11,0.1)' },
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
                  title: '입력항목 설정 (프로젝트·클라이언트·우선순위)',
                  desc: '프로젝트, 클라이언트, 우선순위 등 팀 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>화 14:00 · 클라이언트 미팅</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>ABC Corp · 박민수 담당</div>
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>업무 산출물 첨부</div>
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
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>제안서_ABC_0812.pdf</div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: '100%', height: '100%', background: ACCENT, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>1.2 MB · 업로드 완료</div>
                        </div>
                      </div>
                    </div>
                  ),
                  title: '사진 첨부 (업무 산출물)',
                  desc: '제안서, 보고서, 회의록 등 업무 산출물을 슬롯에 직접 첨부하여 팀원과 공유합니다.',
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
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>이번 주 업무표</div>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5 }}>드래그 선택 중</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(5, 1fr)', gap: 3, marginBottom: 10 }}>
                        <div />
                        {(['월','화','수','목','금'] as string[]).map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                        ))}
                        {([
                          { time: '09:00', delays: [null, 0, 350, null, null] },
                          { time: '13:00', delays: [null, 700, 1050, null, null] },
                          { time: '16:00', delays: [null, null, null, null, null] },
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
                        <div style={{ flex: 1, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: ACCENT, fontWeight: 600 }}>이번 주 선택</div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '0 2px' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: '#22c55e', fontWeight: 600 }}>다음 주 붙여넣기</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['XLSX', 'PDF', 'ICS', 'CSV'].map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 문서다운로드',
                  desc: '셀을 드래그해 복사·붙여넣기. 주간 업무표를 엑셀·PDF·캘린더·CSV로 내보냅니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"지현이 다음주 월요일 클라이언트 미팅"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {[
                            { label: '담당자', value: '김지현' },
                            { label: '날짜', value: '다음주 월요일' },
                            { label: '시간', value: '10:00' },
                            { label: '업무', value: '클라이언트 미팅' },
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
                  desc: '"지현이 다음주 월요일 클라이언트 미팅"처럼 말하듯 입력하면 자동으로 슬롯에 등록됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="wo-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <section style={{ textAlign: 'center', padding: '60px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.5 }}>분산된 업무 채널을 하나로 통합하십시오.<br />WORK:ON이 대신합니다.</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>신용카드 불필요 · 10명까지 영구 무료</p>
            <button className="wo-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

        <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          © 2026 WORK:ON · DTS · <a href="/privacy" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>개인정보처리방침</a>
        </footer>

      </div>
      <DevFileLabel file="LandingWorkOn.tsx" />
    </>
  )
}
