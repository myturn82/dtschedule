export type TimeSlot = string; // e.g. '10-12', '10-10.5', '10.5-11'

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatHour(minutes: number): string {
  return String(minutes / 60);
}

export function generateTimeSlots(
  openFrom: string,
  openTo: string,
  intervalMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = parseMinutes(openFrom);
  const end = parseMinutes(openTo);
  while (current + intervalMinutes <= end) {
    const next = current + intervalMinutes;
    slots.push(`${formatHour(current)}-${formatHour(next)}`);
    current = next;
  }
  return slots;
}

function hourToHHMM(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h}:${m === 0 ? '00' : String(m).padStart(2, '0')}`;
}

// '10-12' → '10:00 ~ 12:00',  '10.5-11' → '10:30 ~ 11:00'
export function parseSlotLabel(slot: string): string {
  const [s, e] = slot.split('-').map(Number);
  return `${hourToHHMM(s)} ~ ${hourToHHMM(e)}`;
}

// Compact start-time label for narrow columns: '10-12' → '10:00', '10.5-11' → '10:30'
export function slotStartLabel(slot: string): string {
  return hourToHHMM(Number(slot.split('-')[0]));
}

// Short range label: '10-12' → '10:00-12:00', '10.5-11' → '10:30-11:00'
export function shortSlotLabel(slot: string): string {
  const [s, e] = slot.split('-').map(Number);
  return `${hourToHHMM(s)}-${hourToHHMM(e)}`;
}

// Compact range label with tilde: '10-12' → '10:00~12:00', '10.5-11' → '10:30~11:00'
export function rangeSlotLabel(slot: string): string {
  const [s, e] = slot.split('-').map(Number);
  return `${hourToHHMM(s)}~${hourToHHMM(e)}`;
}

// Build a slot string: (10, 12) → '10-12', (10.5, 11) → '10.5-11'
export function buildSlot(start: number, end: number): string {
  return `${start}-${end}`;
}

export const SLOT_TEMPLATES: { label: string; intervalMinutes: number; slots: string[] }[] = [
  { label: '오전 (09-13시·1시간)',      intervalMinutes: 60,  slots: generateTimeSlots('09:00', '13:00', 60) },
  { label: '업무 (09-18시·1시간)',      intervalMinutes: 60,  slots: generateTimeSlots('09:00', '18:00', 60) },
  { label: '업무 30분 (09-18시·30분)', intervalMinutes: 30,  slots: generateTimeSlots('09:00', '18:00', 30) },
  { label: '연장 (09-22시·1시간)',      intervalMinutes: 60,  slots: generateTimeSlots('09:00', '22:00', 60) },
  { label: '연장 (09-22시·30분)',       intervalMinutes: 30,  slots: generateTimeSlots('09:00', '22:00', 30) },
  { label: '오후/저녁 (13-22시·1시간)', intervalMinutes: 60,  slots: generateTimeSlots('13:00', '22:00', 60) },
  { label: '야간 (18-24시·1시간)',      intervalMinutes: 60,  slots: generateTimeSlots('18:00', '24:00', 60) },
  { label: '2시간 블록 (09-22시)',      intervalMinutes: 120, slots: generateTimeSlots('09:00', '22:00', 120) },
];

export const DEFAULT_TIME_SLOTS: TimeSlot[] = generateTimeSlots('09:00', '22:00', 120);

export function formatTimeSub(ts: string | null): string {
  if (!ts) return ''
  if (ts.includes('~')) {
    const [s, e] = ts.split('~').map(Number)
    return `${s}~${e + 1}시`
  }
  return `${ts}시`
}

export function getTimeSubOptions(slot: string): { value: string; label: string }[] | null {
  const [start, end] = slot.split('-').map(Number)
  if (end - start !== 2) return null
  return [
    { value: `${start}`, label: `${start}시` },
    { value: `${start + 1}`, label: `${start + 1}시` },
    { value: `${start}~${start + 1}`, label: `${start}~${end}시` },
  ]
}

// 복사한 배정의 time_sub(2시간 슬롯 내 전반/후반/전체 구분, 절대 시각 기준)를
// 붙여넣는 슬롯의 절대 시각으로 다시 계산한다.
// - 대상 슬롯이 2시간 슬롯이 아니면 부분 시각 구분 자체가 없으므로 undefined.
// - 원본에 time_sub이 없었다면(1시간 슬롯 등 부분 시각 구분이 없던 슬롯) 대상 슬롯 "전체 담당"으로 간주한다.
export function remapTimeSub(sourceSlot: string, sourceTimeSub: string | null | undefined, destSlot: string): string | undefined {
  const destOptions = getTimeSubOptions(destSlot)
  if (!destOptions) return undefined
  if (!sourceTimeSub) return destOptions[2].value
  const [srcStart] = sourceSlot.split('-').map(Number)
  if (sourceTimeSub === `${srcStart}`) return destOptions[0].value
  if (sourceTimeSub === `${srcStart + 1}`) return destOptions[1].value
  if (sourceTimeSub === `${srcStart}~${srcStart + 1}`) return destOptions[2].value
  return destOptions[2].value
}

export function getWeekDays(year: number, month: number, day: number): Date[] {
  const anchor = new Date(year, month - 1, day)
  const dow = anchor.getDay()
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd
  })
}
