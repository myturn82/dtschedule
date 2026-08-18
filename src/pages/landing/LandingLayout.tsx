// src/pages/landing/LandingLayout.tsx
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface LandingLayoutProps {
  appName: string
  tagline: string
  accentColor: string
  verticalId: string
  children?: ReactNode
}

export function LandingLayout({ appName, tagline, accentColor, verticalId, children }: LandingLayoutProps) {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#fff', fontFamily: 'inherit' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: accentColor }}>{appName}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/auth?tab=login')}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            로그인
          </button>
          <button
            onClick={() => navigate(`/consent?vertical=${verticalId}`)}
            style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            무료로 시작하기
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 24px 60px' }}>
        <div style={{ display: 'inline-block', background: `${accentColor}22`, color: accentColor, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
          {appName}
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-1px', margin: '0 auto 20px', maxWidth: 640 }}>
          {tagline}
        </h1>
        <button
          onClick={() => navigate(`/consent?vertical=${verticalId}`)}
          style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 8px 32px ${accentColor}44` }}
        >
          무료로 시작하기 →
        </button>
      </section>

      {/* 버티컬별 커스텀 섹션 */}
      {children}

      {/* 가격 */}
      <section style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>무료로 시작하세요</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>멤버 10명까지 영구 무료. 언제든 업그레이드.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { name: '무료', price: '₩0', features: ['멤버 10명', '기본 기능 전체', '이메일 지원'] },
            { name: 'Pro', price: '₩29,000/월', features: ['멤버 50명', 'SMS 알림 100건/월', '광고 없음'] },
          ].map(tier => (
            <div key={tier.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px', minWidth: 220, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{tier.name}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{tier.price}</div>
              {tier.features.map(f => (
                <div key={f} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>✓ {f}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ textAlign: 'center', padding: '40px 24px 60px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => navigate(`/consent?vertical=${verticalId}`)}
          style={{ background: accentColor, color: '#fff', border: 0, borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          지금 무료로 시작하기 →
        </button>
      </section>
    </div>
  )
}
