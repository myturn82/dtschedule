import ExcelJS from 'exceljs'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import type { Assignment, SlotSetting, ScheduleRule, DateOverride, TimeSlot, TenantRole } from '../types'
import { getCellState } from './cellState'
import { rangeSlotLabel } from './timeSlots'
import { getKoreanHolidayName } from './koreanHolidays'

// Mon(0) … Sat(5), Sun(6)
const DOW_LABELS = ['월', '화', '수', '목', '금', '토', '일']
const TOTAL_COLS = 8

export interface ExportMonthScheduleParams {
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

// ── 공통 헬퍼 ────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '스케줄'
}

function baseFilename(tenantName: string, year: number, month: number): string {
  return `${sanitizeFilename(tenantName)}_${year}-${String(month).padStart(2, '0')}_스케줄`
}

// 달력 주 분할: index 0=월 … 5=토, 6=일
function getCalendarWeeks(year: number, month: number): (number | null)[][] {
  const count = new Date(year, month, 0).getDate()
  const weeks: (number | null)[][] = []
  let cur: (number | null)[] = Array(7).fill(null)
  for (let day = 1; day <= count; day++) {
    const idx = (new Date(year, month - 1, day).getDay() + 6) % 7
    cur[idx] = day
    if (idx === 6) { weeks.push(cur); cur = Array(7).fill(null) }
  }
  if (cur.some(d => d !== null)) weeks.push(cur)
  return weeks
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

function buildCellText(
  day: number, slot: TimeSlot, year: number, month: number,
  scheduleRules: ScheduleRule[], slotSettings: SlotSetting[],
  dateOverrides: DateOverride[], assignments: Assignment[],
  displayAssignmentFilter: ((a: Assignment) => boolean) | undefined,
  withdrawnUserIds: Set<string> | undefined,
  isSplitMode: boolean, splitRoles: TenantRole[]
): string {
  const cs = getCellState(day, slot, year, month, scheduleRules, slotSettings, dateOverrides, assignments)
  if (cs.isHoliday) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return getKoreanHolidayName(dateStr) ?? '휴관'
  }
  if (cs.isBreaktime) return '휴게'
  if (cs.isClosed) return '휴무'
  const visible = (displayAssignmentFilter ? cs.assignments.filter(displayAssignmentFilter) : cs.assignments)
    .filter(a => a.member_type !== 'admin_note')
  return visible.map(a => formatAssignmentText(a, withdrawnUserIds, isSplitMode, splitRoles)).join('\n')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ── Excel (.xlsx) ─────────────────────────────────────────────────────────────

function border(color = 'FFD0D0D0'): Partial<ExcelJS.Borders> {
  const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: color } }
  return { top: s, bottom: s, left: s, right: s }
}
function hairBorder(): Partial<ExcelJS.Borders> {
  const h: Partial<ExcelJS.Border> = { style: 'hair', color: { argb: 'FFE0E0E0' } }
  const t: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  return { top: h, bottom: h, left: t, right: t }
}

