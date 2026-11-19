const MS_PER_DAY = 86_400_000

function parseLocal(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Calendar days from one "yyyy-MM-dd" date to another (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseLocal(to).getTime() - parseLocal(from).getTime()) / MS_PER_DAY)
}

/** Today as "yyyy-MM-dd" in the user's own time zone, which is what sprint dates mean. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** A date plus some days, both as "yyyy-MM-dd". */
export function addDays(isoDate: string, days: number): string {
  const date = parseLocal(isoDate)
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** "Day 6 of 12" while the sprint runs, "Starts in 3 days" before it, "Ended 2 days ago" after. */
export function sprintProgressLabel(start: string, end: string, today = todayIso()): string {
  const total = daysBetween(start, end) + 1
  const dayNumber = daysBetween(start, today) + 1
  if (dayNumber < 1) return `Starts in ${1 - dayNumber} ${1 - dayNumber === 1 ? 'day' : 'days'}`
  if (dayNumber > total) return `Ended ${dayNumber - total} ${dayNumber - total === 1 ? 'day' : 'days'} ago`
  return `Day ${dayNumber} of ${total}`
}
