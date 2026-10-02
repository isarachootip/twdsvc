// Fee calculation — pure functions (05_business_rules.md §1)
// All currency amounts are stored and calculated in Satang integers (1 THB = 100 Satang)

export interface FeeRate {
  operationFee: number  // Satang (e.g. 15000 = 150.00 THB)
  shippingFee3pl: number // Satang (e.g. 8000 = 80.00 THB)
}

export interface FeeInput {
  jobType: 'CUSTOMER' | 'STOCK'
  hasWarranty: boolean
  shippingMethod: 'STANDARD' | 'EXPRESS'
  feeRate: FeeRate
}

export interface FeeResult {
  operationFee: number // Satang
  shippingFee: number  // Satang
  total: number        // Satang
}

function normalizeSatang(val: number): number {
  if (val > 0 && val < 1000) {
    return Math.round(val * 100)
  }
  return Math.round(val || 0)
}

export function calcIntakeFees(input: FeeInput): FeeResult {
  if (input.jobType === 'STOCK') {
    return { operationFee: 0, shippingFee: 0, total: 0 }
  }
  const opFee = normalizeSatang(input.feeRate.operationFee)
  const shipFee = normalizeSatang(input.feeRate.shippingFee3pl)

  const operationFee = input.hasWarranty ? 0 : opFee
  const shippingFee = input.shippingMethod === 'EXPRESS' ? shipFee : 0

  return { operationFee, shippingFee, total: operationFee + shippingFee }
}

// Quote calculation — pure functions (05_business_rules.md §2)

export interface QuoteLine {
  unitPrice: number
  quantity: number
}

export function calcQuoteTotals(lines: QuoteLine[], vatRate = 0.07) {
  const subtotal = lines.reduce((sum, l) => sum + Math.round(l.unitPrice) * Math.round(l.quantity), 0)
  const vatAmount = roundHalfUp(subtotal * vatRate)
  const total = subtotal + vatAmount
  return { subtotal, vatAmount, total }
}

function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5)
}

// Balance calculation
export interface JobChargeLike { amount: number }
export interface PaymentLike { amount: number; status: string }

export function calcBalance(charges: JobChargeLike[], payments: PaymentLike[]): number {
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  return totalCharges - totalPaid
}

// Operation fee credit & customer settlement calculation (05_business_rules.md §1.3)
export function calcCustomerBalance(params: {
  operationFeePaidSatang: number
  quoteTotalSatang: number
  additionalPaymentsSatang: number
}): {
  creditSatang: number
  netPayableSatang: number
  outstandingBalanceSatang: number
} {
  const creditSatang = Math.min(params.operationFeePaidSatang, params.quoteTotalSatang)
  const netPayableSatang = params.quoteTotalSatang - creditSatang
  const outstandingBalanceSatang = Math.max(0, netPayableSatang - params.additionalPaymentsSatang)
  return { creditSatang, netPayableSatang, outstandingBalanceSatang }
}

// Vendor Payout Settlement (05_business_rules.md §7)
export function calcVendorPayout(params: {
  subtotalSatang: number
  gpPct: number
  deductionsSatang: number
}): {
  repairAmountSatang: number
  gpAmountSatang: number
  netVendorPayableSatang: number
} {
  const repairAmountSatang = params.subtotalSatang
  const gpAmountSatang = Math.floor((repairAmountSatang * params.gpPct) / 100 + 0.5)
  const netVendorPayableSatang = repairAmountSatang - gpAmountSatang - params.deductionsSatang
  return { repairAmountSatang, gpAmountSatang, netVendorPayableSatang }
}

// SLA helpers

export function calcSlaDeadline(startedAt: Date, hours: number): Date {
  return new Date(startedAt.getTime() + hours * 60 * 60 * 1000)
}

export function getSlaStatus(clock: {
  dueAt: Date
  pausedMinutes: number
  stoppedAt?: Date | null
  status: string
  startedAt?: Date | null
}): 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' {
  if (clock.status === 'STOPPED') return 'ON_TRACK'
  const now = Date.now()
  const dueMs = clock.dueAt.getTime()
  if (now > dueMs) return 'OVERDUE'
  const remaining = dueMs - now
  const totalDuration = (clock.startedAt ? dueMs - clock.startedAt.getTime() : 24 * 3600000) + (clock.pausedMinutes * 60000)
  if (totalDuration > 0 && remaining / totalDuration < 0.2) return 'AT_RISK'
  return 'ON_TRACK'
}

export function getHoursInStep(clock: {
  startedAt: Date
  pausedMinutes: number
  stoppedAt?: Date | null
}): number {
  const end = clock.stoppedAt ?? new Date()
  const elapsedMs = end.getTime() - clock.startedAt.getTime() - clock.pausedMinutes * 60000
  return Math.floor(Math.max(0, elapsedMs) / (60 * 60 * 1000))
}

export function formatSatang(satang: number | null | undefined): string {
  if (satang === null || satang === undefined) return '฿0.00'
  const baht = satang / 100
  return `฿${baht.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

