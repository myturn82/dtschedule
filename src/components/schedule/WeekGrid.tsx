import type { Assignment, SlotSetting, ScheduleRule, DateOverride, ModalTarget, Profile, TenantRole, TimeSlot } from '../../types'
import { getCellState } from '../../utils/cellState'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

interface Props {
  weekDays: Date[]
  timeSlots: TimeSlot[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  highlightName: string | null
  profile: Profile | null
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  slotLabels?: Record<string, string>
  selectedDay?: Date | null
  onDateHeaderClick?: (date: Date) => void
  onCellClick: (target: ModalTarget) => void
}

export function WeekGrid({
  weekDays, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
  selectedDay, onDateHeaderClick,
}: Props) {
  const today = new Date()

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
  }

  // 날짜별 배정 수 계산
  function getAssignmentCount(d: Date): number {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
    return assignments.filter(a =>
      a.year === y && a.month === m && a.day === day &&
      a.volunteer_type !== 'admin_note'
    ).length
  }

  // 날짜별 휴관 여부 확인
  function isDayClosed(d: Date): boolean {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
    return timeSlots.length > 0 && timeSlots.every(slot => {
      const cs = getCellState(day, slot, y, m, scheduleRules, slotSettings, dateOverrides, assignments)
      return cs.isHoliday || cs.isBreaktime
    })
  }

  return (
    <div className="px-1 sm:px-0">
      {/* 주간 날짜 스트립 */}
      <div className="flex items-stretch gap-1 sm:gap-2">
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today)
          const isSelected = selectedDay ? isSameDay(d, selectedDay) : false
          const dow = d.getDay()
          const isSat = dow === 6
          const isSun = dow === 0
          const count = getAssignmentCount(d)
          const closed = isDayClosed(d)

          return (
            <button
              key={i}
              onClick={() => onDateHeaderClick?.(d)}
              className={`flex-1 flex flex-col items-center py-2.5 px-0.5 rounded-2xl transition-all duration-200 active:scale-[0.96] ${
                isSelected
                  ? 'bg-[var(--color-brand-primary)] shadow-[0_2px_12px_rgba(37,99,235,0.35)]'
                  : isToday
                  ? 'bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/30'
                  : 'bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)]'
              }`}
            >
              {/* 요일 */}
              <span className={`text-[10px] font-medium mb-1 ${
                isSelected ? 'text-white/80' :
                isSun ? 'text-red-500' :
                isSat ? 'text-blue-500' :
                'text-[var(--color-text-muted)]'
              }`}>
                {DAY_LABELS[i]}
              </span>

              {/* 날짜 */}
              <span className={`text-base sm:text-lg font-bold leading-none ${
                isSelected ? 'text-white' :
                isToday ? 'text-[var(--color-brand-primary)]' :
                isSun ? 'text-red-500' :
                isSat ? 'text-blue-500' :
                'text-[var(--color-text-primary)]'
              }`}>
                {d.getDate()}
              </span>

              {/* 배정 인디케이터 */}
              <div className="mt-1.5 h-4 flex items-center justify-center">
                {closed ? (
                  <span className={`text-[9px] font-medium ${isSelected ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}>휴</span>
                ) : count > 0 ? (
                  <div className="flex gap-0.5 items-center">
                    {count <= 3 ? (
                      Array.from({ length: count }).map((_, ci) => (
                        <div
                          key={ci}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white/70' : 'bg-[var(--color-brand-primary)]'
                          }`}
                        />
                      ))
                    ) : (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)]'
                      }`}>
                        {count}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/30' : 'bg-[var(--color-border-strong)]'}`} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
