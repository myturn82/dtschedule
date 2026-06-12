import ExcelJS from 'exceljs'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, TenantRole } from '../types'
import { getCellState } from './cellState'
import { rangeSlotLabel } from './timeSlots'
import { getKoreanHolidayName } from './koreanHolidays'

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']

interface ExportMonthScheduleParams {
  year: number
  month: number
  tenantName: string
  timeSlots: TimeSlot[]
  assignments: Assignment[]
  slotSettings: SlotSetting[]
  scheduleRules: ScheduleRule[]
  dateOverrides: DateOverride[]
  slotLabels?: Record<string, string>
  splitRoles?: TenantRole[]
  isSplitMode?: boolean
  withdrawnUserIds?: Set<string>
  displayAssignmentFilter?: (a: Assignment) => boolean
}

function formatAssignmentText(
  a: Assignment,
  withdrawnUserIds: Set<string> | undefined,
  isSplitMode: boolean,
  splitRoles: TenantRole[]
): string {
  const isWithdrawn = !!(a.user_id && withdrawnUserIds?.has(a.user_id)) || a.account_deleted
  let text = a.member_name
  if (isSplitMode && splitRoles.length) {
    const role = splitRoles.find(r => r.id === a.role_id)
    if (role) text = `[${role.name}] ${text}`
  }
  if (a.note) text += `(${a.note})`
  if (a.customer_name) text += ` - ${a.customer_name}${a.customer_phone ? ` (${a.customer_phone})` : ''}`
  if (a.is_locked) text += ' [고정]'
  if (isWithdrawn) text += ' [삭제됨]'
  return text
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '스케줄'
}

export async function exportMonthScheduleToExcel(params: ExportMonthScheduleParams): Promise<void> {
  const {
    year, month, tenantName, timeSlots, assignments, slotSettings, scheduleRules, dateOverrides,
    slotLabels = {}, splitRoles = [], isSplitMode = false, withdrawnUserIds, displayAssignmentFilter,
  } = params

  const daysInMonth = new Date(year, month, 0).getDate()

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(`${year}-${String(month).padStart(2, '0')}`)

  const titleRow = sheet.addRow([`${tenantName} ${year}년 ${month}월 스케줄`])
  sheet.mergeCells(titleRow.number, 1, titleRow.number, daysInMonth + 1)
  titleRow.font = { bold: true, size: 14 }

  const headerValues = ['시간대']
  for (let day = 1; day <= daysInMonth; day++) {
    const dow = new Date(year, month - 1, day).getDay()
    headerValues.push(`${month}/${day} (${DOW_LABELS[dow]})`)
  }
  const headerRow = sheet.addRow(headerValues)
  headerRow.font = { bold: true }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

  for (const slot of timeSlots) {
    const rowValues: string[] = [slotLabels[slot] ?? rangeSlotLabel(slot)]
    for (let day = 1; day <= daysInMonth; day++) {
      const cs = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
      let text = ''
      if (cs.isHoliday) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        text = getKoreanHolidayName(dateStr) ?? '휴관'
      } else if (cs.isBreaktime) {
        text = '휴게'
      } else if (cs.isClosed) {
        text = '휴무'
      } else {
        const visible = (displayAssignmentFilter ? cs.assignments.filter(displayAssignmentFilter) : cs.assignments)
          .filter(a => a.member_type !== 'admin_note')
        text = visible.map(a => formatAssignmentText(a, withdrawnUserIds, isSplitMode, splitRoles)).join('\n')
      }
      rowValues.push(text)
    }
    const row = sheet.addRow(rowValues)
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', wrapText: true, horizontal: colNumber === 1 ? 'center' : 'left' }
    })
  }

  sheet.getColumn(1).width = 12
  for (let day = 1; day <= daysInMonth; day++) sheet.getColumn(day + 1).width = 18

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(tenantName)}_${year}-${String(month).padStart(2, '0')}_스케줄.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
