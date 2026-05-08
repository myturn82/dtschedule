import { useState } from 'react'
import type { Assignment, Profile, TimeSlot } from '../../types'

interface Props {
  year: number
  month: number
  day: number
  assignments: Assignment[]
  profile: Profile
  initialStartHour?: number
  initialEndHour?: number
  onClose: () => void
  onAdd: (params: {
    year: number; month: number; day: number
    time_slot: TimeSlot; volunteer_name: string
    note?: string; volunteer_type: string
    time_sub?: string; user_id: string
  }) => Promise<string | null>
  onUpdate: (id: string, params: { volunteer_name?: string; note?: string; time_sub?: string }) => Promise<string | null>
  onDelete: (id: string) => Promise<string | null>
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9) // 9~22

const COLOR_OPTIONS = [
  { label: '기본', value: '', preview: 'bg-gray-100' },
  { label: '파랑', value: '#BFDBFE', preview: 'bg-blue-200' },
  { label: '초록', value: '#BBF7D0', preview: 'bg-green-200' },
  { label: '빨강', value: '#FECACA', preview: 'bg-red-200' },
  { label: '주황', value: '#FED7AA', preview: 'bg-orange-200' },
  { label: '보라', value: '#E9D5FF', preview: 'bg-purple-200' },
  { label: '노랑', value: '#FEF08A', preview: 'bg-yellow-200' },
]

function parseTimeSub(ts: string): [number, number] {
  if (ts.includes('~')) { const [s, e] = ts.split('~').map(Number); return [s, e + 1] }
  return [Number(ts), Number(ts) + 1]
}

function formatRange(timeSub: string | null): string {
  if (!timeSub) return ''
  const [s, e] = parseTimeSub(timeSub)
  return `${s}시~${e}시`
}

function toTimeSub(startHour: number, endHour: number): string {
  return startHour + 1 === endHour ? `${startHour}` : `${startHour}~${endHour - 1}`
}

