import { useState, useEffect } from 'react'
import { DevFileLabel } from '../DevFileLabel'
import type { Assignment, CellState, ModalTarget, Profile, TenantRole, MemberType, CustomFieldDef, TenantMode } from '../../types'
import { getOptionUnit } from '../../types'
import { parseSlotLabel, getTimeSubOptions, formatTimeSub } from '../../utils/timeSlots'
import { useProfiles } from '../../hooks/useProfiles'
import type { ProfileWithRole } from '../../hooks/useProfiles'
import { LockIcon, UnlockIcon } from '../icons/LockIcons'
import { fmtPhone, fmtNumber } from '../../lib/format'
import { formatPhone, isValidPhone } from '../../lib/phone'
import { ImageUploadField } from '../schedule/ImageUploadField'
import type { PendingImage } from '../schedule/ImageUploadField'
import { ImageGalleryModal } from '../schedule/ImageGalleryModal'
import { uploadScheduleImage } from '../../lib/uploadScheduleImage'

interface Props {
  target: ModalTarget
  cellState: CellState
  profile: Profile | null
  tenantRole?: 'admin' | 'member' | null
  memberRoleId?: string | null
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  tenantRoles?: TenantRole[]
  tenantMode?: TenantMode | '회원선택'
  customFields?: CustomFieldDef[]
  slotLabels?: Record<string, string>
  typeLabels?: { member: string; '50plus': string }
  tenantId?: string
  lockedUserId?: string
  onClose: () => void
  onAdd: (name: string, note: string, memberType: MemberType, timeSub: string | null, color?: string, userId?: string, roleId?: string | null, customerName?: string | null, customerPhone?: string | null, extraData?: Record<string, string>) => Promise<string | null>
  onUpdate: (id: string, name: string, note: string, memberType: MemberType, timeSub: string | null, color?: string, roleId?: string | null, customerName?: string | null, customerPhone?: string | null, extraData?: Record<string, string>) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
  onToggleLock?: (id: string, locked: boolean) => Promise<string | null>
  isHighlighted?: boolean
  onToggleHighlight?: () => void
}

