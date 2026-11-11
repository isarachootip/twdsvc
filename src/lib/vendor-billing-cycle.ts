/**
 * Domain helpers for Vendor Billing / Payout Cycle (ข้อ 7.2 รอบวางบิล / จ่ายเงิน)
 * Supports standard Thai Watsadu presets, 1-31 day-of-month calendar selection,
 * and safe extraction of commercial terms for Admin application review.
 */

export interface BillingCyclePreset {
  value: string
  label: string
  hint: string
}

export const BILLING_CYCLE_PRESETS: readonly BillingCyclePreset[] = [
  {
    value: 'ทุกวันที่ 25 ของเดือน',
    label: 'ทุกวันที่ 25 ของเดือน',
    hint: 'รอบมาตรฐานศูนย์ซ่อมไทวัสดุ',
  },
  {
    value: 'ทุกสิ้นเดือน',
    label: 'ทุกสิ้นเดือน',
    hint: 'วางบิลวันทำการสุดท้ายของเดือน',
  },
  {
    value: 'ทุกวันที่ 15 ของเดือน',
    label: 'ทุกวันที่ 15 ของเดือน',
    hint: 'วางบิลกลางเดือน (เดือนละ 1 รอบ)',
  },
  {
    value: 'เดือนละ 2 รอบ (วันที่ 15 และ 25 ของเดือน)',
    label: 'เดือนละ 2 รอบ (วันที่ 15 และ 25 ของเดือน)',
    hint: 'ตัดรอบกลางเดือนและวันที่ 25',
  },
  {
    value: 'เดือนละ 2 รอบ (วันที่ 15 และสิ้นเดือน)',
    label: 'เดือนละ 2 รอบ (วันที่ 15 และสิ้นเดือน)',
    hint: 'ตัดรอบกลางเดือนและสิ้นเดือน',
  },
] as const

export const CALENDAR_DAYS_OF_MONTH: readonly number[] = Array.from(
  { length: 31 },
  (_, idx) => idx + 1
)

function normalizeBillingDays(days: readonly number[]): number[] {
  const unique = new Set<number>()
  for (const d of days) {
    if (Number.isInteger(d) && d >= 1 && d <= 31) {
      unique.add(d)
    }
  }
  return Array.from(unique).sort((a, b) => a - b)
}

export function formatBillingCycleFromDays(
  days: readonly number[],
  includeEndOfMonth = false
): string {
  const validDays = normalizeBillingDays(days)

  if (validDays.length === 0) {
    return includeEndOfMonth ? 'ทุกสิ้นเดือน' : ''
  }

  if (validDays.length === 1 && !includeEndOfMonth) {
    return `ทุกวันที่ ${validDays[0]} ของเดือน`
  }

  if (validDays.length === 1 && includeEndOfMonth) {
    return `เดือนละ 2 รอบ (วันที่ ${validDays[0]} และสิ้นเดือน)`
  }

  if (validDays.length === 2 && !includeEndOfMonth) {
    return `เดือนละ 2 รอบ (วันที่ ${validDays[0]} และ ${validDays[1]} ของเดือน)`
  }

  if (includeEndOfMonth) {
    return `ทุกวันที่ ${validDays.join(', ')} และสิ้นเดือน`
  }

  return `ทุกวันที่ ${validDays.join(', ')} ของเดือน`
}

export function parseBillingDaysFromText(value: string): {
  days: number[]
  includeEndOfMonth: boolean
} {
  const raw = (value || '').trim()
  if (!raw) {
    return { days: [], includeEndOfMonth: false }
  }

  const includeEndOfMonth = raw.includes('สิ้นเดือน')
  // Strip cycle count phrases like "เดือนละ 2 รอบ" so "2" is never misread as day 2
  const cleaned = raw.replace(/เดือนละ\s*\d+\s*รอบ/g, '')
  // Only extract day numbers if the text explicitly refers to "วันที่"
  if (!cleaned.includes('วันที่')) {
    return { days: [], includeEndOfMonth }
  }

  const matches = cleaned.match(/\d+/g) ?? []
  const nums = matches.map(m => Number(m))
  return {
    days: normalizeBillingDays(nums),
    includeEndOfMonth,
  }
}

export function toggleBillingDay(currentDays: readonly number[], day: number): number[] {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return normalizeBillingDays(currentDays)
  }
  const normalized = normalizeBillingDays(currentDays)
  if (normalized.includes(day)) {
    return normalized.filter(d => d !== day)
  }
  return normalizeBillingDays([...normalized, day])
}

export interface ApplicationCommercialTerms {
  gpPct: string
  creditTerm: string
  billingCycle: string
}

export function extractApplicationCommercialTerms(
  agreements: unknown
): ApplicationCommercialTerms {
  if (!agreements || typeof agreements !== 'object') {
    return { gpPct: '-', creditTerm: '-', billingCycle: '-' }
  }
  const agrObj = agreements as Record<string, unknown>
  const commercial =
    agrObj.commercial && typeof agrObj.commercial === 'object'
      ? (agrObj.commercial as Record<string, unknown>)
      : {}

  const gpPct =
    typeof commercial.gpPct === 'string' && commercial.gpPct.trim()
      ? commercial.gpPct.trim()
      : '-'
  const creditTerm =
    typeof commercial.creditTerm === 'string' && commercial.creditTerm.trim()
      ? commercial.creditTerm.trim()
      : '-'
  const billingCycle =
    typeof commercial.billingCycle === 'string' && commercial.billingCycle.trim()
      ? commercial.billingCycle.trim()
      : '-'

  return { gpPct, creditTerm, billingCycle }
}