export async function exportMonthScheduleToExcel(p: ExportMonthScheduleParams): Promise<void> {
  const { year, month, tenantName, timeSlots, assignments, slotSettings, scheduleRules,
    dateOverrides, slotLabels = {}, splitRoles = [], isSplitMode = false,
    withdrawnUserIds, displayAssignmentFilter } = p

  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet(`${year}-${String(month).padStart(2, '0')}`)

  sheet.getColumn(1).width = 12
  for (let c = 2; c <= TOTAL_COLS; c++) sheet.getColumn(c).width = 16

  const titleRow = sheet.addRow([`${tenantName} ${year}년 ${month}월 스케줄`])
  sheet.mergeCells(titleRow.number, 1, titleRow.number, TOTAL_COLS)
  titleRow.height = 26
  const tc = titleRow.getCell(1)
  tc.font = { bold: true, size: 14 }
  tc.alignment = { horizontal: 'center', vertical: 'middle' }
  tc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } }

  const weeks = getCalendarWeeks(year, month)

  for (let wi = 0; wi < weeks.length; wi++) {
    const week = weeks[wi]

    const whRow = sheet.addRow(['시간대', ...week.map((d, i) => d ? `${month}/${d}(${DOW_LABELS[i]})` : DOW_LABELS[i])])
    whRow.height = 20
    whRow.eachCell((cell, col) => {
      const di = col - 2
      const isSat = di === 5, isSun = di === 6
      cell.font = { bold: true, size: 10, ...(isSat ? { color: { argb: 'FF1D4ED8' } } : isSun ? { color: { argb: 'FFDC2626' } } : {}) }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = border()
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: col === 1 ? 'FFE8EDFF' : isSat ? 'FFE0F0FF' : isSun ? 'FFFFF0F0' : 'FFF5F5F5' }
      }
    })

    for (const slot of timeSlots) {
      const row = sheet.addRow([
        slotLabels[slot] ?? rangeSlotLabel(slot),
        ...week.map(d => {
          if (!d) return ''
          return buildCellText(d, slot, year, month, scheduleRules, slotSettings, dateOverrides,
            assignments, displayAssignmentFilter, withdrawnUserIds, isSplitMode, splitRoles)
        }),
      ])
      row.eachCell((cell, col) => {
        const di = col - 2
        cell.alignment = { vertical: 'top', wrapText: true, horizontal: col === 1 ? 'center' : 'left' }
        cell.border = hairBorder()
        if (col === 1) {
          cell.font = { size: 9, color: { argb: 'FF666666' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } }
        } else if (di === 5) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFCFF' } }
        } else if (di === 6) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFAFA' } }
        }
      })
    }

    if (wi < weeks.length - 1) sheet.addRow([])
  }

  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${baseFilename(tenantName, year, month)}.xlsx`)
}

// ── CSV ───────────────────────────────────────────────────────────────────────

export function exportMonthScheduleToCsv(p: ExportMonthScheduleParams): void {
  const { year, month, tenantName, timeSlots, assignments, slotSettings, scheduleRules,
    dateOverrides, slotLabels = {}, splitRoles = [], isSplitMode = false,
    withdrawnUserIds, displayAssignmentFilter } = p

  const csvCell = (s: string) => {
    const v = s.replace(/"/g, '""')
    return /[,\n"]/.test(v) ? `"${v}"` : v
  }
  const rows: string[][] = []
  rows.push([`${tenantName} ${year}년 ${month}월 스케줄`])

  for (const week of getCalendarWeeks(year, month)) {
    rows.push(['시간대', ...week.map((d, i) => d ? `${month}/${d}(${DOW_LABELS[i]})` : DOW_LABELS[i])])
    for (const slot of timeSlots) {
      rows.push([
        slotLabels[slot] ?? rangeSlotLabel(slot),
        ...week.map(d => !d ? '' : buildCellText(d, slot, year, month, scheduleRules, slotSettings,
          dateOverrides, assignments, displayAssignmentFilter, withdrawnUserIds, isSplitMode, splitRoles)),
      ])
    }
    rows.push([])
  }

  const csv = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${baseFilename(tenantName, year, month)}.csv`)
}

// ── Word (.docx) ──────────────────────────────────────────────────────────────

