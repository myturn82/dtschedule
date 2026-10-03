// src/pages/landing/PromoCard.tsx
import type { ReactNode, CSSProperties } from 'react'

const ACCENT = '#F2604E'
const BG = '#0a0b10'
const CARD_SIZE = 600

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      width: CARD_SIZE, height: CARD_SIZE, flexShrink: 0,
      background: BG, position: 'relative', overflow: 'hidden',
      fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif",
      color: '#fff',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Logo({ size = 16 }: { size?: number }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.5px', color: ACCENT }}>
      LESSON:ON
    </span>
  )
}

function Glow({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <div style={{
      position: 'absolute', top: -180, left: '50%', transform: 'translateX(-50%)',
      width: 700, height: 400, pointerEvents: 'none',
      background: `radial-gradient(circle, rgba(242,96,78,${opacity}), transparent 65%)`,
    }} />
  )
}

// 카드 1 — 문제 공감
function Card1() {
  return (
    <Card>
      <Glow opacity={0.22} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 48 }}>
        <Logo size={18} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 28,
            background: 'rgba(242,96,78,0.12)', display: 'inline-block',
            padding: '4px 12px', borderRadius: 20, width: 'fit-content',
          }}>필라테스·요가 강사라면 공감하실 겁니다</div>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.45, letterSpacing: '-0.8px', marginBottom: 28 }}>
            "이 회원님<br />수강권 몇 회<br />남았더라...?"
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
            수업 준비보다 장부 관리에<br />더 많은 시간을 쓰고 계십니까?
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          1 / 5 — 해결책을 알려드립니다
        </div>
      </div>
    </Card>
  )
}

