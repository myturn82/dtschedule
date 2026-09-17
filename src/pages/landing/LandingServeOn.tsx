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

// 담당자 ↔ 봉사자 실시간 동기화 애니메이션
function ServeSyncDemo() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 8), 750)
    return () => clearInterval(t)
  }, [])
  const assigneeName  = phase >= 2 ? '박미영' : phase === 1 ? '배정 중...' : ''
  const volunteerName = phase >= 5 ? '박미영' : ''
  const arrowOn       = phase >= 3 && phase <= 4
  const volunteerPop  = phase === 5

  const Panel = ({ label, rows }: { label: string; rows: { time: string; name: string; pop?: boolean }[] }) => (
    <div style={{ background: '#0e0f18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'ledPulse 1s ease-in-out infinite' }} />
        {label}
      </div>
      {rows.map(row => (
        <div key={row.time} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 6px', borderRadius: 5, marginBottom: 3, fontSize: 10,
          background: row.pop ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${row.pop ? 'rgba(16,185,129,0.45)' : 'rgba(255,255,255,0.07)'}`,
          transition: 'background 0.35s, border-color 0.35s',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{row.time}</span>
          <span style={{ color: row.pop ? ACCENT : row.name ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.18)', fontWeight: row.pop ? 700 : undefined, transition: 'color 0.35s' }}>
            {row.name || '—'}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
        <Panel label="담당자 화면" rows={[
          { time: '09:00', name: '김영희' },
          { time: '10:00', name: assigneeName },
          { time: '14:00', name: '최준호' },
        ]} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 16, color: arrowOn ? ACCENT : 'rgba(255,255,255,0.18)', transition: 'color 0.3s', animation: arrowOn ? 'ledPulse 0.5s ease-in-out infinite' : undefined }}>↔</span>
          <span style={{ fontSize: 8, color: arrowOn ? ACCENT : 'transparent', fontWeight: 700, transition: 'color 0.3s', whiteSpace: 'nowrap' }}>동기화</span>
        </div>
        <Panel label="봉사자 화면" rows={[
          { time: '09:00', name: '김영희' },
          { time: '10:00', name: volunteerName, pop: volunteerPop },
          { time: '14:00', name: '최준호' },
        ]} />
      </div>
    </div>
  )
}

// 5분 셋업 위자드 단계별 애니메이션
function ServeWizardStepDemo() {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(true)
  const stepRef = useRef<number>(0)

  function go(next: number) {
    setShow(false)
    setTimeout(() => { setStep(next); stepRef.current = next; setShow(true) }, 180)
  }

  useEffect(() => {
    const t = setInterval(() => go((stepRef.current + 1) % 7), 3000)
    return () => clearInterval(t)
  }, [])

  const STEP_LABELS = ['단체 소개', '운영 모드', '역할 설정', '슬롯 규칙', '운영 시간', '커스텀 필드', '테마 색상']

  const previews: React.ReactNode[] = [
    <div key="p0">
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>분야</div>
      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '4px 7px', fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>복지관·NGO</span><span style={{ color: 'rgba(255,255,255,0.25)' }}>▾</span>
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>단체명</div>
      <div style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${ACCENT}55`, borderRadius: 5, padding: '4px 7px', fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
        사랑나눔봉사단<span style={{ animation: 'typeCursor 1s step-end infinite', borderLeft: `1.5px solid ${ACCENT}`, marginLeft: 1 }}>&thinsp;</span>
      </div>
    </div>,

    <div key="p1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {([
        { label: '선착순 신청', sel: false },
        { label: '자동 배정', sel: true },
        { label: '담당자 직접 배정', sel: false },
      ] as { label: string; sel?: boolean }[]).map(m => (
        <div key={m.label} style={{ padding: '4px 7px', borderRadius: 5, background: m.sel ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.sel ? ACCENT : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: m.sel ? 700 : undefined, color: m.sel ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1 }}>{m.label}</span>
          {m.sel && <span style={{ fontSize: 8, color: ACCENT }}>✓</span>}
        </div>
      ))}
    </div>,

    <div key="p2">
      <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
        {([{ name: '봉사자', badge: '칸분리', clr: ACCENT }, { name: '담당자', badge: '없음', clr: 'rgba(255,255,255,0.3)' }] as { name: string; badge: string; clr: string }[]).map(r => (
          <div key={r.name} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 6px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{r.name}</div>
            <div style={{ fontSize: 8, color: r.clr, marginTop: 1 }}>{r.badge}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: 2 }}>
        {([
          { t: '09:00', a: '김영희', b: '이철수' },
          { t: '10:00', a: '박미영', b: '최준호' },
          { t: '14:00', a: '김영희', b: '' },
        ] as { t: string; a: string; b: string }[]).map(row => [
          <div key={`t${row.t}`} style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.t}</div>,
          <div key={`a${row.t}`} style={{ height: 15, borderRadius: 3, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.65)' }}>{row.a}</div>,
          <div key={`b${row.t}`} style={{ height: 15, borderRadius: 3, background: row.b ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${row.b ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.65)' }}>{row.b}</div>,
        ])}
      </div>
    </div>,

    <div key="p3">
      <div style={{ display: 'flex', gap: 3, marginBottom: 7 }}>
        {(['30분', '1시간', '2시간'] as string[]).map((t, i) => (
          <span key={t} style={{ flex: 1, textAlign: 'center', fontSize: 9, padding: '3px 0', borderRadius: 4, background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: i === 1 ? 700 : undefined }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {(['09:00–10:00', '10:00–11:00', '13:00–14:00', '14:00–15:00'] as string[]).map((s, i) => (
          <span key={s} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 4, padding: '2px 5px', fontSize: 9, color: 'rgba(255,255,255,0.6)', opacity: 0, animation: `fadeUp 0.3s ease ${i * 90}ms forwards` }}>{s}</span>
        ))}
      </div>
    </div>,

    <div key="p4">
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {(['일', '월', '화', '수', '목', '금', '토'] as string[]).map((d, i) => {
          const on = i >= 1 && i <= 5
          return <div key={d} style={{ flex: 1, height: 20, borderRadius: 4, fontSize: 9, fontWeight: on ? 700 : undefined, background: on ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</div>
        })}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>09:00 ~ 18:00</div>
    </div>,

    <div key="p5" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {(['가능 요일 (선택)', '자격증 (텍스트)', '차량 유무 (체크)', '메모 (텍스트)'] as string[]).map((name, i) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 5, padding: '4px 7px', opacity: 0, animation: `fadeUp 0.3s ease ${i * 110}ms forwards` }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', flex: 1 }}>{name}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>✕</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 5, fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>+ 추가</div>
    </div>,

    <div key="p6">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {(['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'] as string[]).map((c, i) => (
          <span key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: i === 0 ? '2px solid #fff' : '2px solid transparent', display: 'inline-block' }} />
        ))}
      </div>
      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: ACCENT, fontWeight: 700, textAlign: 'center' }}>SERVE:ON 테마 색상 적용됨</div>
    </div>,
  ]

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '42% 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {STEP_LABELS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <div key={i} onClick={() => { if (i !== stepRef.current) go(i) }} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', padding: '3px 5px', borderRadius: 5, background: active ? 'rgba(16,185,129,0.08)' : 'transparent', border: `1px solid ${active ? 'rgba(16,185,129,0.22)' : 'transparent'}`, transition: 'background 0.25s, border-color 0.25s' }}>
                <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, fontSize: 8, fontWeight: 700, background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: done ? '#22c55e' : active ? ACCENT : 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : undefined, color: done ? 'rgba(255,255,255,0.28)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)', textDecoration: done ? 'line-through' : undefined, transition: 'color 0.2s', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            )
          })}
        </div>
        <div style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(5px)', transition: 'opacity 0.18s ease, transform 0.18s ease', minHeight: 110 }}>
          {previews[step]}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 5 }}>예상 소요 시간 · 약 5분</div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: `linear-gradient(90deg, #22c55e, ${ACCENT})`, borderRadius: 2, width: `${((step + 1) / 7) * 100}%`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// 보기방식 자유전환 애니메이션
