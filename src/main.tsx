import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // 개발 모드: 서비스워커와 캐시를 모두 해제 (HMR 중 오프라인 페이지 노출 방지)
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(reg => reg.unregister())))
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
    }
  } else {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
}