export function HolidayNoteModal({
  year, month, day, assignments, profile,
  initialStartHour = 14, initialEndHour = 17,
  onClose, onAdd, onUpdate, onDelete,
}: Props) {
  const [startHour, setStartHour] = useState(initialStartHour)
  const [endHour, setEndHour] = useState(initialEndHour)
  const [noteText, setNoteText] = useState('')
  const [color, setColor] = useState('')
  const [editingNote, setEditingNote] = useState<Assignment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const adminNotes = assignments
    .filter(a => a.year === year && a.month === month && a.day === day && a.volunteer_type === 'admin_note')
    .sort((a, b) => {
      const [sa] = parseTimeSub(a.time_sub ?? '0')
      const [sb] = parseTimeSub(b.time_sub ?? '0')
      return sa - sb
    })

  function checkOverlap(newStart: number, newEnd: number, excludeId?: string): boolean {
    return adminNotes.some(n => {
      if (n.id === excludeId || !n.time_sub) return false
      const [s, e] = parseTimeSub(n.time_sub)
      return s < newEnd && newStart < e
    })
  }

  // 시간 선택 즉시 중복 체크
  const timeError: string | null = (() => {
    if (startHour >= endHour) return '종료 시간은 시작 시간보다 커야 합니다'
    if (checkOverlap(startHour, endHour, editingNote?.id)) return `${startHour}시~${endHour}시는 기존 비고와 시간이 겹칩니다`
    return null
  })()

  function startEdit(note: Assignment) {
    setEditingNote(note)
    const [s, e] = note.time_sub ? parseTimeSub(note.time_sub) : [initialStartHour, initialEndHour]
    setStartHour(s)
    setEndHour(e)
    setNoteText(note.note ?? '')
    setColor(note.volunteer_name ?? '')
    setError(null)
  }

  function cancelEdit() {
    setEditingNote(null)
    setStartHour(initialStartHour)
    setEndHour(initialEndHour)
    setNoteText('')
    setColor('')
    setError(null)
  }

  async function handleAdd() {
    if (!noteText.trim()) { setError('비고 내용을 입력해주세요'); return }
    if (timeError) return
    setLoading(true)
    const err = await onAdd({
      year, month, day,
      time_slot: '10-12' as TimeSlot,
      volunteer_name: color,
      volunteer_type: 'admin_note',
      time_sub: toTimeSub(startHour, endHour),
      note: noteText.trim(),
      user_id: profile.id,
    })
    setLoading(false)
    if (err) setError(err)
    else { setNoteText(''); setError(null); setColor('') }
  }

  async function handleUpdate() {
    if (!editingNote || !noteText.trim()) return
    if (timeError) return
    setLoading(true)
    const err = await onUpdate(editingNote.id, {
      volunteer_name: color,
      note: noteText.trim(),
      time_sub: toTimeSub(startHour, endHour),
    })
    setLoading(false)
    if (err) setError(err)
    else cancelEdit()
  }

  async function handleDelete(id: string) {
    if (editingNote?.id === id) cancelEdit()
    setLoading(true)
    const err = await onDelete(id)
    setLoading(false)
    if (err) setError(err)
  }

  const isEditing = editingNote !== null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-5 pt-5 pb-3 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold dark:text-gray-100">{year}년 {month}월 {day}일 — 비고</h2>
            <p className="text-xs text-gray-400 mt-0.5">휴관일 시간대별 비고 관리</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 등록된 비고 목록 */}
          {adminNotes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">등록된 비고</p>
              {adminNotes.map(n => (
                <div
                  key={n.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors
                    ${editingNote?.id === n.id ? 'border-blue-400 dark:border-blue-500' : 'border-gray-100 dark:border-gray-700'}`}
                  style={{ backgroundColor: n.volunteer_name || undefined }}
                >
                  <div>
                    <span className="text-xs font-semibold text-gray-700 mr-2">{formatRange(n.time_sub)}</span>
                    <span className="text-sm text-gray-800">{n.note}</span>
                  </div>
                  <div className="flex gap-2 ml-2 shrink-0">
                    <button onClick={() => startEdit(n)} className="text-xs text-blue-500 hover:underline">수정</button>
                    <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:underline">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 추가/수정 폼 */}
          <div className="space-y-3 border-t dark:border-gray-700 pt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isEditing ? '비고 수정' : '비고 추가'}
            </p>

            {/* 시간 범위 */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">시작</label>
                <select value={startHour} onChange={e => setStartHour(Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {HOURS.slice(0, -1).map(h => <option key={h} value={h}>{h}시</option>)}
                </select>
              </div>
              <span className="text-gray-400 pb-2">~</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">종료</label>
                <select value={endHour} onChange={e => setEndHour(Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {HOURS.slice(1).map(h => <option key={h} value={h}>{h}시</option>)}
                </select>
              </div>
            </div>

            {timeError && (
              <p className="text-red-500 dark:text-red-400 text-xs -mt-1">{timeError}</p>
            )}

            {/* 색상 */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">셀 배경색</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setColor(opt.value)}
                    className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border-2 transition-colors
                      ${color === opt.value ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}>
                    <span className={`w-7 h-7 rounded-md border border-gray-200 ${opt.preview}`}
                      style={opt.value ? { backgroundColor: opt.value } : {}} />
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') isEditing ? handleUpdate() : handleAdd() }}
              placeholder="비고 내용 입력"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />

            {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

            <div className="flex gap-2">
              <button onClick={isEditing ? handleUpdate : handleAdd} disabled={loading || !noteText.trim() || !!timeError}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? '저장 중...' : isEditing ? '수정 저장' : '추가'}
              </button>
              {isEditing ? (
                <button onClick={cancelEdit}
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  취소
                </button>
              ) : (
                <button onClick={onClose}
                  className="flex-1 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  닫기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
