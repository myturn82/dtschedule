import { App } from '@capacitor/app'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export function useAndroidBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let handle: Awaited<ReturnType<typeof App.addListener>> | null = null
    App.addListener('backButton', () => {
      if (location.pathname === '/') {
        App.exitApp()
      } else {
        navigate(-1)
      }
    }).then(h => { handle = h })
    return () => { handle?.remove() }
  }, [location.pathname])
}
