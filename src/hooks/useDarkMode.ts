import { useEffect } from 'react'

export function useDarkMode() {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('darkMode')
  }, [])

  return { isDark: false, toggle: () => {} }
}
