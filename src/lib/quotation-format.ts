const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
]

export function formatThaiShortDate(d?: string | Date | null): string {
  if (!d) return '-'
  const dt = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).formatToParts(dt)

  const day = Number(parts.find(p => p.type === 'day')?.value ?? 1)
  const monthIdx = Number(parts.find(p => p.type === 'month')?.value ?? 1) - 1
  const year = Number(parts.find(p => p.type === 'year')?.value ?? 2026) + 543

  return `${day} ${THAI_MONTHS_SHORT[monthIdx] ?? ''} ${year}`
}

export function resolveQuoteDates(input: {
  sentAt?: string | Date | null
  expiresAt?: string | Date | null
  openedAt?: string | Date | null
  inspectedAt?: string | Date | null
}) {
  const sentDate = input.sentAt ? new Date(input.sentAt) : new Date()
  const validSent = Number.isNaN(sentDate.getTime()) ? new Date() : sentDate

  const expDate = input.expiresAt
    ? new Date(input.expiresAt)
    : new Date(validSent.getTime() + 7 * 86400000)

  const inspDate = input.inspectedAt ?? input.openedAt ?? validSent

  return {
    quoteDateText: formatThaiShortDate(validSent),
    validUntilText: formatThaiShortDate(expDate),
    inspectedDateText: formatThaiShortDate(inspDate),
  }
}

export interface RawQuotationLine {
  type?: string
  description: string
  quantity?: number
  amount: number
  partWaitDays?: number
  partWarrantyDays?: number
}

export interface DisplayQuotationLine {
  index: number
  type?: string
  description: string
  quantity: number
  amount: number
  partWaitDays?: number
  partWarrantyDays?: number
}

export interface QuotationFinancials {
  displayLines: DisplayQuotationLine[]
  subtotal: number
  vatAmount: number
  total: number
  operationFeeDiscount: number
  netPayable: number
}

export function computeQuotationFinancials(input: {
  lines: RawQuotationLine[]
  subtotal: number
  vatAmount: number
  total: number
  operationFeePaid?: number | null
  hasWarranty?: boolean
}): QuotationFinancials {
  const normalizedLines: DisplayQuotationLine[] = input.lines.map((l, idx) => {
    const isInspection =
      l.type === 'INSPECTION_FEE' ||
      l.description.includes('ค่าดำเนินการ') ||
      l.description.includes('ค่าเปิดเครื่อง')

    return {
      index: idx + 1,
      type: l.type,
      description: isInspection ? 'ค่าดำเนินการ (ค่าเปิดเครื่อง/ตรวจสอบ)' : l.description,
      quantity: l.quantity && l.quantity > 0 ? l.quantity : 1,
      amount: l.amount,
      partWaitDays: l.partWaitDays,
      partWarrantyDays: l.partWarrantyDays,
    }
  })

  const inspectionLineAmount = normalizedLines
    .filter(l => l.type === 'INSPECTION_FEE' || l.description.includes('ค่าดำเนินการ'))
    .reduce((sum, l) => sum + l.amount, 0)

  const rawOpFee =
    typeof input.operationFeePaid === 'number'
      ? input.operationFeePaid
      : input.hasWarranty
      ? 0
      : inspectionLineAmount

  const alignedOpFee =
    rawOpFee >= 1000 && rawOpFee % 100 === 0 && input.total > 0 && input.total < 5000 && input.total % 100 !== 0
      ? Math.round(rawOpFee / 100)
      : rawOpFee

  const operationFeeDiscount = Math.max(0, Math.min(alignedOpFee, input.total))
  const netPayable = Math.max(0, input.total - operationFeeDiscount)

  return {
    displayLines: normalizedLines,
    subtotal: input.subtotal,
    vatAmount: input.vatAmount,
    total: input.total,
    operationFeeDiscount,
    netPayable,
  }
}

export function calcQuoteTotalsBaht(
  lines: ReadonlyArray<{ unitPrice: string | number }>,
  openFeeBaht: number,
  vatRate = 0.07,
) {
  const partsTotal = Number(
    lines.reduce((s, l) => s + (Number(l.unitPrice) || 0), 0).toFixed(2),
  )
  const openFee = Number((Number(openFeeBaht) || 0).toFixed(2))
  const subtotal = partsTotal
  const vat = Number((subtotal * vatRate).toFixed(2))
  const total = Number((subtotal + vat).toFixed(2))
  return { partsTotal, openFee, subtotal, vat, total }
}