export async function exportMonthScheduleToDocx(p: ExportMonthScheduleParams): Promise<void> {
  const { year, month, tenantName, timeSlots, assignments, slotSettings, scheduleRules,
    dateOverrides, slotLabels = {}, splitRoles = [], isSplitMode = false,
    withdrawnUserIds, displayAssignmentFilter } = p

  const pct = (n: number) => ({ size: n, type: WidthType.PERCENTAGE })
  const cell = (text: string, opts?: { bold?: boolean; shading?: string; align?: typeof AlignmentType[keyof typeof AlignmentType] }) =>
    new TableCell({
      width: pct(13),
      shading: opts?.shading ? { fill: opts.shading, type: 'clear', color: 'auto' } : undefined,
      children: (text || ' ').split('\n').map(line => new Paragraph({
        text: line || ' ',
        alignment: opts?.align ?? AlignmentType.LEFT,
        run: opts?.bold ? { bold: true, size: 18 } : { size: 16 },
      })),
    })

  const sections = getCalendarWeeks(year, month).flatMap((week, wi) => {
    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        cell('시간대', { bold: true, shading: 'E8EDFF', align: AlignmentType.CENTER }),
        ...week.map((d, i) => {
          const isSat = i === 5, isSun = i === 6
          return cell(
            d ? `${month}/${d}(${DOW_LABELS[i]})` : DOW_LABELS[i],
            { bold: true, shading: isSat ? 'E0F0FF' : isSun ? 'FFF0F0' : 'F5F5F5', align: AlignmentType.CENTER }
          )
        }),
      ],
    })
    const dataRows = timeSlots.map(slot => new TableRow({
      children: [
        cell(slotLabels[slot] ?? rangeSlotLabel(slot), { shading: 'F8F8F8', align: AlignmentType.CENTER }),
        ...week.map(d => cell(!d ? '' : buildCellText(d, slot, year, month, scheduleRules, slotSettings,
          dateOverrides, assignments, displayAssignmentFilter, withdrawnUserIds, isSplitMode, splitRoles))),
      ],
    }))
    return [
      new Table({ width: pct(100), rows: [headerRow, ...dataRows] }),
      ...(wi < getCalendarWeeks(year, month).length - 1 ? [new Paragraph('')] : []),
    ]
  })

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `${tenantName} ${year}년 ${month}월 스케줄`, heading: 'Heading1' }),
        ...sections,
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${baseFilename(tenantName, year, month)}.docx`)
}

// ── PDF (직접 다운로드, html2canvas) ─────────────────────────────────────────

export async function exportMonthScheduleToPdf(p: ExportMonthScheduleParams): Promise<void> {
  const { year, month, tenantName, timeSlots, assignments, slotSettings, scheduleRules,
    dateOverrides, slotLabels = {}, splitRoles = [], isSplitMode = false,
    withdrawnUserIds, displayAssignmentFilter } = p

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

  const weekTables = getCalendarWeeks(year, month).map(week => {
    const th = week.map((d, i) => {
      const cls = i === 5 ? ' class="sat"' : i === 6 ? ' class="sun"' : ''
      return `<th${cls}>${esc(d ? `${month}/${d}(${DOW_LABELS[i]})` : DOW_LABELS[i])}</th>`
    }).join('')
    const trs = timeSlots.map(slot => {
      const tds = week.map(d => {
        const txt = !d ? '' : buildCellText(d, slot, year, month, scheduleRules, slotSettings,
          dateOverrides, assignments, displayAssignmentFilter, withdrawnUserIds, isSplitMode, splitRoles)
        return `<td>${esc(txt)}</td>`
      }).join('')
      return `<tr><td class="time">${esc(slotLabels[slot] ?? rangeSlotLabel(slot))}</td>${tds}</tr>`
    }).join('')
    return `<table><thead><tr><th class="time">시간대</th>${th}</tr></thead><tbody>${trs}</tbody></table>`
  }).join('<div class="sep"></div>')

  const container = document.createElement('div')
  container.style.cssText = [
    'position:fixed', 'left:-9999px', 'top:0', 'width:1060px',
    'background:#fff', 'padding:16px',
    "font-family:'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif",
    'font-size:8pt', 'color:#111',
  ].join(';')
  container.innerHTML = `
    <style>
      h2{font-size:13pt;text-align:center;margin:0 0 10px;font-weight:bold}
      table{width:100%;border-collapse:collapse;margin-bottom:6px}
      th,td{border:1px solid #ccc;padding:2px 5px;vertical-align:top;word-break:break-all;font-size:7.5pt}
      th{background:#f0f0f0;text-align:center;font-weight:bold}
      td{text-align:left}
      .time{background:#f8f8f8;text-align:center;color:#555;width:55px;white-space:nowrap}
      .sat{background:#e0f0ff;color:#1d4ed8}
      .sun{background:#fff0f0;color:#dc2626}
      .sep{height:8px}
    </style>
    <h2>${esc(tenantName)} ${year}년 ${month}월 스케줄</h2>
    ${weekTables}
  `
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const imgH = (canvas.height * pdfW) / canvas.width

    let remaining = imgH
    let offset = 0
    pdf.addImage(imgData, 'JPEG', 0, offset, pdfW, imgH)
    remaining -= pdfH

    while (remaining > 0) {
      offset -= pdfH
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, offset, pdfW, imgH)
      remaining -= pdfH
    }

    pdf.save(`${baseFilename(tenantName, year, month)}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
