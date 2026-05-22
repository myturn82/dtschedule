import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../contexts/TenantContext'
import { useAuth } from '../hooks/useAuth'
import type { Tenant } from '../types'

const TILE_GRADIENTS = [
  'linear-gradient(135deg, oklch(0.72 0.14 28), oklch(0.58 0.16 18))',
  'linear-gradient(135deg, oklch(0.70 0.13 265), oklch(0.50 0.16 260))',
  'linear-gradient(135deg, oklch(0.72 0.11 160), oklch(0.52 0.10 175))',
  'linear-gradient(135deg, oklch(0.78 0.13 75), oklch(0.62 0.13 50))',
]

const GRAIN_URL = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return '좋은 아침이에요'
  if (h < 18) return '좋은 오후예요'
  if (h < 22) return '좋은 저녁이에요'
  return '안녕하세요'
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 4 6 6-6 6" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3" />
      <path d="M9 7 6 10l3 3M6 10h7" />
    </svg>
  )
}

interface OrgCardProps {
  name: string
  role: string
  colorIdx: number
  featured?: boolean
  chipLabel?: string
  onClick: () => void
}

function OrgCard({ name, role, colorIdx, featured, chipLabel, onClick }: OrgCardProps) {
  const [hovered, setHovered] = useState(false)
  const initial = name.charAt(0)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        background: featured
          ? 'linear-gradient(180deg, #fff 0%, #fff 60%, oklch(0.97 0.02 28) 100%)'
          : '#fff',
        border: `1px solid ${hovered ? 'rgba(20,23,28,0.18)' : 'rgba(20,23,28,0.09)'}`,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        font: 'inherit',
        color: 'inherit',
        boxShadow: hovered
          ? '0 1px 0 rgba(20,23,28,0.04), 0 12px 28px -12px rgba(20,23,28,0.14)'
          : '0 1px 0 rgba(20,23,28,0.04), 0 1px 2px rgba(20,23,28,0.03)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Featured gradient border */}
      {featured && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 20,
          padding: 1,
          background: 'linear-gradient(180deg, oklch(0.85 0.10 28 / 0.6), transparent)',
          WebkitMask: 'linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)',
          WebkitMaskComposite: 'xor',
          pointerEvents: 'none',
        }} />
      )}

      {/* Avatar tile */}
      <div style={{
        width: 56, height: 56, borderRadius: 14, flexShrink: 0,
        background: TILE_GRADIENTS[colorIdx % TILE_GRADIENTS.length],
        display: 'grid', placeItems: 'center',
        fontSize: 22, fontWeight: 700, color: '#fff',
        letterSpacing: -0.6, position: 'relative', overflow: 'hidden',
      }}>
        {initial}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.35), transparent 50%)',
        }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.4, color: '#14171C', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          {chipLabel && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 999,
              fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
              background: role === '관리자' ? 'oklch(0.94 0.04 240)' : 'oklch(0.94 0.04 160)',
              color: role === '관리자' ? 'oklch(0.38 0.12 240)' : 'oklch(0.36 0.10 160)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
              {chipLabel}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: '#6B7280', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#353A44', whiteSpace: 'nowrap' }}>{role}</span>
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        flexShrink: 0,
        width: 28, height: 28, borderRadius: 8,
        display: 'grid', placeItems: 'center',
        background: hovered ? '#14171C' : 'transparent',
        color: hovered ? '#fff' : '#8A8F99',
        transform: hovered ? 'translateX(2px)' : 'none',
        transition: 'transform 0.15s, background 0.15s, color 0.15s',
      }}>
        <ChevronRight />
      </div>
    </button>
  )
}

