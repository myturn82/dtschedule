import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface DarkModeContextValue {
  isDark: boolean
  toggle: () => void
}

const DarkModeContext = createContext<DarkModeContextValue>({ isDark: false, toggle: () => {} })

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', String(isDark))
  }, [isDark])

  // OS 다크모드 변경 감지 — 사용자가 직접 설정한 경우는 무시
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('darkMode') === null) setIsDark(e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <DarkModeContext.Provider value={{ isDark, toggle: () => setIsDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  return useContext(DarkModeContext)
}