// 카드 2 — Before/After
function Card2() {
  const entries = [
    { date: '8/18 (화)', lines: ['10:00 이하나, 김민지', '14:00 박진희', '※ 김민지 다음주 취소 요청??'], warn: true },
    { date: '8/20 (목)', lines: ['11:00 윤소이, 성시호', '성시호→박진희로?? 확인필요'], warn: true },
  ]
  return (
    <Card>
      <Glow opacity={0.14} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <Logo size={16} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>2 / 5</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 24 }}>
          수기 장부 대신<br /><span style={{ color: ACCENT }}>클릭 한 번</span>으로 끝냅니다
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 12, flex: 1, alignItems: 'center' }}>
          {/* Before */}
          <div style={{ background: '#111218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, height: '100%' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, fontWeight: 700 }}>📝 8월 수업일정.txt</div>
            {entries.map(e => (
              <div key={e.date} style={{ borderLeft: `2px solid rgba(242,96,78,0.4)`, paddingLeft: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 3 }}>{e.date}</div>
                {e.lines.map((l, i) => (
                  <div key={i} style={{ fontSize: 10, color: e.warn && i === e.lines.length - 1 ? 'rgba(255,196,0,0.7)' : 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{l}</div>
                ))}
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 18, color: ACCENT }}>→</div>
          </div>
          {/* After */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, height: '100%' }}>
            <div style={{ fontSize: 10, color: ACCENT, marginBottom: 10, fontWeight: 700 }}>LESSON:ON · 주간뷰</div>
            <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(5,1fr)', gap: 3 }}>
              <div />
              {['월','화','수','목','금'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', paddingBottom: 3 }}>{d}</div>
              ))}
              {[
                { t: '10:00', cells: ['이하나', null, '이하나', null, '김민지'] },
                { t: '13:00', cells: [null, '박진희', null, '윤소이', null] },
                { t: '14:00', cells: ['김민지', null, '박진희', null, '이하나'] },
              ].map(row => [
                <div key={`t-${row.t}`} style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.t}</div>,
                ...row.cells.map((n, ci) => (
                  <div key={`${row.t}-${ci}`} style={{ height: 22, borderRadius: 3, background: n ? 'rgba(242,96,78,0.13)' : 'rgba(255,255,255,0.03)', border: `1px solid ${n ? 'rgba(242,96,78,0.28)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.75)' }}>
                    {n ? n.slice(0,2) : ''}
                  </div>
                )),
              ])}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// 카드 3 — 잔여 횟수 자동 차감
function Card3() {
  const rows = [
    { name: '조은수', type: '매트 그룹', total: 8, used: 0, highlight: false },
    { name: '윤소이', type: '리포머 1:1', total: 10, used: 3, highlight: false },
    { name: '박진희', type: '매트 그룹', total: 8, used: 7, highlight: true },
  ]
  return (
    <Card>
      <Glow opacity={0.16} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Logo size={16} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>3 / 5</div>
        </div>
        <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>잔여 횟수 자동 차감</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.4, marginBottom: 32 }}>
          수업할 때마다<br />알아서 차감됩니다
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 0.8fr', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span>회원</span><span>종류</span><span>잔여</span><span>상태</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => {
              const remain = r.total - r.used
              return (
                <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 0.8fr', alignItems: 'center', background: r.highlight ? 'rgba(242,96,78,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{r.type}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ color: r.highlight ? ACCENT : 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: 13 }}>{remain}회</span>
                    <div style={{ width: 48, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: r.highlight ? ACCENT : '#22c55e', width: `${(remain / r.total) * 100}%` }} />
                    </div>
                  </div>
                  <span style={{ color: r.highlight ? ACCENT : '#22c55e', fontWeight: 700, fontSize: 11 }}>{r.highlight ? '만료 임박' : '진행중'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 카드 4 — 만료 임박 알림
function Card4() {
  return (
    <Card>
      <Glow opacity={0.18} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Logo size={16} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>4 / 5</div>
        </div>
        <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>재등록 유도</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.4, marginBottom: 28 }}>
          만료 임박 회원을<br />자동으로 추출하여<br />문자 일괄 발송합니다.
        </div>
        <div style={{ background: 'rgba(242,96,78,0.08)', border: '1px solid rgba(242,96,78,0.2)', borderRadius: 16, padding: 24, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>만료 임박 미사용 회원 1명</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 20 }}>
              선택 기간 내 만료가 도래하지만<br />아직 미사용 상태인 회원입니다.<br />문자로 이용을 독려하십시오.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['1주일 전', '2주일 전', '직접입력'].map((l, i) => (
                <span key={l} style={{ background: i === 0 ? ACCENT : 'rgba(255,255,255,0.06)', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: i === 0 ? 700 : undefined, padding: '6px 12px', borderRadius: 8 }}>{l}</span>
              ))}
            </div>
          </div>
          <div style={{ background: ACCENT, color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'center', borderRadius: 12, padding: '14px', letterSpacing: '-0.3px' }}>
            ✉ 문자 일괄 발송
          </div>
        </div>
      </div>
    </Card>
  )
}

// 카드 5 — 레슨 시작 전 알림
function Card5() {
  return (
    <Card>
      <Glow opacity={0.18} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Logo size={16} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>5 / 6</div>
        </div>
        <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>레슨 시작 전 알림</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.4, marginBottom: 24 }}>
          수업 시작 전<br />자동으로 알려드립니다
        </div>
        {/* 폰 알림 목업 */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 설정 표시 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>알림 시점</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['10분 전', '30분 전', '1시간 전'].map((l, i) => (
                <span key={l} style={{ background: i === 0 ? 'rgba(242,96,78,0.15)' : 'rgba(255,255,255,0.05)', color: i === 0 ? ACCENT : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: i === 0 ? 700 : undefined, padding: '4px 10px', borderRadius: 6, border: `1px solid ${i === 0 ? 'rgba(242,96,78,0.3)' : 'rgba(255,255,255,0.08)'}` }}>{l}</span>
              ))}
            </div>
          </div>
          {/* 알림 카드 목업 */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>레슨 시작 전 알림</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>방금</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              10시 레슨이 <span style={{ color: ACCENT, fontWeight: 700 }}>10분 후</span> 시작됩니다.<br />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>(이하나, 조은수)</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
            인앱 알림 + 스마트폰 푸시 동시 발송<br />메시지 템플릿을 직접 설정할 수 있습니다.
          </div>
        </div>
      </div>
    </Card>
  )
}

// 카드 6 — CTA
function Card6() {
  return (
    <Card>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 30%, rgba(242,96,78,0.25) 0%, transparent 65%)`,
      }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>6 / 6</div>
        <Logo size={22} />
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.45, margin: '28px 0 16px' }}>
          수기 관리의 번거로움을<br />해소하십시오.
        </div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 36 }}>
          매트 그룹반부터 리포머 1:1까지<br />LESSON:ON 하나면 운영이 더 쉬워집니다.
        </div>
        <div style={{
          background: ACCENT, color: '#fff', fontSize: 16, fontWeight: 700,
          padding: '16px 40px', borderRadius: 14, marginBottom: 20,
          boxShadow: '0 8px 32px rgba(242,96,78,0.4)',
          letterSpacing: '-0.3px',
        }}>
          무료로 시작하기 →
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          Google Play에서 <strong style={{ color: 'rgba(255,255,255,0.6)' }}>레슨온</strong> 검색
        </div>
      </div>
    </Card>
  )
}

export function PromoCard() {
  return (
    <>
      <style>{`
        body { margin: 0; background: #1a1a2e; }
        @media print { body { background: #0a0b10; } }
      `}</style>
      <div style={{
        minHeight: '100vh', background: '#1a1a2e',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 20px', gap: 0,
        fontFamily: "-apple-system,BlinkMacSystemFont,'Pretendard','Apple SD Gothic Neo',sans-serif",
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32, textAlign: 'center', lineHeight: 1.8 }}>
          각 카드를 스크린샷하여 카페에 첨부하세요.<br />
          브라우저 줌을 100%로 설정하면 600×600px로 캡처됩니다.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          {[<Card1 />, <Card2 />, <Card3 />, <Card4 />, <Card5 />, <Card6 />].map((card, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>카드 {i + 1}</div>
              <div style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)', borderRadius: 2 }}>
                {card}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
