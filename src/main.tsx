import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // 개발 모드: 이전 프로덕션 빌드 SW/캐시 정리 후 sw.js 재등록 (순서 보장)
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(reg => reg.unregister())))
      .finally(() => navigator.serviceWorker.register('/sw.js').catch(() => {}))
    if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
    }
  } else {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
}