export function TenantSelectPage() {
  const { memberships, setTenant } = useTenant()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [allTenants, setAllTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile?.is_super_admin) return
    setLoading(true)
    supabase.from('tenants').select('*').order('name').then(({ data }) => {
      setAllTenants(data ?? [])
      setLoading(false)
    })
  }, [profile?.is_super_admin])

  const greeting = getGreeting()
  const displayName = profile?.name ?? ''
  const displayEmail = profile?.email ?? ''

  const pageContent = (items: { id: string; name: string; role: string; onClick: () => void }[]) => (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      overflow: 'hidden',
      background: '#F4F1EA',
      fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.55, background: 'oklch(0.88 0.10 28)', top: -120, left: -80, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.55, background: 'oklch(0.90 0.06 80)', top: '30%', right: -120, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', filter: 'blur(80px)', opacity: 0.55, background: 'oklch(0.92 0.05 160)', bottom: -120, left: '30%', zIndex: 0, pointerEvents: 'none' }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(20,23,28,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse at 50% 30%, black 0%, transparent 70%)',
      }} />

      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        opacity: 0.5, mixBlendMode: 'multiply',
        backgroundImage: GRAIN_URL,
      }} />

      {/* Top bar */}
      <header style={{ position: 'relative', zIndex: 5, padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: '#14171C', color: '#fff',
            display: 'grid', placeItems: 'center',
            fontSize: 13, fontWeight: 700, letterSpacing: -0.2,
          }}>볼</div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, whiteSpace: 'nowrap' }}>스케줄러</span>
          <span style={{
            marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: '#14171C', color: '#fff',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.8, whiteSpace: 'nowrap',
          }}>workspace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {profile?.is_super_admin && (
            <button
              onClick={() => navigate('/superadmin')}
              style={{
                fontSize: 13, color: '#6B7280', textDecoration: 'none',
                padding: '8px 12px', borderRadius: 9, border: 'none',
                background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', font: 'inherit',
              }}
            >
              슈퍼어드민 →
            </button>
          )}
          <button
            onClick={signOut}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, padding: '8px 14px',
              background: '#fff', color: '#353A44',
              border: '1px solid rgba(20,23,28,0.09)', borderRadius: 9,
              cursor: 'pointer', font: 'inherit', whiteSpace: 'nowrap',
              transition: 'background 0.12s',
            }}
          >
            <LogoutIcon />
            로그아웃
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 4, maxWidth: 560, margin: '32px auto 80px', padding: '0 24px' }}>
        {/* Greeting pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 12px 6px 8px',
          background: '#fff', border: '1px solid rgba(20,23,28,0.09)',
          borderRadius: 999, fontSize: 12, color: '#353A44', fontWeight: 500,
          marginBottom: 18,
          boxShadow: '0 1px 0 rgba(20,23,28,0.04), 0 8px 24px -12px rgba(20,23,28,0.10)',
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg, oklch(0.88 0.08 70), oklch(0.78 0.12 35))',
            display: 'grid', placeItems: 'center', fontSize: 12,
          }}>👋</span>
          <span><strong style={{ fontWeight: 600, color: '#14171C' }}>{displayName}</strong>님, {greeting}</span>
        </div>

        {/* Title */}
        <h1 style={{ margin: '0 0 10px', fontSize: 38, lineHeight: 1.1, letterSpacing: -1.4, fontWeight: 700, color: '#14171C' }}>
          오늘은 어디로<br />가볼까요<span style={{ color: 'oklch(0.66 0.16 28)' }}>?</span>
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 15, lineHeight: 1.55, color: '#6B7280', maxWidth: 440 }}>
          내가 속한 조직을 선택해서 들어가세요. 역할에 따라 다른 화면이 열려요.
        </p>

        {/* Section label */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase',
            color: '#8A8F99', fontFamily: '"JetBrains Mono", monospace',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            내 조직
          </span>
          <span style={{ fontSize: 11, color: '#8A8F99', fontFamily: '"JetBrains Mono", monospace', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>
            {items.length}개
          </span>
        </div>

        {/* Org list */}
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8A8F99', fontSize: 14 }}>
            로딩 중...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#8A8F99', fontSize: 14 }}>
            소속된 조직이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <OrgCard
                key={item.id}
                name={item.name}
                role={item.role}
                colorIdx={idx}
                featured={idx === 0}
                chipLabel={item.role}
                onClick={item.onClick}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 28, paddingTop: 16,
          borderTop: '1px solid rgba(20,23,28,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, color: '#8A8F99', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{displayName}</span>
            <span>·</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{displayEmail}</span>
          </div>
        </div>
      </main>
    </div>
  )

  // Super admin: all tenants
  if (profile?.is_super_admin) {
    const items = allTenants.map(t => ({
      id: t.id,
      name: t.name,
      role: '슈퍼어드민',
      onClick: () => { setTenant(t, 'admin'); navigate('/') },
    }))
    return pageContent(items)
  }

  // Regular user: own memberships
  const items = memberships.map(m => ({
    id: m.id,
    name: m.tenant.name,
    role: m.role === 'admin' ? '관리자' : '멤버',
    onClick: () => { setTenant(m.tenant, m.role); navigate('/') },
  }))
  return pageContent(items)
}
