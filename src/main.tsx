import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 개발 모드에서는 이전 프로덕션 빌드(PWA)가 등록해 둔 서비스워커/캐시가
// localhost에 남아 dev 서버와 충돌(끝없는 리로드)을 일으킬 수 있으므로 정리한다.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister())
  })
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)))
  }
}

createRoot(document.getElementById('root')!).render(<App />)
