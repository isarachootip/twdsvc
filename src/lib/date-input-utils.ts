export interface DateBounds {
  min?: string
  max?: string
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2999) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

/**
 * Converts an ISO date string (yyyy-mm-dd or full ISO timestamp) to dd/mm/yyyy (Christian Era).
 * Returns "" if empty or invalid.
 */
export function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const trimmed = iso.trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!isValidCalendarDate(year, month, day)) return ''
  return `${match[3]}/${match[2]}/${match[1]}`
}

/**
 * Parses and validates a dd/mm/yyyy string into ISO yyyy-mm-dd.
 * Returns "" if the input is empty, or null if the input is malformed / out of bounds.
 */
export function displayToIsoDate(display: string, bounds?: DateBounds): string | null {
  const trimmed = display.trim()
  if (trimmed === '') return ''
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!isValidCalendarDate(year, month, day)) return null

  const iso = `${match[3]}-${match[2]}-${match[1]}`
  if (bounds?.min && iso < bounds.min.slice(0, 10)) return null
  if (bounds?.max && iso > bounds.max.slice(0, 10)) return null
  return iso
}

/**
 * Auto-formats user-typed digits into dd/mm/yyyy mask.
 */
export function formatDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}
