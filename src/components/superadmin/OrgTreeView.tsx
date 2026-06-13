import { useState } from 'react'
import type { Tenant, TenantRole } from '../../types'
import { avatarColorFor, initialsOf } from '../../lib/avatarColor'
import { displayMode } from '../../lib/tenantMode'
import { supabase } from '../../lib/supabase'

interface TreeMember {
  id: string
  user_id: string
  role_id: string | null
  is_approved: boolean
  profile: { name: string | null; email: string | null } | null
}

interface OrgData {
  roles: TenantRole[]
  members: TreeMember[]
  loading: boolean
}

interface Props {
  tenants: Tenant[]
  memberCounts: Record<string, number>
  pendingCounts: Record<string, number>
  selectedOrgId: string | null
  onSelect: (id: string) => void
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 12 12" width="10" height="10"
    fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
  >
    <path d="M4 2l4 4-4 4" />
  </svg>
)

const RoleIcon = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13s1-2 6-2 6 2 6 2" />
    <circle cx="8" cy="6" r="3" />
  </svg>
)

const MemberIcon = () => (
  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="5" r="2.5" />
    <path d="M1.5 12.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" />
  </svg>
)

export function OrgTreeView({ tenants, memberCounts, pendingCounts, selectedOrgId, onSelect }: Props) {
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
  const [orgData, setOrgData] = useState<Record<string, OrgData>>({})

  async function fetchOrgData(tenantId: string) {
    setOrgData(prev => ({ ...prev, [tenantId]: { roles: [], members: [], loading: true } }))
    const [{ data: roles }, { data: members }] = await Promise.all([
      supabase.from('tenant_roles').select('*').eq('tenant_id', tenantId).order('display_order'),
      supabase
        .from('tenant_members')
        .select('id, user_id, role_id, is_approved, profile:profiles(name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at'),
    ])
    setOrgData(prev => ({
      ...prev,
      [tenantId]: {
        roles: (roles ?? []) as TenantRole[],
        members: (members ?? []) as unknown as TreeMember[],
        loading: false,
      },
    }))
  }

  function handleOrgToggle(e: React.MouseEvent, tenantId: string) {
    e.stopPropagation()
    const willExpand = !expandedOrgs.has(tenantId)
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      if (next.has(tenantId)) next.delete(tenantId)
      else next.add(tenantId)
      return next
    })
    if (willExpand && !orgData[tenantId]) fetchOrgData(tenantId)
  }

  function handleRoleToggle(roleKey: string) {
    setExpandedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleKey)) next.delete(roleKey)
      else next.add(roleKey)
      return next
    })
  }

  if (tenants.length === 0) {
    return <p className="text-center text-sm text-[var(--color-text-muted)] py-12">조직이 없습니다.</p>
  }

  return (
    <div className="hub-tree">
      {tenants.map(t => {
        const { bg, fg } = avatarColorFor(t.name, t.settings?.theme_color)
        const pending = pendingCounts[t.id] ?? 0
        const isExpanded = expandedOrgs.has(t.id)
        const data = orgData[t.id]

        // Group members by role_id
        const byRole: Record<string, TreeMember[]> = {}
        if (data && !data.loading) {
          for (const m of data.members) {
            const key = m.role_id ?? '__none__'
            if (!byRole[key]) byRole[key] = []
            byRole[key].push(m)
          }
        }

        const roleGroups = data && !data.loading
          ? [
              ...data.roles.map(r => ({ id: r.id, name: r.name, members: byRole[r.id] ?? [] })),
              ...((byRole['__none__']?.length || data.roles.length === 0)
                ? [{ id: '__none__', name: '역할 없음', members: byRole['__none__'] ?? [] }]
                : []),
            ]
          : []

        return (
          <div key={t.id} className="hub-tree-org">
            {/* Org row */}
            <div
              onClick={() => onSelect(t.id)}
              className={`hub-node ${selectedOrgId === t.id ? 'is-selected' : ''} ${t.is_active === false ? 'is-inactive' : ''}`}
            >
              <button
                className="hub-tree-toggle"
                onClick={e => handleOrgToggle(e, t.id)}
                title={isExpanded ? '접기' : '펼치기'}
              >
                <ChevronIcon expanded={isExpanded} />
              </button>
              <span className="hub-avatar" style={{ background: bg, color: fg }}>{initialsOf(t.name)}</span>
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-[var(--color-text-primary)] truncate">{t.name}</span>
                  <span className="text-[11.5px] font-mono text-[var(--color-text-muted)]">{t.slug}</span>
                  {t.is_active === false && <span className="hub-badge hub-badge-danger">비활성</span>}
                  {pending > 0 && <span className="hub-badge hub-badge-pending">승인대기 {pending}</span>}
                </span>
                {t.business_type && (
                  <span className="block text-[11.5px] text-[var(--color-text-muted)] mt-0.5">{t.business_type}</span>
                )}
              </span>
              <span className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="hub-mode-pill">{displayMode(t.settings?.tenant_mode)}</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">멤버 {memberCounts[t.id] ?? 0}명</span>
              </span>
            </div>

            {/* Sub-tree */}
            {isExpanded && (
              <div className="hub-tree-children">
                {!data || data.loading ? (
                  <div className="hub-tree-status">불러오는 중…</div>
                ) : roleGroups.length === 0 ? (
                  <div className="hub-tree-status">멤버 없음</div>
                ) : (
                  roleGroups.map(group => {
                    const roleKey = `${t.id}-${group.id}`
                    const isRoleExpanded = expandedRoles.has(roleKey)
                    const approved = group.members.filter(m => m.is_approved)
                    const pendingM = group.members.filter(m => !m.is_approved)

                    return (
                      <div key={group.id} className="hub-tree-role-group">
                        {/* Role row */}
                        <button
                          className="hub-tree-role-row"
                          onClick={() => handleRoleToggle(roleKey)}
                        >
                          <span className="hub-tree-chevron-sm">
                            <ChevronIcon expanded={isRoleExpanded} />
                          </span>
                          <span className="text-[var(--color-text-muted)]"><RoleIcon /></span>
                          <span className="hub-tree-role-name">{group.name}</span>
                          <span className="hub-tree-role-count">{approved.length}명</span>
                          {pendingM.length > 0 && (
                            <span className="hub-badge hub-badge-pending" style={{ fontSize: '10px', padding: '1px 5px' }}>
                              대기 {pendingM.length}
                            </span>
                          )}
                        </button>

                        {/* Member rows */}
                        {isRoleExpanded && (
                          <div className="hub-tree-members">
                            {group.members.length === 0 ? (
                              <div className="hub-tree-status">멤버 없음</div>
                            ) : (
                              group.members.map(m => (
                                <div key={m.id} className={`hub-tree-member-row${!m.is_approved ? ' is-pending' : ''}`}>
                                  <span className="text-[var(--color-text-muted)] flex-shrink-0"><MemberIcon /></span>
                                  <span className="hub-tree-member-name">{m.profile?.name ?? '(이름 없음)'}</span>
                                  <span className="hub-tree-member-email">{m.profile?.email ?? ''}</span>
                                  {!m.is_approved && (
                                    <span className="hub-badge hub-badge-pending" style={{ fontSize: '10px', padding: '1px 5px' }}>대기</span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
