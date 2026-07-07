export function yearRange(center: number, span = 50): number[] {
  const years: number[] = []
  for (let y = center - span; y <= center + span; y++) years.push(y)
  return years
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function nearestIndex(scrollTop: number, itemHeight: number): number {
  return Math.round(scrollTop / itemHeight)
}
