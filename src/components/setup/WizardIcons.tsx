import type { CSSProperties, ReactNode } from 'react'

interface IconProps {
  size?: number
  sw?: number
  className?: string
  style?: CSSProperties
}

function mk(path: ReactNode, viewBox = '0 0 24 24') {
  return function IconCmp({ size = 16, sw = 1.7, className, style }: IconProps) {
    return (
      <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={sw}
        strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        {path}
      </svg>
    )
  }
}

export const WizardIcon = {
  building: mk(<><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M15 9h2a2 2 0 0 1 2 2v10" /><path d="M3 21h18M8 7h2M8 11h2M8 15h2" /></>),
  layers: mk(<><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>),
  clock: mk(<><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3.5 2" /></>),
  users: mk(<><circle cx={9} cy={8} r={3.2} /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6M21 19a5 5 0 0 0-4-4.9" /></>),
  calendar: mk(<><rect x={3} y={4.5} width={18} height={16.5} rx={2.5} /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><path d="M7 13h2v2H7zM11 13h2v2h-2zM15 13h2v2h-2z" fill="currentColor" stroke="none" /></>),
  palette: mk(<><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.5-.3-.9-.5-1.3-.2-.3-.4-.7-.4-1.2 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7.2-9-7.2Z" /><circle cx={7.5} cy={12} r={1.2} fill="currentColor" stroke="none" /><circle cx={10} cy={8} r={1.2} fill="currentColor" stroke="none" /><circle cx={14.5} cy={8} r={1.2} fill="currentColor" stroke="none" /></>),
  list: mk(<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx={3.5} cy={6} r={1} fill="currentColor" stroke="none" /><circle cx={3.5} cy={12} r={1} fill="currentColor" stroke="none" /><circle cx={3.5} cy={18} r={1} fill="currentColor" stroke="none" /></>),
  sparkles: mk(<><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>),
  party: mk(<><path d="M3 21l5.5-13 7.5 7.5L3 21Z" /><path d="M14 8a3 3 0 0 0 3-3M17 13a2 2 0 0 1 2-2M11 4.5C12 3 14 3 15 4M19.5 7c1 .5 1.5 2 1 3" /></>),
  lock: mk(<><rect x={4.5} y={10} width={15} height={10} rx={2.2} /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  walk: mk(<><circle cx={13} cy={4.5} r={1.8} /><path d="M13 8l-2 4 2 2v6M11 12l-3-1M13 14l3 2-1 4" /></>),
  user: mk(<><circle cx={12} cy={8} r={3.6} /><path d="M5 20a7 7 0 0 1 14 0" /></>),
  arrowRight: mk(<path d="M5 12h14M13 6l6 6-6 6" />),
  arrowLeft: mk(<path d="M19 12H5M11 6l-6 6 6 6" />),
  link: mk(<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></>),
  bulb: mk(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.5.9.5 1.1v.5h6v-.5c0-.2 0-.7.5-1.1A6 6 0 0 0 12 3Z" /></>),
  warn: mk(<><path d="M10.3 3.8 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>),
  check2: mk(<path d="M20 6 9 17l-5-5" />),
  chevron: mk(<path d="m6 9 6 6 6-6" />),
  x: mk(<path d="M18 6 6 18M6 6l12 12" />),
  plus: mk(<path d="M12 5v14M5 12h14" />),
  check: mk(<path d="M20 6 9 17l-5-5" />),
  star: mk(<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />),
  grip: mk(<><circle cx={9} cy={6} r={1.4} fill="currentColor" stroke="none" /><circle cx={9} cy={12} r={1.4} fill="currentColor" stroke="none" /><circle cx={9} cy={18} r={1.4} fill="currentColor" stroke="none" /><circle cx={15} cy={6} r={1.4} fill="currentColor" stroke="none" /><circle cx={15} cy={12} r={1.4} fill="currentColor" stroke="none" /><circle cx={15} cy={18} r={1.4} fill="currentColor" stroke="none" /></>),
  pencil: mk(<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></>),
  trash: mk(<><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>),
  up: mk(<path d="M12 19V5M5 12l7-7 7 7" />),
  down: mk(<path d="M12 5v14M19 12l-7 7-7-7" />),
  hash: mk(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />),
  text: mk(<path d="M4 7V5h16v2M9 19h6M12 5v14" />),
  dot: mk(<circle cx={12} cy={12} r={9} />),
  square: mk(<rect x={4} y={4} width={16} height={16} rx={3} />),
  phone: mk(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-1Z" />),
  chart: mk(<><path d="M3 3v18h18" /><rect x={7} y={12} width={3} height={5} rx={0.6} /><rect x={12} y={8} width={3} height={9} rx={0.6} /><rect x={17} y={5} width={3} height={12} rx={0.6} /></>),
  image: mk(<><rect x={3} y={3} width={18} height={18} rx={2.5} /><circle cx={8.5} cy={8.5} r={1.5} /><path d="m21 15-5-5L5 21" /></>),
}

export type WizardIconKey = keyof typeof WizardIcon
