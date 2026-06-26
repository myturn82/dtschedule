import { useEffect, useRef, useCallback } from 'react'
import { LogoIcon, LogoWordmark } from '../Logo'

interface ScheduleBackgroundProps {
  topNavSlot?: React.ReactNode
  children?: React.ReactNode
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const TIME_TICKS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

export function ScheduleBackground({ topNavSlot, children }: ScheduleBackgroundProps) {
  const assignGridRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  const monthStr = String(now.getMonth() + 1).padStart(2, '0')
  const yearNum = now.getFullYear()
  const monthName = MONTH_NAMES[now.getMonth()]

  // 이번 주 월~일 날짜 계산
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const runAssignAnimation = useCallback(() => {
    const grid = assignGridRef.current
    if (!grid) return () => {}

    const SHIFTS = [
      // col 0 — 월
      { col:0,row:0,  span:1, name:'서용혁', cls:'sun'  },
      { col:0,row:1,  span:1, name:'민지우', cls:'plus' },
      { col:0,row:2,  span:1, name:'이하랜', cls:'sat'  },
      { col:0,row:3,  span:1, name:'박지훈', cls:'moon' },
      { col:0,row:4,  span:1, name:'조서윤', cls:'sun'  },
      { col:0,row:5,  span:1, name:'·',      cls:'break'},
      { col:0,row:6,  span:1, name:'이은서', cls:'sat'  },
      { col:0,row:7,  span:1, name:'한소윤', cls:'sat'  },
      { col:0,row:8,  span:1, name:'정민석', cls:'plus' },
      { col:0,row:9,  span:1, name:'김지움', cls:'moon' },
      { col:0,row:10, span:1, name:'박지훈', cls:'moon' },
      // col 1 — 화
      { col:1,row:0,  span:1, name:'정민석', cls:'plus' },
      { col:1,row:1,  span:1, name:'서용혁', cls:'sun'  },
      { col:1,row:2,  span:1, name:'이은서', cls:'sat'  },
      { col:1,row:3,  span:1, name:'한소윤', cls:'sat'  },
      { col:1,row:4,  span:1, name:'민지우', cls:'plus' },
      { col:1,row:5,  span:1, name:'·',      cls:'break'},
      { col:1,row:6,  span:1, name:'조서윤', cls:'moon' },
      { col:1,row:7,  span:1, name:'이하랜', cls:'sat'  },
      { col:1,row:8,  span:1, name:'박지훈', cls:'moon' },
      { col:1,row:9,  span:1, name:'서용혁', cls:'sun'  },
      { col:1,row:10, span:1, name:'김지움', cls:'sun'  },
      // col 2 — 수
      { col:2,row:0,  span:1, name:'이하랜', cls:'sat'  },
      { col:2,row:1,  span:1, name:'박지훈', cls:'moon' },
      { col:2,row:2,  span:1, name:'서용혁', cls:'sun'  },
      { col:2,row:3,  span:1, name:'민지우', cls:'plus' },
      { col:2,row:4,  span:1, name:'이은서', cls:'sat'  },
      { col:2,row:5,  span:1, name:'·',      cls:'break'},
      { col:2,row:6,  span:1, name:'조서윤', cls:'moon' },
      { col:2,row:7,  span:1, name:'정민석', cls:'plus' },
      { col:2,row:8,  span:1, name:'서용혁', cls:'sun'  },
      { col:2,row:9,  span:1, name:'한소윤', cls:'sat'  },
      { col:2,row:10, span:1, name:'이하랜', cls:'sat'  },
      // col 3 — 목
      { col:3,row:0,  span:1, name:'박지훈', cls:'moon' },
      { col:3,row:1,  span:1, name:'조서윤', cls:'sun'  },
      { col:3,row:2,  span:1, name:'한소윤', cls:'moon' },
      { col:3,row:3,  span:1, name:'이은서', cls:'sat'  },
      { col:3,row:4,  span:1, name:'정민석', cls:'plus' },
      { col:3,row:5,  span:1, name:'·',      cls:'break'},
      { col:3,row:6,  span:1, name:'서용혁', cls:'sun'  },
      { col:3,row:7,  span:1, name:'민지우', cls:'plus' },
      { col:3,row:8,  span:1, name:'이하랜', cls:'sat'  },
      { col:3,row:9,  span:1, name:'김지움', cls:'sun'  },
      { col:3,row:10, span:1, name:'박지훈', cls:'moon' },
      // col 4 — 금
      { col:4,row:0,  span:1, name:'한소윤', cls:'sat'  },
      { col:4,row:1,  span:1, name:'김지움', cls:'sun'  },
      { col:4,row:2,  span:1, name:'민지우', cls:'plus' },
      { col:4,row:3,  span:1, name:'서용혁', cls:'sun'  },
      { col:4,row:4,  span:1, name:'이하랜', cls:'sat'  },
      { col:4,row:5,  span:1, name:'·',      cls:'break'},
      { col:4,row:6,  span:1, name:'박지훈', cls:'moon' },
      { col:4,row:7,  span:1, name:'이은서', cls:'sat'  },
      { col:4,row:8,  span:1, name:'조서윤', cls:'moon' },
      { col:4,row:9,  span:1, name:'정민석', cls:'plus' },
      { col:4,row:10, span:1, name:'민지우', cls:'plus' },
      // col 5 — 토 (partial)
      { col:5,row:0,  span:1, name:'서용혁', cls:'sun'  },
      { col:5,row:2,  span:1, name:'이하랜', cls:'sat'  },
      { col:5,row:4,  span:1, name:'조서윤', cls:'sun'  },
      { col:5,row:7,  span:1, name:'김지움', cls:'plus' },
      { col:5,row:9,  span:1, name:'한소윤', cls:'moon' },
      // col 6 — 일 (partial)
      { col:6,row:1,  span:1, name:'정민석', cls:'plus' },
      { col:6,row:3,  span:1, name:'이하랜', cls:'sat'  },
      { col:6,row:6,  span:1, name:'이은서', cls:'sat'  },
      { col:6,row:8,  span:1, name:'민지우', cls:'plus' },
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
        },i*50))
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
          grid-template-rows: var(--bh,52px) var(--dh,44px) 1fr auto;
          grid-template-columns: var(--tw,56px) 1fr;
        }
        /* background layers */
        .lmp-bg-grid {
          position: absolute;
          top: calc(var(--bh,52px) + var(--dh,44px));
          left: var(--tw,56px); right: 0; bottom: 0;
          z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(to right, rgba(20,23,28,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20,23,28,0.07) 1px, transparent 1px);
          background-size:
            calc((100vw - var(--tw,56px)) / 7)
            calc((100dvh - var(--bh,52px) - var(--dh,44px) - 36px) / 11);
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
          left: var(--tw,56px); right: 0; height: 1px;
          background: oklch(0.66 0.16 28); z-index: 1; pointer-events: none; opacity: 0.7;
          animation: lmpNow 18s ease-in-out infinite alternate;
        }
        .lmp-bg-now::before { content:""; position:absolute; left:-4px; top:50%; transform:translateY(-50%); width:8px; height:8px; background:oklch(0.66 0.16 28); border-radius:50%; box-shadow:0 0 0 3px #F4F1EA; }
        .lmp-bg-now::after { content:"NOW"; position:absolute; right:18px; top:50%; transform:translateY(-50%); background:#F4F1EA; padding:1px 7px; font-family:"JetBrains Mono",monospace; font-size:9px; font-weight:700; letter-spacing:1.2px; color:oklch(0.66 0.16 28); border-radius:3px; border:1px solid oklch(0.66 0.16 28); }
        @keyframes lmpNow {
          0%   { top: calc(var(--bh,52px) + var(--dh,44px) + 28%); }
          100% { top: calc(var(--bh,52px) + var(--dh,44px) + 55%); }
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
          display:grid; grid-template-columns:var(--tw,56px) repeat(7,1fr);
          background:#FBF9F4; border-bottom:1px solid rgba(20,23,28,0.07); z-index:2; position:relative;
        }
        .lmp-day-corner {
          border-right:1px solid rgba(20,23,28,0.07);
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
        }
        .lmp-corner-year { font-family:"JetBrains Mono",monospace; font-size:7px; font-weight:500; color:#C8CDD4; line-height:1; }
        .lmp-corner-month { font-family:"JetBrains Mono",monospace; font-size:9px; font-weight:700; color:#A0A5AF; line-height:1; }
        .lmp-day-cell {
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
          color:#8A8F99; border-right:1px solid rgba(20,23,28,0.07);
        }
        .lmp-day-cell:last-child { border-right:0; }
        .lmp-day-name { font-size:10px; font-weight:600; line-height:1; }
        .lmp-day-num  { font-size:13px; font-weight:700; line-height:1; font-family:"JetBrains Mono",monospace; }
        .lmp-day-cell.sat { color:oklch(0.55 0.13 240); }
        .lmp-day-cell.sun { color:oklch(0.55 0.16 25); }
        .lmp-day-cell.today { background:oklch(0.66 0.16 28); color:white; }
        /* time gutter */
        .lmp-time-gutter { grid-row:3; grid-column:1; border-right:1px solid rgba(20,23,28,0.07); background:#FBF9F4; display:flex; flex-direction:column; z-index:2; position:relative; }
        .lmp-tick { flex:1; display:flex; align-items:center; justify-content:center; font-family:"JetBrains Mono",monospace; font-size:8.5px; font-weight:500; color:#8A8F99; border-bottom:1px dashed rgba(20,23,28,0.07); }
        .lmp-tick:last-child { border-bottom:0; }
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
          .lmp { --bh:48px; --tw:48px; --dh:40px; }
          .lmp-bg-digit { font-size:280px; bottom:-80px; right:-30px; }
          .lmp-bg-digit .lbl { font-size:18px; margin-top:8px; }
        }
        @media (max-width: 720px) {
          .lmp { --bh:46px; --tw:44px; --dh:36px; }
          .lmp-brand-pill { display:none; }
          .lmp-nav-hint { display:none; }
          .lmp-stage { padding:16px 18px; }
          .lmp-bg-digit { font-size:220px; bottom:-65px; right:-25px; }
          .lmp-bg-digit .lbl { font-size:16px; margin-top:6px; }
        }
        @media (max-width: 540px) {
          .lmp { --bh:44px; --tw:0px; --dh:36px; grid-template-columns:1fr; }
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
        /* assign animation grid — 요일·시간 셀에 정확히 정렬 */
        .lmp-assign-grid {
          position:absolute;
          top:calc(var(--bh,52px) + var(--dh,44px));
          left:var(--tw,56px);
          right:0;
          bottom:36px;
          z-index:1; pointer-events:none;
          display:grid;
          grid-template-columns:repeat(7,1fr);
          grid-template-rows:repeat(11,1fr);
          gap:2px;
          padding:2px;
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
        @media (max-width:540px) { .lmp-assign-grid { opacity:0.55; left:0; } }
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
          <LogoIcon size={28} />
          <LogoWordmark size="sm" thin />
          <span className="lmp-brand-pill">WORKSPACE</span>
        </div>
        <div className="lmp-top-nav">
          {topNavSlot}
        </div>
      </header>

      {/* Row 2 — day strip */}
      <div className="lmp-day-strip" aria-hidden="true">
        <div className="lmp-day-corner">
          <span className="lmp-corner-year">{yearNum}</span>
          <span className="lmp-corner-month">{monthStr}월</span>
        </div>
        {DAY_LABELS.map((d, i) => {
          const date = weekDays[i]
          const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth()
          return (
            <div key={d} className={`lmp-day-cell${i===5?' sat':i===6?' sun':''}${isToday?' today':''}`}>
              <span className="lmp-day-name">{d}</span>
              <span className="lmp-day-num">{date.getDate()}</span>
            </div>
          )
        })}
      </div>

      {/* Col 1 — time gutter */}
      <aside className="lmp-time-gutter" aria-hidden="true">
        {TIME_TICKS.map((t, i) => (
          <div key={i} className="lmp-tick">{t}</div>
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
