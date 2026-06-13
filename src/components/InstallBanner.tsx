import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem('pwa-install-dismissed')) return
    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!promptEvent) return null

  const dismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', '1')
    setPromptEvent(null)
  }

  const install = async () => {
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') sessionStorage.setItem('pwa-install-dismissed', '1')
    setPromptEvent(null)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'calc(100vw - 32px)', maxWidth: 380,
      background: '#14171C', borderRadius: 16,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px -8px rgba(20,23,28,0.45)',
      fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif',
      animation: 'ib-slide-up 0.28s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <style>{`
        @keyframes ib-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <img src="/icons/icon-192.png" alt="" width={40} height={40}
        style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF0F4', lineHeight: 1.3 }}>
          앱으로 설치하기
        </div>
        <div style={{ fontSize: 12, color: '#71767F', marginTop: 2 }}>
          홈 화면에 추가하면 더 빠르게 실행돼요
        </div>
      </div>
      <button onClick={install} style={{
        background: 'oklch(0.66 0.16 28)', color: '#fff', border: 0,
        borderRadius: 9, padding: '7px 14px', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      }}>설치</button>
      <button onClick={dismiss} style={{
        background: 'transparent', border: 0, color: '#71767F',
        cursor: 'pointer', padding: 4, lineHeight: 1, flexShrink: 0,
        fontSize: 16,
      }}>✕</button>
    </div>
  )
}
