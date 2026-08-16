// src/pages/landing/LandingLessonOn.tsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { DevFileLabel } from '../../components/DevFileLabel'
import { WizardIcon } from '../../components/setup/WizardIcons'

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

// 실시간 동기화 애니메이션
function SyncDemo() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 8), 750)
    return () => clearInterval(t)
  }, [])
  const instrName  = phase >= 2 ? '이준혁' : phase === 1 ? '등록 중...' : ''
  const memberName = phase >= 5 ? '이준혁' : ''
  const arrowOn    = phase >= 3 && phase <= 4
  const memberPop  = phase === 5

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
          background: row.pop ? 'rgba(242,96,78,0.14)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${row.pop ? 'rgba(242,96,78,0.45)' : 'rgba(255,255,255,0.07)'}`,
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
        <Panel label="강사 화면" rows={[
          { time: '09:00', name: '김민지' },
          { time: '11:00', name: instrName },
          { time: '14:00', name: '박서연' },
        ]} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 16, color: arrowOn ? ACCENT : 'rgba(255,255,255,0.18)', transition: 'color 0.3s', animation: arrowOn ? 'ledPulse 0.5s ease-in-out infinite' : undefined }}>↔</span>
          <span style={{ fontSize: 8, color: arrowOn ? ACCENT : 'transparent', fontWeight: 700, transition: 'color 0.3s', whiteSpace: 'nowrap' }}>동기화</span>
        </div>
        <Panel label="회원 화면" rows={[
          { time: '09:00', name: '김민지' },
          { time: '11:00', name: memberName, pop: memberPop },
          { time: '14:00', name: '박서연' },
        ]} />
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
          { time: '10:00', cells: ['조은수', null, '윤소이', null, '성시호'] },
          { time: '13:00', cells: [null, '이하나', null, '박진희', null] },
          { time: '14:00', cells: ['박진희', null, '성시호', null, '이하나'] },
        ].map(row => [
          <div key={`t-${row.time}`} style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.time}</div>,
          ...row.cells.map((n, ci) => (
            <div key={`${row.time}-${ci}`} style={{ height: 20, borderRadius: 3, background: n ? 'rgba(242,96,78,0.13)' : 'rgba(255,255,255,0.04)', border: `1px solid ${n ? 'rgba(242,96,78,0.26)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.75)' }}>
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
          { time: '10:00', name: '조은수' },
          { time: '11:00', name: '이하나' },
          { time: '12:00', name: null },
          { time: '13:00', name: '윤소이' },
          { time: '14:00', name: '박진희' },
        ].map(s => (
          <div key={s.time} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', width: 28, flexShrink: 0 }}>{s.time}</span>
            <div style={{ flex: 1, height: 18, borderRadius: 3, background: s.name ? 'rgba(242,96,78,0.11)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.name ? 'rgba(242,96,78,0.24)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', paddingLeft: s.name ? 6 : 0, fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>
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
            { d:3,  ents:['10시 이연화','11시 조은수'], more:5 },
            { d:4,  ents:['10시 이연화','13시 조은수'], more:6 },
            { d:5,  ents:['11시 조은수'], more:4 },
            { d:6,  ents:['10시 이연화'], more:7 },
            { d:7,  ents:['10시 이연화'], more:3 },
            { d:8,  ents:[], more:0 },
            { d:9,  ents:[], more:0 },
            { d:10, ents:['10시 이은진','11시 이은진'], more:5 },
            { d:11, ents:['10시 이연화'], more:5 },
            { d:12, ents:['10시 이은진'], more:4 },
            { d:13, ents:['10시 이연화'], more:7 },
            { d:14, ents:['10시 이연화'], more:5 },
            { d:15, ents:[], more:0 },
            { d:16, ents:[], more:0 },
          ] as { d:number; ents:string[]; more:number }[]).map(({ d, ents, more }, i) => (
            <div key={d} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2, padding: 2, minHeight: 28 }}>
              <div style={{ fontSize: 7, color: (i%7)>=5?(i%7)===5?'#60a5fa':'#f87171':'rgba(255,255,255,0.45)', marginBottom: 1 }}>{d}</div>
              {ents.map(e => (
                <div key={e} style={{ fontSize: 6, background: 'rgba(242,96,78,0.1)', borderLeft: '1.5px solid rgba(242,96,78,0.4)', paddingLeft: 2, color: 'rgba(255,255,255,0.72)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e}</div>
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
          { time: '10:00', cells: ['이연화', '이연화', null,   '이연화', '이연화'] },
          { time: '11:00', cells: ['이연화', null,     null,   '김아영', '김아영'] },
          { time: '13:00', cells: ['이연화', null,     '이연화','김아영', null    ] },
          { time: '14:00', cells: ['최민화', '최민화', '이연화','김아영', '최민화'] },
          { time: '15:00', cells: ['최민화', '최민화', null,   null,    '최민화'] },
        ] as { time: string; cells: (string|null)[] }[]).map(row => (
          <div key={row.time} style={{ display: 'grid', gridTemplateColumns: '30px repeat(5, 1fr)', gap: 2, marginBottom: 2 }}>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.time}</div>
            {row.cells.map((name, ci) => (
              <div key={ci} style={{
                height: 14, borderRadius: 2,
                background: name ? 'rgba(242,96,78,0.13)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${name ? 'rgba(242,96,78,0.28)' : 'rgba(255,255,255,0.06)'}`,
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
      <div style={{ minHeight: 120, opacity: show ? 1 : 0, transition: 'opacity 0.25s ease' }}>
        {content[view]}
      </div>
    </div>
  )
}

// 5분 셋업 위자드 단계별 애니메이션
function WizardStepDemo() {
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

  const STEP_LABELS = ['조직 소개', '운영 모드', '시간 단위', '역할 설정', '운영 요일', '레슨 종류', '입력 항목']

  const cell = (n: string | null, accent: string) => (
    <div style={{ height: 15, borderRadius: 3, background: n ? `rgba(${accent},0.1)` : 'rgba(255,255,255,0.03)', border: `1px solid ${n ? `rgba(${accent},0.25)` : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'rgba(255,255,255,0.65)' }}>{n}</div>
  )

  const previews: React.ReactNode[] = [
    // 0: 조직 소개
    <div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>업종</div>
      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '4px 7px', fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><WizardIcon.user size={10} sw={1.6} style={{ color: 'rgba(255,255,255,0.45)' }} />PT·헬스</span><span style={{ color: 'rgba(255,255,255,0.25)' }}>▾</span>
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>조직명</div>
      <div style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${ACCENT}55`, borderRadius: 5, padding: '4px 7px', fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
        서울 PT 스튜디오<span style={{ animation: 'typeCursor 1s step-end infinite', borderLeft: `1.5px solid ${ACCENT}`, marginLeft: 1 }}>&thinsp;</span>
      </div>
    </div>,

    // 1: 운영 모드
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {([
        { Icon: WizardIcon.users, label: '회원 공유' },
        { Icon: WizardIcon.lock,  label: '회원 개별', sel: true },
        { Icon: WizardIcon.walk,  label: '비회원' },
      ] as { Icon: typeof WizardIcon.users; label: string; sel?: boolean }[]).map(m => (
        <div key={m.label} style={{ padding: '4px 7px', borderRadius: 5, background: m.sel ? 'rgba(242,96,78,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.sel ? ACCENT : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', gap: 5 }}>
          <m.Icon size={11} sw={1.6} style={{ color: m.sel ? ACCENT : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: m.sel ? 700 : undefined, color: m.sel ? '#fff' : 'rgba(255,255,255,0.5)', flex: 1 }}>{m.label}</span>
          {m.sel && <span style={{ fontSize: 8, color: ACCENT }}>✓</span>}
        </div>
      ))}
    </div>,

    // 2: 시간 단위
    <div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 7 }}>
        {(['30분', '1시간', '2시간'] as string[]).map((t, i) => (
          <span key={t} style={{ flex: 1, textAlign: 'center', fontSize: 9, padding: '3px 0', borderRadius: 4, background: i === 1 ? ACCENT : 'rgba(255,255,255,0.07)', color: i === 1 ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: i === 1 ? 700 : undefined }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {(['09:00–10:00', '10:00–11:00', '11:00–12:00', '13:00–14:00'] as string[]).map((s, i) => (
          <span key={s} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 4, padding: '2px 5px', fontSize: 9, color: 'rgba(255,255,255,0.6)', opacity: 0, animation: `fadeUp 0.3s ease ${i * 90}ms forwards` }}>{s}</span>
        ))}
      </div>
    </div>,

    // 3: 역할 설정
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
        {([{ name: '강사', badge: '칸분리', clr: ACCENT }, { name: '회원', badge: '없음', clr: 'rgba(255,255,255,0.3)' }] as { name: string; badge: string; clr: string }[]).map(r => (
          <div key={r.name} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '4px 6px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{r.name}</div>
            <div style={{ fontSize: 8, color: r.clr, marginTop: 1 }}>{r.badge}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '22px 1fr 1fr', gap: 2 }}>
        {([
          { t: '10:00', a: '이하나', b: '조은수' },
          { t: '11:00', a: '이하나', b: '김민지' },
          { t: '14:00', a: '성시호', b: '' },
        ] as { t: string; a: string; b: string }[]).map(row => [
          <div key={`t${row.t}`} style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{row.t}</div>,
          cell(row.a, '242,96,78'),
          cell(row.b || null, '61,220,132'),
        ])}
      </div>
    </div>,

    // 4: 운영 요일
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {(['일', '월', '화', '수', '목', '금', '토'] as string[]).map((d, i) => {
          const on = i >= 1 && i <= 5
          return <div key={d} style={{ flex: 1, height: 20, borderRadius: 4, fontSize: 9, fontWeight: on ? 700 : undefined, background: on ? 'rgba(242,96,78,0.13)' : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? 'rgba(242,96,78,0.35)' : 'rgba(255,255,255,0.08)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</div>
        })}
      </div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
        {(['평일', '주5일', '매일'] as string[]).map((t, i) => (
          <span key={t} style={{ flex: 1, textAlign: 'center', fontSize: 9, padding: '3px 0', borderRadius: 4, background: i === 0 ? 'rgba(242,96,78,0.12)' : 'rgba(255,255,255,0.06)', color: i === 0 ? ACCENT : 'rgba(255,255,255,0.35)', border: `1px solid ${i === 0 ? 'rgba(242,96,78,0.28)' : 'rgba(255,255,255,0.08)'}` }}>{t}</span>
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>09:00 ~ 19:00</div>
    </div>,

    // 5: 레슨 종류
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {(['1:1 레슨 10회', '그룹 수업 20회', '체험 레슨 3회'] as string[]).map((name, i) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 5, padding: '4px 7px', opacity: 0, animation: `fadeUp 0.3s ease ${i * 110}ms forwards` }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', flex: 1 }}>{name}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>✕</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 5, fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>+ 추가</div>
    </div>,

    // 6: 입력 항목
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {([
        { Icon: WizardIcon.pencil, label: '이름',     type: '텍스트',   on: true },
        { Icon: WizardIcon.phone,  label: '연락처',   type: '전화번호', on: true },
        { Icon: WizardIcon.list,   label: '레슨 유형', type: '드롭다운', on: true },
        { Icon: WizardIcon.text,   label: '메모',     type: '텍스트',   on: false },
      ] as { Icon: typeof WizardIcon.pencil; label: string; type: string; on: boolean }[]).map((f, i) => (
        <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0, animation: `fadeUp 0.3s ease ${i * 80}ms forwards` }}>
          <f.Icon size={10} sw={1.6} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', flex: 1 }}>{f.label}</span>
          <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>{f.type}</span>
          <div style={{ width: 22, height: 12, borderRadius: 6, background: f.on ? ACCENT : 'rgba(255,255,255,0.12)', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, width: 8, height: 8, borderRadius: '50%', background: '#fff', left: f.on ? 11 : 2, transition: 'left 0.2s' }} />
          </div>
        </div>
      ))}
    </div>,
  ]

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '42% 1fr', gap: 10, marginBottom: 10 }}>
        {/* 단계 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {STEP_LABELS.map((label, i) => {
            const done = i < step
            const active = i === step
            return (
              <div key={i} onClick={() => { if (i !== stepRef.current) go(i) }} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', padding: '3px 5px', borderRadius: 5, background: active ? 'rgba(242,96,78,0.08)' : 'transparent', border: `1px solid ${active ? 'rgba(242,96,78,0.22)' : 'transparent'}`, transition: 'background 0.25s, border-color 0.25s' }}>
                <div style={{ width: 15, height: 15, borderRadius: '50%', flexShrink: 0, fontSize: 8, fontWeight: 700, background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(242,96,78,0.15)' : 'rgba(255,255,255,0.06)', color: done ? '#22c55e' : active ? ACCENT : 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 700 : undefined, color: done ? 'rgba(255,255,255,0.28)' : active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)', textDecoration: done ? 'line-through' : undefined, transition: 'color 0.2s', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            )
          })}
        </div>
        {/* 단계 미리보기 */}
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

export function LandingLessonOn() {
  const navigate = useNavigate()
  const goStart = () => navigate('/consent?vertical=lessonon')
  const goLogin = () => navigate('/auth?tab=login')

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(28px);} to { opacity:1; transform:translateY(0);} }
        @keyframes glowPulse { 0%,100% { opacity:0.18; transform:translateX(-50%) scale(1); } 50% { opacity:0.3; transform:translateX(-50%) scale(1.08); } }
        @keyframes ctaPulse  { 0%,100% { box-shadow:0 8px 32px rgba(242,96,78,0.35);} 50% { box-shadow:0 8px 52px rgba(242,96,78,0.6);} }
        @keyframes badgePop  { 0% { opacity:0; transform:scale(0.85) translateY(10px);} 100% { opacity:1; transform:scale(1) translateY(0);} }
        @keyframes navFade   { from { opacity:0; transform:translateY(-8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes qPulse    { 0%,100% { opacity:0.25; } 50% { opacity:0.65; } }
        @keyframes ledPulse  { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
        @keyframes liveSlot  { 0%,100%{ background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.07); } 40%,60%{ background:rgba(242,96,78,0.1); border-color:rgba(242,96,78,0.3); } }
        @keyframes cellFill  { 0%,20%{ opacity:0; transform:scale(0.8); } 40%,100%{ opacity:1; transform:scale(1); } }
        @keyframes autoGlow  { 0%,100%{ box-shadow:0 4px 16px rgba(242,96,78,0.3); } 50%{ box-shadow:0 6px 28px rgba(242,96,78,0.6); } }
        @keyframes typeCursor{ 0%,100%{ opacity:1; } 50%{ opacity:0; } }
        @keyframes wizFill   { from{ width:0%; } to{ width:100%; } }
        @keyframes dragSel   { 0%,8%{ background:rgba(255,255,255,0.04); box-shadow:none; } 32%,68%{ background:rgba(242,96,78,0.18); box-shadow:inset 0 0 0 2px rgba(242,96,78,0.6); } 88%,100%{ background:rgba(255,255,255,0.04); box-shadow:none; } }
        .lo-qmark { animation: qPulse 2s ease-in-out infinite; }
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
          .lo-feat-grid { grid-template-columns:1fr !important; gap:10px !important; }
          .lo-feat-visual { max-width:none !important; justify-self:stretch !important; order:2 !important; }
          .lo-feat-text { order:1 !important; text-align:center !important; }
          .lo-sect-01 { padding-bottom: 160px !important; }
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
          <p className="lo-sub" style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>설치 없이 브라우저에서 무료로 시작할 수 있습니다.</p>
          <button className="lo-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>무료로 시작하기 →</button>
        </section>

        {/* 01 — 수강권/결제 누락 및 잔여 횟수 혼선 */}
        <section className="lo-sect-01" style={{ padding: '100px 24px', maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
          <Anim style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>01 — 수강권/결제 누락 및 잔여 횟수 혼선</div>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, lineHeight: 1.5, letterSpacing: '-0.5px', marginBottom: 16 }}>
              "이 회원님 남은 횟수가 몇 번이더라..."<br />"오늘 그분 오시는 날 맞나?"
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
              수기 장부, 카톡 캡처, 엑셀 시트를 오가며<br />수업 준비보다 관리에 더 많은 시간을 씁니다.
            </p>
          </Anim>
          <Anim delay={150}>
            {(() => {
              const DAYS = ['월', '화', '수', '목', '금', '토']
              const ROWS = [
                { time: '10:00', cells: ['조은수', null, '윤소이', '박진희', null, '성시호'] },
                { time: '11:00', cells: [null, '이하나', null, null, '김민지', null] },
                { time: '13:00', cells: ['박진희', '윤소이', null, '조은수', '이하나', null] },
                { time: '14:00', cells: [null, null, '성시호', null, null, '박진희'] },
              ] as { time: string; cells: (string | null)[] }[]
              let cellIdx = 0
              return (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '20px 16px', overflowX: 'auto' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12, textAlign: 'left' }}>이번 주 수업 일정</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(6, 1fr)', gap: 5, minWidth: 420 }}>
                    <div />
                    {DAYS.map(d => (
                      <div key={d} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingBottom: 6 }}>{d}</div>
                    ))}
                    {ROWS.map((row, ri) => (
                      <>
                        <div key={row.time} style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', paddingRight: 4, whiteSpace: 'nowrap' }}>{row.time}</div>
                        {row.cells.map((name, ci) => {
                          const delay = 300 + (ri * 6 + ci) * 50
                          const isConfused = ri === 0 && ci === 1
                          cellIdx++
                          if (name) {
                            return (
                              <div key={ci} style={{ background: 'rgba(242,96,78,0.1)', border: '1px solid rgba(242,96,78,0.2)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', opacity: 0, animation: `fadeUp 0.4s ease ${delay}ms both` }}>
                                {name}
                              </div>
                            )
                          }
                          return (
                            <div key={ci} style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', opacity: 0, animation: `fadeUp 0.4s ease ${delay}ms both` }}>
                              <span className="lo-qmark" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'block' }}>?</span>
                              {isConfused && (
                                <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(242,96,78,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10 }}>
                                  몇 번 남았더라...
                                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(242,96,78,0.9)' }} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </>
                    ))}
                  </div>
                </div>
              )
            })()}
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
            <Anim delay={120} className="lo-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
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
            <Anim delay={120} className="lo-feat-visual">
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, maxWidth: 340, justifySelf: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>만료 임박 알림</div>
                <div style={{ background: 'rgba(242,96,78,0.1)', border: '1px solid rgba(242,96,78,0.25)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>만료 임박 레슨권 미소진 회원 1명</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>선택한 기간 내 만료가 도래하지만 아직 미소진 상태인 회원입니다. 문자로 소진을 독려하십시오.</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    <span style={{ background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8 }}>1주일 전</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 11, padding: '5px 10px', borderRadius: 8 }}>2주일 전</span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 11, padding: '5px 10px', borderRadius: 8 }}>직접입력</span>
                  </div>
                  <div style={{ background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center', borderRadius: 10, padding: 10 }}>✉ 문자 발송</div>
                </div>
              </div>
            </Anim>
            <Anim style={{ order: 1 }}>
              <div className="lo-feat-text">
                <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>03 — 재등록 유도</div>
                <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>만료 임박 회원에게<br />자동으로 알립니다</h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>레슨권 만료일이 임박했으나 미소진 회원을 자동으로 추출하여 표시합니다. 기준(1주일 전, 2주일 전 등)을 설정하면 단체 문자를 일괄 발송하여 소진과 재등록을 독려할 수 있습니다.</p>
              </div>
            </Anim>
          </div>
        </section>

        {/* 04 — 데이터로 관리 */}
        <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, transparent, rgba(242,96,78,0.05), transparent)' }}>
          <Anim style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>04 — 데이터로 관리</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>대시보드에서 레슨권 통계를<br />한눈에 조회합니다</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>회원별 레슨권 소진 추이를 자동 집계합니다. 아래 통계 항목을 대시보드에서 바로 확인할 수 있습니다.</p>
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
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>주요 활용 업종</div>
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
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>LESSON:ON은 다양한 업종에 적용 가능한 스케줄 엔진을 기반으로 합니다. 아래 기능을 기본 제공합니다.</p>
            </Anim>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>

              {[
                {
                  visual: <WizardStepDemo />,
                  title: '5분 셋업 위자드',
                  desc: '운영 모드·시간 단위·요일 규칙을 7단계 질문으로 안내받아 바로 시작합니다.',
                },
                {
                  visual: <ViewCycleDemo />,
                  title: '보기 방식 자유 전환',
                  desc: '월간·주간·일간, 일자별·시간별 보기를 조직과 사용자의 상황에 따라 자유롭게 전환할 수 있습니다.',
                },
                {
                  visual: <SyncDemo />,
                  title: '실시간 동기화',
                  desc: '강사와 회원이 동시에 캘린더를 봐도 새로고침 없이 즉시 반영되어 중복 예약을 막습니다.',
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
                          const on = i === 1 || i === 3 || i === 5
                          return (
                            <span key={d} style={{ width: 22, height: 22, borderRadius: 6, background: on ? 'rgba(242,96,78,0.15)' : undefined, border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`, color: on ? ACCENT : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: on ? 700 : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</span>
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {(['10:00–11:00', '14:00–15:00'] as string[]).map(t => (
                          <span key={t} style={{ background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 5, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{t}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>자동 생성된 슬롯</div>
                      {(['8/4 (월) · 10:00', '8/6 (수) · 10:00', '8/8 (금) · 10:00'] as string[]).map((slot, i) => (
                        <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 9px', background: 'rgba(242,96,78,0.08)', border: '1px solid rgba(242,96,78,0.18)', borderRadius: 7, marginBottom: 4, fontSize: 10, opacity: 0, animation: `fadeUp 0.4s ease ${300 + i * 110}ms forwards` }}>
                          <span style={{ color: ACCENT }}>✓</span>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{slot}</span>
                        </div>
                      ))}
                    </div>
                  ),
                  title: '반복 등록',
                  desc: '반복 유형·요일·시간대·기간을 지정하면 회원 한 명의 수업을 여러 슬롯에 한 번에 일괄 등록합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {([
                          { name: '김민지', color: ACCENT, slots: '화·목 선호' },
                          { name: '이준혁', color: '#818cf8', slots: '월·수·금 선호' },
                          { name: '박서연', color: '#22c55e', slots: '상시 가능' },
                        ] as { name: string; color: string; slots: string }[]).map(m => (
                          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 600 }}>{m.name}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{m.slots}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px', borderRadius: 9, marginBottom: 10, animation: 'autoGlow 3s ease-in-out infinite' }}>★ 자동배정 실행</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>배정 결과 미리보기</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                        {(['월', '화', '수', '목', '금'] as string[]).map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.35)', paddingBottom: 3 }}>{d}</div>
                        ))}
                        {([
                          { init: '이', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', color: '#818cf8', delay: 200 },
                          { init: '김', bg: 'rgba(242,96,78,0.15)',  border: 'rgba(242,96,78,0.3)',  color: ACCENT,   delay: 400 },
                          { init: '이', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', color: '#818cf8', delay: 600 },
                          { init: '김', bg: 'rgba(242,96,78,0.15)',  border: 'rgba(242,96,78,0.3)',  color: ACCENT,   delay: 800 },
                          { init: '박', bg: 'rgba(34,197,94,0.13)',  border: 'rgba(34,197,94,0.28)', color: '#22c55e', delay: 1000 },
                          { init: '박', bg: 'rgba(34,197,94,0.13)',  border: 'rgba(34,197,94,0.28)', color: '#22c55e', delay: 1200 },
                          { init: '—',  bg: 'rgba(255,255,255,0.04)',border: 'rgba(255,255,255,0.08)',color: 'rgba(255,255,255,0.2)', delay: 1400 },
                          { init: '박', bg: 'rgba(34,197,94,0.13)',  border: 'rgba(34,197,94,0.28)', color: '#22c55e', delay: 1600 },
                          { init: '—',  bg: 'rgba(255,255,255,0.04)',border: 'rgba(255,255,255,0.08)',color: 'rgba(255,255,255,0.2)', delay: 1800 },
                          { init: '이', bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', color: '#818cf8', delay: 2000 },
                        ] as { init: string; bg: string; border: string; color: string; delay: number }[]).map((cell, i) => (
                          <div key={i} style={{ padding: '5px 0', textAlign: 'center', borderRadius: 5, background: cell.bg, border: `1px solid ${cell.border}`, fontSize: 10, fontWeight: 700, color: cell.color, opacity: 0, animation: `cellFill 0.4s ease ${cell.delay}ms forwards` }}>{cell.init}</div>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '자동 배정',
                  desc: '역할별로 대표·회원 비율을, 회원별로 가능 요일과 월 최대 횟수를 설정하면 빈 슬롯을 규칙에 맞춰 자동으로 채웁니다.',
                },
                {
                  visual: (() => {
                    const days = Array.from({ length: 31 }, (_, i) => {
                      const d = i + 1
                      const dow = (6 + i) % 7
                      const isSlot = dow === 1 || dow === 3 || dow === 5
                      const isHol = d === 15
                      const isSpc = d === 20
                      const isToday = d === 27
                      return { d, isSlot, isHol, isSpc, isToday }
                    })
                    return (
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: 'rgba(255,255,255,0.8)' }}>2026년 8월</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
                          {['일','월','화','수','목','금','토'].map(d => (
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
                  desc: '"월·수·금 운영" 같은 기본 규칙에 휴관일·특별 운영일을 그날만 따로 지정할 수 있습니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>회원 정보 · 커스텀 필드</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                        {([
                          { type: '텍스트', label: '부상 이력',   value: '왼쪽 무릎',  tc: 'rgba(255,255,255,0.55)', tb: 'rgba(255,255,255,0.08)' },
                          { type: '선택',   label: '레슨 종류',   value: '1:1 PT',     tc: '#818cf8',                tb: 'rgba(99,102,241,0.12)' },
                          { type: '날짜',   label: '등록일',      value: '2026.06.01', tc: '#22c55e',                tb: 'rgba(34,197,94,0.1)' },
                          { type: '숫자',   label: '보유 횟수',   value: '8',          tc: ACCENT,                   tb: 'rgba(242,96,78,0.1)' },
                        ] as { type: string; label: string; value: string; tc: string; tb: string }[]).map(f => (
                          <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                            <span style={{ background: f.tb, color: f.tc, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{f.type}</span>
                            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{f.label}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ border: `1px dashed ${ACCENT}`, borderRadius: 8, padding: '7px', textAlign: 'center', fontSize: 11, color: ACCENT, fontWeight: 700 }}>+ 입력항목 추가</div>
                    </div>
                  ),
                  title: '입력항목 설정',
                  desc: '부상 이력, 보유 레슨권 종류 등 조직별 고유 항목을 코드 수정 없이 추가합니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: 'rgba(255,255,255,0.85)' }}>화 10:00 · 김민지</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>필라테스 · 1:1 레슨</div>
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
                          <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>자세교정_0804.webp</div>
                          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ width: '100%', height: '100%', background: ACCENT, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>312 KB · 압축 완료</div>
                        </div>
                      </div>
                    </div>
                  ),
                  title: '사진 첨부',
                  desc: '회원 자세 교정 사진 등을 배정에 첨부합니다. 브라우저에서 자동 압축되어 저장 효율을 높입니다.',
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
                          { time: '13:00', delays: [null, 700, 1050, null, null] },
                          { time: '14:00', delays: [null, null, null, null, null] },
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
                        <div style={{ flex: 1, background: 'rgba(242,96,78,0.1)', border: '1px solid rgba(242,96,78,0.25)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: ACCENT, fontWeight: 600 }}>이번 주 선택</div>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '0 2px' }}>→</div>
                        <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px', textAlign: 'center', fontSize: 10, color: '#22c55e', fontWeight: 600 }}>다음 주 붙여넣기</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['XLSX', 'PDF', 'CSV', 'DOCX'] as string[]).map(f => (
                          <span key={f} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 0', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  ),
                  title: '엑셀모드 + 내보내기',
                  desc: '셀을 드래그하거나 Shift+클릭으로 범위를 선택한 뒤 Ctrl+C/V로 복사·붙여넣기합니다. 한 달 스케줄을 엑셀·CSV·워드·PDF로 내보냅니다.',
                },
                {
                  visual: (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>자연어 입력</div>
                      <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>"박지은님 화요일 10시 요가 예약"</span>
                        <span style={{ width: 2, height: 14, background: ACCENT, display: 'inline-block', flexShrink: 0, animation: 'typeCursor 1s step-end infinite' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: ACCENT, fontSize: 14 }}>↓</span>
                        AI 파싱 완료
                      </div>
                      <div style={{ background: 'rgba(242,96,78,0.08)', border: '1px solid rgba(242,96,78,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 10 }}>
                          {([
                            { label: '회원', value: '박지은' },
                            { label: '요일', value: '화요일' },
                            { label: '시간', value: '10:00' },
                            { label: '종류', value: '요가' },
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
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>수기 관리의 번거로움을 해소하십시오.<br />Lesson On이 대신합니다.</h2>
            <button className="lo-cta" onClick={goStart} style={{ background: ACCENT, color: '#fff', border: 0, borderRadius: 12, padding: '16px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>지금 무료로 시작하기 →</button>
          </section>
        </Anim>

      </div>
      <DevFileLabel file="LandingLessonOn.tsx" />
    </>
  )
}
