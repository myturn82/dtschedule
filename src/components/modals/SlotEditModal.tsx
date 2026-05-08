import { useState } from 'react'
import type { Assignment, CellState, ModalTarget, Profile, VolunteerType } from '../../types'
import { TYPE_LABELS } from '../../types'

interface Props {
  target: ModalTarget
  cellState: CellState
  profile: Profile | null
  onClose: () => void
  onAdd: (name: string, note: string, volunteerType: VolunteerType, timeSub: string | null, color?: string) => Promise<string | null>
  onUpdate: (id: string, name: string, note: string, volunteerType: VolunteerType, timeSub: string | null, color?: string) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
}

function getTimeSubOptions(slot: string): { value: string; label: string }[] | null {
  const [start, end] = slot.split('-').map(Number)
  if (end - start !== 2) return null
  return [
    { value: `${start}`, label: `${start}시` },
    { value: `${start + 1}`, label: `${start + 1}시` },
    { value: `${start}~${start + 1}`, label: `${start}~${end}시` },  // 전체 범위 표시
  ]
}

const PLUS_COLORS = [
  { label: '기본', value: '' },
  { label: '파랑', value: '#BFDBFE' },
  { label: '초록', value: '#BBF7D0' },
  { label: '빨강', value: '#FECACA' },
  { label: '주황', value: '#FED7AA' },
  { label: '보라', value: '#E9D5FF' },
  { label: '노랑', value: '#FEF08A' },
]

function formatTimeSub(ts: string | null): string {
  if (!ts) return ''
  if (ts.includes('~')) {
    const [s, e] = ts.split('~').map(Number)
    return `${s}~${e + 1}시`
  }
  return `${ts}시`
}

export function SlotEditModal({ target, cellState, profile, onClose, onAdd, onUpdate, onDelete }: Props) {
  const { day, month, year, timeSlot, volunteerType: defaultType } = target

  const isAdmin = profile?.role === 'admin'
  const profileType: VolunteerType = profile?.role === '50plus' ? '50plus' : 'volunteer'
  const isSaturday = new Date(year, month - 1, day).getDay() === 6

  const [volunteerType, setVolunteerType] = useState<VolunteerType>(
    isAdmin ? (isSaturday && defaultType === '50plus' ? 'volunteer' : defaultType) : profileType
  )
  const timeSubOptions = getTimeSubOptions(timeSlot)
  const [timeSub, setTimeSub] = useState<string | null>(null)
  const [name, setName] = useState(isAdmin ? '' : (profile?.name ?? ''))
  const [note, setNote] = useState('')
  const [color, setColor] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const displayedAssignments = cellState.assignments.filter(
    a => !a.volunteer_type || a.volunteer_type === volunteerType
  )

  function startEdit(a: Assignment) {
    setEditingId(a.id)
    setName(a.volunteer_name)
    setNote(a.note ?? '')
    setVolunteerType(a.volunteer_type ?? 'volunteer')
    setTimeSub(a.time_sub ?? null)
    setColor(a.color ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setName(isAdmin ? '' : (profile?.name ?? ''))
    setNote('')
    setTimeSub(null)
    setColor('')
  }

  async function handleAdd() {
    if (!name.trim()) return
    if (!isAdmin && cellState.isFull) { setError('정원이 마감되었습니다'); return }
    setLoading(true)
    const err = await onAdd(name.trim(), note.trim(), volunteerType, timeSub, color || undefined)
    setLoading(false)
    if (err) setError(err)
    else {
      setName(isAdmin ? '' : (profile?.name ?? ''))
      setNote('')
      setTimeSub(null)
      setColor('')
    }
  }

  async function handleUpdate() {
    if (!editingId || !name.trim()) return
    setLoading(true)
    const err = await onUpdate(editingId, name.trim(), note.trim(), volunteerType, timeSub, color || undefined)
    setLoading(false)
    if (err) setError(err)
    else cancelEdit()
  }

  async function handleDelete(id: string) {
    setLoading(true)
    const err = await onDelete(id)
    setLoading(false)
    if (err) setError(err)
  }

  const showColorPicker = volunteerType === '50plus'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center px-5 pt-5 pb-3">
          <h2 className="text-base font-bold dark:text-gray-100">
            {year}년 {month}월 {day}일 {timeSlot}시
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>

        {/* 유형 탭 */}
        <div className="flex border-b dark:border-gray-700 px-2">
          {(['volunteer', '50plus'] as VolunteerType[]).map(t => {
            const disabledByRole = !isAdmin && profileType !== t
            const disabledBySaturday = isSaturday && t === '50plus'
            const isDisabled = disabledByRole || disabledBySaturday
            return (
              <button
                key={t}
                onClick={() => { if (!isDisabled) setVolunteerType(t) }}
                disabled={isDisabled}
                className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors
                  ${volunteerType === t
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-400 dark:text-gray-500'}
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                {TYPE_LABELS[t]}{disabledBySaturday ? ' (토요일 제외)' : ''}
              </button>
            )
          })}
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* 기존 등록자 */}
          {displayedAssignments.length > 0 && (
            <div className="space-y-1.5">
              {displayedAssignments.map(a => {
                const canEdit = isAdmin || a.user_id === profile?.id
                return (
                  <div key={a.id}
                    className="flex items-center justify-between rounded-lg px-3 py-1.5 border border-gray-100 dark:border-gray-700"
                    style={{ backgroundColor: a.color || undefined }}
                  >
                    <span className="text-sm dark:text-gray-200">
                      {a.volunteer_name}
                      {a.time_sub && <span className="ml-1 text-xs text-gray-500">({formatTimeSub(a.time_sub)})</span>}
                      {a.note && <span className="ml-1 text-xs text-gray-500">({a.note})</span>}
                    </span>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(a)} className="text-xs text-blue-500 hover:underline">수정</button>
                        <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:underline">삭제</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {profile ? (
            <>
              {/* 2시간 슬롯 시간 선택 */}
              {timeSubOptions && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">근무 시간 선택</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {timeSubOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTimeSub(timeSub === opt.value ? null : opt.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                          ${timeSub === opt.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 50플러스 색상 선택 */}
              {showColorPicker && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">셀 색상 선택</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {PLUS_COLORS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setColor(opt.value)}
                        title={opt.label}
                        className={`w-7 h-7 rounded-full border-2 transition-colors
                          ${color === opt.value ? 'border-blue-500 scale-110' : 'border-gray-200 hover:border-gray-400'}`}
                        style={{ backgroundColor: opt.value || '#F3F4F6' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="이름"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="메모 (선택)"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={loading || !name.trim()}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '저장 중...' : editingId ? '수정' : '추가'}
                </button>
                {editingId ? (
                  <button onClick={cancelEdit} className="flex-1 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    취소
                  </button>
                ) : (
                  <button onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    닫기
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">로그인 후 스케줄을 입력할 수 있습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
