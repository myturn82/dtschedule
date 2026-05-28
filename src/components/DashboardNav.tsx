import { NavLink } from 'react-router-dom'

export function DashboardNav() {
  return (
    <nav className="flex bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `px-5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            isActive
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`
        }
      >
        대시보드
      </NavLink>
      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          `px-5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
            isActive
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`
        }
      >
        스케줄
      </NavLink>
    </nav>
  )
}
