import { useEffect, useRef, useCallback } from 'react'

interface ScheduleBackgroundProps {
  topNavSlot?: React.ReactNode
  children?: React.ReactNode
}

const DAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN']
const TIME_TICKS = ['09','10','11','12','·','13','14','15','16','17','18']
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

function getWeekNumber(d: Date): number {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = dt.getUTCDay() || 7
  dt.setUTCDate(dt.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  return Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function ScheduleBackground({ topNavSlot, children }: ScheduleBackgroundProps) {
  const assignGridRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const weekNum = getWeekNumber(now)
  const todayDow = now.getDay()
  const monthStr = String(now.getMonth() + 1).padStart(2, '0')
  const yearNum = now.getFullYear()
  const monthName = MONTH_NAMES[now.getMonth()]

  const runAssignAnimation = useCallback(() => {
    const grid = assignGridRef.current
    if (!grid) return () => {}

    const SHIFTS = [
      { col:0,row:0, span:2,name:'서용혁',cls:'sun' },{ col:0,row:2, span:3,name:'민지우',cls:'plus' },
      { col:0,row:5, span:1,name:'·',     cls:'break'},{ col:0,row:6, span:2,name:'이은서',cls:'sat' },
      { col:0,row:8, span:3,name:'박지훈',cls:'moon' },{ col:1,row:0, span:3,name:'정민석',cls:'plus' },
      { col:1,row:3, span:2,name:'김지움',cls:'sun' }, { col:1,row:5, span:1,name:'·',     cls:'break'},
      { col:1,row:6, span:3,name:'한소윤',cls:'sat' }, { col:1,row:9, span:2,name:'조서윤',cls:'moon' },
      { col:2,row:0, span:2,name:'이하랜',cls:'sat' }, { col:2,row:2, span:2,name:'박지훈',cls:'moon' },
      { col:2,row:4, span:1,name:'서용혁',cls:'sun' }, { col:2,row:5, span:1,name:'·',     cls:'break'},
      { col:2,row:6, span:2,name:'민지우',cls:'plus' },{ col:2,row:8, span:3,name:'이은서',cls:'sat' },
      { col:3,row:0, span:3,name:'박지훈',cls:'moon' },{ col:3,row:3, span:2,name:'조서윤',cls:'sun' },
      { col:3,row:5, span:1,name:'·',     cls:'break'},{ col:3,row:6, span:3,name:'정민석',cls:'plus' },
      { col:3,row:9, span:2,name:'김지움',cls:'sat' }, { col:4,row:0, span:2,name:'한소윤',cls:'sat' },
      { col:4,row:2, span:3,name:'민지우',cls:'plus' },{ col:4,row:5, span:1,name:'·',     cls:'break'},
      { col:4,row:6, span:2,name:'서용혁',cls:'sun' }, { col:4,row:8, span:3,name:'박지훈',cls:'moon' },
      { col:5,row:1, span:2,name:'이하랜',cls:'sat' }, { col:5,row:4, span:2,name:'조서윤',cls:'sun' },
      { col:5,row:7, span:2,name:'김지움',cls:'plus' },{ col:6,row:2, span:3,name:'한소윤',cls:'moon' },
      { col:6,row:6, span:2,name:'이은서',cls:'sat' },
    ]

    const nodes = SHIFTS.map(s => {
      const el = document.createElement('div')
      el.className = `lmp-chip ${s.cls}`
      el.style.gridColumn = `${s.col + 1} / span 1`
      el.style.gridRow = `${s.row + 1} / span ${s.span}`
      el.textContent = s.name
      grid.appendChild(el)
      return el
    })

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { nodes.forEach(n => n.classList.add('visible')); return () => nodes.forEach(n => n.remove()) }

    let timers: ReturnType<typeof setTimeout>[] = []
    const clearAll = () => { timers.forEach(clearTimeout); timers = [] }
    const shuffle = <T,>(arr: T[]) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}; return a }

    function runCycle() {
      nodes.forEach(n => n.classList.remove('visible','fading'))
      const order = shuffle(nodes.map((_,i)=>i))
      order.forEach((idx,i) => {
        timers.push(setTimeout(()=>{
          nodes[idx].classList.add('visible')
        },i*95))
      })
      const done = order.length*95+400
      timers.push(setTimeout(()=>{
        nodes.forEach((n,i)=>{ const s=SHIFTS[i]; timers.push(setTimeout(()=>n.classList.add('fading'),s.col*110+s.row*18)) })
      },done+1800))
      timers.push(setTimeout(runCycle,done+1800+1500))
    }

    timers.push(setTimeout(runCycle,400))
    const onVis = () => { if(document.hidden){clearAll()}else{clearAll();timers.push(setTimeout(runCycle,200))} }
    document.addEventListener('visibilitychange',onVis)
    return () => { clearAll(); document.removeEventListener('visibilitychange',onVis); nodes.forEach(n=>n.remove()) }
  }, [])

  useEffect(() => { return runAssignAnimation() }, [runAssignAnimation])

  return (
    <div className="lmp">
      <style>{`
        .lmp {
          font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #F4F1EA;
          position: relative;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          display: grid;
          grid-template-rows: var(--bh,52px) var(--dh,32px) 1fr auto;
          grid-template-columns: var(--tw,48px) 1fr;
        }
        /* background layers */
        .lmp-bg-grid {
          position: absolute;
          top: calc(var(--bh,52px) + var(--dh,32px));
          left: var(--tw,48px); right: 0; bottom: 0;
          z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(20,23,28,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20,23,28,0.07) 1px, transparent 1px);
          background-size: 56px 56px;
          background-position: -1px -1px;
          mask-image: linear-gradient(to bottom,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.5) 65%,rgba(0,0,0,0.15) 100%);
          -webkit-mask-image: linear-gradient(to bottom,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.5) 65%,rgba(0,0,0,0.15) 100%);
        }
        .lmp-bg-digit {
          position: absolute; bottom: -110px; right: -50px;
          font-size: 380px; line-height: 0.85; font-weight: 800; letter-spacing: -10px;
          color: transparent; -webkit-text-stroke: 1.5px rgba(20,23,28,0.07);
          user-select: none; z-index: 0; font-family: "JetBrains Mono", monospace; pointer-events: none;
        }
        .lmp-bg-digit .sm { font-size:0.30em; letter-spacing:0; margin-left:-10px; -webkit-text-stroke:1.2px rgba(20,23,28,0.06); }
        .lmp-bg-digit .lbl { display:block; font-family:"Pretendard Variable",Pretendard,sans-serif; font-size:22px; color:rgba(20,23,28,0.18); letter-spacing:4px; font-weight:600; -webkit-text-stroke:0; margin-top:12px; margin-left:20px; }
        .lmp-bg-now {
          position: absolute;
          left: var(--tw,48px); right: 0; height: 1px;
          background: oklch(0.66 0.16 28); z-index: 1; pointer-events: none; opacity: 0.7;
          animation: lmpNow 18s ease-in-out infinite alternate;
        }
        .lmp-bg-now::before { content:""; position:absolute; left:-4px; top:50%; transform:translateY(-50%); width:8px; height:8px; background:oklch(0.66 0.16 28); border-radius:50%; box-shadow:0 0 0 3px #F4F1EA; }
        .lmp-bg-now::after { content:"NOW"; position:absolute; right:18px; top:50%; transform:translateY(-50%); background:#F4F1EA; padding:1px 7px; font-family:"JetBrains Mono",monospace; font-size:9px; font-weight:700; letter-spacing:1.2px; color:oklch(0.66 0.16 28); border-radius:3px; border:1px solid oklch(0.66 0.16 28); }
        @keyframes lmpNow {
          0%   { top: calc(var(--bh,52px) + var(--dh,32px) + 28%); }
          100% { top: calc(var(--bh,52px) + var(--dh,32px) + 55%); }
        }
        /* brand bar */
        .lmp-brand-bar {
          grid-row:1; grid-column:1/-1;
          display:flex; align-items:center; padding:0 24px 0 20px;
          border-bottom:1px solid rgba(20,23,28,0.07);
          background:#F4F1EA; z-index:3; position:relative;
        }
        .lmp-brand-pill {
          margin-left:4px; font-size:10px; font-family:"JetBrains Mono",monospace;
          padding:3px 8px; border-radius:999px; background:#fff;
          border:1px solid rgba(20,23,28,0.09); color:#6B7280; letter-spacing:0.4px; text-transform:uppercase; white-space:nowrap;
        }
        .lmp-top-nav { margin-left:auto; display:flex; align-items:center; gap:8px; font-size:13px; color:#6B7280; white-space:nowrap; }
        .lmp-nav-btn { color:#14171C; font-weight:600; padding:6px 12px; border-radius:8px; background:#fff; border:1px solid rgba(20,23,28,0.09); cursor:pointer; font:inherit; font-size:13px; transition:background .12s; }
        .lmp-nav-btn:hover { background:#ECE8DF; }
        .lmp-nav-hint { color:#6B7280; font-size:13px; }
        /* day strip */
        .lmp-day-strip {
          grid-row:2; grid-column:1/-1;
          display:grid; grid-template-columns:var(--tw,48px) repeat(7,1fr);
          background:#FBF9F4; border-bottom:1px solid rgba(20,23,28,0.07); z-index:2; position:relative;
        }
        .lmp-day-corner { border-right:1px solid rgba(20,23,28,0.07); display:flex; align-items:center; justify-content:center; font-family:"JetBrains Mono",monospace; font-size:9px; font-weight:600; color:#B8BBC2; letter-spacing:0.6px; }
        .lmp-day-cell { display:flex; align-items:center; justify-content:center; font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:600; letter-spacing:0.8px; color:#8A8F99; border-right:1px solid rgba(20,23,28,0.07); }
        .lmp-day-cell:last-child { border-right:0; }
        .lmp-day-cell.sat { color:oklch(0.55 0.13 240); }
        .lmp-day-cell.sun { color:oklch(0.55 0.16 25); }
        .lmp-day-cell.today { background:oklch(0.66 0.16 28); color:white; }
        /* time gutter */
        .lmp-time-gutter { grid-row:3; grid-column:1; border-right:1px solid rgba(20,23,28,0.07); background:#FBF9F4; display:flex; flex-direction:column; z-index:2; position:relative; }
        .lmp-tick { flex:1; display:flex; align-items:center; justify-content:center; font-family:"JetBrains Mono",monospace; font-size:10px; font-weight:500; color:#8A8F99; border-bottom:1px dashed rgba(20,23,28,0.07); }
        .lmp-tick:last-child { border-bottom:0; }
        .lmp-tick.lunch { color:#B8BBC2; font-style:italic; }
        /* stage */
        .lmp-stage {
          grid-row:3; grid-column:2; z-index:2; position:relative;
          overflow-y:auto; min-height:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:24px 28px;
        }
        /* footer */
        .lmp-footer {
          grid-row:4; grid-column:1/-1; border-top:1px solid rgba(20,23,28,0.07);
          background:#F4F1EA; z-index:3; position:relative; height:36px;
          display:flex; align-items:center; padding:0 24px; font-size:11px; color:#8A8F99; gap:12px;
        }
        .lmp-foot-dot { width:3px; height:3px; border-radius:50%; background:#B8BBC2; flex-shrink:0; }
        /* ─── responsive ─── */
        @media (max-width: 900px) {
          .lmp { --bh:48px; --tw:40px; --dh:30px; }
          .lmp-bg-digit { font-size:280px; bottom:-80px; right:-30px; }
          .lmp-bg-digit .lbl { font-size:18px; margin-top:8px; }
        }
        @media (max-width: 720px) {
          .lmp { --bh:46px; --tw:36px; --dh:28px; }
          .lmp-brand-pill { display:none; }
          .lmp-nav-hint { display:none; }
          .lmp-stage { padding:16px 18px; }
          .lmp-bg-digit { font-size:220px; bottom:-65px; right:-25px; }
          .lmp-bg-digit .lbl { font-size:16px; margin-top:6px; }
        }
        @media (max-width: 540px) {
          .lmp { --bh:44px; --tw:0px; --dh:28px; grid-template-columns:1fr; }
          .lmp-time-gutter { display:none; }
          .lmp-bg-grid { left:0; }
          .lmp-bg-now { left:0; }
          .lmp-day-strip { grid-template-columns:repeat(7,1fr); }
          .lmp-day-corner { display:none; }
          .lmp-brand-bar { padding:0 14px; }
          .lmp-stage { grid-column:1; padding:14px; }
          .lmp-bg-digit { font-size:160px; bottom:-50px; right:-20px; }
          .lmp-bg-digit .sm, .lmp-bg-digit .lbl { display:none; }
          .lmp-footer { height:30px; padding:0 12px; font-size:10px; gap:8px; }
          .lmp-hide-sm { display:none; }
        }
        @media (max-height: 620px) and (min-width: 541px) {
          .lmp-stage { padding:10px 20px; }
        }
        /* assign animation grid */
        .lmp-assign-grid {
          position:absolute;
          top:calc(var(--bh,52px) + var(--dh,32px) + 4px);
          left:calc(var(--tw,48px) + 4px);
          right:4px; bottom:40px;
          z-index:1; pointer-events:none;
          display:grid;
          grid-template-columns:repeat(7,1fr);
          grid-template-rows:repeat(11,1fr);
          gap:3px;
        }
        .lmp-chip {
          border-radius:4px; font-size:10.5px; font-weight:600;
          display:flex; align-items:center; justify-content:center;
          letter-spacing:-0.2px; padding:1px 4px; min-width:0;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; line-height:1;
          opacity:0; transform:scale(0.82) translateY(-4px);
          transition:opacity .32s ease,transform .32s cubic-bezier(.34,1.56,.64,1),box-shadow .5s ease;
          will-change:opacity,transform;
        }
        .lmp-chip.visible   { opacity:0.72; transform:scale(1) translateY(0); }
        .lmp-chip.just-placed { opacity:1; box-shadow:0 0 0 1.5px oklch(0.66 0.16 28),0 4px 10px -3px oklch(0.66 0.16 28/0.35); }
        .lmp-chip.fading    { opacity:0; transform:scale(0.94); transition:opacity .55s ease,transform .55s ease; }
        .lmp-chip.sun   { background:oklch(0.93 0.06 70);  color:oklch(0.40 0.12 60); }
        .lmp-chip.sat   { background:oklch(0.93 0.05 160); color:oklch(0.38 0.10 160); }
        .lmp-chip.plus  { background:oklch(0.93 0.05 20);  color:oklch(0.42 0.12 20); }
        .lmp-chip.moon  { background:oklch(0.93 0.05 290); color:oklch(0.40 0.11 290); }
        .lmp-chip.break { background:oklch(0.93 0.05 230); color:oklch(0.42 0.10 240); }
        @media (max-width:540px) { .lmp-assign-grid { opacity:0.55; } }
      `}</style>

      {/* background layers */}
      <div className="lmp-bg-grid" aria-hidden="true" />
      <div className="lmp-bg-digit" aria-hidden="true">
        {monthStr}<span className="sm">月</span>
        <span className="lbl">{monthName} {yearNum}</span>
      </div>
      <div className="lmp-bg-now" aria-hidden="true" />
      <div className="lmp-assign-grid" ref={assignGridRef} aria-hidden="true" />

      {/* Row 1 — brand bar */}
      <header className="lmp-brand-bar">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="32" height="32" style={{ flexShrink:0, borderRadius:8, overflow:'hidden' }}>
            <rect width="512" height="512" rx="112" fill="#FBF9F4"/>
            <rect x="64"     y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
            <rect x="129.67" y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.66 0.16 28)"/>
            <rect x="326.67" y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.78 0.09 230)"/>
            <rect x="392.33" y="142.8" width="55.67" height="68.8" rx="16" fill="oklch(0.75 0.10 160)"/>
            <rect x="64"     y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.72 0.10 290)"/>
            <rect x="129.67" y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
            <rect x="326.67" y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.66 0.16 28)"/>
            <rect x="392.33" y="221.6" width="55.67" height="68.8" rx="16" fill="oklch(0.78 0.09 230)"/>
            <rect x="64"     y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.75 0.10 160)"/>
            <rect x="129.67" y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.72 0.10 290)"/>
            <rect x="326.67" y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
            <rect x="392.33" y="300.4" width="55.67" height="68.8" rx="16" fill="oklch(0.66 0.16 28)"/>
            <rect x="64"     y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.78 0.09 230)"/>
            <rect x="129.67" y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.75 0.10 160)"/>
            <rect x="326.67" y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.72 0.10 290)"/>
            <rect x="392.33" y="379.2" width="55.67" height="68.8" rx="16" fill="oklch(0.85 0.10 70)"/>
          </svg>
          <span style={{ fontSize:15, fontWeight:600, letterSpacing:-0.2, color:'#14171C', whiteSpace:'nowrap' }}>스케줄러</span>
          <span className="lmp-brand-pill">WORKSPACE</span>
        </div>
        <div className="lmp-top-nav">
          {topNavSlot}
        </div>
      </header>

      {/* Row 2 — day strip */}
      <div className="lmp-day-strip" aria-hidden="true">
        <div className="lmp-day-corner">W{String(weekNum).padStart(2,'0')}</div>
        {DAY_LABELS.map((d, i) => {
          const isToday = (i + 1) % 7 === todayDow
          return (
            <div key={d} className={`lmp-day-cell${i===5?' sat':i===6?' sun':''}${isToday?' today':''}`}>{d}</div>
          )
        })}
      </div>

      {/* Col 1 — time gutter */}
      <aside className="lmp-time-gutter" aria-hidden="true">
        {TIME_TICKS.map((t, i) => (
          <div key={i} className={`lmp-tick${t==='·'?' lunch':''}`}>{t}</div>
        ))}
      </aside>

      {/* Col 2 — stage */}
      <main className="lmp-stage">
        {children}
      </main>

      {/* Row 4 — footer */}
      <footer className="lmp-footer">
        <span>© {yearNum} 스케줄러</span>
        <span className="lmp-foot-dot lmp-hide-sm" />
        <span className="lmp-hide-sm" style={{ color:'#6B7280', cursor:'pointer' }}>서비스 약관</span>
        <span className="lmp-foot-dot lmp-hide-sm" />
        <span className="lmp-hide-sm" style={{ color:'#6B7280', cursor:'pointer' }}>개인정보</span>
        <span style={{ marginLeft:'auto', fontFamily:'"JetBrains Mono",monospace' }}>v1.0</span>
      </footer>
    </div>
  )
}
