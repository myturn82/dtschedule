import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTenant } from '../contexts/TenantContext'
import { useAuth } from '../hooks/useAuth'
import type { Tenant } from '../types'

export function TenantSelectPage() {
  const { memberships, setTenant } = useTenant()
  const { profile } = useAuth()
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

  if (profile?.is_super_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">조직 선택</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">관리할 조직을 선택해 주세요.</p>
            </div>
            <button
              onClick={() => navigate('/superadmin')}
              className="text-sm text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] font-medium whitespace-nowrap"
            >
              슈퍼어드민 관리 →
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">로딩 중...</p>
          ) : allTenants.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
              등록된 조직이 없습니다. 슈퍼어드민 관리에서 조직을 생성해 주세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {allTenants.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => { setTenant(t, 'admin'); navigate('/') }}
                    className="w-full text-left px-5 py-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 shadow-sm"
                  >
                    <div className="font-semibold text-[var(--color-text)]">{t.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {t.business_type ?? '단체'} · {t.slug}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2 text-center">조직 선택</h1>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">
          소속된 조직을 선택해 주세요.
        </p>
        <ul className="space-y-3">
          {memberships.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => { setTenant(m.tenant, m.role); navigate('/') }}
                className="w-full text-left px-5 py-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-all duration-150 shadow-sm"
              >
                <div className="font-semibold text-[var(--color-text)]">{m.tenant.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {m.role === 'admin' ? '관리자' : '멤버'} · {m.tenant.business_type ?? '단체'}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
