import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TERMS } from '../lib/legalTerms'
import { DevFileLabel } from '../components/DevFileLabel'
import { BRAND } from '../lib/brandConfig'

type Tab = 'privacy' | 'tos'

export function PrivacyPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('privacy')

  const content = TERMS[tab]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#e2e8f0', fontFamily: 'inherit' }}>
      {/* 헤더 */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky', top: 0, background: '#0a0b10', zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontSize: 20,
            display: 'flex', alignItems: 'center',
          }}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>법적 고지</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{BRAND.name}</span>
      </header>

      {/* 탭 */}
      <div style={{
        display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#0d0e15',
      }}>
        {([['privacy', '개인정보처리방침'], ['tos', '서비스 이용약관']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '14px 8px', fontSize: 13, fontWeight: tab === key ? 700 : 400,
              color: tab === key ? '#fff' : 'rgba(255,255,255,0.4)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === key ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'color 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#fff' }}>
          {content.title}
        </h1>
        <div style={{
          fontSize: 13.5, lineHeight: 1.85, color: 'rgba(255,255,255,0.65)',
          whiteSpace: 'pre-wrap', wordBreak: 'keep-all',
        }}>
          {content.body}
        </div>
      </main>

      {/* 푸터 */}
      <footer style={{
        textAlign: 'center', padding: '20px', fontSize: 12,
        color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </footer>

      <DevFileLabel file="PrivacyPage.tsx" />
    </div>
  )
}
