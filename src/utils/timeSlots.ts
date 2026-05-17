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
  {
    label: '10-22시 (1시간 단위)',
    intervalMinutes: 60,
    slots: generateTimeSlots('10:00', '22:00', 60),
  },
  {
    label: '10-22시 (30분 단위)',
    intervalMinutes: 30,
    slots: generateTimeSlots('10:00', '22:00', 30),
  },
];

export const DEFAULT_TIME_SLOTS: TimeSlot[] = generateTimeSlots('10:00', '22:00', 120);