export function SlotEditModal({
  target, cellState, profile, tenantRole, memberRoleId,
  splitRoles = [], isSplitMode = false, tenantRoles = [],
  tenantMode = '회원선택', customFields = [],
  slotLabels = {},
  typeLabels = { member: '팀원', '50plus': '' },
  tenantId,
  lockedUserId,
  onClose, onAdd, onUpdate, onDelete, onToggleLock, isHighlighted, onToggleHighlight,
}: Props) {
  const { year, day, month, timeSlot, memberType: defaultType, roleId: initialRoleId } = target
  const isAdmin = profile?.is_super_admin || tenantRole === 'admin'
  const isSuperAdmin = !!profile?.is_super_admin
  const isReadOnly = !isAdmin && (tenantMode === '회원개별' || tenantMode === '비회원')
  const profileType: MemberType = 'member'

  const isFreeform = tenantMode === '비회원'
  const useDynamicFields = isFreeform && customFields.length > 0
  // 회원공유/회원개별 모드에서도 관리자콘솔에 등록된 커스텀 필드를 추가 입력으로 노출
  const showExtraCustomFields = !isFreeform && customFields.length > 0

  const [memberType, setMemberType] = useState<MemberType>(
    isAdmin ? defaultType : profileType
  )
  const timeSubOptions = getTimeSubOptions(timeSlot)
  const defaultTimeSub = timeSubOptions ? timeSubOptions[timeSubOptions.length - 1].value : null
  const [timeSub, setTimeSub] = useState<string | null>(defaultTimeSub)
  const [selectedUserId, setSelectedUserId] = useState<string>(
    isAdmin ? (lockedUserId ?? '') : (profile?.id ?? '')
  )
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    initialRoleId ?? (!isAdmin && memberRoleId ? memberRoleId : (splitRoles[0]?.id ?? null))
  )

  // 동적 필드 값 (useDynamicFields 모드)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [pendingImages, setPendingImages] = useState<Record<string, PendingImage[]>>({})
  const [galleryUrls, setGalleryUrls] = useState<string[] | null>(null)

  const selectedRole = splitRoles.find(r => r.id === selectedRoleId) ?? null

  const { profiles } = useProfiles()

  const lockedProfile = lockedUserId ? profiles.find(p => p.id === lockedUserId) ?? null : null
  const selectedProfile = isAdmin
    ? (lockedProfile ?? profiles.find(p => p.id === selectedUserId) ?? null)
    : profile

  const effectiveMemberType: MemberType = isAdmin
    ? 'member'
    : memberType

  const displayedAssignments = isSplitMode
    ? cellState.assignments.filter(a => a.role_id === selectedRoleId)
    : isAdmin
    ? cellState.assignments.filter(a => a.member_type === defaultType)
    : cellState.assignments.filter(a => !a.member_type || a.member_type === memberType)

  // DB 제약: (year, month, day, time_slot, member_name) 고유 → 역할 무관하게 같은 슬롯 중복 배정 불가
  const assignedNames = new Set(
    cellState.assignments.filter(a => a.id !== editingId).map(a => a.member_name)
  )

  const selectableProfiles = isAdmin && (isSplitMode || !isFreeform)
    ? isSplitMode
      ? (profiles as ProfileWithRole[]).filter(p =>
            p.tenantRoleId === selectedRoleId && !assignedNames.has(p.name)
          )
      : profiles.filter(p => !assignedNames.has(p.name))
    : []

  const totalTypeProfiles = (!isFreeform && isAdmin)
    ? isSplitMode
      ? (profiles as ProfileWithRole[]).filter(p => p.tenantRoleId === selectedRoleId)
      : profiles
    : []

  // 선택 가능한 항목이 1개뿐이면 자동 선택
  const singleProfileId = !isFreeform && selectableProfiles.length === 1 ? selectableProfiles[0].id : null
  useEffect(() => {
    if (isAdmin && !editingId && singleProfileId) {
      setSelectedUserId(singleProfileId)
    }
  }, [isAdmin, editingId, singleProfileId])


  async function resolveImageUploads(baseValues: Record<string, string>): Promise<Record<string, string>> {
    if (!tenantId) return baseValues
    const resolved = { ...baseValues }
    await Promise.all(
      customFields
        .filter(f => f.type === 'image_upload')
        .map(async f => {
          const pending = pendingImages[f.id] ?? []
          if (pending.length === 0) return
          const existing: string[] = (() => {
            try { return resolved[f.id] ? (JSON.parse(resolved[f.id]) as string[]) : [] } catch { return [] }
          })()
          const newUrls = await Promise.all(pending.map(img => uploadScheduleImage(tenantId, img.blob)))
          resolved[f.id] = JSON.stringify([...existing, ...newUrls])
        })
    )
    return resolved
  }

  function startEdit(a: Assignment) {
    setEditingId(a.id)
    setNote(a.note ?? '')
    setTimeSub(a.time_sub ?? null)
    if (isSplitMode) setSelectedRoleId(a.role_id ?? null)
    if (useDynamicFields) {
      const nameFieldId = customFields[0]?.id
      const restored: Record<string, string> = {}
      if (nameFieldId) restored[nameFieldId] = a.member_name
      Object.assign(restored, a.extra_data ?? {})
      setFieldValues(restored)
      if (isAdmin && isSplitMode) setSelectedUserId(a.user_id ?? '')
    } else {
      setSelectedUserId(a.user_id ?? '')
      setMemberType(a.member_type ?? 'member')
    }
    if (showExtraCustomFields) {
      setFieldValues({ ...(a.extra_data ?? {}) })
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setNote('')
    setTimeSub(defaultTimeSub)
    setFieldValues({})
    Object.values(pendingImages).flat().forEach(img => URL.revokeObjectURL(img.previewUrl))
    setPendingImages({})
    setSelectedUserId(isAdmin ? '' : (profile?.id ?? ''))
  }

  async function handleAdd() {
    setError(null)
    let name: string
    let userId: string | undefined
    const customerPhone: string | null = null

    if (useDynamicFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
      const nameFieldId = customFields[0].id
      name = fieldValues[nameFieldId]?.trim() ?? ''
      if (!name) return
      if (isAdmin && isSplitMode && selectedUserId) userId = selectedUserId
    } else {
      if (!selectedProfile) return
      name = selectedProfile.name
      userId = isAdmin ? selectedProfile.id : undefined
    }

    if (showExtraCustomFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
    }

    if (cellState.isFull) {
      if (!isAdmin && !isFreeform) { setError('정원이 마감되었습니다'); return }
      if (!window.confirm(`정원(${cellState.maxCapacity}명)이 초과됩니다. 계속 추가하시겠습니까?`)) return
    }

    setLoading(true)

    let resolvedValues = fieldValues
    if (customFields.some(f => f.type === 'image_upload')) {
      try {
        resolvedValues = await resolveImageUploads(fieldValues)
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 업로드 실패')
        setLoading(false)
        return
      }
    }

    let extraData: Record<string, string> | undefined
    if (useDynamicFields) {
      const rest: Record<string, string> = {}
      customFields.slice(1).forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    } else if (showExtraCustomFields) {
      const rest: Record<string, string> = {}
      customFields.forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    }

    const err = await onAdd(
      name,
      note.trim(),
      isFreeform ? 'member' : effectiveMemberType,
      timeSub,
      undefined,
      userId,
      isSplitMode ? selectedRoleId : undefined,
      null,
      customerPhone,
      extraData,
    )
    setLoading(false)
    if (err) { setError(err); return }
    Object.values(pendingImages).flat().forEach(img => URL.revokeObjectURL(img.previewUrl))
    setPendingImages({})
    onClose()
  }

  async function handleUpdate() {
    if (!editingId) return
    setError(null)

    let name: string
    const customerPhone: string | null = null

    if (useDynamicFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
      const nameFieldId = customFields[0].id
      name = fieldValues[nameFieldId]?.trim() ?? ''
      if (!name) return
    } else {
      if (!selectedProfile) return
      name = selectedProfile.name
    }

    if (showExtraCustomFields) {
      for (const field of customFields) {
        if (field.required && !isFieldFilled(field)) { setError(`"${field.label}"은(는) 필수 항목입니다`); return }
        if (field.type === 'number') {
          const num = Number(fieldValues[field.id])
          if (fieldValues[field.id]?.trim() && field.min !== undefined && num < field.min) { setError(`"${field.label}"은(는) ${field.min} 이상이어야 합니다`); return }
          if (fieldValues[field.id]?.trim() && field.max !== undefined && num > field.max) { setError(`"${field.label}"은(는) ${field.max} 이하이어야 합니다`); return }
        }
        if (field.type === 'phone' && fieldValues[field.id]?.trim()) {
          if (!isValidPhone(fieldValues[field.id])) { setError(`"${field.label}"의 전화번호 형식이 올바르지 않습니다 (예: 010-1234-5678)`); return }
        }
        if (field.type === 'account_number' && fieldValues[field.id]?.trim()) {
          if (fieldValues[field.id].replace(/\D/g, '').length < 8) { setError(`"${field.label}"의 계좌번호는 숫자 8자리 이상이어야 합니다`); return }
        }
      }
    }

    setLoading(true)

    let resolvedValues = fieldValues
    if (customFields.some(f => f.type === 'image_upload')) {
      try {
        resolvedValues = await resolveImageUploads(fieldValues)
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 업로드 실패')
        setLoading(false)
        return
      }
    }

    let extraData: Record<string, string> | undefined
    if (useDynamicFields) {
      const rest: Record<string, string> = {}
      customFields.slice(1).forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    } else if (showExtraCustomFields) {
      const rest: Record<string, string> = {}
      customFields.forEach(f => {
        const v = resolvedValues[f.id]
        if (v !== undefined && v !== '') rest[f.id] = v.trim ? v.trim() : v
      })
      if (Object.keys(rest).length > 0) extraData = rest
    }

    const err = await onUpdate(
      editingId,
      name,
      note.trim(),
      isFreeform ? 'member' : effectiveMemberType,
      timeSub,
      undefined,
      isSplitMode ? selectedRoleId : undefined,
      null,
      customerPhone,
      extraData,
    )
    setLoading(false)
    if (err) { setError(err); return }
    Object.values(pendingImages).flat().forEach(img => URL.revokeObjectURL(img.previewUrl))
    setPendingImages({})
    cancelEdit()
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const err = await onDelete(id)
    setLoading(false)
    if (err) setError(err)
  }

  async function handleToggleLock(id: string, locked: boolean) {
    if (!onToggleLock) return
    setLoading(true)
    const err = await onToggleLock(id, locked)
    setLoading(false)
    if (err) setError(err)
  }

  const ownLockedAssignment = !isAdmin && displayedAssignments.some(
    a => a.user_id === profile?.id && a.is_locked
  )

  // 이미 본인 배정이 있으면 새로 등록 대신 수정 모드로 진입하도록 안내
  // - 동적 필드 없는 경우: member_name 일치로 본인 배정 탐지
  // - 비회원(useDynamicFields) 모드: user_id로 본인 배정 탐지
  const ownAssignment = !isAdmin
    ? useDynamicFields
      ? displayedAssignments.find(a => !!profile?.id && a.user_id === profile.id && !a.is_locked)
      : displayedAssignments.find(a => a.member_name === profile?.name && !a.is_locked)
    : undefined

  // 날짜 전체가 잠긴 경우(date_overrides.is_locked) 신규 등록은 누구도 불가 (기존 항목 수정은 가능)
  const blockNewRegistration = !editingId && cellState.isLocked

  const isAddDisabled = loading || (() => {
    if (useDynamicFields) {
      return customFields.some(f => f.required && !isFieldFilled(f))
    }
    if (showExtraCustomFields && customFields.some(f => f.required && !isFieldFilled(f))) {
      return true
    }
    return !selectedUserId
  })()

  const inputClass = 'w-full min-w-0 h-11 border border-[var(--color-border-strong)] rounded-xl px-3 text-sm font-medium bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 focus:border-[var(--color-brand-primary)]/50 focus:bg-[var(--color-surface)] transition-all duration-200'

  function isFieldFilled(field: CustomFieldDef): boolean {
    if (field.type === 'image_upload') {
      const hasExisting = (() => {
        try { return field.id in fieldValues && (JSON.parse(fieldValues[field.id]) as string[]).length > 0 } catch { return false }
      })()
      return hasExisting || (pendingImages[field.id]?.length ?? 0) > 0
    }
    const val = fieldValues[field.id] ?? ''
    if (field.type === 'checkbox') return val === 'true'
    return val.trim() !== ''
  }

  function renderFieldInput(field: CustomFieldDef) {
    if (field.type === 'image_upload') {
      const existingUrls: string[] = (() => {
        try { return fieldValues[field.id] ? (JSON.parse(fieldValues[field.id]) as string[]) : [] } catch { return [] }
      })()
      return (
        <ImageUploadField
          key={field.id}
          fieldDef={field}
          existingUrls={existingUrls}
          onExistingChange={urls => setFieldValues(prev => ({ ...prev, [field.id]: JSON.stringify(urls) }))}
          pending={pendingImages[field.id] ?? []}
          onPendingChange={imgs => setPendingImages(prev => ({ ...prev, [field.id]: imgs }))}
        />
      )
    }
    const val = fieldValues[field.id] ?? ''
    return (
      <div key={field.id}>
        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
          {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {field.type === 'select' && (field.options?.length ?? 0) > 0 ? (
          <select
            value={val}
            onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
            className={inputClass}
          >
            <option value="">{field.placeholder || `-- ${field.label} 선택 --`}</option>
            {field.options!.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.name}</option>
            ))}
          </select>
        ) : field.type === 'number' ? (
          <input
            type="number"
            value={val}
            onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
            placeholder={field.placeholder || ''}
            min={field.min}
            max={field.max}
            className={inputClass}
          />
        ) : field.type === 'radio' && (field.options?.length ?? 0) > 0 ? (
          <div className="flex gap-4 flex-wrap py-1">
            {field.options!.map(opt => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <input
                  type="radio"
                  name={`field-${field.id}`}
                  value={opt.value}
                  checked={val === opt.value}
                  onChange={() => setFieldValues(prev => ({ ...prev, [field.id]: opt.value }))}
                  className="accent-[var(--color-brand-primary)]"
                />
                {opt.name}
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer py-1">
            <input
              type="checkbox"
              checked={val === 'true'}
              onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.checked ? 'true' : 'false' }))}
              className="accent-[var(--color-brand-primary)] w-4 h-4"
            />
            {field.label}
          </label>
        ) : field.type === 'checkbox_group' && (field.options?.length ?? 0) > 0 ? (
          (() => {
            const selected = new Set(val.split(',').filter(Boolean))
            return (
              <div className="flex gap-4 flex-wrap py-1">
                {field.options!.map(opt => (
                  <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(opt.value)}
                      onChange={() => {
                        const next = new Set(selected)
                        if (next.has(opt.value)) next.delete(opt.value)
                        else next.add(opt.value)
                        setFieldValues(prev => ({ ...prev, [field.id]: [...next].join(',') }))
                      }}
                      className="accent-[var(--color-brand-primary)]"
                    />
                    {opt.name}
                  </label>
                ))}
              </div>
            )
          })()
        ) : field.type === 'phone' ? (
          <input
            type="tel"
            value={val}
            onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: formatPhone(e.target.value) }))}
            placeholder={field.placeholder || '010-0000-0000'}
            maxLength={14}
            className={inputClass}
          />
        ) : field.type === 'account_number' ? (
          <input
            type="text"
            inputMode="numeric"
            value={val}
            onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value.replace(/[^\d-]/g, '').slice(0, 25) }))}
            placeholder={field.placeholder || '계좌번호 입력 (숫자)'}
            maxLength={25}
            className={inputClass}
          />
        ) : (
          <input
            type="text"
            value={val}
            onChange={e => {
              setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))
              if (isAdmin && isSplitMode && field.id === customFields[0]?.id) setSelectedUserId('')
            }}
            placeholder={field.placeholder || `${field.label}${field.required ? ' (필수)' : ' (선택)'}`}
            maxLength={100}
            className={inputClass}
          />
        )}
      </div>
    )
  }

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(year, month - 1, day).getDay()]
  const kickerLabel = editingId
    ? '배정 수정'
    : (isReadOnly || ownLockedAssignment || blockNewRegistration || ownAssignment)
      ? '슬롯 상세'
      : isAdmin ? '관리자 등록' : '내 스케줄 등록'
  const roleOrTypeLabel = isSplitMode && selectedRole
    ? selectedRole.name
    : !isSplitMode && isAdmin && !isFreeform && tenantRoles.length === 0
      ? (defaultType === '50plus' ? typeLabels['50plus'] : typeLabels.member)
      : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 overflow-hidden">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-t-[26px] sm:rounded-[22px] shadow-[var(--shadow-xl)] w-full max-w-md animate-scale-in overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[calc(100dvh-2rem)]">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-3.5 border-b border-[var(--color-border)] shrink-0">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] border border-[var(--color-brand-primary)]/20 px-2.5 py-1 rounded-full mb-2 whitespace-nowrap">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 6.5v4l2.5 1.5"/></svg>
              {kickerLabel}
            </span>
            <h2 className="text-[19px] font-extrabold tracking-tight text-[var(--color-text-primary)] flex items-baseline gap-2 flex-wrap m-0">
              {month}월 {day}일
              <span className="text-[13px] font-semibold text-[var(--color-text-muted)]">({weekday})</span>
            </h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[13px] font-bold text-[var(--color-text-secondary)]">
              <span className="font-mono tabular-nums">{parseSlotLabel(timeSlot)}</span>
              {slotLabels[timeSlot] && <span className="text-[var(--color-text-muted)] font-semibold">· {slotLabels[timeSlot]}</span>}
              {roleOrTypeLabel && <span className="text-[var(--color-text-muted)] font-semibold">· {roleOrTypeLabel}</span>}
              <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)] shrink-0" />
              <span
                className="text-[11.5px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                style={cellState.isFull
                  ? { color: 'oklch(0.56 0.11 150)', backgroundColor: 'color-mix(in srgb, oklch(0.56 0.11 150) 12%, transparent)' }
                  : { color: 'var(--color-brand-primary)', backgroundColor: 'color-mix(in srgb, var(--color-brand-primary) 10%, transparent)' }}
              >
                {cellState.assignments.length}/{cellState.maxCapacity}명
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)] transition-all duration-200 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>
          </button>
        </div>

        {/* Role selector (split mode) OR type tabs (회원선택 모드) */}
        {isSplitMode ? (
          isAdmin && splitRoles.length > 1 ? (
            <div className="flex border-b border-[var(--color-border)] px-4 py-2.5 gap-2 items-center shrink-0 flex-wrap">
              <p className="text-xs font-bold text-[var(--color-text-muted)] shrink-0">역할</p>
              <div className="flex gap-1.5 flex-wrap">
                {splitRoles.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(r.id)
                      setFieldValues({})
                      setSelectedUserId('')
                    }}
                    className={`px-3.5 h-9 rounded-xl text-[13px] font-bold border transition-colors whitespace-nowrap ${
                      selectedRoleId === r.id
                        ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white shadow-[0_4px_10px_-6px_var(--color-brand-primary)]'
                        : 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)]/40'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          ) : !isAdmin && selectedRole ? (
            <div className="flex border-b border-[var(--color-border)] px-4 py-2.5 gap-2 items-center shrink-0">
              <p className="text-xs font-bold text-[var(--color-text-muted)] shrink-0">역할</p>
              <span className="px-3.5 h-9 inline-flex items-center rounded-xl text-[13px] font-bold bg-[var(--color-surface-secondary)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)]">{selectedRole.name}</span>
            </div>
          ) : null
        ) : !isAdmin && !isFreeform && tenantRoles.length === 0 && (  // 커스텀 역할 없는 조직만 표시
          <div className="flex border-b border-[var(--color-border)] px-2 shrink-0">
            {(['member', '50plus'] as MemberType[]).filter(t => t !== '50plus' || !!typeLabels['50plus']).map(t => {
              const isDisabled = !isAdmin && profileType !== t
              return (
                <button
                  key={t}
                  onClick={() => {
                    if (!isDisabled) {
                      setMemberType(t)
                      setSelectedUserId(isAdmin ? '' : (profile?.id ?? ''))
                    }
                  }}
                  disabled={isDisabled}
                  className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200
                    ${memberType === t
                      ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                      : 'border-transparent text-[var(--color-text-muted)]'}
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-[var(--color-text-secondary)]'}`}
                >
                  {t === '50plus' ? typeLabels['50plus'] : typeLabels.member}
                </button>
              )
            })}
          </div>
        )}

        <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto flex-1">
          {/* Existing assignments */}
          {displayedAssignments.length > 0 && (
            <div className="flex flex-col gap-2">
              {displayedAssignments.map(a => {
                const canEdit = !a.is_locked && (isAdmin || (a.user_id === profile?.id && !isReadOnly))
                const isOwnEntry = !isAdmin && a.user_id === profile?.id && a.member_name === profile?.name
                const displayName = isFreeform && useDynamicFields && customFields[0]
                  ? `${customFields[0].label}: ${a.member_name}`
                  : a.member_name
                const detailChips: { key: string; label: string; value: string }[] = []
                if (isFreeform) {
                  if (!useDynamicFields && a.customer_phone) detailChips.push({ key: 'phone', label: '연락처', value: fmtPhone(a.customer_phone) })
                  if (useDynamicFields) customFields.slice(1).forEach(f => {
                    if (f.type === 'image_upload') return
                    const val = a.extra_data?.[f.id]
                    if (!val) return
                    const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                    detailChips.push({ key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` })
                  })
                } else if (showExtraCustomFields) {
                  customFields.forEach(f => {
                    if (f.type === 'image_upload') return
                    const val = a.extra_data?.[f.id]
                    if (!val) return
                    const unit = getOptionUnit(f.options?.find(o => o.value === val)?.value_type)
                    detailChips.push({ key: f.id, label: f.label, value: `${fmtNumber(val)}${unit}` })
                  })
                }
                if (a.note) detailChips.push({ key: 'note', label: '메모', value: a.note })

                const imageChips: { fieldId: string; label: string; urls: string[] }[] = []
                const imgFieldSource = useDynamicFields ? customFields.slice(1) : showExtraCustomFields ? customFields : []
                imgFieldSource.forEach(f => {
                  if (f.type !== 'image_upload') return
                  const raw = a.extra_data?.[f.id]
                  if (!raw) return
                  try {
                    const urls = JSON.parse(raw) as string[]
                    if (urls.length > 0) imageChips.push({ fieldId: f.id, label: f.label, urls })
                  } catch {}
                })

                return (
                  <div
                    key={a.id}
                    className={`rounded-2xl px-3 py-2.5 border transition-colors ${
                      isOwnEntry
                        ? 'bg-[color-mix(in_srgb,var(--color-brand-primary)_7%,var(--color-surface))] border-[color-mix(in_srgb,var(--color-brand-primary)_24%,var(--color-border-strong))]'
                        : a.is_locked
                          ? 'bg-[var(--color-surface-secondary)] border-[var(--color-border)]'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                    }`}
                    style={{ backgroundColor: !isOwnEntry ? (a.color || undefined) : undefined }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-extrabold bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] text-[var(--color-brand-primary)] shrink-0">
                        {a.member_name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                        <span className="text-sm text-[var(--color-text-primary)] font-bold flex items-center flex-wrap gap-1.5">
                          {displayName}
                          {a.time_sub && <span className="text-xs text-[var(--color-text-muted)] font-medium">({formatTimeSub(a.time_sub)})</span>}
                          {!isFreeform && isAdmin && !isSplitMode && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold truncate max-w-[72px] ${a.member_type === '50plus' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                              {a.member_type === '50plus' ? typeLabels['50plus'] : typeLabels.member}
                            </span>
                          )}
                          {isOwnEntry && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]">나</span>
                          )}
                          {a.is_locked && <span title="관리자에 의해 고정됨"><LockIcon size={12} className="inline -mt-0.5" /></span>}
                        </span>
                      </div>
                      {(canEdit || (onToggleLock && a.is_locked && isSuperAdmin)) && (
                        <div className="flex gap-0.5 shrink-0">
                          {canEdit && (
                            <>
                              {!(ownAssignment && a.id === ownAssignment.id) && (
                                <button onClick={() => startEdit(a)} className="text-xs font-bold text-[var(--color-text-muted)] px-2 py-1 rounded-lg hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors">수정</button>
                              )}
                              <button onClick={() => handleDelete(a.id)} className="text-xs font-bold text-[var(--color-text-muted)] px-2 py-1 rounded-lg hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors">삭제</button>
                              {onToggleLock && isAdmin && (
                                <button onClick={() => handleToggleLock(a.id, true)} className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)] px-2 py-1 rounded-lg hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"><LockIcon size={12} /> 고정</button>
                              )}
                            </>
                          )}
                          {onToggleLock && a.is_locked && isSuperAdmin && (
                            <button onClick={() => handleToggleLock(a.id, false)} className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-muted)] px-2 py-1 rounded-lg hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors"><UnlockIcon size={12} /> 해제</button>
                          )}
                        </div>
                      )}
                    </div>
                    {(detailChips.length > 0 || imageChips.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-dashed border-[var(--color-border-strong)]">
                        {detailChips.map(c => (
                          <span key={c.key} className="text-[11.5px] font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-2 py-1 rounded-lg inline-flex gap-1 whitespace-nowrap">
                            <b className="font-extrabold text-[var(--color-text-muted)]">{c.label}</b>{c.value}
                          </span>
                        ))}
                        {imageChips.map(ic => (
                          <button
                            key={ic.fieldId}
                            type="button"
                            onClick={() => setGalleryUrls(ic.urls)}
                            className="text-[11.5px] font-semibold text-[var(--color-brand-primary)] bg-[color-mix(in_srgb,var(--color-brand-primary)_8%,transparent)] border border-[var(--color-brand-primary)]/20 px-2 py-1 rounded-lg inline-flex items-center gap-1 whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--color-brand-primary)_15%,transparent)] transition-colors select-none"
                          >
                            <span className="select-none">🖼</span> {ic.label} {ic.urls.length}장
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {profile && ownLockedAssignment ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-3 flex items-center justify-center gap-1.5">
              <LockIcon size={14} />
              고정된 항목은 수정할 수 없습니다. 해제는 슈퍼관리자에게 문의하세요.
            </p>
          ) : profile && blockNewRegistration ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-3 flex items-center justify-center gap-1.5">
              <LockIcon size={14} />
              이 날짜는 전체 고정되어 새 등록이 불가합니다.
            </p>
          ) : profile && ownAssignment && !editingId ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-3">
              이미 등록된 내 스케줄입니다. 아래 버튼으로 수정할 수 있습니다.
            </p>
          ) : profile && !isReadOnly ? (
            <>
              {/* Time slot selector */}
              {timeSubOptions && (
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-muted)] mb-2">근무 시간</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {timeSubOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTimeSub(timeSub === opt.value ? null : opt.value)}
                        className={`px-3.5 h-9 rounded-xl text-[13px] font-bold border transition-all duration-200
                          ${timeSub === opt.value
                            ? 'bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)] shadow-[0_4px_10px_-6px_var(--color-brand-primary)]'
                            : 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)]/40'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input section */}
              {useDynamicFields ? (
                /* 동적 커스텀 필드 */
                <>
                  {customFields.map(field => renderFieldInput(field))}
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="메모 (선택)"
                    maxLength={200}
                    className={inputClass}
                  />
                </>
              ) : (
                /* 회원선택 모드 */
                <>
                  {isAdmin ? (
                    (isFreeform && isSplitMode && selectableProfiles.length > 0) ? null : (
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-muted)] mb-2">회원 선택</p>
                      {lockedUserId ? (
                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                          <div className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-extrabold bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] text-[var(--color-brand-primary)] shrink-0">
                            {(profiles.find(p => p.id === lockedUserId)?.name ?? '?').slice(0, 1)}
                          </div>
                          <span className="text-sm text-[var(--color-text-primary)] font-bold">
                            {profiles.find(p => p.id === lockedUserId)?.name ?? '알 수 없음'}
                          </span>
                        </div>
                      ) : selectableProfiles.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)] py-2 text-center">
                          {totalTypeProfiles.length === 0
                            ? '해당 유형으로 가입된 회원이 없습니다'
                            : '모든 회원이 이미 배정되어 있습니다'}
                        </p>
                      ) : (
                        <select
                          value={selectedUserId}
                          onChange={e => setSelectedUserId(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">-- 회원을 선택하세요 --</option>
                          {selectableProfiles.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                      <div className="w-8 h-8 rounded-full grid place-items-center text-[13px] font-extrabold bg-[color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)] text-[var(--color-brand-primary)] shrink-0">
                        {profile.name.slice(0, 1)}
                      </div>
                      <span className="text-sm text-[var(--color-text-primary)] font-bold">{profile.name}</span>
                      <span className="ml-auto text-[11px] font-extrabold text-white bg-[var(--color-brand-primary)] px-2 py-0.5 rounded-full">나</span>
                    </div>
                  )}
                  {showExtraCustomFields && customFields.map(field => renderFieldInput(field))}
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="메모 (선택)"
                    className={inputClass}
                  />
                </>
              )}

            </>
          ) : profile && isReadOnly ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-3">
              스케줄 조회 전용입니다. 배정은 관리자에게 문의하세요.
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-3">
              로그인 후 스케줄을 입력할 수 있습니다.
            </p>
          )}
        </div>

        {profile && !isReadOnly && !ownLockedAssignment && !blockNewRegistration && (
          <div className="px-5 py-3.5 border-t border-[var(--color-border)] flex flex-col gap-2.5 shrink-0">
            {error && (
              <p className="text-red-500 text-xs bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              {ownAssignment && !editingId ? (
                <>
                  <button
                    onClick={() => startEdit(ownAssignment)}
                    className="flex-1 h-11 bg-[var(--color-brand-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-brand-primary-hover)] transition-all duration-200 shadow-[0_8px_18px_-10px_var(--color-brand-primary)]"
                  >
                    내 스케줄 수정
                  </button>
                  <button onClick={onClose} className="flex-1 h-11 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-xl text-sm font-bold hover:bg-[var(--color-surface-hover)] transition-all duration-200">
                    닫기
                  </button>
                </>
              ) : (
                <>
                  {isAdmin && onToggleHighlight && !editingId && (
                    <button
                      onClick={onToggleHighlight}
                      className={`flex-1 h-11 rounded-xl text-sm font-bold border transition-all duration-200 ${
                        isHighlighted
                          ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                          : 'bg-[var(--color-surface)] border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      {isHighlighted ? '하이라이트 해제' : '빈 슬롯 알림'}
                    </button>
                  )}
                  <button
                    onClick={editingId ? handleUpdate : handleAdd}
                    disabled={isAddDisabled}
                    className="flex-1 h-11 bg-[var(--color-brand-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-brand-primary-hover)] disabled:opacity-50 transition-all duration-200 shadow-[0_8px_18px_-10px_var(--color-brand-primary)]"
                  >
                    {loading ? '저장 중...' : editingId ? '수정 완료' : '저장'}
                  </button>
                  {editingId ? (
                    <button onClick={cancelEdit} className="flex-1 h-11 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-xl text-sm font-bold hover:bg-[var(--color-surface-hover)] transition-all duration-200">
                      취소
                    </button>
                  ) : (
                    <button onClick={onClose} className="flex-1 h-11 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-xl text-sm font-bold hover:bg-[var(--color-surface-hover)] transition-all duration-200">
                      닫기
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {galleryUrls && (
        <ImageGalleryModal
          urls={galleryUrls}
          onClose={() => setGalleryUrls(null)}
        />
      )}
      <DevFileLabel file="SlotEditModal.tsx" />
    </div>
  )
}
