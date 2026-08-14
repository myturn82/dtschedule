// src/pages/landing/LandingLessonOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'

const ACCENT = '#F2604E'
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

export function LandingLessonOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=lesson-sports')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(242,96,78,0.35);} 50% { box-shadow:0 8px 52px rgba(242,96,78,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        body { margin:0; background:#0a0b10; }
        .lo-nav   { animation: navFade 0.5s ease both; }
        .lo-badge { animation: badgePop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        .lo-h1    { animation: fadeUp 0.75s ease 0.22s both; }
        .lo-sub   { animation: fadeUp 0.65s ease 0.38s both; }
        .lo-cta   { animation: fadeUp 0.65s ease 0.5s both, ctaPulse 2.8s ease-in-out 1.2s infinite; }
        .lo-glow  { animation: glowPulse 5s ease-in-out infinite; }
        .lo-card  { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; cursor:default; }
        .lo-card:hover { transform:translateY(-6px); border-color:rgba(242,96,78,0.3) !important; box-shadow:0 16px 48px rgba(0,0,0,0.35); }
        .lo-tag-btn { transition: background 0.18s, transform 0.18s; }
        .lo-tag-btn:hover { transform:scale(1.06); }
        @media (max-width:720px) {
          .lo-feat-grid { grid-template-columns:1fr !important; gap:0 !important; }
          .lo-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .lo-feat-text { order:1 !important; text-align:center !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif" }}>

        {/* Nav */}
        <nav className="lo-nav" style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(10,11,16,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>LESSON:ON</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goLogin} style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.18s, color 0.18s' }}>로그인</button>
            <button onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.18s' }}>무료로 시작하기</button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '120px 24px 100px', position: 'relative', overflow: 'hidden' }}>
          <div className="lo-glow" style={{ position: 'absolute', top: -200, left: '50%', width: 900, height: 500, background: 'radial-gradient(circle, rgba(242,96,78,0.22), transparent 70%)', pointerEvents: 'none', transformOrigin: 'center center' }} />
          <div className="lo-badge" style={{ display: 'inline-block', background: 'rgba(242,96,78,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>강사를 위한 회원권 관리</div>
          <h1 className="lo-h1" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 720 }}>
            수업 일정부터 수강권 관리까지.<br /><span style={{ color: ACCENT }}>Lesson On</span> 하나면<br />운영이 더 쉬워집니다.
          </h1>
          <p className="lo-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>지금 바로 무료로 시작하세요.</p>
          <button className="lo-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기 →</button>
        </section>

        {/* 01 — 강사의 하루 */}
        <section style={{ padding: '100px 24px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Anim>
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>01 — 강사의 하루</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px' }}>
              "이 회원님 남은 횟수가 몇 번이더라..."<br />"오늘 그분 오시는 날 맞나?"
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginTop: 24 }}>
              수기 장부, 카톡 캡처, 엑셀 시트를 오가며<br />수업 준비보다 관리에 더 많은 시간을 씁니다.
            </p>
          </Anim>
        </section>

        {/* 02 — 자동 소진 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(242,96,78,0.05), transparent)' }}>
          <div className="lo-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim style={{}} className="lo-feat-text">
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>02 — 자동 소진</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>등록해두면, 수업마다<br />알아서 차감됩니다</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>코치가 회원과 사전 조율한 횟수제 레슨권(그룹 4회, 개인 8회 등)을 등록해두면, 수업이 진행될 때마다 결제 기록에서 잔여 횟수가 자동으로 소진됩니다.</p>
            </Anim>
            <Anim delay={120}>
              <div className="lo-feat-visual" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>결제 기록 · 회원별 소진 현황</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.6fr 0.7fr', fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '0 16px 8px', textAlign: 'center' }}>
                  <span>회원</span><span>레슨종류</span><span>소진</span><span>상태</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: '조은수', type: '그룹레슨-4회', used: '0/4', status: '진행중', highlight: false },
                    { name: '윤소이', type: '개인레슨-8회', used: '3/8', status: '진행중', highlight: false },
                    { name: '박진희', type: '그룹레슨-8회', used: '7/8', status: '만료 임박', highlight: true },
                  ].map((r, i) => (
                    <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.6fr 0.7fr', alignItems: 'center', background: r.highlight ? 'rgba(242,96,78,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', fontSize: 13, textAlign: 'center', opacity: 0, animation: `fadeUp 0.5s ease ${200 + i * 100}ms forwards` }}>
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.type}</span>
                      <span style={{ color: r.highlight ? ACCENT : 'rgba(255,255,255,0.6)', fontWeight: r.highlight ? 700 : undefined }}>{r.used}</span>
                      <span style={{ color: r.highlight ? ACCENT : GREEN, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Anim>
          </div>
        </section>

        {/* 03 — 재등록 유도 */}
        <section style={{ padding: '80px 24px' }}>
          <div className="lo-feat-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
            <Anim delay={120}>
              <div className="lo-feat-visual" style={{ order: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 340, justifySelf: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>만료 임박 알림</div>
                <div style={{ background: 'rgba(242,96,78,0.1)', border: '1px solid rgba(242,96,78,0.25)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>⏰ 만료 임박 레슨권 미소진 회원 1명</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>선택한 기간 내 만료가 도래하지만 아직 다 사용하지 않은 회원입니다. 문자로 소진을 독려해 보세요.</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    <span style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8 }}>1주일 전</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 11, padding: '5px 10px', borderRadius: 8 }}>2주일 전</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 11, padding: '5px 10px', borderRadius: 8 }}>직접입력</span>
                  </div>
                  <div style={{ background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center', borderRadius: 10, padding: 10 }}>📩 문자 발송</div>
                </div>
              </div>
            </Anim>
            <Anim style={{ order: 1 }}>
              <div className="lo-feat-text">
                <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>03 — 재등록 유도</div>
                <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>만료 임박 회원에게,<br />자동으로 알려드려요</h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>레슨권 만료일이 가까운데 아직 다 쓰지 않은 회원을 자동으로 모아 보여줍니다. 기준(1주일 전, 2주일 전 등)을 정하면 한 번에 단체 문자를 발송해 소진과 재등록을 독려할 수 있습니다.</p>
              </div>
            </Anim>
          </div>
        </section>

        {/* 04 — 데이터로 관리 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(242,96,78,0.05), transparent)' }}>
          <Anim style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>04 — 데이터로 관리</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>대시보드에서, 레슨권 통계를<br />바로 조회하세요</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>회원별 레슨권 소진 추이를 자동 집계합니다. 아래 통계 데이터를 대시보드에서 바로 확인할 수 있어요.</p>
          </Anim>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { tag: '누적', title: '현재 유효 레슨권 보유 인원', desc: '인원 수 + 회원별 잔여·만료일 목록' },
              { tag: '누적', title: '레슨권 종류별 판매 건수', desc: '건수 + 점유율 테이블' },
              { tag: '누적', title: '소진율 현황', desc: '진행중 / 소진완료 / 만료 3칸 카드' },
              { tag: '누적', title: '만료 시 평균 잔여 회차', desc: '평균 회차 + 만료 목록' },
              { tag: '누적', title: '재구매 회원 현황', desc: '인원 수 + 구매횟수·첫/최근 구매일' },
              { tag: '월별', title: '해당 월 신규 결제 건수', desc: '건수 + 회원·레슨권·결제일 목록' },
              { tag: '월별', title: '해당 월 결제 레슨권 소진율', desc: '평균 소진% + 상태별 목록' },
            ].map((item, i) => (
              <Anim key={item.title} delay={i * 60}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', transition: 'background 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                  <span style={{ flexShrink: 0, whiteSpace: 'nowrap', background: item.tag === '누적' ? 'rgba(242,96,78,0.12)' : 'rgba(255,255,255,0.08)', color: item.tag === '누적' ? ACCENT : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>{item.tag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.desc}</div>
                  </div>
                </div>
              </Anim>
            ))}
          </div>
        </section>

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>이런 곳에서 쓰고 있어요</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
              {['PT·헬스', '요가', '필라테스', '골프 레슨', '무술·격투기', '수영', '발레', '댄스'].map((tag, i) => (
                <span key={tag} className="lo-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 50}ms forwards` }}>{tag}</span>
              ))}
            </div>
          </Anim>
        </section>

        {/* 엔진 기능 */}
        <section style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Anim style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>엔진</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>레슨권 뒤에서 움직이는 스케줄 엔진</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>LESSON:ON은 단일 서비스가 아니라, 여러 업종에 쓰이는 스케줄 엔진 위에 만들어졌습니다. 그래서 아래 기본 기능들을 사용할 수 있습니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[1,2,3,4].map(i => <span key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />)}
                        {[5,6,7].map(i => <span key={i} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px dashed rgba(255,255,255,0.25)', display: 'inline-block' }} />)}
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}><div style={{ width: '55%', height: '100%', background: ACCENT }} /></div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>4/7 단계 · 요일 규칙 설정 중</div>
                    </div>
                  ),
                  title: '5분 셋업 위자드',
                  desc: '운영 모드·시간 단위·요일 규칙을 7단계 질문으로 안내받아 바로 시작합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[['월간', true], ['주간', false], ['일간', false]].map(([label, active]) => (
                          <span key={label as string} style={{ background: active ? ACCENT : 'rgba(255,255,255,0.08)', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: active ? 700 : undefined, padding: '3px 8px', borderRadius: 6 }}>{label as string}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[['일자별', false], ['시간별', true]].map(([label, active]) => (
                          <span key={label as string} style={{ background: active ? 'rgba(242,96,78,0.15)' : 'rgba(255,255,255,0.08)', color: active ? ACCENT : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: active ? 700 : undefined, padding: '3px 8px', borderRadius: 6 }}>{label as string}</span>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3 }}>
                        {[false, true, false, true, false, true].map((on, i) => (
                          <div key={i} style={{ height: 10, borderRadius: 2, background: on ? ACCENT : 'rgba(255,255,255,0.08)' }} />
                        ))}
                      </div>
                    </div>
                  ),
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간, 일자별·시간별 보기를 조직과 사용자의 상황에 따라 마음껏 전환할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      {[{ label: '강사' }, { label: '' }, { label: '회원' }].map((item, i) => i === 1 ? (
                        <div key="line" style={{ flex: 1, height: 1, borderTop: '1.5px dashed rgba(255,255,255,0.2)', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />
                        </div>
                      ) : (
                        <div key={item.label} style={{ textAlign: 'center' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '실시간 동기화',
                  desc: '강사와 회원이 동시에 캘린더를 봐도 새로고침 없이 즉시 반영되어 중복 예약을 막습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[['매일', false], ['매주', true], ['매월', false]].map(([label, active]) => (
                          <span key={label as string} style={{ background: active ? ACCENT : 'rgba(255,255,255,0.08)', color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: active ? 700 : undefined, padding: '3px 8px', borderRadius: 6 }}>{label as string}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[['일', true], ['월', false], ['화', false], ['수', false], ['토', true]].map(([d, active]) => (
                          <span key={d as string} style={{ width: 20, height: 20, borderRadius: 5, background: active ? 'rgba(242,96,78,0.15)' : undefined, border: active ? undefined : '1px solid rgba(255,255,255,0.1)', color: active ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: active ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d as string}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 5, marginRight: 4 }}>10:00-11:00</span>
                        <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 5 }}>14:00-15:00</span>
                      </div>
                    </div>
                  ),
                  title: '반복 등록',
                  desc: '반복 유형·요일·시간대·기간을 지정하면 회원 한 명의 수업을 여러 슬롯에 한 번에 일괄 등록합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>역할별 · 역할 비율 (합계 100%)</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>대표</span>
                          <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 8px', fontSize: 10, color: '#fff' }}>30%</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>회원</span>
                          <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 8px', fontSize: 10, color: '#fff' }}>70%</span>
                          <span style={{ marginLeft: 'auto', background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 5, padding: '3px 8px' }}>비율 저장</span>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>회원별 · 가능 요일 설정</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>성시호</span>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {[false, false, true, false, false].map((on, i) => (
                              <span key={i} style={{ width: 14, height: 14, borderRadius: 4, background: on ? ACCENT : undefined, border: on ? undefined : '1px solid rgba(255,255,255,0.15)', display: 'inline-block' }} />
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>신하랑 <span style={{ float: 'right' }}>›</span></div>
                      </div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별로 대표·회원 비율을, 회원별로 가능 요일과 월 최대 횟수를 설정하면 빈 슬롯을 규칙에 맞춰 자동으로 채웁니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[['월', true], ['화', false], ['수', true], ['목', false], ['금', true]].map(([d, on]) => (
                          <span key={d as string} style={{ width: 26, height: 26, borderRadius: 7, background: on ? ACCENT : undefined, border: on ? undefined : '1px solid rgba(255,255,255,0.15)', color: on ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d as string}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: 'rgba(242,96,78,0.12)', color: ACCENT, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>7/15 휴관 예외</span>
                        <span>그날만 별도 지정</span>
                      </div>
                    </div>
                  ),
                  title: '반복 규칙 + 날짜 예외',
                  desc: '"월·수·금 운영" 같은 기본 규칙에 휴관일·특별 운영일을 그날만 따로 지정할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 14px 12px', height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>부상 이력</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>왼쪽 무릎</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>보유 레슨권</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>10회권</span></div>
                      <div style={{ border: `1px dashed ${ACCENT}`, borderRadius: 6, padding: '4px 8px', fontSize: 11, color: ACCENT, textAlign: 'center', fontWeight: 700 }}>+ 필드 추가</div>
                    </div>
                  ),
                  title: '입력항목 설정',
                  desc: '부상 이력, 보유 레슨권 종류 등 우리 스튜디오만의 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🖼️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 6 }}><div style={{ width: '70%', height: '100%', background: ACCENT }} /></div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>brand_photo.webp · <span style={{ color: ACCENT, fontWeight: 700 }}>312KB · 압축 완료</span></div>
                      </div>
                    </div>
                  ),
                  title: '사진 첨부',
                  desc: '회원 자세 교정 사진 등을 배정에 첨부. 브라우저에서 자동 압축돼 용량 걱정이 없습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                        {[false, true, true, false, false, true, true, false].map((on, i) => (
                          <div key={i} style={{ height: 14, border: on ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                        {['엑셀', 'CSV', 'PDF'].map(f => <span key={f} style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 5 }}>{f}</span>)}
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 내보내기',
                  desc: '셀을 드래그해 복사·붙여넣기. 한 달 스케줄을 엑셀·CSV·워드·PDF로 내보냅니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, height: 88, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>"박지은님 화요일 10시 요가 예약"</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span style={{ color: ACCENT }}>↓</span>
                        <span style={{ background: 'rgba(242,96,78,0.12)', color: ACCENT, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>화 10:00 · 요가 · 박지은</span>
                      </div>
                    </div>
                  ),
                  title: 'AI 자연어 예약',
                  desc: '"박지은님 화요일 10시 요가 예약"처럼 말하듯 입력하면 자동으로 슬롯에 등록됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="lo-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%' }}>
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
          <section style={{ textAlign: 'center', padding: '60px 24px 100px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>직접 쓰던 번거로움, 오늘로 끝내세요.<br />이제 Lesson On으로 전환하세요.</h2>
            <button className="lo-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

      </div>
      <DevFileLabel file="LandingLessonOn.tsx" />
    </>
  )
}
