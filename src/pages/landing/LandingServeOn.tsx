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
  const assigneeName  = phase >= 2 ? '박O영' : phase === 1 ? '배정 중...' : ''
  const volunteerName = phase >= 5 ? '박O영' : ''
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
          { time: '09:00', name: '김O희' },
          { time: '10:00', name: assigneeName },
          { time: '14:00', name: '최O호' },
        ]} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 16, color: arrowOn ? ACCENT : 'rgba(255,255,255,0.18)', transition: 'color 0.3s', animation: arrowOn ? 'ledPulse 0.5s ease-in-out infinite' : undefined }}>↔</span>
          <span style={{ fontSize: 8, color: arrowOn ? ACCENT : 'transparent', fontWeight: 700, transition: 'color 0.3s', whiteSpace: 'nowrap' }}>동기화</span>
        </div>
        <Panel label="봉사자 화면" rows={[
          { time: '09:00', name: '김O희' },
          { time: '10:00', name: volunteerName, pop: volunteerPop },
          { time: '14:00', name: '최O호' },
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
          { t: '09:00', a: '김O희', b: '이O수' },
          { t: '10:00', a: '박O영', b: '최O호' },
          { t: '14:00', a: '김O희', b: '' },
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
          { time: '10:00', cells: ['김O희', null, '박O영', null, '이O수'] },
          { time: '13:00', cells: [null, '최O호', null, '정다은', null] },
          { time: '14:00', cells: ['정다은', null, '이O수', null, '최O호'] },
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
          { time: '10:00', name: '김O희' },
          { time: '11:00', name: '박O영' },
          { time: '12:00', name: null },
          { time: '13:00', name: '이O수' },
          { time: '14:00', name: '최O호' },
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
            { d:3,  ents:['10시 김O희','11시 박O영'], more:3 },
            { d:4,  ents:['10시 김O희','13시 박O영'], more:4 },
            { d:5,  ents:['11시 이O수'], more:2 },
            { d:6,  ents:['10시 김O희'], more:5 },
            { d:7,  ents:['10시 김O희'], more:2 },
            { d:8,  ents:[], more:0 },
            { d:9,  ents:[], more:0 },
            { d:10, ents:['10시 최O호','11시 최O호'], more:3 },
            { d:11, ents:['10시 김O희'], more:3 },
            { d:12, ents:['10시 최O호'], more:2 },
            { d:13, ents:['10시 김O희'], more:5 },
            { d:14, ents:['10시 김O희'], more:3 },
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
          { time: '10:00', cells: ['김O희', '김O희', null,   '김O희', '김O희'] },
          { time: '11:00', cells: ['김O희', null,     null,   '박O영', '박O영'] },
          { time: '13:00', cells: ['김O희', null,     '김O희','박O영', null    ] },
          { time: '14:00', cells: ['이O수', '이O수', '김O희','박O영', '이O수'] },
          { time: '15:00', cells: ['이O수', '이O수', null,   null,    '이O수'] },
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
        @media (max-width:720px) {
          .sv-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .sv-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .sv-feat-text { order:1 !important; text-align:center !important; }
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

          <div className="sv-badge" style={{ display: 'inline-block', background: 'rgba(16,185,129,0.13)', color: ACCENT, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 24 }}>봉사 활동 관리 플랫폼</div>
          <h1 className="sv-h1" style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-1.2px', margin: '0 auto 24px', maxWidth: 720 }}>
            봉사자 배정·시간 집계·알림 발송을<br /><span style={{ color: ACCENT }}>엑셀 없이 한 화면에</span>
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
              {
                icon: (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <rect x="2" y="7" width="24" height="22" rx="2.5"/>
                    <line x1="2" y1="14" x2="26" y2="14"/>
                    <line x1="2" y1="21" x2="26" y2="21"/>
                    <line x1="10" y1="7" x2="10" y2="29"/>
                    <line x1="18" y1="7" x2="18" y2="29"/>
                    <rect x="24" y="14" width="17" height="12" rx="3"/>
                    <path d="M26 26 L23 32 L31 26"/>
                    <line x1="27" y1="18.5" x2="38" y2="18.5"/>
                    <line x1="27" y1="21.5" x2="35" y2="21.5"/>
                  </svg>
                ),
                title: '엑셀 + 카톡 그룹방',
                desc: '봉사자 명단을 엑셀로 관리하고 카톡 그룹방으로 공지하느라 정보가 분산됩니다.',
              },
              {
                icon: (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <path d="M7 8 C7 7 10 6 11 8 L14 14 C14.5 15.5 14 17 13 18 C12 19 15 24 17 25.5 C19 27 21 26 22 25 L24 23 C25.5 21.5 28 23 28.5 24.5 L31 30 C32 32.5 29 35.5 27 36 C13 40 3 22 4 13 C3.5 8.5 6.5 8.5 7 8 Z"/>
                    <rect x="27" y="3" width="14" height="10" rx="3"/>
                    <path d="M29 13 L27 17 L33 13"/>
                    <rect x="29" y="19" width="13" height="10" rx="3"/>
                    <path d="M31 29 L29 33 L35 29"/>
                    <line x1="30" y1="7.5" x2="38" y2="7.5"/>
                    <line x1="30" y1="10.5" x2="36" y2="10.5"/>
                    <line x1="32" y1="23.5" x2="39" y2="23.5"/>
                  </svg>
                ),
                title: '일일이 전화·문자',
                desc: '참석 여부를 한 명씩 확인하느라 봉사 준비보다 연락에 더 많은 시간을 씁니다.',
              },
              {
                icon: (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <rect x="5" y="9" width="24" height="29" rx="2.5"/>
                    <rect x="11" y="6" width="12" height="7" rx="2"/>
                    <line x1="10" y1="19" x2="24" y2="19"/>
                    <line x1="10" y1="24" x2="24" y2="24"/>
                    <line x1="10" y1="29" x2="18" y2="29"/>
                    <path d="M26 29 L37 16 L41 20 L30 33 Z"/>
                    <path d="M26 29 L24 37 L32 34 Z"/>
                    <line x1="35" y1="18" x2="39" y2="22"/>
                  </svg>
                ),
                title: '봉사 시간 수기 계산',
                desc: '활동 시간을 개별로 집계하고 인증서 자료를 수작업으로 정리합니다.',
              },
            ].map((item, i) => (
              <Anim key={item.title} delay={i * 80}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 20px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: 28, marginBottom: 14, display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </Anim>
            ))}
          </div>
        </section>


        {/* wave divider */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)', margin: '0 24px' }} />

        {/* 스케줄러 핵심 기능 */}
        <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, transparent, rgba(16,185,129,0.05), transparent)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <Anim style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>스케줄러</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>봉사 현장에 최적화된 스케줄 관리</h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>역할 분리부터 잠금·빈슬롯 알림까지, 현장 운영에 필요한 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(3, 1fr)', gap: 2, marginBottom: 4 }}>
                        <div />
                        {['월', '화', '수'].map(d => (
                          <div key={d}>
                            <div style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>{d}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                              <div style={{ fontSize: 6.5, color: ACCENT, fontWeight: 700, textAlign: 'center' }}>봉사자</div>
                              <div style={{ fontSize: 6.5, color: '#60A5FA', fontWeight: 700, textAlign: 'center' }}>활동가</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '3px 0 5px' }} />
                      {[
                        { time: '10:00', cells: [['김O희', ''], ['이O화', '최O화'], ['', '']] },
                        { time: '14:00', cells: [['박O영', '이O화'], ['', '최O화'], ['이O화', '']] },
                        { time: '16:00', cells: [['', '이O화'], ['최O화', ''], ['박O영', '이O화']] },
                      ].map(row => (
                        <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '28px repeat(3, 1fr)', gap: 2, marginBottom: 2 }}>
                          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center' }}>{row.time}</div>
                          {row.cells.map(([a, b], ci) => (
                            <div key={ci} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                              <div style={{ height: 18, borderRadius: 2, borderLeft: `2px solid ${a ? ACCENT : 'rgba(255,255,255,0.1)'}`, background: a ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6.5, color: 'rgba(255,255,255,0.75)' }}>{a ? a.slice(0, 2) : ''}</div>
                              <div style={{ height: 18, borderRadius: 2, borderLeft: `2px solid ${b ? '#60A5FA' : 'rgba(255,255,255,0.1)'}`, background: b ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6.5, color: 'rgba(255,255,255,0.75)' }}>{b ? b.slice(0, 2) : ''}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'center' }}>
                        {[{ color: ACCENT, label: '봉사자' }, { color: '#60A5FA', label: '활동가' }].map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>
                            <span style={{ width: 3, height: 14, borderRadius: 1, background: r.color, display: 'inline-block' }} />
                            {r.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '역할별 셀 분리',
                  desc: '봉사자·활동가 등 역할마다 독립 칸을 분리하고 색상 바로 구분합니다. 한눈에 인원 현황을 파악할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {['관리자 모드', '공유 모드'].map((m, i) => (
                          <span key={m} style={{ flex: 1, textAlign: 'center', fontSize: 9, padding: '3px 0', borderRadius: 5, background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: i === 1 ? 700 : undefined }}>{m}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.35)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
                        회원이 직접 슬롯 등록 가능
                      </div>
                      {[
                        { time: '10:00', name: '이O화', mine: false },
                        { time: '13:00', name: '', mine: false },
                        { time: '14:00', name: '최O화', mine: false },
                        { time: '16:00', name: '박O영', mine: true },
                      ].map(row => (
                        <div key={row.time} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)', width: 28, flexShrink: 0 }}>{row.time}</span>
                          <div style={{ flex: 1, height: 22, borderRadius: 4, background: row.mine ? 'rgba(16,185,129,0.15)' : row.name ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${row.mine ? ACCENT : row.name ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', paddingLeft: row.name ? 8 : 0, justifyContent: row.name ? 'flex-start' : 'center', fontSize: 9, color: 'rgba(255,255,255,0.75)', gap: 5 }}>
                            {row.name ? (
                              <>
                                {row.mine && <span style={{ color: ACCENT, fontSize: 7.5, fontWeight: 700, background: 'rgba(16,185,129,0.2)', padding: '1px 4px', borderRadius: 3 }}>나</span>}
                                {row.name}
                              </>
                            ) : <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.18)' }}>+</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '회원공유모드',
                  desc: '팀장이 전체 스케줄을 관리하면서 각 역할 회원이 직접 자신의 슬롯을 등록할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>빈슬롯 알림</span>
                        <span style={{ background: '#F59E0B', color: '#000', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>공석 2</span>
                      </div>
                      {[
                        { time: '10:00', name: '김O희', dashed: false },
                        { time: '13:00', name: '', dashed: true },
                        { time: '14:00', name: '박O영', dashed: false },
                        { time: '15:00', name: '', dashed: true },
                        { time: '16:00', name: '이O화', dashed: false },
                      ].map(row => (
                        <div key={row.time} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)', width: 28, flexShrink: 0 }}>{row.time}</span>
                          <div style={{ flex: 1, height: 22, borderRadius: 4, background: row.name ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.05)', border: row.dashed ? '1.5px dashed rgba(245,158,11,0.5)' : `1px solid ${row.name ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', paddingLeft: row.name ? 8 : 0, justifyContent: row.name ? 'flex-start' : 'center', fontSize: 9, color: 'rgba(255,255,255,0.75)' }}>
                            {row.name || (row.dashed ? <span style={{ fontSize: 8, color: 'rgba(245,158,11,0.7)', fontWeight: 700 }}>인원 필요</span> : null)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '빈슬롯 알림',
                  desc: '채워지지 않은 시간대를 점선으로 강조 표시합니다. 인원이 필요한 슬롯을 팀원에게 즉시 공유할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', flex: 1 }}>완료 후 수정 불가</span>
                        <span style={{ background: 'rgba(16,185,129,0.15)', border: `1px solid rgba(16,185,129,0.3)`, color: ACCENT, fontSize: 8.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>전체 고정</span>
                      </div>
                      {[
                        { time: '10:00', name: '김O희', locked: true },
                        { time: '13:00', name: '이O화', locked: true },
                        { time: '14:00', name: '박O영', locked: false },
                        { time: '16:00', name: '최O화', locked: false },
                      ].map(row => (
                        <div key={row.time} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.28)', width: 28, flexShrink: 0 }}>{row.time}</span>
                          <div style={{ flex: 1, height: 22, borderRadius: 4, background: row.locked ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.1)', border: `1px solid ${row.locked ? 'rgba(255,255,255,0.09)' : 'rgba(16,185,129,0.25)'}`, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 5, fontSize: 9, color: row.locked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)' }}>
                            {row.locked && (
                              <svg width="9" height="10" viewBox="0 0 9 10" fill="none" style={{ flexShrink: 0 }}>
                                <rect x="1" y="4" width="7" height="6" rx="1.2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"/>
                                <path d="M2.5 4V3a2 2 0 014 0v1" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
                              </svg>
                            )}
                            {row.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '전체 · 개별 고정',
                  desc: '완료 처리된 슬롯은 잠금 상태로 전환됩니다. 공유 모드에서도 회원이 임의로 수정할 수 없습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                        {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 7.5, color: i >= 5 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.3)', paddingBottom: 2 }}>{d}</div>
                        ))}
                      </div>
                      {[[1,2,3,4,5,6,7],[8,9,10,11,12,13,14]].map((week, wi) => (
                        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
                          {week.map(d => {
                            const isHoliday = d === 6
                            const isSpecial = d === 11
                            return (
                              <div key={d} style={{ borderRadius: 4, padding: '3px 0', background: isHoliday ? 'rgba(239,68,68,0.14)' : isSpecial ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isHoliday ? 'rgba(239,68,68,0.28)' : isSpecial ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' }}>
                                <div style={{ fontSize: 8, color: isHoliday ? '#EF4444' : isSpecial ? ACCENT : 'rgba(255,255,255,0.4)' }}>{d}</div>
                                {isHoliday && <div style={{ fontSize: 5.5, color: '#EF4444', fontWeight: 700, marginTop: 1 }}>휴관</div>}
                                {isSpecial && <div style={{ fontSize: 5, color: ACCENT, fontWeight: 700, marginTop: 1 }}>전체회의</div>}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {[{ color: '#EF4444', label: '휴관일' }, { color: ACCENT, label: '특별일정' }].map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: 2, background: r.color, opacity: 0.7, display: 'inline-block' }} />
                            {r.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '특별일정 등록',
                  desc: '휴관일에도 전체회의·특별 행사 등 별도 일정을 등록해 팀 전체에 공유합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(20,20,30,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                      {/* 모달 헤더 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>문자 발송</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', cursor: 'default' }}>✕</span>
                      </div>
                      {/* 안내 문구 */}
                      <div style={{ margin: '7px 12px 5px', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, fontSize: 8, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                        당월 스케줄 등록자(관리자 제외)를 대상으로 발송합니다.
                      </div>
                      {/* 수신자 수 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px 4px', fontSize: 8.5, color: 'rgba(255,255,255,0.45)' }}>
                        <span>수신자 <b style={{ color: 'rgba(255,255,255,0.75)' }}>32</b>/32명</span>
                        <span style={{ color: 'rgba(255,255,255,0.25)' }}>전체 해제</span>
                      </div>
                      {/* 체크박스 목록 */}
                      {[
                        { name: '강O민', phone: '010-xxxx-3327' },
                        { name: '강O우', phone: '010-xxxx-4119' },
                        { name: '권O운', phone: '010-xxxx-8450' },
                        { name: '김O흔', phone: '010-xxxx-5894' },
                      ].map((r, i) => (
                        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3.5px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 9, opacity: 0, animation: `fadeUp 0.35s ease ${i * 60}ms forwards` }}>
                          <span style={{ width: 11, height: 11, borderRadius: 3, background: ACCENT, opacity: 0.85, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><polyline points="1,3.5 3,5.5 6,2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                          <span style={{ flex: 1, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{r.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{r.phone}</span>
                        </div>
                      ))}
                      {/* 메시지 영역 */}
                      <div style={{ margin: '6px 12px 0', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 6 }}>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>메시지</div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '5px 7px', fontSize: 8.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                          이번달 봉사활동 스케줄 등록이 완료되었습니다. 확인 부탁드립니다.
                        </div>
                      </div>
                      {/* 발송 버튼 */}
                      <div style={{ padding: '8px 12px 10px' }}>
                        <div style={{ background: ACCENT, borderRadius: 6, padding: '6px 0', textAlign: 'center', fontSize: 9.5, fontWeight: 700, color: '#fff' }}>
                          문자 발송 (32명)
                        </div>
                      </div>
                    </div>
                  ),
                  title: '일괄 문자발송',
                  desc: '당월 스케줄에 등록된 회원 전체에게 안내 문자를 한 번에 발송합니다. 개별 연락 없이 전체 공지가 완료됩니다.',
                },
              ].map((card, i) => (
                <Anim key={card.title} delay={i * 60}>
                  <div className="sv-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 6, paddingLeft: 2 }}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={{ fontWeight: 700, marginBottom: 8, paddingLeft: 2 }}>{card.title}</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, paddingLeft: 2, marginBottom: 16 }}>{card.desc}</div>
                    <div style={{ overflow: 'hidden' }}>{card.visual}</div>
                  </div>
                </Anim>
              ))}
            </div>
          </div>
        </section>

        {/* wave divider */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)', margin: '0 24px' }} />

        {/* 업종 배지 */}
        <section style={{ textAlign: 'center', padding: '80px 24px' }}>
          <Anim>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
              {['복지관', '사회복지시설', '시민단체', '종교단체', '지자체', '도서관', '문화시설', '자원봉사센터', '병원 봉사', '환경단체'].map((tag, i) => (
                <span key={tag} className="sv-tag-btn" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '6px 14px', fontSize: 13, opacity: 0, animation: `fadeUp 0.4s ease ${i * 50}ms forwards` }}>{tag}</span>
              ))}
              <span style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: 'rgba(255,255,255,0.3)', opacity: 0, animation: 'fadeUp 0.4s ease 500ms forwards' }}>그 외 다수</span>
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
                          { name: '김O희', color: ACCENT, days: '월·수·금', max: 12, delay: 0 },
                          { name: '박O영', color: '#60A5FA', days: '전일', max: 16, delay: 80 },
                          { name: '이O수', color: '#A78BFA', days: '화·목', max: 8, delay: 160 },
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
                          { name: '박O영', hours: 61, pct: 76 },
                          { name: '김O희', hours: 48, pct: 60 },
                          { name: '이O수', hours: 32, pct: 40 },
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
                            { label: '봉사자', value: '김O희' },
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