function ViewCycleDemo() {
  const VIEWS = ['월간', '주간', '일간', '일자별', '시간별'] as const
  type V = typeof VIEWS[number]
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(true)
  const idxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setShow(false)
      setTimeout(() => {
        const next = (idxRef.current + 1) % VIEWS.length
        idxRef.current = next
        setIdx(next)
        setShow(true)
      }, 270)
    }, 2100)
  }

  function jump(newIdx: number) {
    if (newIdx === idxRef.current) return
    setShow(false)
    setTimeout(() => { idxRef.current = newIdx; setIdx(newIdx); setShow(true) }, 270)
    startTimer()
  }

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const view = VIEWS[idx]

  const content: Record<V, React.ReactNode> = {
    '월간': (
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 5, color: 'rgba(255,255,255,0.6)' }}>2026년 8월</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {['일','월','화','수','목','금','토'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.25)', paddingBottom: 2 }}>{d}</div>
          ))}
          {Array.from({ length: 5 }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: 27 }, (_, i) => {
            const d = i + 1; const hasSlot = [2,4,6,9,11,13,16,18,20,23,25].includes(d)
            return (
              <div key={d} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: d === 12 ? ACCENT : 'transparent', position: 'relative' }}>
                <span style={{ fontSize: 8, color: d === 12 ? '#fff' : 'rgba(255,255,255,0.5)' }}>{d}</span>
                {hasSlot && d !== 12 && <span style={{ position: 'absolute', bottom: 0, width: 3, height: 3, borderRadius: '50%', background: ACCENT }} />}
              </div>
            )
          })}
        </div>
      </div>
    ),
    '주간': (
      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(5, 1fr)', gap: 3 }}>
        <div />
        {['월','화','수','목','금'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', paddingBottom: 3 }}>{d}</div>)}
        {[
          { time: '10:00', cells: ['김영희', null, '박미영', null, '이철수'] },
          { time: '13:00', cells: [null, '최준호', null, '정다은', null] },
          { time: '14:00', cells: ['정다은', null, '이철수', null, '최준호'] },
        ].map(row => [
          <div key={`t-${row.time}`} style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
          ...row.cells.map((n, ci) => (
            <div key={`${row.time}-${ci}`} style={{ height: 20, borderRadius: 3, background: n ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.04)', border: `1px solid ${n ? 'rgba(16,185,129,0.26)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.75)' }}>
              {n ? n.slice(0,2) : ''}
            </div>
          )),
        ])}
      </div>
    ),
    '일간': (
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 5, color: 'rgba(255,255,255,0.6)' }}>8월 12일 (화)</div>
        {[
          { time: '09:00', name: null },
          { time: '10:00', name: '김영희' },
          { time: '11:00', name: '박미영' },
          { time: '12:00', name: null },
          { time: '13:00', name: '이철수' },
          { time: '14:00', name: '최준호' },
        ].map(s => (
          <div key={s.time} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', width: 28, flexShrink: 0 }}>{s.time}</span>
            <div style={{ flex: 1, height: 18, borderRadius: 3, background: s.name ? 'rgba(16,185,129,0.11)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.name ? 'rgba(16,185,129,0.24)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', paddingLeft: s.name ? 6 : 0, fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>
              {s.name}
            </div>
          </div>
        ))}
      </div>
    ),
    '일자별': (
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, textAlign: 'center', marginBottom: 4, color: 'rgba(255,255,255,0.5)' }}>2026년 8월</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
          {(['월','화','수','목','금','토','일'] as string[]).map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 7, color: i===5?'#60a5fa':i===6?'#f87171':'rgba(255,255,255,0.28)', paddingBottom: 2 }}>{d}</div>
          ))}
          {[null,null,null,null,null,'1','2'].map((d, i) => (
            <div key={`h${i}`} style={{ fontSize: 7, textAlign: 'center', color: i===5?'#60a5fa':i===6?'#f87171':'rgba(255,255,255,0.4)', padding: '1px 0' }}>{d ?? ''}</div>
          ))}
          {([
            { d:3,  ents:['10시 김영희','11시 박미영'], more:3 },
            { d:4,  ents:['10시 김영희','13시 박미영'], more:4 },
            { d:5,  ents:['11시 이철수'], more:2 },
            { d:6,  ents:['10시 김영희'], more:5 },
            { d:7,  ents:['10시 김영희'], more:2 },
            { d:8,  ents:[], more:0 },
            { d:9,  ents:[], more:0 },
            { d:10, ents:['10시 최준호','11시 최준호'], more:3 },
            { d:11, ents:['10시 김영희'], more:3 },
            { d:12, ents:['10시 최준호'], more:2 },
            { d:13, ents:['10시 김영희'], more:5 },
            { d:14, ents:['10시 김영희'], more:3 },
            { d:15, ents:[], more:0 },
            { d:16, ents:[], more:0 },
          ] as { d:number; ents:string[]; more:number }[]).map(({ d, ents, more }, i) => (
            <div key={d} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2, padding: 2, minHeight: 28 }}>
              <div style={{ fontSize: 7, color: (i%7)>=5?(i%7)===5?'#60a5fa':'#f87171':'rgba(255,255,255,0.45)', marginBottom: 1 }}>{d}</div>
              {ents.map(e => (
                <div key={e} style={{ fontSize: 6, background: 'rgba(16,185,129,0.1)', borderLeft: '1.5px solid rgba(16,185,129,0.4)', paddingLeft: 2, color: 'rgba(255,255,255,0.72)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e}</div>
              ))}
              {more > 0 && <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>+{more}건 더</div>}
            </div>
          ))}
        </div>
      </div>
    ),
    '시간별': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '30px repeat(5, 1fr)', gap: 2, marginBottom: 3 }}>
          <div />
          {(['월','화','수','목','금'] as string[]).map((d, i) => (
            <div key={d} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)' }}>{d}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{i + 3}</div>
            </div>
          ))}
        </div>
        {([
          { time: '10:00', cells: ['김영희', '김영희', null,   '김영희', '김영희'] },
          { time: '11:00', cells: ['김영희', null,     null,   '박미영', '박미영'] },
          { time: '13:00', cells: ['김영희', null,     '김영희','박미영', null    ] },
          { time: '14:00', cells: ['이철수', '이철수', '김영희','박미영', '이철수'] },
          { time: '15:00', cells: ['이철수', '이철수', null,   null,    '이철수'] },
        ] as { time: string; cells: (string|null)[] }[]).map(row => (
          <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '30px repeat(5, 1fr)', gap: 2, marginBottom: 2 }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.time}</div>
            {row.cells.map((name, ci) => (
              <div key={ci} style={{
                height: 14, borderRadius: 2,
                background: name ? 'rgba(16,185,129,0.13)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${name ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.06)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 6.5, color: 'rgba(255,255,255,0.78)', overflow: 'hidden',
              }}>
                {name ? name.slice(0, 3) : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
        {VIEWS.map((v, i) => (
          <span key={v} onClick={() => jump(i)} style={{ flex: 1, textAlign: 'center', background: v === view ? ACCENT : 'rgba(255,255,255,0.07)', color: v === view ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: v === view ? 700 : undefined, padding: '3px 0', borderRadius: 5, transition: 'background 0.25s, color 0.25s', whiteSpace: 'nowrap', cursor: 'pointer' }}>{v}</span>
        ))}
      </div>
      <div style={{ minHeight: 155, opacity: show ? 1 : 0, transition: 'opacity 0.25s ease' }}>
        {content[view]}
      </div>
    </div>
  )
}

// 날짜·요일·시간 설정 인터랙티브 데모
function ScheduleRuleDemo() {
  const [tick, setTick] = useState(0)
  const [manualTab, setManualTab] = useState<number | null>(null)
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 24), 900)
    return () => { clearInterval(id); if (manualTimerRef.current !== null) clearTimeout(manualTimerRef.current) }
  }, [])

  const tabIdx = manualTab !== null ? manualTab : Math.floor(tick / 8) % 3
  const sub = tick % 8

  function selectTab(i: number) {
    if (manualTimerRef.current !== null) clearTimeout(manualTimerRef.current)
    setManualTab(i)
    manualTimerRef.current = setTimeout(() => setManualTab(null), 12000)
  }

  const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
  const WEEK_DAYS = ['월', '화', '수', '목', '금']
  const SLOT_LABELS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
  const TEMPLATES = [
    { label: '평일만',  open: [1, 2, 3, 4, 5] },
    { label: '연중무휴', open: [0, 1, 2, 3, 4, 5, 6] },
    { label: '월·수·금', open: [1, 3, 5] },
  ]

  const dayTemplIdx = tabIdx !== 0 ? 0 : sub <= 1 ? 0 : sub === 2 ? 1 : sub <= 3 ? 2 : 0
  const dayOpenDays = TEMPLATES[dayTemplIdx]?.open ?? [1, 2, 3, 4, 5]
  const dayRegular   = tabIdx === 0 && sub >= 4 && sub <= 5
  const dayHidePanel = tabIdx === 0 && sub >= 6
  const dayClosedDow = tabIdx === 0 && sub >= 5 ? [0] : []
  const dayHiddenDow = tabIdx === 0 && sub >= 7 ? [0] : []

  const slotOpen = SLOT_LABELS.map((_, i) => {
    if (tabIdx !== 1) return true
    if (i === 2) return sub <= 1 || sub >= 7
    if (i === 5) return sub <= 3
    return true
  })
  const slotHighlight = tabIdx === 1 ? (sub === 1 ? 2 : sub === 3 ? 5 : sub === 6 ? 2 : null) : null

  const dateHols: { d: number; type: 'hol' | 'spc' }[] = []
  if (tabIdx === 2) {
    if (sub >= 3) dateHols.push({ d: 15, type: 'hol' })
    if (sub >= 6) dateHols.push({ d: 20, type: 'spc' })
  }
  let dateTyping: { text: string; type: 'hol' | 'spc' | null } | null = null
  if (tabIdx === 2) {
    if      (sub === 1) dateTyping = { text: '8/15', type: null }
    else if (sub === 2) dateTyping = { text: '8/15 · 광복절 휴무일', type: 'hol' }
    else if (sub === 4) dateTyping = { text: '8/20', type: null }
    else if (sub === 5) dateTyping = { text: '8/20 · 특별활동일', type: 'spc' }
  }

  const baseOpen = tabIdx === 0 ? dayOpenDays : [1, 2, 3, 4, 5]
  const calDays = Array.from({ length: 31 }, (_, i) => {
    const d = i + 1; const dow = (6 + i) % 7
    const hol = dateHols.find(h => h.d === d)
    const closed = dayClosedDow.includes(dow)
    const hidden = dayHiddenDow.includes(dow)
    const open = baseOpen.includes(dow) && !closed && !hol
    return { d, dow, open, closed, hidden, hol }
  })

  const calGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
      {DAY_LABELS.map((d, i) => (
        <div key={d} style={{
          textAlign: 'center', fontSize: 7, paddingBottom: 2,
          color: dayHiddenDow.includes(i) ? 'rgba(255,255,255,0.07)'
            : i === 0 ? 'rgba(239,68,68,0.55)' : i === 6 ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.25)',
          transition: 'color 0.6s',
        }}>{d}</div>
      ))}
      {Array.from({ length: 6 }, (_, i) => <div key={`e${i}`} />)}
      {calDays.map(({ d, open, closed, hidden, hol }) => (
        <div key={d} style={{
          aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 2, position: 'relative',
          background: hol?.type === 'hol' ? 'rgba(239,68,68,0.22)' : hol?.type === 'spc' ? 'rgba(34,197,94,0.18)'
            : closed ? 'rgba(239,68,68,0.14)' : 'transparent',
          opacity: hidden ? 0.07 : 1,
          transition: 'background 0.5s, opacity 0.7s',
        }}>
          <span style={{
            fontSize: 7, lineHeight: 1,
            color: hol?.type === 'hol' ? '#ef4444' : hol?.type === 'spc' ? '#22c55e'
              : closed ? 'rgba(239,68,68,0.6)' : open ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)',
            transition: 'color 0.5s',
          }}>{d}</span>
          {open && !closed && !hol && (
            <span style={{ position: 'absolute', bottom: 0, width: 2, height: 2, borderRadius: '50%', background: ACCENT }} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {['요일별', '시간별', '날짜별'].map((t, i) => (
          <button key={t} onClick={() => selectTab(i)} style={{
            flex: 1, textAlign: 'center', padding: '3px 0', borderRadius: 5, cursor: 'pointer',
            background: i === tabIdx ? ACCENT : 'rgba(255,255,255,0.06)',
            color: i === tabIdx ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 9, fontWeight: i === tabIdx ? 700 : undefined,
            border: `1px solid ${i === tabIdx ? ACCENT : 'rgba(255,255,255,0.09)'}`,
            transition: 'background 0.4s, color 0.4s, border-color 0.4s',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ minHeight: 150 }}>
      {tabIdx === 0 && (
        <div>
          {!dayRegular && !dayHidePanel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>빠른선택</span>
              {TEMPLATES.map((t, i) => (
                <span key={t.label} style={{
                  padding: '2px 6px', borderRadius: 4, fontSize: 8,
                  fontWeight: i === dayTemplIdx ? 700 : undefined,
                  background: i === dayTemplIdx ? ACCENT : 'rgba(255,255,255,0.06)',
                  color: i === dayTemplIdx ? '#fff' : 'rgba(255,255,255,0.35)',
                  border: `1px solid ${i === dayTemplIdx ? ACCENT : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.5s',
                }}>{t.label}</span>
              ))}
            </div>
          )}
          {dayRegular && !dayHidePanel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
              <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>정기휴일</span>
              {DAY_LABELS.map((d, i) => (
                <span key={d} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 600,
                  background: i === 0 ? 'rgba(239,68,68,0.28)' : 'rgba(255,255,255,0.05)',
                  color: i === 0 ? '#ef4444' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${i === 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.4s',
                }}>{d}</span>
              ))}
            </div>
          )}
          {dayHidePanel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
              <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>요일숨김</span>
              {DAY_LABELS.map((d, i) => (
                <span key={d} style={{
                  width: 18, height: 18, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 600,
                  background: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: i === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)',
                  border: `1px solid ${i === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.4s',
                }}>{d}</span>
              ))}
            </div>
          )}
          {calGrid}
        </div>
      )}
      {tabIdx === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 14 }}>
            {SLOT_LABELS.map((t, i) => (
              <div key={t} style={{
                height: 20, display: 'flex', alignItems: 'center', paddingLeft: 4,
                fontSize: 7.5, fontWeight: slotOpen[i] ? 700 : undefined,
                color: slotHighlight === i ? '#fff' : slotOpen[i] ? ACCENT : 'rgba(255,255,255,0.2)',
                background: slotHighlight === i ? ACCENT : slotOpen[i] ? `rgba(16,185,129,0.12)` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${slotOpen[i] ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 3, transition: 'all 0.5s',
              }}>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, marginBottom: 2 }}>
              {WEEK_DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 7, color: 'rgba(255,255,255,0.25)' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {SLOT_LABELS.map((_, si) => (
                <div key={si} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
                  {WEEK_DAYS.map(d => (
                    <div key={d} style={{
                      height: 20, borderRadius: 2,
                      background: slotOpen[si] ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${slotOpen[si] ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'background 0.5s, border-color 0.5s',
                    }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tabIdx === 2 && (
        <div>
          <div style={{
            display: 'flex', gap: 5, alignItems: 'center', marginBottom: 7,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 6, padding: '4px 8px', minHeight: 24,
          }}>
            <span style={{ flex: 1, fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>
              {dateTyping
                ? dateTyping.text
                : <span style={{ color: 'rgba(255,255,255,0.2)' }}>날짜 입력 중...</span>}
              {dateTyping && (
                <span style={{ display: 'inline-block', width: 1, height: 9, background: ACCENT, marginLeft: 1, verticalAlign: 'middle', animation: 'typeCursor 0.8s step-end infinite' }} />
              )}
            </span>
            {dateTyping?.type && (
              <span style={{
                fontSize: 7, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                background: dateTyping.type === 'hol' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
                color: dateTyping.type === 'hol' ? '#ef4444' : '#22c55e',
                border: `1px solid ${dateTyping.type === 'hol' ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.2)'}`,
              }}>{dateTyping.type === 'hol' ? '휴무일' : '특별활동'}</span>
            )}
          </div>
          {calGrid}
          <div style={{ display: 'flex', gap: 8, marginTop: 5, minHeight: 14, visibility: dateHols.length > 0 ? 'visible' : 'hidden' }}>
            {dateHols.map(h => (
              <div key={h.d} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 7.5, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: 5, height: 5, borderRadius: 1.5, flexShrink: 0, background: h.type === 'hol' ? 'rgba(239,68,68,0.55)' : 'rgba(34,197,94,0.55)' }} />
                {h.d === 15 ? '8/15 광복절 휴무' : '8/20 특별활동일'}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
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
                  visual: <ServeWizardStepDemo />,
                  title: '5분 셋업 위자드',
                  desc: '단체 분야·역할(봉사자/담당자) 설정부터 슬롯 규칙까지 7단계 안내로 바로 시작합니다.',
                },
                {
                  visual: <ViewCycleDemo />,
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간, 일자별·시간별 보기를 상황에 따라 자유롭게 전환합니다.',
                },
                {
                  visual: <ServeSyncDemo />,
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
                  visual: <ScheduleRuleDemo />,
                  title: '날짜·요일·시간 설정',
                  desc: '요일별·시간별·날짜별로 독립 설정이 가능해 단체마다 완전히 커스터마이징할 수 있습니다. 정기 활동 패턴 위에 공휴일·특별 활동일을 날짜마다 따로 지정합니다.',
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
