const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

/** "yyyy-MM-dd" (what the API sends for a date) to "Nov 29". Parsed as a local date so it never shifts a day. */
export function formatDay(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  return dateFormat.format(new Date(year, month - 1, day))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** Hours without noise: 8 -> "8 h", 7.5 -> "7.5 h", 0.3333 -> "0.3 h". */
export function formatHours(hours: number): string {
  return `${Math.round(hours * 10) / 10} h`
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.min(100, Math.max(0, (part / whole) * 100)) : 0
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '').toUpperCase() : '')
}
